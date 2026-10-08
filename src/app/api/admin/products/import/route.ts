import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdminBulk } from "@/lib/supabase/require-admin-bulk";
import { validateBody } from "@/lib/validation/validate";
import { productImportSchema } from "@/lib/validation/schemas";
import { toSlug } from "@/lib/products/csv-import";

type Outcome =
  | { key: string; result: "created" | "updated"; id: string }
  | { key: string; result: "skipped"; reason: string }
  | { key: string; result: "error"; message: string };

// Never sends email: no new-arrival broadcast (products are created as drafts)
// and no restock emails when an update takes a size from 0 to in stock.
export async function POST(req: NextRequest) {
  const auth = await requireAdminBulk("products-import");
  if ("error" in auth) return auth.error;

  const result = await validateBody(req, productImportSchema);
  if ("error" in result) return result.error;
  const { products } = result.data;
  const actorEmail = auth.user.email ?? null;

  const admin = createAdminClient();

  // SKU matching is case-insensitive (imports upper-case SKUs), so load all SKUs once.
  const { data: existing, error: skuError } = await admin.from("products").select("id, sku").not("sku", "is", null);
  if (skuError) return NextResponse.json({ error: skuError.message }, { status: 500 });
  const idBySku = new Map((existing ?? []).map(p => [String(p.sku).trim().toUpperCase(), p.id as string]));

  const outcomes: Outcome[] = [];
  const logRows: Record<string, unknown>[] = [];

  for (const [i, p] of products.entries()) {
    const existingId = p.sku ? idBySku.get(p.sku.toUpperCase()) : undefined;

    if (p.mode === "update") {
      if (!existingId) { outcomes.push({ key: p.key, result: "skipped", reason: "No product with this SKU" }); continue; }
      const { error } = await admin.from("product_sizes").upsert(
        p.sizes.map(s => ({ product_id: existingId, size: s.size, stock: s.stock })),
        { onConflict: "product_id,size" },
      );
      if (error) { outcomes.push({ key: p.key, result: "error", message: error.message }); continue; }
      outcomes.push({ key: p.key, result: "updated", id: existingId });
      logRows.push({
        action: "product_updated", entity_type: "product", entity_id: existingId, entity_name: p.name,
        actor_email: actorEmail, details: { import: true, sizes: p.sizes },
      });
      continue;
    }

    if (existingId) { outcomes.push({ key: p.key, result: "skipped", reason: "SKU already exists" }); continue; }
    const sizes = p.sizes.filter(s => s.stock > 0);
    if (!sizes.length) { outcomes.push({ key: p.key, result: "skipped", reason: "All pairs sold" }); continue; }

    const { data: created, error } = await admin.from("products").insert({
      name: p.name,
      slug: toSlug(p.name, i.toString(36)),
      brand: p.brand,
      sku: p.sku,
      gender: p.gender,
      status: "on-hand",
      srp_price: p.price,
      full_payment_price: p.price,
      downpayment_price: Math.round(p.price * 0.5),
      cost_price: p.cost,
      images: [],
      is_published: false,
      is_featured: false,
      is_trending: false,
      is_new: true,
    }).select("id").single();
    if (error || !created) { outcomes.push({ key: p.key, result: "error", message: error?.message ?? "Insert failed" }); continue; }

    const { error: sizesError } = await admin.from("product_sizes").insert(
      sizes.map(s => ({ product_id: created.id, size: s.size, stock: s.stock })),
    );
    if (sizesError) {
      // No transactions in supabase-js: undo the product so no stockless shell is left behind.
      await admin.from("products").delete().eq("id", created.id);
      outcomes.push({ key: p.key, result: "error", message: sizesError.message });
      continue;
    }

    if (p.sku) idBySku.set(p.sku.toUpperCase(), created.id);
    outcomes.push({ key: p.key, result: "created", id: created.id });
    logRows.push({
      action: "product_created", entity_type: "product", entity_id: created.id, entity_name: p.name,
      actor_email: actorEmail, details: { import: true },
    });
  }

  if (logRows.length) {
    try {
      const { error: logError } = await admin.from("activity_log").insert(logRows);
      if (logError) console.error("[activity_log] import insert failed:", logError);
    } catch (err) {
      console.error("[activity_log] import insert failed:", err);
    }
  }

  return NextResponse.json({
    created: outcomes.filter(o => o.result === "created").length,
    updated: outcomes.filter(o => o.result === "updated").length,
    skipped: outcomes.filter(o => o.result === "skipped"),
    errors: outcomes.filter(o => o.result === "error"),
    outcomes,
  });
}

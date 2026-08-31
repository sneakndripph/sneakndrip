import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { sendRestockEmailsForSize } from "@/lib/email/restock";

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("inventory_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { product_id, product_name, size, new_stock, reason } = await req.json();
  if (!product_id || !size || new_stock === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("product_sizes")
    .select("stock")
    .eq("product_id", product_id)
    .eq("size", size)
    .single();

  const old_stock = current?.stock ?? 0;

  const { error } = await admin
    .from("product_sizes")
    .update({ stock: new_stock })
    .eq("product_id", product_id)
    .eq("size", size);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("inventory_log").insert({
    product_id,
    product_name,
    size,
    old_stock,
    new_stock,
    reason: reason || "manual_adjustment",
    changed_by: caller.email,
    order_number: null,
  });

  if (old_stock === 0 && new_stock > 0) {
    void (async () => {
      const { data: productRow } = await admin.from("products").select("slug, images").eq("id", product_id).single();
      await sendRestockEmailsForSize(product_id, size, product_name ?? "", productRow?.slug ?? product_id, productRow?.images?.[0]);
    })();
  }

  return NextResponse.json({ ok: true, old_stock, new_stock });
}

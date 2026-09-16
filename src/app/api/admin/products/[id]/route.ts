import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";
import { sendRestockEmailsForSize } from "@/lib/email/restock";
import { z } from "zod";
import { productUpdateSchema, productSizeSchema } from "@/lib/validation/schemas";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const env = validateEnv();
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdmin = user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const productRaw = formData.get("product") as string | null;
  const sizesRaw = formData.get("sizes") as string | null;
  if (!productRaw) return NextResponse.json({ error: "Missing product data" }, { status: 400 });

  let parsedProductRaw: unknown;
  let parsedSizesRaw: unknown;
  try {
    parsedProductRaw = JSON.parse(productRaw);
    parsedSizesRaw = JSON.parse(sizesRaw ?? "[]");
  } catch {
    return NextResponse.json({ error: "Invalid JSON in form data" }, { status: 400 });
  }

  const productResult = productUpdateSchema.safeParse(parsedProductRaw);
  if (!productResult.success) {
    return NextResponse.json({ error: productResult.error.issues[0]?.message ?? "Invalid product data" }, { status: 400 });
  }
  const sizesResult = z.array(productSizeSchema).safeParse(parsedSizesRaw);
  if (!sizesResult.success) {
    return NextResponse.json({ error: sizesResult.error.issues[0]?.message ?? "Invalid sizes data" }, { status: 400 });
  }
  // id/created_at/updated_at/product_sizes and any other unknown keys are stripped by the schema
  const product = productResult.data;
  const sizes = sizesResult.data;

  // Read current sizes to detect restocks
  const { data: oldSizes } = await admin.from("product_sizes").select("size, stock").eq("product_id", id);
  const oldStockMap = new Map((oldSizes ?? []).map(s => [s.size, s.stock]));

  // Images are already uploaded client-side; product.images contains the final URL array
  const { error } = await admin.from("products").update(product).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (sizes.length > 0) {
    await admin.from("product_sizes").delete().eq("product_id", id);
    await admin.from("product_sizes").insert(
      sizes.map(s => ({ product_id: id, size: s.size, stock: s.stock }))
    );
  }

  const productName = product.name ?? "Product";
  const productSlug = product.slug ?? id;
  const productImageUrl = product.images?.[0];
  if (sizes.length > 0) {
    const restockedSizes = sizes
      .filter(s => s.stock > 0 && (oldStockMap.get(s.size) ?? 0) === 0)
      .map(s => s.size);
    for (const size of restockedSizes) {
      await sendRestockEmailsForSize(id, size, productName, productSlug, productImageUrl);
    }
  }

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "product_updated",
      entity_type: "product",
      entity_id: id,
      entity_name: productName,
      actor_email: user.email ?? null,
      details: null,
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  const isAdminDel = user?.app_metadata?.role === "admin";
  if (!user || !isAdminDel) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { data: existing } = await admin.from("products").select("name").eq("id", id).maybeSingle();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    const { error: logError } = await admin.from("activity_log").insert({
      action: "product_deleted",
      entity_type: "product",
      entity_id: id,
      entity_name: existing?.name ?? null,
      actor_email: user.email ?? null,
      details: null,
    });
    if (logError) console.error("[activity_log] insert failed:", logError);
  } catch (err) {
    console.error("[activity_log] insert failed:", err);
  }

  return NextResponse.json({ ok: true });
}

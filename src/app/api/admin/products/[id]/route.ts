import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";
import { sendRestockEmailsForSize } from "@/lib/email/restock";

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

  let parsedProduct: Record<string, unknown>;
  let sizes: { size: string; stock: number }[];
  try {
    parsedProduct = JSON.parse(productRaw) as Record<string, unknown>;
    sizes = JSON.parse(sizesRaw ?? "[]") as { size: string; stock: number }[];
  } catch {
    return NextResponse.json({ error: "Invalid JSON in form data" }, { status: 400 });
  }

  const { id: _id, created_at, updated_at, product_sizes, ...product } = parsedProduct;

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

  const productName = (product as { name?: string }).name ?? "Product";
  const productSlug = (product as { slug?: string }).slug ?? id;
  const productImageUrl = (product as { images?: string[] }).images?.[0];
  if (sizes.length > 0) {
    const restockedSizes = sizes
      .filter(s => s.stock > 0 && (oldStockMap.get(s.size) ?? 0) === 0)
      .map(s => s.size);
    for (const size of restockedSizes) {
      await sendRestockEmailsForSize(id, size, productName, productSlug, productImageUrl);
    }
  }

  void admin.from("activity_log").insert({
    action: "product_updated",
    entity_type: "product",
    entity_id: id,
    entity_name: productName,
    actor_email: user.email ?? null,
    details: null,
  });

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
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

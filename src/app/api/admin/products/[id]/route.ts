import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

async function getRequestingUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();
  const formData = await req.formData();

  const productRaw = formData.get("product") as string;
  const sizesRaw = formData.get("sizes") as string;
  const keepUrlsRaw = formData.get("keepUrls") as string;

  const { id: _id, created_at, updated_at, product_sizes, slug, ...product } =
    JSON.parse(productRaw) as Record<string, unknown> & { slug: string };
  const sizes = JSON.parse(sizesRaw ?? "[]") as { size: string; stock: number }[];
  const keepUrls: string[] = JSON.parse(keepUrlsRaw ?? "[]");

  // Upload new images via service role
  const imageFiles = formData.getAll("images") as File[];
  const newUrls: string[] = [];

  for (const file of imageFiles) {
    if (!file.name || file.size === 0) continue;
    const ext = file.name.split(".").pop();
    const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { data: upload } = await admin.storage
      .from("product-images")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });
    if (upload) {
      const { data: { publicUrl } } = admin.storage.from("product-images").getPublicUrl(upload.path);
      newUrls.push(publicUrl);
    }
  }

  product.images = [...keepUrls, ...newUrls];

  const { error } = await admin.from("products").update(product).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace sizes
  await admin.from("product_sizes").delete().eq("product_id", id);
  if (sizes.length > 0) {
    await admin.from("product_sizes").insert(
      sizes.map(s => ({ product_id: id, size: s.size, stock: s.stock }))
    );
  }

  return NextResponse.json({ ok: true, imagesUploaded: newUrls.length });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestingUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

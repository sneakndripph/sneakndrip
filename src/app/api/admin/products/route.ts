import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest) {
  const user = await getRequestingUser();
  if (!user || user.user_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const formData = await req.formData();

  const productRaw = formData.get("product") as string;
  const sizesRaw = formData.get("sizes") as string;
  const product = JSON.parse(productRaw);
  const sizes = JSON.parse(sizesRaw ?? "[]");
  const slug = product.slug as string;

  // Upload images via service role (bypasses storage RLS)
  const imageFiles = formData.getAll("images") as File[];
  const imageUrls: string[] = [];
  for (const file of imageFiles) {
    const ext = file.name.split(".").pop();
    const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { data: upload } = await admin.storage
      .from("product-images")
      .upload(path, arrayBuffer, { contentType: file.type, upsert: true });
    if (upload) {
      const { data: { publicUrl } } = admin.storage.from("product-images").getPublicUrl(upload.path);
      imageUrls.push(publicUrl);
    }
  }

  if (imageUrls.length) product.images = imageUrls;

  // Insert product
  const { data, error } = await admin.from("products").insert(product).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert sizes
  if (sizes.length > 0) {
    await admin.from("product_sizes").insert(
      sizes.map((s: { size: string; stock: number }) => ({ product_id: data.id, size: s.size, stock: s.stock }))
    );
  }

  return NextResponse.json({ id: data.id });
}

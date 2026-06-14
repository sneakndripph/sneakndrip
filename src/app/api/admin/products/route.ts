import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name, brand, status, product_sizes(size, stock)")
    .order("name");
  const products = (data ?? []).map(p => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    status: p.status,
    sizes: (Array.isArray(p.product_sizes) ? p.product_sizes : [])
      .sort((a: { size: string }, b: { size: string }) => parseFloat(a.size.replace("US ", "")) - parseFloat(b.size.replace("US ", ""))),
  }));
  return NextResponse.json(products);
}

async function getRequestingUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Images are already uploaded client-side; URLs are in product.images
  const { data, error } = await admin.from("products").insert(product).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (sizes.length > 0) {
    await admin.from("product_sizes").insert(
      sizes.map((s: { size: string; stock: number }) => ({ product_id: data.id, size: s.size, stock: s.stock }))
    );
  }

  return NextResponse.json({ id: data.id });
}

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

  const { id: _id, created_at, updated_at, product_sizes, ...product } =
    JSON.parse(productRaw) as Record<string, unknown>;
  const sizes = JSON.parse(sizesRaw ?? "[]") as { size: string; stock: number }[];

  // Images are already uploaded client-side; product.images contains the final URL array
  const { error } = await admin.from("products").update(product).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("product_sizes").delete().eq("product_id", id);
  if (sizes.length > 0) {
    await admin.from("product_sizes").insert(
      sizes.map(s => ({ product_id: id, size: s.size, stock: s.stock }))
    );
  }

  return NextResponse.json({ ok: true });
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

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getRequestingUser() {
  try {
    const cookieStore = await cookies();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("inventory_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return NextResponse.json(data ?? []);
}

// Manual stock adjustment
export async function POST(req: NextRequest) {
  const user = await getRequestingUser();
  const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
  if (!user || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { product_id, product_name, size, new_stock, reason } = await req.json();
  if (!product_id || !size || new_stock === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get current stock
  const { data: current } = await admin
    .from("product_sizes")
    .select("stock")
    .eq("product_id", product_id)
    .eq("size", size)
    .single();

  const old_stock = current?.stock ?? 0;

  // Update stock
  const { error } = await admin
    .from("product_sizes")
    .update({ stock: new_stock })
    .eq("product_id", product_id)
    .eq("size", size);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log the change
  await admin.from("inventory_log").insert({
    product_id,
    product_name,
    size,
    old_stock,
    new_stock,
    reason: reason || "manual_adjustment",
    changed_by: user.email,
    order_number: null,
  });

  return NextResponse.json({ ok: true, old_stock, new_stock });
}

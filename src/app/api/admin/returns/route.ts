import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { cookies } from "next/headers";

async function requireAdmin() {
  try {
    const cookieStore = await cookies();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    const isAdmin = user?.user_metadata?.role === "admin" || user?.app_metadata?.role === "admin";
    if (!user || !isAdmin) return null;
    return user;
  } catch {
    return null;
  }
}

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: returns, error } = await admin
    .from("return_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Batch-fetch orders for all return requests
  const orderNumbers = [...new Set((returns ?? []).map(r => r.order_number))];
  const { data: orders } = orderNumbers.length
    ? await admin
        .from("orders")
        .select("order_number, total, payment_method, created_at, order_items(product_name, size, quantity, unit_price, products(images, bg))")
        .in("order_number", orderNumbers)
    : { data: [] };

  const orderMap = new Map((orders ?? []).map(o => [o.order_number, o]));
  const returnsWithOrders = (returns ?? []).map(r => ({ ...r, order: orderMap.get(r.order_number) ?? null }));

  return NextResponse.json({ returns: returnsWithOrders });
}

export async function PATCH(req: NextRequest) {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status, admin_note } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!["approved", "denied"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const admin = createAdminClient();

  // Get return request to find the order number
  const { data: returnReq } = await admin
    .from("return_requests")
    .select("order_number")
    .eq("id", id)
    .single();

  const { error } = await admin
    .from("return_requests")
    .update({ status, admin_note: admin_note ?? null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // When approved, update the order status to "returned"
  if (status === "approved" && returnReq?.order_number) {
    await admin
      .from("orders")
      .update({ status: "returned" })
      .eq("order_number", returnReq.order_number);
  }

  void admin.from("activity_log").insert({
    action: `return_${status}`,
    entity_type: "return_request",
    entity_id: id,
    entity_name: returnReq?.order_number ?? null,
    actor_email: caller.email ?? null,
    details: null,
  });

  return NextResponse.json({ ok: true });
}

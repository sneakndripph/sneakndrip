import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { orderNumber } = await req.json();
  if (!orderNumber) return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });

  const admin = createAdminClient();

  // Fetch the order — must belong to the logged-in user and be pending
  const { data: order } = await admin
    .from("orders")
    .select("id, status, customer_email, order_items(product_id, size, quantity)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.customer_email !== user.email)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "pending")
    return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 });

  // Restore stock
  for (const item of (order.order_items as { product_id: string; size: string; quantity: number }[])) {
    if (!item.product_id) continue;
    const { data: row } = await admin
      .from("product_sizes")
      .select("stock")
      .eq("product_id", item.product_id)
      .eq("size", item.size)
      .single();
    if (row) {
      await admin.from("product_sizes")
        .update({ stock: row.stock + item.quantity })
        .eq("product_id", item.product_id)
        .eq("size", item.size);
    }
  }

  await admin.from("orders").update({ status: "cancelled" }).eq("id", order.id);

  return NextResponse.json({ ok: true });
}

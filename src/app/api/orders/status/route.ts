import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber) return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });

  // Prefer the live session -- covers the post-checkout confirmation page, which
  // always has one since /api/orders/create requires auth. Fall back to the
  // orderNumber+email combo (same second factor as GET /api/track-order) for
  // callers with no session.
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();
  const guestEmail = req.nextUrl.searchParams.get("email");

  if (!user && !guestEmail) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("status, payment_status, payment_method, tracking_number, customer_email")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const ownerEmail = user?.email ?? guestEmail!.toLowerCase().trim();
  if (order.customer_email !== ownerEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    tracking_number: order.tracking_number,
  });
}

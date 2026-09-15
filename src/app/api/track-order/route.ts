import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  const email = req.nextUrl.searchParams.get("email");

  if (!orderNumber || !email)
    return NextResponse.json({ error: "Missing orderNumber or email" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("order_number, status, payment_method, payment_status, tracking_number, created_at, total, order_items(product_name, size, quantity, unit_price, products(images, bg))")
    .eq("order_number", orderNumber.toUpperCase().trim())
    .eq("customer_email", email.toLowerCase().trim())
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Order not found. Check your order number and email." }, { status: 404 });
  return NextResponse.json(order);
}

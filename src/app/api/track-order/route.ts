import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { orderNumberSchema } from "@/lib/validation/schemas";

// Case-insensitive input, normalized to uppercase before format-checking --
// matches this route's pre-existing orderNumber.toUpperCase().trim() lookup.
const trackOrderQuerySchema = z.object({
  orderNumber: z.string().trim().toUpperCase().pipe(orderNumberSchema),
  email: z.string().trim().toLowerCase().min(1, "Missing orderNumber or email"),
});

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = trackOrderQuerySchema.safeParse({
    orderNumber: req.nextUrl.searchParams.get("orderNumber") ?? undefined,
    email: req.nextUrl.searchParams.get("email") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Missing orderNumber or email" }, { status: 400 });
  }
  const { orderNumber, email } = parsed.data;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("order_number, status, payment_method, payment_status, tracking_number, created_at, total, order_items(product_name, size, quantity, unit_price, products(images, bg))")
    .eq("order_number", orderNumber)
    .eq("customer_email", email)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Order not found. Check your order number and email." }, { status: 404 });
  return NextResponse.json(order);
}

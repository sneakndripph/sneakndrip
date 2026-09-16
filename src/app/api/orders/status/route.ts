import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { orderNumberSchema } from "@/lib/validation/schemas";

// email is only an ownership-equality check against the stored customer_email,
// not a delivery address -- kept as a loose trimmed/lowercased string (no
// .email() format requirement) matching this route's pre-existing permissiveness.
const orderStatusQuerySchema = z.object({
  orderNumber: orderNumberSchema,
  email: z.string().trim().toLowerCase().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = orderStatusQuerySchema.safeParse({
    orderNumber: req.nextUrl.searchParams.get("orderNumber") ?? undefined,
    email: req.nextUrl.searchParams.get("email") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { orderNumber, email: guestEmail } = parsed.data;

  // Prefer the live session -- covers the post-checkout confirmation page, which
  // always has one since /api/orders/create requires auth. Fall back to the
  // orderNumber+email combo (same second factor as GET /api/track-order) for
  // callers with no session.
  const serverClient = await createClient();
  const { data: { user } } = await serverClient.auth.getUser();

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

  const ownerEmail = user?.email ?? guestEmail!;
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

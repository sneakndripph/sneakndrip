import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { couponDiscount, isDeal, dealGroupSize } from "@/lib/orders/pricing";

const couponValidateSchema = z.object({
  code: z.string().trim().min(1, "Missing code").max(50, "Missing code"),
  orderTotal: z.coerce.number().finite("Invalid orderTotal").nonnegative("Invalid orderTotal").optional(),
  // Cart lines for deal coupons. Display only: /api/orders/create reprices everything.
  items: z.array(z.object({
    product_id: z.string().max(64),
    unit_price: z.coerce.number().finite().nonnegative(),
    quantity: z.coerce.number().int().min(1).max(50),
    payment_type: z.string().max(20).optional(),
  })).max(50).optional(),
});

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`coupons-validate:${getIP(req)}`, 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const result = await validateBody(req, couponValidateSchema);
  if ("error" in result) return result.error;
  const { code, orderTotal, items } = result.data;

  const admin = createAdminClient();
  const { data: coupon } = await admin
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("is_active", true)
    .maybeSingle();

  if (!coupon) return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return NextResponse.json({ error: "This coupon has expired" }, { status: 400 });

  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses)
    return NextResponse.json({ error: "This coupon has reached its usage limit" }, { status: 400 });

  if (orderTotal !== undefined && Number(orderTotal) < Number(coupon.min_order))
    return NextResponse.json({
      error: `Minimum order of ₱${Number(coupon.min_order).toLocaleString()} required`,
    }, { status: 400 });

  // Same formula /api/orders/create uses, so the shown total matches the stored one.
  const discount = couponDiscount(coupon, Number(orderTotal ?? 0), items ?? []);
  if (isDeal(coupon) && discount === 0)
    return NextResponse.json({ error: `Add ${dealGroupSize(coupon)} eligible items to use this deal` }, { status: 400 });

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    min_order: coupon.min_order,
    buy_qty: coupon.buy_qty,
    get_qty: coupon.get_qty,
    product_ids: coupon.product_ids,
    discount,
  });
}

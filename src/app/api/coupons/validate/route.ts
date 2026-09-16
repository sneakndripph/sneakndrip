import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";

const couponValidateSchema = z.object({
  code: z.string().trim().min(1, "Missing code").max(50, "Missing code"),
  orderTotal: z.coerce.number().finite("Invalid orderTotal").nonnegative("Invalid orderTotal").optional(),
});

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const result = await validateBody(req, couponValidateSchema);
  if ("error" in result) return result.error;
  const { code, orderTotal } = result.data;

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

  const discount = coupon.type === "percent"
    ? Math.round((Number(orderTotal ?? 0) * Number(coupon.value)) / 100)
    : Number(coupon.value);

  return NextResponse.json({
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    discount,
  });
}

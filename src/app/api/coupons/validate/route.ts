import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function POST(req: NextRequest) {
  const { code, orderTotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

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

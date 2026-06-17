import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ orders: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select("id, order_number, created_at, status, total, subtotal, shipping_fee, discount, coupon_code, payment_method, payment_type, payment_reference, proof_of_payment, tracking_number, shipping_street, shipping_barangay, shipping_city, shipping_province, customer_name, customer_mobile, order_items(product_name, size, quantity, unit_price, payment_type, product_id, products(images, bg, slug))")
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: data ?? [] });
}

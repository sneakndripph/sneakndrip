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
    .select("id, order_number, created_at, status, total, payment_method, proof_of_payment, tracking_number, shipping_street, shipping_barangay, shipping_city, shipping_province, order_items(product_name, size, quantity, unit_price, products(images, bg, slug))")
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: data ?? [] });
}

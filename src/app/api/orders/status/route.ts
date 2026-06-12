import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber) return NextResponse.json({ error: "Missing orderNumber" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("status, payment_status, payment_method, tracking_number")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(data);
}

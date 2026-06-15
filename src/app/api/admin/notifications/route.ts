import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = createAdminClient();
  const [{ count: pendingOrders }, { count: pendingReviews }, { count: pendingReturns }] = await Promise.all([
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("reviews").select("*", { count: "exact", head: true }).eq("is_verified", false),
    admin.from("return_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return NextResponse.json({
    pendingOrders: pendingOrders ?? 0,
    pendingReviews: pendingReviews ?? 0,
    pendingReturns: pendingReturns ?? 0,
    total: (pendingOrders ?? 0) + (pendingReviews ?? 0) + (pendingReturns ?? 0),
  });
}

import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET() {
  const caller = await requireAdmin();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const [{ count: pendingOrders }, { count: pendingReviews }, { count: pendingReturns }, { data: lowStockRows }] = await Promise.all([
    admin.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("reviews").select("*", { count: "exact", head: true }).eq("is_verified", false),
    admin.from("return_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("product_sizes").select("product_id").lte("stock", 3).gt("stock", 0),
  ]);
  const lowStock = new Set((lowStockRows ?? []).map(r => r.product_id)).size;
  return NextResponse.json({
    pendingOrders: pendingOrders ?? 0,
    pendingReviews: pendingReviews ?? 0,
    pendingReturns: pendingReturns ?? 0,
    lowStock,
    total: (pendingOrders ?? 0) + (pendingReviews ?? 0) + (pendingReturns ?? 0),
  });
}

import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const admin = createAdminClient();

  let query = admin
    .from("orders")
    .select("id, order_number, total, status, created_at, payment_method, customer_name, customer_email, order_items(product_name, unit_price, quantity, products(cost_price))")
    .order("created_at", { ascending: true });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data: orders, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = orders ?? [];
  const paid = all.filter(o => !["pending", "cancelled"].includes(o.status));
  const cancelled = all.filter(o => o.status === "cancelled");
  const pending = all.filter(o => o.status === "pending");

  const totalRevenue = paid.reduce((s, o) => s + Number(o.total), 0);
  const avgOrder = paid.length ? totalRevenue / paid.length : 0;
  const cancelRate = all.length ? (cancelled.length / all.length) * 100 : 0;

  // Revenue by day
  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of paid) {
    const day = new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const slot = dayMap.get(day) ?? { revenue: 0, orders: 0 };
    slot.revenue += Number(o.total);
    slot.orders++;
    dayMap.set(day, slot);
  }
  const revenueByDay = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }));

  // Top products + profit computation
  const productMap = new Map<string, { revenue: number; units: number; cost: number }>();
  let totalCost = 0;
  for (const o of paid) {
    for (const item of (o.order_items as unknown as { product_name: string; unit_price: number; quantity: number; products: { cost_price: number | null } | { cost_price: number | null }[] | null }[]) ?? []) {
      const rev = Number(item.unit_price) * Number(item.quantity);
      const prodCost = Array.isArray(item.products) ? item.products[0]?.cost_price : item.products?.cost_price;
      const costPrice = prodCost ? Number(prodCost) : 0;
      const itemCost = costPrice * Number(item.quantity);
      totalCost += itemCost;
      const ex = productMap.get(item.product_name) ?? { revenue: 0, units: 0, cost: 0 };
      productMap.set(item.product_name, { revenue: ex.revenue + rev, units: ex.units + Number(item.quantity), cost: ex.cost + itemCost });
    }
  }
  const totalProfit = totalRevenue - totalCost;
  const topProducts = Array.from(productMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, v]) => ({
      name: name.length > 28 ? name.slice(0, 28) + "…" : name,
      revenue: v.revenue, units: v.units,
      profit: v.cost > 0 ? v.revenue - v.cost : null,
    }));

  // By payment method
  const paymentMap = new Map<string, number>();
  for (const o of paid) {
    const pm = (o.payment_method ?? "unknown").replace(/_/g, " ");
    paymentMap.set(pm, (paymentMap.get(pm) ?? 0) + Number(o.total));
  }
  const byPayment = Array.from(paymentMap.entries()).map(([method, revenue]) => ({ method, revenue }));

  // By status
  const statusMap = new Map<string, number>();
  for (const o of all) statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // Top customers
  const custMap = new Map<string, { name: string; email: string; revenue: number; orders: number }>();
  for (const o of paid) {
    const email = o.customer_email ?? "unknown";
    const ex = custMap.get(email) ?? { name: o.customer_name ?? email, email, revenue: 0, orders: 0 };
    ex.revenue += Number(o.total);
    ex.orders++;
    custMap.set(email, ex);
  }
  const topCustomers = Array.from(custMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  return NextResponse.json({
    metrics: {
      totalRevenue,
      totalCost,
      totalProfit,
      totalOrders: all.length,
      paidOrders: paid.length,
      cancelledOrders: cancelled.length,
      pendingOrders: pending.length,
      avgOrder,
      cancelRate,
    },
    revenueByDay,
    topProducts,
    byPayment,
    byStatus,
    topCustomers,
  });
}

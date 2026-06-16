import { createAdminClient } from "@/lib/supabase/admin-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get("period") ?? "week";
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const periodStart = (() => {
    if (period === "today") return todayStart.toISOString();
    if (period === "month") return new Date(Date.now() - 30 * 86400000).toISOString();
    if (period === "year") return new Date(Date.now() - 365 * 86400000).toISOString();
    return new Date(Date.now() - 7 * 86400000).toISOString();
  })();

  const { data: orders } = await admin
    .from("orders")
    .select("total, status, created_at")
    .gte("created_at", periodStart)
    .order("created_at", { ascending: true });

  const slotMap = new Map<string, { revenue: number; orders: number }>();
  if (period === "today") {
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
      slotMap.set(label, { revenue: 0, orders: 0 });
    }
  } else if (period === "year") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      slotMap.set(d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" }), { revenue: 0, orders: 0 });
    }
  } else {
    const days = period === "month" ? 30 : 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      slotMap.set(d.toLocaleDateString("en-PH", { month: "short", day: "numeric" }), { revenue: 0, orders: 0 });
    }
  }

  for (const o of (orders ?? []).filter(o => !["pending", "cancelled"].includes(o.status))) {
    const d = new Date(o.created_at);
    const key = period === "today"
      ? (d.getHours() === 0 ? "12am" : d.getHours() < 12 ? `${d.getHours()}am` : d.getHours() === 12 ? "12pm" : `${d.getHours() - 12}pm`)
      : period === "year"
      ? d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" })
      : d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
    const slot = slotMap.get(key);
    if (slot) { slot.revenue += Number(o.total); slot.orders++; }
  }

  const revenueByDay = Array.from(slotMap.entries()).map(([date, v]) => ({ date, ...v }));
  return NextResponse.json({ revenueByDay });
}

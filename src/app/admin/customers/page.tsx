import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminCustomersClient from "@/components/admin/AdminCustomersClient";

export default async function AdminCustomersPage() {
  const admin = createAdminClient();

  const [{ data: customers }, { data: allOrders }] = await Promise.all([
    admin
      .from("customers")
      .select("id, full_name, email, mobile, created_at, shipping_addresses(city, province)")
      .order("created_at", { ascending: false }),
    admin.from("orders").select("customer_email, total, created_at"),
  ]);

  // Aggregate order stats per customer email
  type OrderRow = { customer_email: string; total: number; created_at: string };
  const statsMap = new Map<string, { count: number; total: number; lastOrder: string }>();
  for (const o of (allOrders ?? []) as OrderRow[]) {
    const e = o.customer_email;
    if (!statsMap.has(e)) statsMap.set(e, { count: 0, total: 0, lastOrder: o.created_at });
    const s = statsMap.get(e)!;
    s.count++;
    s.total += Number(o.total);
    if (new Date(o.created_at) > new Date(s.lastOrder)) s.lastOrder = o.created_at;
  }

  const enriched = (customers ?? []).map(c => {
    const stats = statsMap.get(c.email) ?? { count: 0, total: 0, lastOrder: "" };
    const addr = (c.shipping_addresses as { city: string; province: string }[] | null)?.[0];
    return {
      id: c.id,
      name: c.full_name,
      email: c.email,
      mobile: c.mobile ?? "",
      city: addr ? `${addr.city}, ${addr.province}` : "—",
      orders: stats.count,
      total: stats.total,
      joined: new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
      lastOrder: stats.lastOrder ? new Date(stats.lastOrder).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—",
    };
  });

  return <AdminCustomersClient customers={enriched} />;
}

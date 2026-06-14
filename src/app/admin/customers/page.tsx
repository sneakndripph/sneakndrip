import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminCustomersClient from "@/components/admin/AdminCustomersClient";

export default async function AdminCustomersPage() {
  noStore();
  const admin = createAdminClient();

  const [{ data: customers }, { data: allOrders }] = await Promise.all([
    admin
      .from("customers")
      .select("id, full_name, email, mobile, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("orders")
      .select("customer_email, order_number, total, status, created_at, customer_mobile, shipping_city, shipping_province")
      .order("created_at", { ascending: false }),
  ]);

  type OrderRow = {
    customer_email: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    customer_mobile: string | null;
    shipping_city: string | null;
    shipping_province: string | null;
  };

  // Group orders by email
  const ordersByEmail = new Map<string, OrderRow[]>();
  for (const o of (allOrders ?? []) as OrderRow[]) {
    if (!ordersByEmail.has(o.customer_email)) ordersByEmail.set(o.customer_email, []);
    ordersByEmail.get(o.customer_email)!.push(o);
  }

  const enriched = (customers ?? []).map(c => {
    const orders = ordersByEmail.get(c.email) ?? [];
    const latestOrder = orders[0]; // already desc by created_at

    // Use customers.mobile first, fallback to customer_mobile from most recent order
    const mobile = c.mobile || latestOrder?.customer_mobile || "";

    // Location from most recent order's shipping info
    const city = latestOrder?.shipping_city && latestOrder?.shipping_province
      ? `${latestOrder.shipping_city}, ${latestOrder.shipping_province}`
      : "";

    const totalRevenue = orders.filter(o => !["pending", "cancelled"].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);

    return {
      id: c.id,
      name: c.full_name ?? "—",
      email: c.email,
      mobile,
      city,
      orders: orders.length,
      total: totalRevenue,
      joined: c.created_at
        ? new Date(c.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "—",
      lastOrder: latestOrder?.created_at
        ? new Date(latestOrder.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "—",
      recentOrders: orders.slice(0, 10).map(o => ({
        order_number: o.order_number,
        total: o.total,
        status: o.status,
        created_at: o.created_at,
      })),
    };
  });

  return <AdminCustomersClient customers={enriched} />;
}

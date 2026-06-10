import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage() {
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("*, order_items(product_name, brand, size, quantity, unit_price, payment_type)")
    .order("created_at", { ascending: false });

  return <AdminOrdersClient initialOrders={orders ?? []} />;
}

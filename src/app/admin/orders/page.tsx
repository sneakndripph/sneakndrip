import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminOrdersClient from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  noStore();
  const [admin, { q, status }] = [createAdminClient(), await searchParams];
  const { data: orders } = await admin
    .from("orders")
    .select("*, payment_reference, proof_of_payment, balance_reference, balance_proof_url, balance_paid_at, balance_payment_method, shipping_fee, order_items(product_name, brand, size, quantity, unit_price, payment_type, products(images, bg))")
    .order("created_at", { ascending: false });

  return <AdminOrdersClient initialOrders={orders ?? []} initialSearch={q ?? ""} initialStatus={status ?? ""} />;
}

import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminInventoryClient from "@/components/admin/AdminInventoryClient";

export default async function AdminInventoryPage() {
  noStore();
  const admin = createAdminClient();

  const [{ data: products }, { data: log }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, brand, status, images, product_sizes(size, stock)")
      .order("name"),
    admin
      .from("inventory_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  return <AdminInventoryClient initialProducts={products ?? []} initialLog={log ?? []} />;
}

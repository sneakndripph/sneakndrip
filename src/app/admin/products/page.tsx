import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export default async function AdminProductsPage() {
  noStore();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_sizes(size, stock)")
    .order("created_at", { ascending: false });
  return <AdminProductsClient initialProducts={data ?? []} />;
}

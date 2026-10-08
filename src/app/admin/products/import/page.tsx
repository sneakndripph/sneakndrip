import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import ProductImportClient from "@/components/admin/ProductImportClient";

export default async function ProductImportPage() {
  noStore();
  const { data } = await createAdminClient()
    .from("products")
    .select("id, name, sku")
    .not("sku", "is", null);
  const existing = (data ?? []).map(p => ({ id: p.id as string, name: p.name as string, sku: String(p.sku) }));
  return <ProductImportClient existing={existing} />;
}

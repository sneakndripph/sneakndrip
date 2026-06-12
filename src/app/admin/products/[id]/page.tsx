import { unstable_noStore as noStore } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { notFound } from "next/navigation";
import EditProductForm from "@/components/admin/EditProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("*, product_sizes(size, stock)")
    .eq("id", id)
    .single();

  if (!product) notFound();
  return <EditProductForm product={product} />;
}

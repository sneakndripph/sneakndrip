import { getProducts } from "@/lib/supabase/products";
import ShopClient from "@/components/shop/ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; brand?: string; gender?: string }>;
}) {
  const [products, { q, filter, brand, gender }] = await Promise.all([getProducts(), searchParams]);
  return (
    <ShopClient
      products={products}
      initialSearch={q ?? ""}
      initialFilter={filter ?? "all"}
      initialBrand={brand ?? ""}
      initialGender={gender ?? ""}
    />
  );
}

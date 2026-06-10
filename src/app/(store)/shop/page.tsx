import { getProducts } from "@/lib/supabase/products";
import ShopClient from "@/components/shop/ShopClient";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; brand?: string }>;
}) {
  const [products, { q, filter, brand }] = await Promise.all([getProducts(), searchParams]);
  return (
    <ShopClient
      products={products}
      initialSearch={q ?? ""}
      initialFilter={filter ?? "all"}
      initialBrand={brand ?? ""}
    />
  );
}

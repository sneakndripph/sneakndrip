import { getProducts } from "@/lib/supabase/products";
import ShopClient from "@/components/shop/ShopClient";

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [products, { q }] = await Promise.all([getProducts(), searchParams]);
  return <ShopClient products={products} initialSearch={q ?? ""} />;
}

import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/supabase/products";
import ProductDetail from "@/components/product/ProductDetail";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}

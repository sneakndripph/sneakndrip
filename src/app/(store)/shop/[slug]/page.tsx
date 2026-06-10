import { notFound } from "next/navigation";
import { getProductBySlug, getReviews } from "@/lib/supabase/products";
import ProductDetail from "@/components/product/ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, reviews] = await Promise.all([
    getProductBySlug(slug),
    getReviews(undefined),
  ]);
  if (!product) notFound();
  const productReviews = reviews.filter(r => !r.product_id || r.product_id === product.id);
  return <ProductDetail product={product} reviews={productReviews} />;
}

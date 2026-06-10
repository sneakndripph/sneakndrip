import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getReviews } from "@/lib/supabase/products";
import ProductDetail from "@/components/product/ProductDetail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found — Sneak N' Drip" };
  const title = `${product.name} — ₱${product.full_payment_price.toLocaleString()} | Sneak N' Drip`;
  const description = product.description ||
    `Buy authentic ${product.name} by ${product.brand} at Sneak N' Drip. ${product.status === "pre-order" ? "Pre-order now!" : "In stock, ships fast!"}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images?.[0] ? [{ url: product.images[0], alt: product.name }] : [],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

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

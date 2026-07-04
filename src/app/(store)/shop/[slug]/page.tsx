import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getReviews, getSettings } from "@/lib/supabase/products";
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
  const [product, reviews, settings] = await Promise.all([
    getProductBySlug(slug),
    getReviews(undefined),
    getSettings(),
  ]);
  if (!product) notFound();
  const productReviews = reviews.filter(r => r.product_id === product.id);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    description:
      product.description ||
      `Authentic ${product.name} by ${product.brand}. ${product.status === "pre-order" ? "Available for pre-order." : "On hand, ships fast."}`,
    image: product.images ?? [],
    url: `https://sneakndrip.ph/shop/${slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "PHP",
      price: product.full_payment_price,
      availability:
        product.status === "pre-order"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Sneak N' Drip" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          currency: "PHP",
          minValue: 0,
          maxValue: 200,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "PH",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 2,
            maxValue: 7,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PH",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
    ...(productReviews.length > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: (productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length).toFixed(1),
        reviewCount: productReviews.length,
      },
    }),
  };

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <ProductDetail product={product} reviews={productReviews} settings={settings} />
    </>
  );
}

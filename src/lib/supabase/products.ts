import { createClient } from "./server";
import { createAdminClient } from "./admin-server";
import { MOCK_PRODUCTS, MOCK_REVIEWS } from "@/lib/constants";
import type { Product, Review } from "@/lib/types";

function mapRow(p: Record<string, unknown>): Product {
  const sizes = ((p.product_sizes as Record<string, unknown>[]) ?? []).map((s) => ({
    size: s.size as string,
    stock: s.stock as number,
  }));
  return {
    id: p.id as string,
    name: p.name as string,
    slug: p.slug as string,
    brand: p.brand as string,
    colorway: (p.colorway as string) ?? "",
    gender: (p.gender as string) ?? "Unisex",
    description: (p.description as string) ?? "",
    status: p.status as Product["status"],
    srp_price: p.srp_price as number,
    downpayment_price: p.downpayment_price as number,
    full_payment_price: p.full_payment_price as number,
    sizes,
    is_featured: Boolean(p.is_featured),
    is_trending: Boolean(p.is_trending),
    is_new: Boolean(p.is_new),
    bg: (p.bg as string) ?? undefined,
    eta_start: (p.eta_start as string) ?? undefined,
    eta_end: (p.eta_end as string) ?? undefined,
    images: Array.isArray(p.images) ? (p.images as string[]) : undefined,
    sale_price: p.sale_price != null ? Number(p.sale_price) : null,
    sale_start: (p.sale_start as string) ?? null,
    sale_end: (p.sale_end as string) ?? null,
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_sizes(size, stock)")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) return MOCK_PRODUCTS as unknown as Product[];
    if (!data?.length) return [];
    return data.map(mapRow);
  } catch {
    return MOCK_PRODUCTS as unknown as Product[];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_sizes(size, stock)")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();
    if (error || !data) {
      return (MOCK_PRODUCTS as unknown as Product[]).find(p => p.slug === slug) ?? null;
    }
    return mapRow(data as Record<string, unknown>);
  } catch {
    return (MOCK_PRODUCTS as unknown as Product[]).find(p => p.slug === slug) ?? null;
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("store_settings").select("key, value");
    if (!data?.length) return {};
    return Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function getReviews(productId?: string): Promise<Review[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("reviews")
      .select("*")
      .eq("is_verified", true)
      .order("created_at", { ascending: false });
    if (productId) query = query.eq("product_id", productId);
    const { data, error } = await query;
    if (error || !data?.length) return [];
    return data as unknown as Review[];
  } catch {
    return [];
  }
}

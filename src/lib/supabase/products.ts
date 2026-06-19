import { createClient } from "./server";
import { createAdminClient } from "./admin-server";
import type { Product, Review } from "@/lib/types";

function mapRow(p: Record<string, unknown>, newArrivalCutoffMs?: number): Product {
  const sizes = ((p.product_sizes as Record<string, unknown>[]) ?? []).map((s) => ({
    size: s.size as string,
    stock: s.stock as number,
  }));
  const createdAt = (p.created_at as string) ?? "";
  const isNew = newArrivalCutoffMs && createdAt
    ? new Date(createdAt).getTime() >= newArrivalCutoffMs
    : Boolean(p.is_new);
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
    is_new: isNew,
    bg: (p.bg as string) ?? undefined,
    eta_start: (p.eta_start as string) ?? undefined,
    eta_end: (p.eta_end as string) ?? undefined,
    images: Array.isArray(p.images) ? (p.images as string[]) : undefined,
    sale_price: p.sale_price != null ? Number(p.sale_price) : null,
    sale_start: (p.sale_start as string) ?? null,
    sale_end: (p.sale_end as string) ?? null,
    created_at: createdAt || undefined,
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const [{ data, error }, settingRes] = await Promise.all([
      supabase.from("products").select("*, product_sizes(size, stock)").eq("is_published", true).order("created_at", { ascending: false }),
      adminClient.from("store_settings").select("value").eq("key", "new_arrivals_days").maybeSingle(),
    ]);
    if (error || !data?.length) return [];
    const days = Number(settingRes.data?.value) || 14;
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.map(p => mapRow(p, cutoffMs));
  } catch {
    return [];
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
    if (error || !data) return null;
    return mapRow(data as Record<string, unknown>);
  } catch {
    return null;
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

import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin-server";

const BASE = "https://sneakndrip.ph";

const STATIC: MetadataRoute.Sitemap = [
  { url: BASE,                   lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
  { url: `${BASE}/shop`,         lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE}/brands`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
  { url: `${BASE}/about`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/contact`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE}/authenticity`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${BASE}/shipping`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${BASE}/returns`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();
  const { data: products } = await admin
    .from("products")
    .select("slug, updated_at")
    .eq("is_published", true);

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url: `${BASE}/shop/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...STATIC, ...productUrls];
}

import { getProducts } from "@/lib/supabase/products";
import ShopClient from "@/components/shop/ShopClient";
import { CATEGORIES } from "@/lib/constants";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { q?: string; filter?: string; brand?: string; gender?: string; category?: string };

/** Only known categories (and the "deals" tab) pass through; anything else shows everything. */
const toCategory = (c?: string) => c === "deals" || CATEGORIES.some(x => x.value === c) ? c! : "";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Params> }): Promise<Metadata> {
  const cat = toCategory((await searchParams).category);
  const label = cat === "deals" ? "Deals" : CATEGORIES.find(c => c.value === cat)?.label;
  return { title: `${label ? `Shop ${label}` : "Shop All"} — Sneak N' Drip` };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<Params> }) {
  const [products, { q, filter, brand, gender, category }] = await Promise.all([getProducts(), searchParams]);
  const cat = toCategory(category);
  return (
    <ShopClient
      key={cat}
      products={products}
      initialSearch={q ?? ""}
      initialFilter={filter ?? "all"}
      initialBrand={brand ?? ""}
      initialGender={gender ?? ""}
      initialCategory={cat}
    />
  );
}

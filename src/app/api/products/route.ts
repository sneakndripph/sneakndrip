import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

/** All published products, for client-side search/autocomplete. Fields kept lean — no descriptions-heavy joins. */
export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name, slug, brand, colorway, description, sku, images, full_payment_price, is_featured, is_trending, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return NextResponse.json({ products: data ?? [] });
}

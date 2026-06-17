import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ products: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("id, name, brand, slug, images, bg, full_payment_price")
    .eq("is_published", true)
    .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
    .order("name")
    .limit(6);

  return NextResponse.json({ products: data ?? [] });
}

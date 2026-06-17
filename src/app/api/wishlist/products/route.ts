import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({ products: [] });

  const idList = ids.split(",").filter(Boolean);
  if (idList.length === 0) return NextResponse.json({ products: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("products")
    .select("*, sizes:product_sizes(size, stock)")
    .in("id", idList)
    .eq("is_published", true);

  return NextResponse.json({ products: data ?? [] });
}

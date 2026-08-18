import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { rateLimit, getIP } from "@/lib/rate-limit";

// product_sizes has no single "id" the client holds -- the identifying key
// in this schema is (product_id, size), same as create_order_with_stock_check
// (supabase/migrations/034_atomic_order_creation.sql) uses for its own lookup.
type StockCheckItem = { product_id: string; size: string; quantity: number };
type StockStatus = "available" | "reduced" | "sold_out";

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 30, 60_000); // 30 checks/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const items = body?.items;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Missing items" }, { status: 400 });
  }

  const validItems: StockCheckItem[] = items.filter(
    (i: Record<string, unknown>): i is StockCheckItem =>
      typeof i?.product_id === "string" &&
      typeof i?.size === "string" &&
      Number.isFinite(i?.quantity) &&
      (i.quantity as number) > 0
  );

  if (validItems.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const admin = createAdminClient();
  const productIds = [...new Set(validItems.map(i => i.product_id))];

  const { data: rows, error } = await admin
    .from("product_sizes")
    .select("product_id, size, stock")
    .in("product_id", productIds);

  if (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const stockByKey = new Map<string, number>();
  for (const row of rows ?? []) {
    stockByKey.set(`${row.product_id}::${row.size}`, row.stock as number);
  }

  const result = validItems.map(item => {
    const currentStock = stockByKey.get(`${item.product_id}::${item.size}`) ?? 0;
    const status: StockStatus =
      currentStock <= 0 ? "sold_out" : currentStock < item.quantity ? "reduced" : "available";

    return {
      product_id: item.product_id,
      size: item.size,
      current_stock: currentStock,
      requested_quantity: item.quantity,
      status,
    };
  });

  return NextResponse.json({ items: result });
}

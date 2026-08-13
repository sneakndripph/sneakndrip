import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";

type StockItem = { product_id: string; size: string; quantity: number };
type StockFailure = { product_id: string; product_name: string; size: string; requested: number; available: number };

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 10, 60_000); // 10 orders/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { order, items } = body;

    if (!order || !items?.length) {
      return NextResponse.json({ error: "Missing order data" }, { status: 400 });
    }

    // Validate and sanitize customer-supplied string fields
    const ALLOWED_PAYMENT_METHODS = ["gcash", "maya", "bank_transfer", "cod"];
    const o = order as Record<string, unknown>;
    const name = String(o.customer_name ?? "").trim();
    const email = String(o.customer_email ?? "").trim();
    const mobile = String(o.customer_mobile ?? "").trim();
    if (!name || name.length > 200) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (!mobile || !/^09\d{9}$/.test(mobile)) return NextResponse.json({ error: "Invalid mobile" }, { status: 400 });
    if (String(o.shipping_street ?? "").trim().length > 300) return NextResponse.json({ error: "Street too long" }, { status: 400 });
    if (!ALLOWED_PAYMENT_METHODS.includes(String(o.payment_method ?? ""))) return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    const total = Number(o.total);
    if (!Number.isFinite(total) || total < 0 || total > 1_000_000) return NextResponse.json({ error: "Invalid total" }, { status: 400 });

    const supabase = createAdminClient();

    // Single transactional RPC: locks + checks + deducts stock, inserts the
    // order and its items, all atomically. Any failure (insufficient stock,
    // bad input, a constraint violation) rolls the whole thing back — no
    // manual compensation/refund step needed.
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "create_order_with_stock_check",
      { p_order: order, p_items: items }
    );

    if (rpcError) {
      if (rpcError.hint === "insufficient_stock") {
        let failures: StockFailure[] = [];
        try { failures = JSON.parse(rpcError.details ?? "[]"); } catch { /* leave empty */ }
        return NextResponse.json(
          {
            error: failures.length
              ? `${failures.map(f => `${f.product_name} (${f.size})`).join(", ")} sold out. Please remove it from your cart.`
              : "One or more items just sold out. Please remove them from your cart.",
            outOfStock: true,
            items: failures,
          },
          { status: 409 }
        );
      }
      if (rpcError.hint === "invalid_input") {
        return NextResponse.json({ error: rpcError.details || "Invalid order data" }, { status: 400 });
      }
      console.error("Order creation error:", rpcError);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const data = rpcResult as { id: string; order_number: string } | null;
    if (!data?.id) {
      console.error("Order creation error: RPC returned no id", rpcResult);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    // Stock is already deducted by the RPC — recompute the item list purely
    // for the inventory_log fire-and-forget block below.
    const stockItems: StockItem[] = items
      .filter((i: Record<string, unknown>) => i.product_id)
      .map((i: Record<string, unknown>) => ({
        product_id: i.product_id as string,
        size: i.size as string,
        quantity: i.quantity as number,
      }));

    // Fire-and-forget: log stock changes to inventory_log
    if (stockItems.length > 0) {
      Promise.all(
        stockItems.map(async (item) => {
          const { data: sizeRow } = await supabase
            .from("product_sizes")
            .select("stock")
            .eq("product_id", item.product_id)
            .eq("size", item.size)
            .single();
          const matchedItem = (items as Record<string, unknown>[]).find(
            i => i.product_id === item.product_id && i.size === item.size
          );
          const newStock = sizeRow?.stock ?? 0;
          return {
            product_id: item.product_id,
            product_name: String(matchedItem?.product_name ?? ""),
            size: item.size,
            old_stock: newStock + item.quantity,
            new_stock: newStock,
            reason: "order_placed",
            changed_by: String((order as Record<string, unknown>).customer_email ?? ""),
            order_number: String((order as Record<string, unknown>).order_number ?? ""),
          };
        })
      ).then(entries => supabase.from("inventory_log").insert(entries)).catch(() => {});
    }

    // Increment coupon uses
    const couponCode = (order as Record<string, unknown>).coupon_code as string | undefined;
    if (couponCode) {
      try {
        const { data: c } = await supabase.from("coupons").select("id, uses").eq("code", couponCode).single();
        if (c) await supabase.from("coupons").update({ uses: c.uses + 1 }).eq("id", c.id);
      } catch { /* non-critical */ }
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

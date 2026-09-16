import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { emailSchema, orderNumberSchema, priceSchema, quantitySchema, uuidSchema } from "@/lib/validation/schemas";

type StockItem = { product_id: string; size: string; quantity: number };
type StockFailure = { product_id: string; product_name: string; size: string; requested: number; available: number };

const ALLOWED_PAYMENT_METHODS = ["gcash", "maya", "bank_transfer", "cod"] as const;

// Local-format only (09XXXXXXXXX) -- deliberately stricter than the shared
// mobileSchema (which also accepts +639XXXXXXXXX), preserving this route's
// pre-existing behavior on the highest-risk checkout path.
const mobileLocalOnlySchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "Invalid mobile");

// Envelope-level fields the route itself relies on are strictly typed;
// everything else (shipping_barangay/city/province/postal, subtotal,
// shipping_fee, discount, coupon_code, payment_type, payment_status,
// proof_of_payment, payment_reference, status, customer_id) rides through
// via passthrough, unvalidated here -- same as before this migration. The
// RPC (create_order_with_stock_check) remains the final authority on the
// full order/item shape regardless of what this schema checks.
const orderItemSchema = z.object({
  product_id: uuidSchema,
  size: z.string().trim().min(1, "Missing item size"),
  quantity: quantitySchema,
  unit_price: priceSchema,
}).passthrough();

const orderCreateSchema = z.object({
  order: z.object({
    order_number: orderNumberSchema,
    customer_name: z.string().trim().min(1, "Invalid name").max(200, "Invalid name"),
    customer_email: emailSchema,
    customer_mobile: mobileLocalOnlySchema,
    shipping_street: z.string().trim().max(300, "Street too long").optional(),
    payment_method: z.enum(ALLOWED_PAYMENT_METHODS, { error: "Invalid payment method" }),
    total: z.coerce.number().finite("Invalid total").min(0, "Invalid total").max(1_000_000, "Invalid total"),
  }).passthrough(),
  items: z.array(orderItemSchema).min(1, "Missing order data"),
});

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIP(req), 10, 60_000); // 10 orders/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const result = await validateBody(req, orderCreateSchema);
    if ("error" in result) return result.error;
    const { order, items } = result.data;

    const supabase = createAdminClient();

    if (order.payment_method === "cod") {
      const productIds = [...new Set(items.map(i => i.product_id))];
      if (productIds.length) {
        const { data: preorderCheck } = await supabase
          .from("products")
          .select("id, status")
          .in("id", productIds);
        if ((preorderCheck ?? []).some(p => p.status === "pre-order")) {
          return NextResponse.json(
            { error: "Cash on Delivery is not available for orders containing pre-order items" },
            { status: 400 }
          );
        }
      }
    }

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
    const stockItems: StockItem[] = items.map(i => ({
      product_id: i.product_id,
      size: i.size,
      quantity: i.quantity,
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
          const matchedItem = items.find(
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
            changed_by: order.customer_email,
            order_number: order.order_number,
          };
        })
      ).then(entries => supabase.from("inventory_log").insert(entries)).catch(() => {});
    }

    // Increment coupon uses
    const couponCode = order.coupon_code as string | undefined;
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

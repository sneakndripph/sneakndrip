import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { z } from "zod";
import { validateBody } from "@/lib/validation/validate";
import { emailSchema, orderNumberSchema, priceSchema, quantitySchema, uuidSchema } from "@/lib/validation/schemas";
import { unitPrice, calcShipping, shippingConfigFrom, couponDiscount, type PricedProduct } from "@/lib/orders/pricing";

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Re-validates a coupon and claims one use. The update only succeeds if `uses`
 * is unchanged since the read, so concurrent orders can't push it past max_uses.
 */
async function claimCoupon(supabase: Admin, code: string, subtotal: number): Promise<{ id: string; discount: number } | { error: string }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: c } = await supabase
      .from("coupons")
      .select("id, type, value, min_order, max_uses, uses, expires_at, is_active")
      .eq("code", code)
      .maybeSingle();
    if (!c || !c.is_active) return { error: "This coupon code is not valid." };
    if (c.expires_at && new Date(c.expires_at).getTime() < Date.now()) return { error: "This coupon has expired." };
    if (c.max_uses !== null && c.uses >= c.max_uses) return { error: "This coupon has reached its usage limit." };
    if (subtotal < Number(c.min_order ?? 0)) return { error: `This coupon needs a minimum order of ₱${Number(c.min_order).toLocaleString()}.` };
    const { data: claimed } = await supabase
      .from("coupons").update({ uses: c.uses + 1 }).eq("id", c.id).eq("uses", c.uses).select("id");
    if (claimed?.length) return { id: c.id, discount: couponDiscount(c, subtotal) };
  }
  return { error: "This coupon is busy right now. Please try again." };
}

/** Gives a claimed use back when the order isn't created. Best-effort. */
async function releaseCoupon(supabase: Admin, id: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: c } = await supabase.from("coupons").select("uses").eq("id", id).maybeSingle();
    if (!c || c.uses <= 0) return;
    const { data: done } = await supabase.from("coupons").update({ uses: c.uses - 1 }).eq("id", id).eq("uses", c.uses).select("id");
    if (done?.length) return;
  }
}

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

// Only what the customer legitimately chooses is read from the body. Prices,
// totals, discount, owner, status and proof are rebuilt on the server below,
// so a tampered request cannot set them (security audit, Nov 2026).
const orderItemSchema = z.object({
  product_id: uuidSchema,
  size: z.string().trim().min(1, "Missing item size").max(40),
  quantity: quantitySchema,
  unit_price: priceSchema, // what the customer was shown; compared, never stored
  payment_type: z.enum(["full", "downpayment"]).optional(),
});

const addressPart = z.string().trim().max(200).optional();

const orderCreateSchema = z.object({
  order: z.object({
    order_number: orderNumberSchema,
    customer_name: z.string().trim().min(1, "Invalid name").max(200, "Invalid name"),
    customer_email: emailSchema.optional(), // ignored: the session email owns the order
    customer_mobile: mobileLocalOnlySchema,
    shipping_street: z.string().trim().max(300, "Street too long").optional(),
    shipping_barangay: addressPart,
    shipping_city: addressPart,
    shipping_province: addressPart,
    shipping_postal: z.string().trim().max(10).optional(),
    // shortcut: region comes from the client (only shifts shipping by a few pesos); derive it from the address if that ever matters.
    region_group: z.string().trim().max(40).optional(),
    coupon_code: z.string().trim().max(50).nullable().optional(),
    payment_method: z.enum(ALLOWED_PAYMENT_METHODS, { error: "Invalid payment method" }),
    payment_reference: z.string().trim().max(100).nullable().optional(),
    total: z.coerce.number().finite("Invalid total").min(0, "Invalid total").max(1_000_000, "Invalid total"),
  }),
  items: z.array(orderItemSchema).min(1, "Missing order data").max(50),
  utm: z.object({
    source: z.string().max(100), medium: z.string().max(100), campaign: z.string().max(100),
    content: z.string().max(100), term: z.string().max(100),
  }).partial().strip().optional(),
});

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`orders-create:${getIP(req)}`, 10, 60_000); // 10 orders/min per IP
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  try {
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const result = await validateBody(req, orderCreateSchema);
    if ("error" in result) return result.error;
    const { order: input, items: inputItems, utm } = result.data;

    const supabase = createAdminClient();

    const productIds = [...new Set(inputItems.map(i => i.product_id))];
    const [{ data: orderedProducts }, { data: settingRows }] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, brand, status, eta_end, is_published, full_payment_price, downpayment_price, sale_price, sale_start, sale_end")
        .in("id", productIds),
      supabase
        .from("store_settings")
        .select("key, value")
        .in("key", ["free_shipping_threshold", "metro_shipping_fee", "provincial_shipping_fee", "cod_enabled"]),
    ]);
    const byId = new Map((orderedProducts ?? []).map(p => [p.id as string, p]));
    if (productIds.some(id => !byId.get(id)?.is_published)) {
      return NextResponse.json({ error: "An item in your cart is no longer available. Please review your cart." }, { status: 400 });
    }
    const settings = Object.fromEntries((settingRows ?? []).map(r => [r.key as string, r.value as string]));
    if (input.payment_method === "cod" && settings.cod_enabled === "false") {
      return NextResponse.json({ error: "Cash on Delivery is currently unavailable" }, { status: 400 });
    }

    const preorders = (orderedProducts ?? []).filter(p => p.status === "pre-order");

    // A cart can outlive a pre-order's ETA window; the storefront shows these as
    // sold out, but the server is the only place that can enforce it.
    const expired = preorders.filter(p => p.eta_end && new Date(String(p.eta_end)).getTime() < Date.now());
    if (expired.length > 0) {
      return NextResponse.json(
        { error: `This pre-order has expired. ${expired.map(p => p.name).join(", ")} is no longer available.` },
        { status: 400 }
      );
    }

    if (input.payment_method === "cod" && preorders.length > 0) {
      return NextResponse.json(
        { error: "Cash on Delivery is not available for orders containing pre-order items" },
        { status: 400 }
      );
    }

    // Rebuild every money field from the catalogue and settings.
    const nowMs = Date.now();
    const items = inputItems.map(i => {
      const p = byId.get(i.product_id)!;
      const kind = i.payment_type === "downpayment" ? "downpayment" : "full_payment";
      return {
        product_id: i.product_id,
        product_name: String(p.name),
        brand: String(p.brand),
        size: i.size,
        quantity: i.quantity,
        unit_price: unitPrice(p as PricedProduct, kind, nowMs),
        payment_type: i.payment_type === "downpayment" ? "downpayment" : "full",
      };
    });
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const itemCount = items.reduce((s, i) => s + i.quantity, 0);
    const shippingFee = calcShipping(input.payment_method === "cod", input.region_group ?? "", subtotal, itemCount, shippingConfigFrom(settings));

    // Coupon: re-validate here and claim one use atomically (optimistic update on `uses`).
    let discount = 0;
    let claimedCoupon: { id: string } | null = null;
    const couponCode = input.coupon_code?.toUpperCase().trim() || null;
    if (couponCode) {
      const claim = await claimCoupon(supabase, couponCode, subtotal);
      if ("error" in claim) return NextResponse.json({ error: claim.error }, { status: 400 });
      discount = claim.discount;
      claimedCoupon = { id: claim.id };
    }
    const total = subtotal + shippingFee - discount;

    // The customer pays the amount they were shown, so never store a different one silently.
    if (Math.abs(total - input.total) > 0.5) {
      if (claimedCoupon) await releaseCoupon(supabase, claimedCoupon.id);
      return NextResponse.json(
        {
          error: "Prices in your cart have changed. Please review your cart and try again.",
          priceChanged: true,
          total,
          // Current prices so the cart can update itself and show the right total.
          prices: items.map(i => ({ product_id: i.product_id, payment_type: i.payment_type, unit_price: i.unit_price })),
        },
        { status: 409 }
      );
    }

    const order = {
      order_number: input.order_number,
      customer_id: null,
      customer_name: input.customer_name,
      customer_email: user.email!, // owner is the signed-in account, never the body
      customer_mobile: input.customer_mobile,
      shipping_street: input.shipping_street ?? "",
      shipping_barangay: input.shipping_barangay || "N/A",
      shipping_city: input.shipping_city ?? "",
      shipping_province: input.shipping_province || "N/A",
      shipping_postal: input.shipping_postal || "0000",
      subtotal,
      shipping_fee: shippingFee,
      discount,
      coupon_code: couponCode,
      total,
      payment_method: input.payment_method,
      payment_type: items[0]?.payment_type === "downpayment" ? "downpayment" : "full",
      payment_status: "pending",
      proof_of_payment: null, // set by /api/orders/upload-proof once the file is stored
      payment_reference: input.payment_reference || null,
      status: "pending",
    };

    // Single transactional RPC: locks + checks + deducts stock, inserts the
    // order and its items, all atomically. Any failure (insufficient stock,
    // bad input, a constraint violation) rolls the whole thing back — no
    // manual compensation/refund step needed.
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "create_order_with_stock_check",
      { p_order: order, p_items: items }
    );

    if (rpcError) {
      if (claimedCoupon) await releaseCoupon(supabase, claimedCoupon.id); // order not created: give the use back
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

    // Best-effort attribution; never fails the order (column may not exist until migration 044 runs).
    if (utm && Object.keys(utm).length) {
      try { await supabase.from("orders").update({ utm }).eq("id", data.id); } catch { /* non-critical */ }
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

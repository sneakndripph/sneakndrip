// Order money math shared by the checkout page (what the customer is shown and pays)
// and /api/orders/create (what is stored). Keep both on these functions so they agree.
import { SHIPPING_FEE } from "@/lib/constants";

export type PricedProduct = {
  full_payment_price: number;
  downpayment_price: number | null;
  sale_price?: number | null;
  sale_start?: string | null;
  sale_end?: string | null;
};

export type PaymentKind = "full_payment" | "downpayment";

/** Price per unit for this payment plan, applying an active sale to full payments. */
export function unitPrice(p: PricedProduct, kind: PaymentKind, nowMs: number): number {
  if (kind === "downpayment") return Number(p.downpayment_price ?? p.full_payment_price);
  const onSale = p.sale_price != null &&
    (!p.sale_start || new Date(p.sale_start).getTime() <= nowMs) &&
    (!p.sale_end || new Date(p.sale_end).getTime() >= nowMs);
  return Number(onSale ? p.sale_price : p.full_payment_price);
}

export type ShippingConfig = { freeThreshold: number; metro: number; prov: number };

export const DEFAULT_SHIPPING: ShippingConfig = {
  freeThreshold: SHIPPING_FEE.free_threshold,
  metro: SHIPPING_FEE.metro_sm,
  prov: SHIPPING_FEE.provincial_sm,
};

/** Same parsing the checkout page uses for the admin shipping settings. */
export function shippingConfigFrom(settings: Record<string, string | undefined>): ShippingConfig {
  return {
    freeThreshold: Number(settings.free_shipping_threshold) || SHIPPING_FEE.free_threshold,
    metro: Number(settings.metro_shipping_fee) || SHIPPING_FEE.metro_sm,
    prov: Number(settings.provincial_shipping_fee) || SHIPPING_FEE.provincial_sm,
  };
}

export function calcShipping(
  isCOD: boolean,
  regionGroup: string,
  sub: number,
  itemCount: number,
  cfg: ShippingConfig = DEFAULT_SHIPPING,
): number {
  const lg = itemCount > 2;
  if (isCOD) {
    if (regionGroup === "Visayas" || regionGroup === "Mindanao")
      return lg ? SHIPPING_FEE.cod_vm_lg : SHIPPING_FEE.cod_vm_sm;
    return lg ? SHIPPING_FEE.cod_luzon_lg : SHIPPING_FEE.cod_luzon_sm;
  }
  if (sub >= cfg.freeThreshold) return 0;
  if (regionGroup === "Metro Manila") return lg ? cfg.metro * 2 : cfg.metro;
  return lg ? cfg.prov * 2 : cfg.prov;
}

export type CouponRow = {
  type: string;
  value: number;
  min_order: number | null;
  buy_qty?: number | null;
  get_qty?: number | null;
  product_ids?: string[] | null;
};

/** A cart/order line as the deal math needs it. Downpayment lines never count toward deals. */
export type DealLine = { product_id: string; unit_price: number; quantity: number; payment_type?: string };

export const isDeal = (c: { type: string }) => c.type === "bogo" || c.type === "bundle";

export function dealGroupSize(c: CouponRow): number {
  return Math.max(1, Number(c.buy_qty ?? 1)) + Math.max(1, Number(c.get_qty ?? 1));
}

/** Short customer-facing label, e.g. "20% off", "Buy 1 Take 1", "Buy 1 Take 1 for ₱5,000". */
export function couponLabel(c: Pick<CouponRow, "type" | "value" | "buy_qty" | "get_qty">): string {
  const peso = (n: number) => `₱${Number(n).toLocaleString()}`;
  if (c.type === "percent") return `${c.value}% off`;
  if (c.type === "fixed") return `${peso(c.value)} off`;
  const bt = `Buy ${c.buy_qty ?? 1} Take ${c.get_qty ?? 1}`;
  return c.type === "bundle" ? `${bt} for ${peso(c.value)}` : bt;
}

/** Compact badge for product cards, e.g. "B1T1" or "B1T1 ₱5,000". */
export function dealBadge(c: Pick<CouponRow, "type" | "value" | "buy_qty" | "get_qty">): string {
  const bt = `B${c.buy_qty ?? 1}T${c.get_qty ?? 1}`;
  return c.type === "bundle" ? `${bt} ₱${Number(c.value).toLocaleString()}` : bt;
}

/**
 * Discount for a coupon (same formula on the checkout page, /api/coupons/validate and
 * /api/orders/create). Deals sort eligible full-payment units by price, highest first, and
 * group them buy+get at a time; leftovers that don't fill a group pay full price.
 */
export function couponDiscount(c: CouponRow, subtotal: number, lines: DealLine[] = []): number {
  let d: number;
  if (isDeal(c)) {
    const buy = Math.max(1, Number(c.buy_qty ?? 1));
    const size = dealGroupSize(c);
    const eligible = c.product_ids?.length ? new Set(c.product_ids) : null;
    const prices = lines
      .filter(l => l.payment_type !== "downpayment" && (!eligible || eligible.has(l.product_id)))
      .flatMap(l => Array<number>(Math.max(0, Math.floor(l.quantity))).fill(Number(l.unit_price)))
      .sort((a, b) => b - a);
    d = 0;
    for (let i = 0; i + size <= prices.length; i += size) {
      const group = prices.slice(i, i + size);
      const sum = group.reduce((s, p) => s + p, 0);
      d += c.type === "bogo"
        ? group.slice(buy).reduce((s, p) => s + p, 0) // the cheapest `get` items are free
        : Math.max(0, sum - Number(c.value));          // the group costs the bundle price
    }
  } else {
    d = c.type === "percent" ? Math.round((subtotal * Number(c.value)) / 100) : Number(c.value);
  }
  return Math.min(Math.max(d, 0), subtotal); // never negative, never more than the goods
}

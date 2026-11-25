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

export type CouponRow = { type: string; value: number; min_order: number | null };

/** Discount for a coupon on a subtotal (same formula as /api/coupons/validate). */
export function couponDiscount(c: CouponRow, subtotal: number): number {
  const d = c.type === "percent"
    ? Math.round((subtotal * Number(c.value)) / 100)
    : Number(c.value);
  return Math.min(Math.max(d, 0), subtotal); // never negative, never more than the goods
}

// GA4 ecommerce event helpers. Each function is a no-op if gtag hasn't been
// loaded (analytics consent declined, or GA not configured) — see
// GoogleAnalytics.tsx, which only defines window.gtag once consent is given.

export type AnalyticsItem = {
  id?: string;
  name: string;
  brand?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
};

function toGtagItem(item: AnalyticsItem) {
  return {
    ...(item.id ? { item_id: item.id } : {}),
    item_name: item.name,
    ...(item.brand ? { item_brand: item.brand } : {}),
    ...(item.size ? { item_variant: item.size } : {}),
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

function gtagEvent(name: string, params: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

export function trackViewItem(product: { id: string; name: string; brand: string }, price: number) {
  gtagEvent("view_item", {
    currency: "PHP",
    value: price,
    items: [toGtagItem({ id: product.id, name: product.name, brand: product.brand, quantity: 1, unitPrice: price })],
  });
}

export function trackAddToCart(
  product: { id: string; name: string; brand: string },
  price: number,
  quantity: number,
  size: string,
) {
  gtagEvent("add_to_cart", {
    currency: "PHP",
    value: price * quantity,
    items: [toGtagItem({ id: product.id, name: product.name, brand: product.brand, size, quantity, unitPrice: price })],
  });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number) {
  gtagEvent("begin_checkout", {
    currency: "PHP",
    value,
    items: items.map(toGtagItem),
  });
}

export function trackPurchase(transactionId: string, items: AnalyticsItem[], value: number) {
  gtagEvent("purchase", {
    transaction_id: transactionId,
    currency: "PHP",
    value,
    items: items.map(toGtagItem),
  });
}

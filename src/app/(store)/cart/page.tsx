"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { SHIPPING_FEE } from "@/lib/constants";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, LogIn, CheckSquare, Square, AlertCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMinimumLoadingTime } from "@/hooks/useMinimumLoadingTime";
import CartLoading from "./loading";
import type { Product } from "@/lib/types";

type StockCheck = {
  product_id: string;
  size: string;
  current_stock: number;
  requested_quantity: number;
  status: "available" | "reduced" | "sold_out";
};

function TopProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-16 pt-12 border-t border-line">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-eyebrow text-ink-3 mb-1">You Might Also Like</p>
          <h2 className="text-display-s text-ink font-display font-medium">Top picks</h2>
        </div>
        <Link href="/shop" className="text-body-sm text-ink-2 transition-colors hover:text-ink">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
            <div className={`aspect-square overflow-hidden mb-3 relative flex items-center justify-center rounded-md transition-transform duration-slow ease-smooth group-hover:scale-[1.02] border border-line ${!p.bg ? "bg-paper-2" : ""}`}
              style={p.bg ? { background: p.bg } : undefined}>
              {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover object-center" sizes="300px" />
              ) : (
                <span className="font-display text-ink opacity-5 text-[3rem]">
                  {p.brand.charAt(0)}
                </span>
              )}
              <div className="absolute top-2 left-2">
                <span className="bg-paper border border-line text-eyebrow px-2 py-0.5 rounded-sm text-ink-3">
                  {p.status === "pre-order" ? "Pre-Order" : "On Hand"}
                </span>
              </div>
            </div>
            <p className="text-eyebrow text-ink-3 mb-0.5">{p.brand}</p>
            <p className="text-body-sm text-ink leading-snug mb-1">{p.name}</p>
            <p className="text-body-sm font-medium text-ink">
              ₱{p.full_payment_price.toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, removeItems, updateQuantity, updateSize, updatePaymentType, subtotal } = useCartStore();
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const itemKey = (id: string, size: string) => `${id}-${size}`;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map(i => itemKey(i.product.id, i.size))));
  const allSelected = items.length > 0 && items.every(i => selected.has(itemKey(i.product.id, i.size)));
  const selectedItems = items.filter(i => selected.has(itemKey(i.product.id, i.size)));
  const sub = selectedItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const [stockMap, setStockMap] = useState<Record<string, StockCheck>>({});
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  // Cart is persisted to localStorage; on first mount it hasn't hydrated yet,
  // so `items` is briefly [] even for a returning customer with a full cart.
  // `.persist` is only available client-side, so it must never be touched
  // during the render/useState-initializer phase (which also runs on the server).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const persistApi = useCartStore.persist;
    if (!persistApi) { queueMicrotask(() => setHydrated(true)); return; }
    if (persistApi.hasHydrated()) { queueMicrotask(() => setHydrated(true)); return; }
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);
  const showLoading = useMinimumLoadingTime(!hydrated, 800);

  const refreshStock = useCallback(() => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    fetch("/api/cart/refresh-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: current.map(i => ({ product_id: i.product.id, size: i.size, quantity: i.quantity })),
      }),
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) return;
        const map: Record<string, StockCheck> = {};
        for (const check of (data.items ?? []) as StockCheck[]) {
          map[itemKey(check.product_id, check.size)] = check;
        }
        setStockMap(map);
      })
      .catch(() => { /* silent -- non-critical background check */ });
  }, []);

  // Refresh on mount, and again whenever the user tabs back in -- another
  // customer may have bought the last unit while this tab was in the background.
  useEffect(() => {
    refreshStock();
    const onVisible = () => { if (document.visibilityState === "visible") refreshStock(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshStock]);

  const hasSoldOut = selectedItems.some(i => stockMap[itemKey(i.product.id, i.size)]?.status === "sold_out");
  const hasReduced = !hasSoldOut && selectedItems.some(i => stockMap[itemKey(i.product.id, i.size)]?.status === "reduced");

  useEffect(() => {
    const supabase = createClient();
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    // Fetch top picks
    supabase
      .from("products")
      .select("*, product_sizes(size, stock)")
      .eq("is_published", true)
      .eq("is_trending", true)
      .limit(4)
      .then(({ data }) => {
        if (data?.length) {
          const cartIds = new Set(items.map(i => i.product.id));
          const filtered = data
            .filter((p: Record<string, unknown>) => !cartIds.has(p.id as string))
            .slice(0, 4)
            .map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              slug: p.slug as string,
              brand: p.brand as string,
              colorway: (p.colorway as string) ?? "",
              gender: (p.gender as string) ?? "Unisex",
              description: (p.description as string) ?? "",
              status: p.status as Product["status"],
              srp_price: p.srp_price as number,
              downpayment_price: p.downpayment_price as number,
              full_payment_price: p.full_payment_price as number,
              is_featured: Boolean(p.is_featured),
              is_trending: Boolean(p.is_trending),
              is_new: Boolean(p.is_new),
              bg: (p.bg as string) ?? undefined,
              eta_start: (p.eta_start as string) ?? undefined,
              eta_end: (p.eta_end as string) ?? undefined,
              sizes: ((p.product_sizes as Record<string, unknown>[]) ?? []).map(s => ({ size: s.size as string, stock: s.stock as number })),
              images: (p.images as string[]) ?? [],
            }));
          setTopProducts(filtered);
        }
      });
  }, [items]);

  if (showLoading) {
    return <CartLoading />;
  }

  if (items.length === 0) {
    return (
      <div className="bg-paper min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-24">
          <div className="flex flex-col items-center justify-center mb-16">
            <div className="w-20 h-20 rounded-full bg-paper-2 flex items-center justify-center mb-5">
              <ShoppingBag className="w-8 h-8 text-ink-3" />
            </div>
            <h2 className="text-display-s text-ink font-display font-medium">
              Your cart is empty
            </h2>
            <p className="text-body-sm text-ink-3 mt-2 mb-8">Looks like you haven&apos;t added anything yet.</p>
            <Link href="/shop"
              className="px-8 py-3.5 rounded-md text-body-sm font-medium transition-colors bg-ink text-paper hover:bg-ink-2">
              Start Shopping
            </Link>
          </div>
          <TopProducts products={topProducts} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-12 py-12">
        <div className="mb-10">
          <p className="text-eyebrow text-ink-3 mb-3">Checkout</p>
          <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em]">
            Your cart
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={() => setSelected(allSelected ? new Set() : new Set(items.map(i => itemKey(i.product.id, i.size))))}
                className="flex items-center gap-1.5 text-body-sm text-ink-3 transition-colors hover:text-ink">
                {allSelected ? <CheckSquare className="w-4 h-4 text-ink" /> : <Square className="w-4 h-4" />}
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => {
                    removeItems(items.filter(i => selected.has(itemKey(i.product.id, i.size))).map(i => ({ productId: i.product.id, size: i.size })));
                    setSelected(new Set());
                  }}
                  className="flex items-center gap-1.5 text-body-sm text-state-error transition-opacity hover:opacity-70">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected ({selected.size})
                </button>
              )}
            </div>
            {items.map(item => {
              const key = itemKey(item.product.id, item.size);
              const isSelected = selected.has(key);
              const isPreOrder = item.product.status === "pre-order";
              const stockCheck = stockMap[key];
              return (
              <div key={key}
                className={`p-4 flex gap-4 rounded-md transition-opacity bg-paper border ${isSelected ? "border-ink opacity-100" : "border-line opacity-60"}`}>
                {/* Checkbox */}
                <button
                  onClick={() => setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })}
                  className="shrink-0 self-start mt-0.5">
                  {isSelected
                    ? <CheckSquare className="w-5 h-5 text-ink" />
                    : <Square className="w-5 h-5 text-line-strong" />}
                </button>

                {/* Image — clickable */}
                <Link href={`/shop/${item.product.slug}`} className={`w-20 h-20 shrink-0 flex items-center justify-center relative overflow-hidden rounded-md transition-opacity hover:opacity-80 border border-line ${!item.product.bg ? "bg-paper-2" : ""}`}
                  style={item.product.bg ? { background: item.product.bg } : undefined}>
                  {item.product.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover object-center" sizes="80px" />
                  ) : (
                    <span className="font-display text-ink opacity-5 text-[1.5rem]">
                      {item.product.brand.charAt(0)}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-eyebrow text-ink-3 mb-0.5">{item.product.brand}</p>
                      <Link href={`/shop/${item.product.slug}`} className="text-body-sm text-ink leading-snug hover:underline underline-offset-2">{item.product.name}</Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <select
                          value={item.size}
                          onChange={e => updateSize(item.product.id, item.size, e.target.value)}
                          className="text-micro px-2 py-0.5 rounded-sm cursor-pointer focus:outline-none border border-line text-ink-3 bg-paper-2">
                          {item.product.sizes
                            .filter(s => s.stock > 0 || s.size === item.size)
                            .map(s => (
                              <option key={s.size} value={s.size}>{s.size}</option>
                            ))}
                        </select>
                        {isPreOrder ? (
                          <div className="flex flex-wrap gap-1">
                            {(["full_payment", "downpayment"] as const).map(pt => (
                              <button key={pt} type="button"
                                onClick={() => updatePaymentType(item.product.id, item.size, pt)}
                                className={`px-2 py-0.5 text-micro rounded-sm transition-colors whitespace-nowrap border ${
                                  item.payment_type === pt ? "bg-ink text-paper border-ink" : "bg-transparent text-ink-3 border-line"
                                }`}>
                                {pt === "full_payment" ? `Full ₱${item.product.full_payment_price.toLocaleString()}` : `DP ₱${item.product.downpayment_price.toLocaleString()}`}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-micro px-2 py-0.5 rounded-sm bg-paper-2 text-ink-3">
                            Full Payment
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-body font-display font-medium shrink-0 text-ink">
                      ₱{(item.unit_price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  {stockCheck && stockCheck.status !== "available" && (
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <span className={`flex items-center gap-1.5 text-admin ${stockCheck.status === "sold_out" ? "text-state-error" : "text-state-preorder"}`}>
                        {stockCheck.status === "sold_out"
                          ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        {stockCheck.status === "sold_out"
                          ? "This item is no longer available"
                          : `Only ${stockCheck.current_stock} left`}
                      </span>
                      <button
                        onClick={() => {
                          if (stockCheck.status === "sold_out") {
                            removeItem(item.product.id, item.size);
                          } else {
                            updateQuantity(item.product.id, item.size, stockCheck.current_stock);
                            setStockMap(prev => ({
                              ...prev,
                              [key]: { ...stockCheck, status: "available", requested_quantity: stockCheck.current_stock },
                            }));
                          }
                        }}
                        className="shrink-0 px-2.5 py-1 rounded-md text-admin-sm bg-paper border border-line text-ink hover:bg-paper-2 transition-colors">
                        {stockCheck.status === "sold_out" ? "Remove" : `Update quantity to ${stockCheck.current_stock}`}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty control */}
                    <div className="flex items-center gap-0 border border-line rounded-md">
                      {(() => {
                        const maxStock = item.product.sizes.find(s => s.size === item.size)?.stock ?? 99;
                        return (
                          <>
                            <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-ink transition-opacity hover:opacity-60">
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.quantity}
                              onChange={e => {
                                const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                                if (!isNaN(val) && val >= 1) {
                                  updateQuantity(item.product.id, item.size, Math.min(val, maxStock));
                                }
                              }}
                              className="w-10 text-center text-body-sm text-ink focus:outline-none bg-transparent"
                            />
                            <button onClick={() => updateQuantity(item.product.id, item.size, Math.min(item.quantity + 1, maxStock))}
                              disabled={item.quantity >= maxStock}
                              className="w-8 h-8 flex items-center justify-center text-ink transition-opacity hover:opacity-60 disabled:opacity-30">
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    <button onClick={() => removeItem(item.product.id, item.size)}
                      className="flex items-center gap-1 text-body-sm text-state-error transition-opacity hover:opacity-60">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Summary */}
          <div className="overflow-hidden rounded-md lg:sticky lg:top-24 bg-paper border border-line">
            <div className="p-6">
              <h2 className="text-eyebrow text-ink-3 mb-5">
                Order Summary
              </h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-body-sm">
                  <span className="text-ink-3">
                    Subtotal ({selectedItems.reduce((s, i) => s + i.quantity, 0)} of {items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span className="text-ink">₱{sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-ink-3">Shipping</span>
                  <span className="text-ink-3">Computed at checkout</span>
                </div>
                {sub >= SHIPPING_FEE.free_threshold && (
                  <p className="text-micro text-ink-3">
                    You may qualify for free shipping (GCash / Maya / Bank)
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center py-4 mb-5 border-t border-b border-line">
                <span className="text-body-sm text-ink">Total</span>
                <span className="text-display-s text-ink font-display font-medium">₱{sub.toLocaleString()}</span>
              </div>
              {selectedItems.length === 0 && (
                <p className="text-micro text-center mb-3 text-state-error">Select at least one item to checkout</p>
              )}
              {hasSoldOut ? (
                <p className="flex items-center justify-center gap-1.5 text-admin text-center mb-3 text-state-error">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Remove unavailable items to continue.
                </p>
              ) : hasReduced && (
                <p className="flex items-center justify-center gap-1.5 text-admin text-center mb-3 text-state-error">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Update quantities to available amounts to continue.
                </p>
              )}
              {isLoggedIn === false ? (
                <button
                  onClick={() => router.push("/login?redirect=/checkout")}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-md text-body-sm font-medium transition-colors bg-ink text-paper hover:bg-ink-2">
                  <LogIn className="w-4 h-4" /> Sign In to Checkout
                </button>
              ) : (
                <button
                  disabled={selectedItems.length === 0 || hasSoldOut || hasReduced}
                  onClick={() => {
                    const keys = Array.from(selected);
                    sessionStorage.setItem("snd_checkout_keys", JSON.stringify(keys));
                    router.push("/checkout");
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-md text-body-sm font-medium transition-colors bg-ink text-paper hover:bg-ink-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <Link href="/shop"
                className="flex items-center justify-center mt-3 py-3 text-body-sm text-ink-3 transition-colors hover:text-ink">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        <TopProducts products={topProducts} />
      </div>
    </div>
  );
}

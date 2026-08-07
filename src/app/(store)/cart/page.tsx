"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { SHIPPING_FEE } from "@/lib/constants";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, LogIn, CheckSquare, Square } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

function TopProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-16 pt-12 border-t border-snd-border">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-snd-teal">You Might Also Like</p>
          <h2 className="font-heading tracking-[0.04em] text-[2rem] text-snd-black">TOP PICKS</h2>
        </div>
        <Link href="/shop" className="text-sm font-semibold transition-opacity hover:opacity-60 text-snd-black">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
            <div className={`aspect-square overflow-hidden mb-3 relative flex items-center justify-center transition-transform group-hover:scale-[1.02] border border-snd-border ${!p.bg ? "bg-snd-bg" : ""}`}
              style={p.bg ? { background: p.bg } : undefined}>
              {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover object-center" sizes="300px" />
              ) : (
                <span className="font-heading text-[3rem] text-snd-black opacity-[0.06]">
                  {p.brand.charAt(0)}
                </span>
              )}
              <div className="absolute top-2 left-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 text-white ${p.status === "pre-order" ? "bg-snd-red" : "bg-snd-teal"}`}>
                  {p.status === "pre-order" ? "Pre-Order" : "On Hand"}
                </span>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-snd-muted">{p.brand}</p>
            <p className="text-sm font-semibold leading-snug mb-1 text-snd-black">{p.name}</p>
            <p className="font-black font-heading text-[1.1rem] text-snd-black">
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

  if (items.length === 0) {
    return (
      <div className="bg-snd-bg font-body min-h-[80vh]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
          <div className="flex flex-col items-center justify-center mb-16">
            <ShoppingBag className="w-16 h-16 mb-5 text-snd-muted-lt" />
            <h2 className="font-heading tracking-[0.04em] text-[2.5rem] text-snd-black">
              YOUR CART IS EMPTY
            </h2>
            <p className="text-sm mt-2 mb-8 text-snd-muted">Looks like you haven't added anything yet.</p>
            <Link href="/shop"
              className="px-8 py-4 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80 bg-snd-black text-snd-bg">
              Start Shopping
            </Link>
          </div>
          <TopProducts products={topProducts} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-snd-bg font-body min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="mb-10">
          <p className="snd-label mb-3 text-snd-muted-lt">Checkout</p>
          <h1 className="font-heading tracking-[0.04em] leading-none text-snd-black text-[length:var(--text-display-sm)]">
            YOUR CART
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <button
                onClick={() => setSelected(allSelected ? new Set() : new Set(items.map(i => itemKey(i.product.id, i.size))))}
                className="flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70 text-snd-muted">
                {allSelected ? <CheckSquare className="w-4 h-4 text-snd-teal" /> : <Square className="w-4 h-4" />}
                {allSelected ? "Deselect All" : "Select All"}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={() => {
                    removeItems(items.filter(i => selected.has(itemKey(i.product.id, i.size))).map(i => ({ productId: i.product.id, size: i.size })));
                    setSelected(new Set());
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold transition-opacity hover:opacity-70 text-[#EF4444]">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Selected ({selected.size})
                </button>
              )}
            </div>
            {items.map(item => {
              const key = itemKey(item.product.id, item.size);
              const isSelected = selected.has(key);
              const isPreOrder = item.product.status === "pre-order";
              return (
              <div key={key}
                className={`p-5 flex gap-5 transition-opacity bg-snd-card border-[1.5px] ${isSelected ? "border-snd-teal opacity-100" : "border-snd-border opacity-60"}`}>
                {/* Checkbox */}
                <button
                  onClick={() => setSelected(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })}
                  className="shrink-0 self-start mt-0.5">
                  {isSelected
                    ? <CheckSquare className="w-5 h-5 text-snd-teal" />
                    : <Square className="w-5 h-5 text-snd-border" />}
                </button>

                {/* Image — clickable */}
                <Link href={`/shop/${item.product.slug}`} className={`w-20 h-20 shrink-0 flex items-center justify-center relative overflow-hidden transition-opacity hover:opacity-80 border border-snd-border ${!item.product.bg ? "bg-snd-bg" : ""}`}
                  style={item.product.bg ? { background: item.product.bg } : undefined}>
                  {item.product.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover object-center" sizes="80px" />
                  ) : (
                    <span className="font-heading text-snd-black opacity-[0.06] text-[1.5rem]">
                      {item.product.brand.charAt(0)}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-0.5 text-snd-muted">{item.product.brand}</p>
                      <Link href={`/shop/${item.product.slug}`} className="font-semibold text-sm leading-snug hover:underline underline-offset-2 text-snd-black">{item.product.name}</Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <select
                          value={item.size}
                          onChange={e => updateSize(item.product.id, item.size, e.target.value)}
                          className="text-xs px-2 py-0.5 font-medium cursor-pointer focus:outline-none border border-snd-border text-snd-muted bg-snd-bg">
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
                                className={`px-2 py-0.5 text-xs font-bold transition-all whitespace-nowrap border ${
                                  item.payment_type === pt ? "bg-snd-teal text-white border-snd-teal" : "bg-transparent text-snd-muted border-snd-border"
                                }`}>
                                {pt === "full_payment" ? `Full ₱${item.product.full_payment_price.toLocaleString()}` : `DP ₱${item.product.downpayment_price.toLocaleString()}`}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 font-semibold bg-snd-teal/[8%] text-snd-teal">
                            Full Payment
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-black shrink-0 font-heading text-[1.3rem] text-snd-black">
                      ₱{(item.unit_price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty control */}
                    <div className="flex items-center gap-0 border border-snd-border">
                      {(() => {
                        const maxStock = item.product.sizes.find(s => s.size === item.size)?.stock ?? 99;
                        return (
                          <>
                            <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60 text-snd-black">
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
                              className="w-10 text-center text-sm font-bold focus:outline-none bg-transparent text-snd-black"
                            />
                            <button onClick={() => updateQuantity(item.product.id, item.size, Math.min(item.quantity + 1, maxStock))}
                              disabled={item.quantity >= maxStock}
                              className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60 disabled:opacity-30 text-snd-black">
                              <Plus className="w-3 h-3" />
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    <button onClick={() => removeItem(item.product.id, item.size)}
                      className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-60 text-snd-red">
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Summary */}
          <div className="overflow-hidden sticky top-24 bg-snd-card border border-snd-border">
            <div className="p-6">
              <h2 className="mb-5 font-heading tracking-[0.04em] text-[1.5rem] text-snd-black">
                ORDER SUMMARY
              </h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-snd-muted">
                    Subtotal ({selectedItems.reduce((s, i) => s + i.quantity, 0)} of {items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span className="text-snd-black">₱{sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-snd-muted">Shipping</span>
                  <span className="text-snd-muted">Calculated at checkout</span>
                </div>
                {sub >= SHIPPING_FEE.free_threshold && (
                  <p className="text-xs text-snd-teal">
                    You may qualify for free shipping (GCash / Maya / Bank)
                  </p>
                )}
              </div>
              <div className="flex justify-between font-black py-4 mb-5 border-t border-b border-snd-border">
                <span className="text-snd-black">Subtotal</span>
                <span className="font-heading text-[1.5rem] text-snd-black">₱{sub.toLocaleString()}</span>
              </div>
              {selectedItems.length === 0 && (
                <p className="text-xs text-center mb-3 font-semibold text-snd-red">Select at least one item to checkout</p>
              )}
              {isLoggedIn === false ? (
                <button
                  onClick={() => router.push("/login?redirect=/checkout")}
                  className="flex items-center justify-center gap-2 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 bg-snd-teal text-white">
                  <LogIn className="w-4 h-4" /> Sign In to Checkout
                </button>
              ) : (
                <button
                  disabled={selectedItems.length === 0}
                  onClick={() => {
                    const keys = Array.from(selected);
                    sessionStorage.setItem("snd_checkout_keys", JSON.stringify(keys));
                    router.push("/checkout");
                  }}
                  className="flex items-center justify-center gap-2 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-40 bg-snd-black text-snd-bg">
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <Link href="/shop"
                className="flex items-center justify-center mt-3 py-3 text-sm font-semibold transition-opacity hover:opacity-60 text-snd-muted">
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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { BRAND, FONTS, SHIPPING_FEE } from "@/lib/constants";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

function TopProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mt-16 pt-12" style={{ borderTop: `1px solid ${BRAND.border}` }}>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>You Might Also Like</p>
          <h2 style={{ fontFamily: FONTS.display, fontSize: "2rem", letterSpacing: "0.04em", color: BRAND.black }}>TOP PICKS</h2>
        </div>
        <Link href="/shop" className="text-sm font-semibold transition-opacity hover:opacity-60" style={{ color: BRAND.black }}>
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(p => (
          <Link key={p.id} href={`/shop/${p.slug}`} className="group block">
            <div className="aspect-square rounded-xl overflow-hidden mb-3 relative flex items-center justify-center transition-transform group-hover:scale-[1.02]"
              style={{ background: p.bg || BRAND.bg, border: `1px solid ${BRAND.cardBorder}` }}>
              {p.images?.[0] ? (
                <Image src={p.images[0]} alt={p.name} fill className="object-cover object-center" sizes="300px" />
              ) : (
                <span style={{ fontFamily: FONTS.display, fontSize: "3rem", color: BRAND.black, opacity: 0.06 }}>
                  {p.brand.charAt(0)}
                </span>
              )}
              <div className="absolute top-2 left-2">
                <span className="text-[9px] font-black uppercase px-2 py-0.5 text-white"
                  style={{ background: p.status === "pre-order" ? BRAND.red : BRAND.teal }}>
                  {p.status === "pre-order" ? "Pre-Order" : "On Hand"}
                </span>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.muted }}>{p.brand}</p>
            <p className="text-sm font-semibold leading-snug mb-1" style={{ color: BRAND.black }}>{p.name}</p>
            <p className="font-black" style={{ fontFamily: FONTS.display, fontSize: "1.1rem", color: BRAND.black }}>
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
  const { items, removeItem, updateQuantity, updateSize, subtotal } = useCartStore();
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const sub = subtotal();

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
      <div style={{ background: BRAND.bg, fontFamily: FONTS.body, minHeight: "80vh" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center justify-center mb-16">
            <ShoppingBag className="w-16 h-16 mb-5" style={{ color: BRAND.mutedLight }} />
            <h2 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black, letterSpacing: "0.04em" }}>
              YOUR CART IS EMPTY
            </h2>
            <p className="text-sm mt-2 mb-8" style={{ color: BRAND.muted }}>Looks like you haven't added anything yet.</p>
            <Link href="/shop"
              className="px-8 py-4 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-80"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              Start Shopping
            </Link>
          </div>
          <TopProducts products={topProducts} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body, minHeight: "80vh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="mb-8" style={{ fontFamily: FONTS.display, fontSize: "3rem", letterSpacing: "0.04em", color: BRAND.black }}>
          YOUR CART
        </h1>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={`${item.product.id}-${item.size}`}
                className="p-5 rounded-xl flex gap-5"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
                {/* Image — clickable */}
                <Link href={`/shop/${item.product.slug}`} className="w-20 h-20 shrink-0 rounded-lg flex items-center justify-center relative overflow-hidden transition-opacity hover:opacity-80"
                  style={{ background: item.product.bg || BRAND.bg, border: `1px solid ${BRAND.border}` }}>
                  {item.product.images?.[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover object-center" sizes="80px" />
                  ) : (
                    <span style={{ fontFamily: FONTS.display, color: BRAND.black, opacity: 0.06, fontSize: "1.5rem" }}>
                      {item.product.brand.charAt(0)}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.muted }}>{item.product.brand}</p>
                      <Link href={`/shop/${item.product.slug}`} className="font-semibold text-sm leading-snug hover:underline underline-offset-2" style={{ color: BRAND.black }}>{item.product.name}</Link>
                      <div className="flex items-center gap-2 mt-1.5">
                        <select
                          value={item.size}
                          onChange={e => updateSize(item.product.id, item.size, e.target.value)}
                          className="text-xs px-2 py-0.5 font-medium cursor-pointer focus:outline-none"
                          style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted, background: BRAND.bg }}>
                          {item.product.sizes
                            .filter(s => s.stock > 0 || s.size === item.size)
                            .map(s => (
                              <option key={s.size} value={s.size}>{s.size}</option>
                            ))}
                        </select>
                        <span className="text-xs px-2 py-0.5 font-semibold"
                          style={{ background: item.payment_type === "full_payment" ? `${BRAND.teal}15` : `${BRAND.red}12`, color: item.payment_type === "full_payment" ? BRAND.teal : BRAND.red }}>
                          {item.payment_type === "full_payment" ? "Full Payment" : "Downpayment"}
                        </span>
                      </div>
                    </div>
                    <p className="font-black shrink-0" style={{ fontFamily: FONTS.display, fontSize: "1.3rem", color: BRAND.black }}>
                      ₱{(item.unit_price * item.quantity).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty control */}
                    <div className="flex items-center gap-0" style={{ border: `1px solid ${BRAND.border}` }}>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60"
                        style={{ color: BRAND.black }}>
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold" style={{ color: BRAND.black }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-60"
                        style={{ color: BRAND.black }}>
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button onClick={() => removeItem(item.product.id, item.size)}
                      className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-60"
                      style={{ color: BRAND.red }}>
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="rounded-xl overflow-hidden sticky top-24"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
            <div className="p-6">
              <h2 className="mb-5" style={{ fontFamily: FONTS.display, fontSize: "1.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
                ORDER SUMMARY
              </h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span style={{ color: BRAND.muted }}>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span style={{ color: BRAND.black }}>₱{sub.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: BRAND.muted }}>Shipping</span>
                  <span style={{ color: BRAND.muted }}>Calculated at checkout</span>
                </div>
                {sub >= SHIPPING_FEE.free_threshold && (
                  <p className="text-xs" style={{ color: BRAND.teal }}>
                    You may qualify for free shipping (GCash / Maya / Bank)
                  </p>
                )}
              </div>
              <div className="flex justify-between font-black py-4 mb-5"
                style={{ borderTop: `1px solid ${BRAND.border}`, borderBottom: `1px solid ${BRAND.border}` }}>
                <span style={{ color: BRAND.black }}>Subtotal</span>
                <span style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black }}>₱{sub.toLocaleString()}</span>
              </div>
              {isLoggedIn === false ? (
                <button
                  onClick={() => router.push("/login?redirect=/checkout")}
                  className="flex items-center justify-center gap-2 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
                  style={{ background: BRAND.teal, color: "#fff" }}>
                  <LogIn className="w-4 h-4" /> Sign In to Checkout
                </button>
              ) : (
                <Link href="/checkout"
                  className="flex items-center justify-center gap-2 w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
                  style={{ background: BRAND.black, color: BRAND.bg }}>
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <Link href="/shop"
                className="flex items-center justify-center mt-3 py-3 text-sm font-semibold transition-opacity hover:opacity-60"
                style={{ color: BRAND.muted }}>
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

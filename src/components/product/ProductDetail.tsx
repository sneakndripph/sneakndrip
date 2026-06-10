"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND, FONTS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Zap, Shield, Truck, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/lib/types";

function formatETA(start: string, end?: string) {
  const s = new Date(start);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!end) return `${months[s.getMonth()]} ${s.getDate()}`;
  const e = new Date(end);
  if (s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

export default function ProductDetail({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"full_payment" | "downpayment">("full_payment");
  const [activeTab, setActiveTab] = useState<"details" | "shipping" | "auth">("details");
  const [imageIdx, setImageIdx] = useState(0);
  const addItem = useCartStore(s => s.addItem);

  const isPreOrder = product.status === "pre-order";
  const price = paymentType === "full_payment" ? product.full_payment_price : product.downpayment_price;
  const images = Array(4).fill(product.bg || BRAND.bg);

  function handleAddToCart() {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    addItem(product, selectedSize, paymentType);
    toast.success(`${product.name} (${selectedSize}) added to cart!`);
  }

  return (
    <div style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-8 text-xs" style={{ color: BRAND.muted }}>
          <Link href="/" className="hover:opacity-70">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:opacity-70">Shop</Link>
          <span>/</span>
          <span style={{ color: BRAND.black }}>{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square mb-3 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: images[imageIdx], border: `1px solid ${BRAND.cardBorder}` }}>
              <span style={{ fontFamily: FONTS.display, fontSize: "8rem", color: BRAND.black, opacity: 0.05 }}>
                {product.brand.charAt(0)}
              </span>
              <div className="absolute top-4 left-4">
                {isPreOrder ? (
                  <span className="text-xs font-black uppercase px-3 py-1.5 text-white" style={{ background: BRAND.red }}>Pre-Order</span>
                ) : (
                  <span className="text-xs font-black uppercase px-3 py-1.5 text-white" style={{ background: BRAND.teal }}>On Hand</span>
                )}
              </div>
              {product.full_payment_price < product.srp_price && (
                <div className="absolute top-4 right-4 w-16 h-16 rounded-full flex flex-col items-center justify-center"
                  style={{ background: BRAND.red }}>
                  <span className="text-white text-[9px] font-black uppercase text-center leading-tight">Below<br />SRP</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {images.map((bg, i) => (
                <button key={i} onClick={() => setImageIdx(i)}
                  className="aspect-square rounded-lg flex items-center justify-center transition-all"
                  style={{ background: bg, border: `2px solid ${imageIdx === i ? BRAND.teal : BRAND.border}` }}>
                  <span style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black, opacity: 0.07 }}>
                    {product.brand.charAt(0)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>{product.brand}</p>
            <h1 className="text-2xl font-bold mb-1 leading-snug" style={{ color: BRAND.black }}>{product.name}</h1>
            {product.colorway && <p className="text-sm mb-4" style={{ color: BRAND.muted }}>{product.colorway}</p>}

            {isPreOrder && product.eta_start && (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm mb-5"
                style={{ background: `${BRAND.red}12`, border: `1px solid ${BRAND.red}30` }}>
                <Clock className="w-4 h-4" style={{ color: BRAND.red }} />
                <span className="text-sm font-bold" style={{ color: BRAND.red }}>
                  ETA: {formatETA(product.eta_start, product.eta_end)}
                </span>
              </div>
            )}

            {/* Pricing */}
            <div className="p-5 rounded-xl mb-6" style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
              <div className="mb-4">
                <p style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: BRAND.black, letterSpacing: "0.02em" }}>
                  ₱{price.toLocaleString()}
                </p>
                {product.srp_price !== product.full_payment_price && (
                  <p className="text-sm" style={{ color: BRAND.muted }}>
                    SRP: <span className="line-through">₱{product.srp_price.toLocaleString()}</span>
                    <span className="ml-2 font-bold" style={{ color: BRAND.red }}>
                      Save ₱{(product.srp_price - product.full_payment_price).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-1">
                {([
                  { value: "full_payment" as const, label: "Full Payment", price: product.full_payment_price },
                  { value: "downpayment" as const, label: "Downpayment", price: product.downpayment_price },
                ]).map(opt => (
                  <button key={opt.value} onClick={() => setPaymentType(opt.value)}
                    className="py-3 px-3 text-center transition-all rounded-sm"
                    style={{
                      background: paymentType === opt.value ? BRAND.teal : "transparent",
                      color: paymentType === opt.value ? "#fff" : BRAND.muted,
                      border: `1.5px solid ${paymentType === opt.value ? BRAND.teal : BRAND.border}`,
                    }}>
                    <p className="text-xs font-bold uppercase tracking-wide">{opt.label}</p>
                    <p style={{ fontFamily: FONTS.display, fontSize: "1.1rem" }}>₱{opt.price.toLocaleString()}</p>
                  </button>
                ))}
              </div>
              {paymentType === "downpayment" && (
                <p className="text-xs mt-2 text-center" style={{ color: BRAND.muted }}>
                  Balance of ₱{(product.full_payment_price - product.downpayment_price).toLocaleString()} due upon arrival
                </p>
              )}
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold uppercase tracking-wide" style={{ color: BRAND.black }}>Select Size</p>
                {selectedSize && <p className="text-sm font-semibold" style={{ color: BRAND.teal }}>{selectedSize}</p>}
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.sizes.map(s => {
                  const outOfStock = s.stock === 0;
                  const isSelected = selectedSize === s.size;
                  return (
                    <button key={s.size} onClick={() => !outOfStock && setSelectedSize(s.size)}
                      disabled={outOfStock}
                      className="py-2.5 text-sm font-semibold transition-all relative"
                      style={{
                        background: isSelected ? BRAND.black : "transparent",
                        color: isSelected ? BRAND.bg : outOfStock ? BRAND.mutedLight : BRAND.black,
                        border: `1.5px solid ${isSelected ? BRAND.black : BRAND.border}`,
                        opacity: outOfStock ? 0.4 : 1,
                        textDecoration: outOfStock ? "line-through" : "none",
                        cursor: outOfStock ? "not-allowed" : "pointer",
                      }}>
                      {s.size.replace("US ", "")}
                      {s.stock > 0 && s.stock <= 2 && (
                        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full text-[7px] font-black text-white flex items-center justify-center"
                          style={{ background: BRAND.red }}>{s.stock}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-2" style={{ color: BRAND.muted }}>Numbers in red = limited stock.</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 mb-8">
              <button onClick={handleAddToCart}
                className="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: BRAND.black, color: BRAND.bg }}>
                <ShoppingBag className="w-4 h-4" />
                {isPreOrder ? "Reserve Now" : "Add to Cart"}
              </button>
              <button onClick={handleAddToCart}
                className="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: BRAND.teal, color: "#fff" }}>
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { icon: <Shield className="w-3 h-3" />, text: "100% Authentic" },
                { icon: <Truck className="w-3 h-3" />, text: "Fast Shipping" },
                { icon: <Clock className="w-3 h-3" />, text: isPreOrder && product.eta_start ? `ETA: ${formatETA(product.eta_start, product.eta_end)}` : "In Stock" },
              ].map(b => (
                <span key={b.text} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5"
                  style={{ background: `${BRAND.teal}12`, color: BRAND.teal, border: `1px solid ${BRAND.teal}25` }}>
                  {b.icon}{b.text}
                </span>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <div className="flex gap-0 -mb-px">
                {(["details", "shipping", "auth"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="px-5 py-3 text-sm font-bold uppercase tracking-wide capitalize transition-colors"
                    style={{
                      borderBottom: `2px solid ${activeTab === tab ? BRAND.teal : "transparent"}`,
                      color: activeTab === tab ? BRAND.teal : BRAND.muted,
                    }}>
                    {tab === "auth" ? "Authenticity" : tab}
                  </button>
                ))}
              </div>
              <div className="py-5 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
                {activeTab === "details" && <p>{product.description || "Premium authentic sneakers from verified suppliers."}</p>}
                {activeTab === "shipping" && (
                  <ul className="space-y-2">
                    <li>• Metro Manila: 1–3 business days (₱150)</li>
                    <li>• Provincial: 3–7 business days (₱250)</li>
                    <li>• Free shipping on orders ₱3,000+</li>
                    <li>• All orders come with tracking number</li>
                  </ul>
                )}
                {activeTab === "auth" && (
                  <ul className="space-y-2">
                    <li>• Every pair sourced from verified authentic suppliers</li>
                    <li>• No replicas, fakes, or unauthorized items ever</li>
                    <li>• Legit check available upon request</li>
                    <li>• Full refund if authenticity is ever in question</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

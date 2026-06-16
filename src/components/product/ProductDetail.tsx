"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Zap, Shield, Truck, Clock, Star, Minus, Plus, Share2, Bell, Heart, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRecentlyViewed, useRecentlyViewedStore } from "@/hooks/useRecentlyViewed";
import { useWishlist } from "@/hooks/useWishlist";
import type { Product, Review } from "@/lib/types";

type SizeGuide = { label: string; note: string; rows: string[][] };

const NIKE_ROWS: string[][] = [
  ["US 4","36","3.5","22"],["US 4.5","36.5","4","22.5"],["US 5","37.5","4.5","23"],
  ["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],["US 6.5","39","6","24.5"],
  ["US 7","40","6","25"],["US 7.5","40.5","6.5","25.5"],["US 8","41","7","26"],
  ["US 8.5","42","7.5","26.5"],["US 9","42.5","8","27"],["US 9.5","43","8.5","27.5"],
  ["US 10","44","9","28"],["US 10.5","44.5","9.5","28.5"],["US 11","45","10","29"],
  ["US 11.5","45.5","10.5","29.5"],["US 12","46","11","30"],["US 13","47.5","12","31"],
  ["US 14","48.5","13","32"],["US 15","49.5","14","33"],
];

const ADIDAS_ROWS: string[][] = [
  ["US 4","36","3.5","22.5"],["US 4.5","36.5","4","23"],["US 5","37","4.5","23.5"],
  ["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],["US 6.5","39","6","24.5"],
  ["US 7","40","6.5","25"],["US 7.5","40.5","7","25.5"],["US 8","41","7.5","26"],
  ["US 8.5","42","8","26.5"],["US 9","42.5","8.5","27"],["US 9.5","43","9","27.5"],
  ["US 10","44","9.5","28"],["US 10.5","44.5","10","28.5"],["US 11","45","10.5","29"],
  ["US 11.5","45.5","11","29.5"],["US 12","46","11.5","30"],["US 13","47.5","12.5","31"],
  ["US 14","48","13.5","32"],
];

const VANS_ROWS: string[][] = [
  ["US 3.5","35","3","22"],["US 4","36","3.5","22.5"],["US 4.5","36.5","4","23"],
  ["US 5","37","4.5","23"],["US 5.5","38","5","23.5"],["US 6","38.5","5.5","24"],
  ["US 6.5","39","6","24.5"],["US 7","40","6.5","25"],["US 7.5","40.5","7","25.5"],
  ["US 8","41","7.5","26"],["US 8.5","42","8","26.5"],["US 9","42.5","8.5","27"],
  ["US 9.5","43","9","27.5"],["US 10","44","9.5","28"],["US 10.5","44.5","10","28.5"],
  ["US 11","45","10.5","29"],["US 12","46","11.5","30"],["US 13","47","12.5","31"],
];

function getSizeGuideData(brand: string): SizeGuide {
  const b = brand.toLowerCase();
  if (b.includes("adidas") || b.includes("yeezy")) {
    return { label: "Adidas / Yeezy", note: "Adidas generally fits true to size. If between sizes, go half size up.", rows: ADIDAS_ROWS };
  }
  if (b.includes("vans")) {
    return { label: "Vans", note: "Vans fits true to size. Slip-ons run half a size large — consider sizing down.", rows: VANS_ROWS };
  }
  if (b.includes("converse")) {
    return { label: "Converse", note: "Converse runs 1–1.5 sizes large. We recommend going 1 size down from your usual US size.", rows: NIKE_ROWS };
  }
  if (b.includes("new balance")) {
    return { label: "New Balance", note: "New Balance fits true to size. Wide widths available — check product details.", rows: NIKE_ROWS };
  }
  return { label: `Nike / Jordan / ${brand}`, note: "Nike and Jordan sizes run true to size. If between sizes, go half size up.", rows: NIKE_ROWS };
}

function formatETA(start: string, end?: string) {
  const s = new Date(start);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!end) return `${months[s.getMonth()]} ${s.getDate()}`;
  const e = new Date(end);
  if (s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

export default function ProductDetail({
  product,
  reviews = [],
  settings = {},
}: {
  product: Product;
  reviews?: Review[];
  settings?: Record<string, string>;
}) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentType, setPaymentType] = useState<"full_payment" | "downpayment">("full_payment");
  const [activeTab, setActiveTab] = useState<"details" | "shipping" | "auth" | "reviews">("details");
  const [imageIdx, setImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxReview, setLightboxReview] = useState<Review | null>(null);
  const addItem = useCartStore(s => s.addItem);
  const { trackItem } = useRecentlyViewed();
  const recentItems = useRecentlyViewedStore(s => s.items);
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [notifySize, setNotifySize] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySubmitted, setNotifySubmitted] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    trackItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.full_payment_price,
      images: product.images ?? [],
      bg: product.bg ?? "",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, text: `${product.brand} · ₱${product.full_payment_price.toLocaleString()}`, url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim() || !notifySize) return;
    await fetch("/api/restock-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, size: notifySize, email: notifyEmail }),
    });
    setNotifySubmitted(notifySize);
    setNotifyEmail("");
  }

  const metroFee = settings.metro_shipping_fee || "150";
  const provFee = settings.provincial_shipping_fee || "250";
  const freeThreshold = settings.free_shipping_threshold || "5000";

  const isPreOrder = product.status === "pre-order";
  const effectivePaymentType = isPreOrder ? paymentType : "full_payment";
  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= now) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= now);
  }, [product.sale_price, product.sale_start, product.sale_end]);
  const effectiveFullPrice = isOnSale ? product.sale_price! : product.full_payment_price;
  const price = effectivePaymentType === "full_payment" ? effectiveFullPrice : product.downpayment_price;
  const images = product.images?.length ? product.images : Array(4).fill(null);

  function getStock() {
    return product.sizes.find(s => s.size === selectedSize)?.stock ?? 0;
  }

  function getInCart() {
    return useCartStore.getState().items
      .find(i => i.product.id === product.id && i.size === selectedSize)?.quantity ?? 0;
  }

  function handleAddToCart() {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    const stock = getStock();
    const inCart = getInCart();
    if (inCart + quantity > stock) {
      const remaining = stock - inCart;
      toast.error(remaining <= 0
        ? `Only ${stock} pair${stock === 1 ? "" : "s"} available for ${selectedSize}`
        : `Only ${remaining} more pair${remaining === 1 ? "" : "s"} can be added`
      );
      return;
    }
    addItem(product, selectedSize, effectivePaymentType, quantity);
    toast.success(`${product.name} (${selectedSize}) added to cart!`);
  }

  function handleBuyNow() {
    if (!selectedSize) { toast.error("Please select a size"); return; }
    const stock = getStock();
    const inCart = getInCart();
    if (inCart + quantity > stock) {
      const remaining = stock - inCart;
      toast.error(remaining <= 0
        ? `Only ${stock} pair${stock === 1 ? "" : "s"} available for ${selectedSize}`
        : `Only ${remaining} more pair${remaining === 1 ? "" : "s"} can be added`
      );
      return;
    }
    addItem(product, selectedSize, effectivePaymentType, quantity);
    router.push("/cart");
  }

  const sizeGuideData = getSizeGuideData(product.brand);

  return (<>
    {/* Size Guide Modal */}
    {showSizeGuide && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => setShowSizeGuide(false)}>
        <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, maxHeight: "85vh" }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ background: BRAND.black }}>
            <div>
              <h2 style={{ fontFamily: FONTS.display, fontSize: "1.1rem", color: "#fff" }}>SIZE GUIDE</h2>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>{sizeGuideData.label} · All sizes in US (men&apos;s)</p>
            </div>
            <button onClick={() => setShowSizeGuide(false)} className="opacity-60 hover:opacity-100">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-xs mb-3 px-1" style={{ color: BRAND.muted }}>{sizeGuideData.note}</p>
            <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${BRAND.border}` }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: BRAND.black }}>
                    {["US", "EU", "UK", "CM"].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider" style={{ color: "#fff" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sizeGuideData.rows.map((row, i) => (
                    <tr key={row[0]} style={{ background: i % 2 === 0 ? BRAND.bg : BRAND.card, borderBottom: `1px solid ${BRAND.border}` }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2.5 font-semibold" style={{ color: j === 0 ? BRAND.teal : BRAND.black }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

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
            <div className="relative aspect-square mb-3 rounded-xl overflow-hidden flex items-center justify-center cursor-zoom-in"
              style={{ background: product.bg || BRAND.bg, border: `1px solid ${BRAND.cardBorder}` }}
              onClick={() => images[imageIdx] && setLightboxOpen(true)}>
              {images[imageIdx] ? (
                <Image src={images[imageIdx]!} alt={product.name} fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <span style={{ fontFamily: FONTS.display, fontSize: "8rem", color: BRAND.black, opacity: 0.05 }}>
                  {product.brand.charAt(0)}
                </span>
              )}
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
              {images.map((img, i) => (
                <button key={i} onClick={() => setImageIdx(i)}
                  className="aspect-square rounded-lg flex items-center justify-center transition-all overflow-hidden relative"
                  style={{ background: product.bg || BRAND.bg, border: `2px solid ${imageIdx === i ? BRAND.teal : BRAND.border}` }}>
                  {img ? (
                    <Image src={img} alt="" fill className="object-cover object-center" sizes="80px" />
                  ) : (
                    <span style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.black, opacity: 0.07 }}>
                      {product.brand.charAt(0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.muted }}>{product.brand}</p>
            <h1 className="text-2xl font-bold mb-1 leading-snug" style={{ color: BRAND.black }}>{product.name}</h1>
            {product.colorway && <p className="text-sm mb-2" style={{ color: BRAND.muted }}>{product.colorway}</p>}

            {/* Rating summary */}
            {reviews.length > 0 && (() => {
              const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
              return (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} className="w-4 h-4" fill={n <= Math.round(avg) ? "#F59E0B" : "none"} stroke={n <= Math.round(avg) ? "#F59E0B" : BRAND.mutedLight} />
                    ))}
                  </div>
                  <span className="text-sm font-bold" style={{ color: BRAND.black }}>{avg.toFixed(1)}</span>
                  <button onClick={() => { setActiveTab("reviews"); setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }} className="text-xs underline hover:opacity-70 transition-opacity" style={{ color: BRAND.muted }}>
                    ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                  </button>
                </div>
              );
            })()}

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
                <div className="flex items-center gap-3">
                  <p style={{ fontFamily: FONTS.display, fontSize: "2.5rem", color: isOnSale ? BRAND.red : BRAND.black, letterSpacing: "0.02em" }}>
                    ₱{price.toLocaleString()}
                  </p>
                  {isOnSale && (
                    <span className="text-[11px] font-black uppercase px-2.5 py-1 tracking-wider text-white"
                      style={{ background: BRAND.red }}>SALE</span>
                  )}
                </div>
                {isOnSale ? (
                  <p className="text-sm" style={{ color: BRAND.muted }}>
                    Was: <span className="line-through">₱{product.full_payment_price.toLocaleString()}</span>
                    <span className="ml-2 font-bold" style={{ color: BRAND.red }}>
                      Save ₱{(product.full_payment_price - product.sale_price!).toLocaleString()}
                    </span>
                  </p>
                ) : product.srp_price !== product.full_payment_price ? (
                  <p className="text-sm" style={{ color: BRAND.muted }}>
                    SRP: <span className="line-through">₱{product.srp_price.toLocaleString()}</span>
                    <span className="ml-2 font-bold" style={{ color: BRAND.red }}>
                      Save ₱{(product.srp_price - product.full_payment_price).toLocaleString()}
                    </span>
                  </p>
                ) : null}
              </div>
              {isPreOrder ? (
                <>
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
                        <p style={{ fontFamily: FONTS.display, fontSize: "1.1rem" }}>&#8369;{opt.price.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                  {paymentType === "downpayment" && (
                    <p className="text-xs mt-2 text-center" style={{ color: BRAND.muted }}>
                      Balance of &#8369;{(product.full_payment_price - product.downpayment_price).toLocaleString()} due upon arrival
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs mt-1" style={{ color: BRAND.muted }}>Full payment · Ships immediately</p>
              )}
            </div>

            {/* Size selector */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold uppercase tracking-wide" style={{ color: BRAND.black }}>Select Size</p>
                <div className="flex items-center gap-3">
                  {selectedSize && <p className="text-sm font-semibold" style={{ color: BRAND.teal }}>{selectedSize}</p>}
                  <button type="button" onClick={() => setShowSizeGuide(true)}
                    className="text-xs underline transition-opacity hover:opacity-60"
                    style={{ color: BRAND.muted }}>
                    Size Guide
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {product.sizes.map(s => {
                  const outOfStock = s.stock === 0;
                  const isSelected = selectedSize === s.size;
                  const isNotify = notifySize === s.size;
                  return (
                    <button key={s.size}
                      onClick={() => {
                        if (outOfStock) { setNotifySize(s.size); setNotifySubmitted(null); }
                        else { setSelectedSize(s.size); setQuantity(1); setNotifySize(null); }
                      }}
                      className="py-2.5 text-sm font-semibold transition-all relative"
                      style={{
                        background: isSelected ? BRAND.black : isNotify ? `${BRAND.teal}15` : "transparent",
                        color: isSelected ? BRAND.bg : outOfStock ? BRAND.mutedLight : BRAND.black,
                        border: `1.5px solid ${isSelected ? BRAND.black : isNotify ? BRAND.teal : BRAND.border}`,
                        opacity: outOfStock ? 0.55 : 1,
                        textDecoration: outOfStock ? "line-through" : "none",
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
              {/* Notify-me form for OOS size */}
              {notifySize && product.sizes.find(s => s.size === notifySize)?.stock === 0 && (
                <div className="mt-3 p-4 rounded-xl" style={{ background: `${BRAND.teal}08`, border: `1px solid ${BRAND.teal}25` }}>
                  {notifySubmitted === notifySize ? (
                    <p className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.teal }}>
                      <Bell className="w-4 h-4" /> We&apos;ll notify you when {notifySize} is back in stock!
                    </p>
                  ) : (
                    <form onSubmit={handleNotify} className="flex gap-2">
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={e => setNotifyEmail(e.target.value)}
                        placeholder="Your email for restock alerts"
                        required
                        className="flex-1 px-3 py-2 text-sm focus:outline-none"
                        style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                      />
                      <button type="submit"
                        className="px-4 py-2 text-xs font-black uppercase tracking-wide whitespace-nowrap"
                        style={{ background: BRAND.teal, color: "#fff" }}>
                        Notify Me
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <p className="text-xs" style={{ color: BRAND.muted }}>Numbers in red = limited stock.</p>
                {selectedSize && (() => {
                  const s = product.sizes.find(sz => sz.size === selectedSize);
                  if (!s || s.stock > 5) return null;
                  return (
                    <p className="text-xs font-bold" style={{ color: BRAND.red }}>
                      Max {s.stock} per order
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Quantity selector */}
            <div className="mb-6">
              <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND.black }}>Quantity</p>
              <div className="flex items-center gap-0 w-fit" style={{ border: `1.5px solid ${BRAND.border}` }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center transition-colors hover:opacity-60"
                  style={{ color: BRAND.black }}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-sm font-bold" style={{ color: BRAND.black, borderLeft: `1px solid ${BRAND.border}`, borderRight: `1px solid ${BRAND.border}`, lineHeight: "2.5rem" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    if (selectedSize) {
                      const stock = getStock();
                      const inCart = getInCart();
                      if (quantity + inCart < stock) setQuantity(q => q + 1);
                    } else {
                      setQuantity(q => q + 1);
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center transition-colors hover:opacity-60"
                  style={{ color: BRAND.black }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex gap-3">
                <button onClick={handleAddToCart}
                  className="flex-1 py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: BRAND.black, color: BRAND.bg }}>
                  <ShoppingBag className="w-4 h-4" />
                  {isPreOrder ? "Reserve Now" : "Add to Cart"}
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="px-4 py-4 flex items-center justify-center transition-all"
                  style={{
                    background: wishlisted ? `${BRAND.teal}15` : "transparent",
                    border: `1.5px solid ${wishlisted ? BRAND.teal : BRAND.border}`,
                    color: wishlisted ? BRAND.teal : BRAND.muted,
                  }}
                  title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
                  <Heart className="w-5 h-5" fill={wishlisted ? BRAND.teal : "none"} stroke={wishlisted ? BRAND.teal : BRAND.muted} />
                </button>
              </div>
              <button onClick={handleBuyNow}
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
              <button onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 transition-opacity hover:opacity-70"
                style={{ background: `${BRAND.black}08`, color: BRAND.black, border: `1px solid ${BRAND.border}` }}>
                <Share2 className="w-3 h-3" /> Share
              </button>
            </div>

            {/* Tabs */}
            <div ref={tabsRef} style={{ borderTop: `1px solid ${BRAND.border}` }}>
              <div className="flex gap-0 -mb-px overflow-x-auto">
                {(["details", "shipping", "auth", "reviews"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="px-4 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors"
                    style={{
                      borderBottom: `2px solid ${activeTab === tab ? BRAND.teal : "transparent"}`,
                      color: activeTab === tab ? BRAND.teal : BRAND.muted,
                    }}>
                    {tab === "auth" ? "Authenticity" : tab === "reviews" ? `Reviews (${reviews.length})` : tab}
                  </button>
                ))}
              </div>
              <div className="py-5 text-sm leading-relaxed" style={{ color: BRAND.muted }}>
                {activeTab === "details" && <p>{product.description || "Premium authentic sneakers from verified suppliers."}</p>}
                {activeTab === "shipping" && (
                  <ul className="space-y-2">
                    <li>• Metro Manila: 1–3 business days (&#8369;{Number(metroFee).toLocaleString()})</li>
                    <li>• Provincial: 3–7 business days (&#8369;{Number(provFee).toLocaleString()})</li>
                    <li>• Free shipping on orders &#8369;{Number(freeThreshold).toLocaleString()}+</li>
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
                {activeTab === "reviews" && (
                  <div className="space-y-5">
                    {reviews.length === 0 ? (
                      <p style={{ color: BRAND.mutedLight }}>No reviews yet. Purchase this product to leave a review.</p>
                    ) : (
                      reviews.map(r => (
                        <div key={r.id} className="pb-5 cursor-pointer transition-opacity hover:opacity-80"
                          style={{ borderBottom: `1px solid ${BRAND.border}` }}
                          onClick={() => setLightboxReview(r)}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-sm" style={{ color: BRAND.black }}>
                              {r.author_name}
                              {r.is_verified && (
                                <span className="ml-2 text-[10px] font-bold px-2 py-0.5"
                                  style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>Verified</span>
                              )}
                            </p>
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="w-3 h-3"
                                  style={{ color: i < r.rating ? "#F59E0B" : BRAND.border, fill: i < r.rating ? "#F59E0B" : "none" }} />
                              ))}
                            </div>
                          </div>
                          {r.title && <p className="font-semibold text-sm mb-1" style={{ color: BRAND.black }}>{r.title}</p>}
                          <p style={{ color: BRAND.muted }}>{r.body}</p>
                          {r.image_url && (
                            <div className="mt-2 w-16 h-16 relative rounded overflow-hidden"
                              style={{ border: `1px solid ${BRAND.border}` }}>
                              <Image src={r.image_url} alt="Review photo" fill className="object-cover" sizes="64px" />
                            </div>
                          )}
                          {r.created_at && (
                            <p className="text-xs mt-1" style={{ color: BRAND.mutedLight }}>
                              {new Date(r.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Viewed */}
        {recentItems.filter(i => i.id !== product.id).length > 0 && (
          <div className="mt-12 pt-10" style={{ borderTop: `1px solid ${BRAND.border}` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: BRAND.muted }}>Recently Viewed</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentItems.filter(i => i.id !== product.id).slice(0, 4).map(item => (
                <Link key={item.id} href={`/shop/${item.slug}`} className="group block">
                  <div className="relative aspect-square mb-2 overflow-hidden rounded-lg"
                    style={{ background: item.bg || BRAND.bg, border: `1px solid ${BRAND.cardBorder}` }}>
                    {item.images[0] ? (
                      <Image src={item.images[0]} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-black"
                        style={{ fontFamily: FONTS.display, color: BRAND.black, opacity: 0.05, fontSize: "2rem" }}>
                        {item.brand.charAt(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: BRAND.muted }}>{item.brand}</p>
                  <p className="text-xs font-semibold leading-snug truncate" style={{ color: BRAND.black }}>{item.name}</p>
                  <p className="text-xs font-black mt-0.5" style={{ color: BRAND.black }}>₱{item.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Lightbox */}
    {lightboxOpen && images[imageIdx] && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)" }}
        onClick={() => setLightboxOpen(false)}>
        <button
          className="absolute top-4 right-4 p-2 rounded-full transition-opacity hover:opacity-70"
          style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          onClick={() => setLightboxOpen(false)}>
          <X className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-2xl aspect-square" onClick={e => e.stopPropagation()}>
          <Image src={images[imageIdx]!} alt={product.name} fill className="object-contain" sizes="100vw" />
        </div>
      </div>
    )}

    {/* Review lightbox */}
    {lightboxReview && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)" }}
        onClick={() => setLightboxReview(null)}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}` }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: `1px solid ${BRAND.border}`, background: BRAND.card }}>
            <div>
              <p className="font-black text-sm" style={{ color: BRAND.black }}>{lightboxReview.author_name}</p>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3"
                    style={{ color: i < lightboxReview.rating ? "#F59E0B" : BRAND.border, fill: i < lightboxReview.rating ? "#F59E0B" : "none" }} />
                ))}
              </div>
            </div>
            <button onClick={() => setLightboxReview(null)} className="p-1 transition-opacity hover:opacity-70">
              <X className="w-4 h-4" style={{ color: BRAND.muted }} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {lightboxReview.title && (
              <p className="font-bold text-sm" style={{ color: BRAND.black }}>{lightboxReview.title}</p>
            )}
            <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>{lightboxReview.body}</p>
            {lightboxReview.image_url && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden"
                style={{ border: `1px solid ${BRAND.border}` }}>
                <Image src={lightboxReview.image_url} alt="Review photo" fill className="object-cover" sizes="400px" />
              </div>
            )}
            {lightboxReview.created_at && (
              <p className="text-xs" style={{ color: BRAND.mutedLight }}>
                {new Date(lightboxReview.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </>);
}

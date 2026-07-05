"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { BRAND, FONTS } from "@/lib/constants";
import { useCartStore } from "@/store/cartStore";
import { useState, useMemo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

// Dark card palette — sits on the cream page bg like items in a display case
const CARD = {
  bg:          "#141518",
  borderRest:  "rgba(255,255,255,0.07)",
  borderHover: "rgba(91,184,180,0.5)",
  shadowRest:  "0 2px 16px rgba(0,0,0,0.22)",
  shadowHover: "0 0 0 1px rgba(91,184,180,0.1), 0 20px 56px rgba(0,0,0,0.38), 0 0 40px rgba(91,184,180,0.07)",
  textPrimary: "#E0DDD9",
  textBrand:   "#47433F",
} as const;

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export default function ProductCard({ product, showQuickAdd = true }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const addItem = useCartStore(s => s.addItem);

  const availableSizes = product.sizes.filter(s => s.stock > 0);
  const [selectedSize, setSelectedSize] = useState(
    availableSizes[0]?.size ?? product.sizes[0]?.size ?? ""
  );

  const isPreOrder = product.status === "pre-order";
  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= now) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= now);
  }, [product.sale_price, product.sale_start, product.sale_end]);

  const displayPrice = isOnSale ? product.sale_price! : product.full_payment_price;
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!selectedSize) return;
    addItem(product, selectedSize, "full_payment");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  function handleSizeClick(e: React.MouseEvent, size: string) {
    e.preventDefault();
    setSelectedSize(size);
  }

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background:    CARD.bg,
        border:        `1px solid ${hovered ? CARD.borderHover : CARD.borderRest}`,
        borderRadius:  10,
        overflow:      "hidden",
        boxShadow:     hovered ? CARD.shadowHover : CARD.shadowRest,
        transform:     hovered ? "translateY(-3px)" : "translateY(0)",
        transition:    "border-color 240ms ease, box-shadow 240ms ease, transform 260ms ease",
      }}>

        {/* ── Image zone ───────────────────────────────── */}
        <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>

          {product.images?.[0] && !imgError ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: product.bg || "#1C1E24" }}>
              <span className="font-black select-none"
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "clamp(3rem,8vw,6rem)",
                  color: "#fff", opacity: 0.04,
                  letterSpacing: "0.04em",
                }}>
                {product.brand.toUpperCase()}
              </span>
            </div>
          )}

          {/* Gradient vignette — bleeds image into info zone */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: "linear-gradient(to bottom, transparent 45%, rgba(20,21,24,0.9) 100%)",
          }} />

          {/* Status pill — top left */}
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }}>
            <StatusPill
              availableSizes={availableSizes.length}
              isPreOrder={isPreOrder}
            />
          </div>

          {/* Sale / Below SRP stamp — top right */}
          {(isOnSale || product.full_payment_price < product.srp_price) && (
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }}>
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "#fff",
                background: BRAND.red, padding: "4px 9px",
              }}>
                {isOnSale ? "SALE" : "BELOW SRP"}
              </span>
            </div>
          )}

          {/* Hover overlay — size picker + CTA */}
          {showQuickAdd && availableSizes.length > 0 && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 20,
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              opacity: hovered ? 1 : 0,
              pointerEvents: hovered ? "auto" : "none",
              transition: "opacity 200ms ease",
            }}>
              <div style={{ padding: "0 12px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {availableSizes.slice(0, 8).map(s => (
                    <button
                      key={s.size}
                      type="button"
                      onClick={e => handleSizeClick(e, s.size)}
                      style={{
                        fontSize: 9, fontWeight: 900, padding: "3px 7px",
                        background: selectedSize === s.size ? BRAND.teal : "rgba(255,255,255,0.1)",
                        border: `1px solid ${selectedSize === s.size ? BRAND.teal : "rgba(255,255,255,0.28)"}`,
                        color: selectedSize === s.size ? "#000" : "#fff",
                        cursor: "pointer",
                        transition: "background 100ms, border-color 100ms",
                      }}>
                      {s.size.replace("US ", "")}
                    </button>
                  ))}
                  {availableSizes.length > 8 && (
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", alignSelf: "center" }}>
                      +{availableSizes.length - 8}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleQuickAdd}
                  disabled={!selectedSize}
                  style={{
                    width: "100%", padding: "12px",
                    background: added ? BRAND.teal : BRAND.black,
                    color: added ? "#000" : "#fff",
                    fontSize: 10, fontWeight: 900,
                    letterSpacing: "0.18em", textTransform: "uppercase",
                    border: "none", cursor: selectedSize ? "pointer" : "default",
                    transition: "background 180ms ease",
                    opacity: selectedSize ? 1 : 0.45,
                  }}>
                  {added ? "Added ✓" : selectedSize ? `Add US ${selectedSize.replace("US ", "")}` : "Select Size"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Info zone ─────────────────────────────────── */}
        <div style={{ padding: "13px 15px 17px" }}>

          {/* Brand + wishlist */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.32em",
              textTransform: "uppercase", color: CARD.textBrand,
              fontFamily: FONTS.body,
            }}>
              {product.brand}
            </span>
            <button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
              style={{
                width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: wishlisted ? "rgba(91,184,180,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${wishlisted ? "rgba(91,184,180,0.3)" : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer",
                transition: "background 200ms, border-color 200ms",
              }}>
              <Heart
                className="w-3 h-3"
                fill={wishlisted ? BRAND.teal : "none"}
                stroke={wishlisted ? BRAND.teal : "rgba(255,255,255,0.28)"}
              />
            </button>
          </div>

          {/* Product name — Barlow Condensed, uppercase, bold */}
          <h3 style={{
            fontFamily:    FONTS.display,
            fontSize:      17,
            fontWeight:    800,
            textTransform: "uppercase",
            letterSpacing: "0.015em",
            lineHeight:    1.1,
            color:         hovered ? "#fff" : CARD.textPrimary,
            marginBottom:  isPreOrder && product.eta_start ? 6 : 13,
            transition:    "color 200ms ease",
          }}>
            {product.name}
          </h3>

          {isPreOrder && product.eta_start && product.eta_end && (
            <p style={{ fontSize: 11, fontWeight: 600, color: BRAND.red, marginBottom: 10 }}>
              ETA: {formatETA(product.eta_start, product.eta_end)}
            </p>
          )}

          {/* Price + size availability */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{
                fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em",
                color: isOnSale ? BRAND.red : BRAND.teal,
                fontVariantNumeric: "tabular-nums",
              }}>
                ₱{displayPrice.toLocaleString()}
              </span>
              {isOnSale ? (
                <span style={{ fontSize: 11, color: "#2A2A2A", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>
                  ₱{product.full_payment_price.toLocaleString()}
                </span>
              ) : product.srp_price !== product.full_payment_price ? (
                <span style={{ fontSize: 11, color: "#2A2A2A", textDecoration: "line-through", fontVariantNumeric: "tabular-nums" }}>
                  ₱{product.srp_price.toLocaleString()}
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              {product.sizes.slice(0, 5).map(s => (
                <span key={s.size} style={{
                  width: 26, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 600, borderRadius: 4,
                  background: s.stock > 0 ? "rgba(91,184,180,0.07)" : "rgba(255,255,255,0.03)",
                  border:     `1px solid ${s.stock > 0 ? "rgba(91,184,180,0.18)" : "rgba(255,255,255,0.05)"}`,
                  color:      s.stock > 0 ? "rgba(91,184,180,0.75)" : "#242424",
                  fontVariantNumeric: "tabular-nums",
                  transition: "background 200ms, border-color 200ms",
                }}>
                  {s.size.replace("US ", "")}
                </span>
              ))}
              {product.sizes.length > 5 && (
                <span style={{ fontSize: 9, color: "#2E2E2E", alignSelf: "center" }}>
                  +{product.sizes.length - 5}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Frosted glass status pill — glowing dot communicates availability at a glance
function StatusPill({ availableSizes, isPreOrder }: { availableSizes: number; isPreOrder: boolean }) {
  if (availableSizes === 0) return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
      color: "#666", background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)", padding: "5px 10px", borderRadius: 100,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#444", flexShrink: 0, display: "inline-block" }} />
      Sold Out
    </span>
  );

  if (isPreOrder) return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
      color: BRAND.red, background: "rgba(217,79,61,0.1)",
      border: "1px solid rgba(217,79,61,0.25)", padding: "5px 10px", borderRadius: 100,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      <span style={{
        width: 4, height: 4, borderRadius: "50%", background: BRAND.red,
        boxShadow: `0 0 6px ${BRAND.red}`, flexShrink: 0, display: "inline-block",
      }} />
      Pre-Order
    </span>
  );

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
      color: BRAND.teal, background: "rgba(91,184,180,0.08)",
      border: "1px solid rgba(91,184,180,0.22)", padding: "5px 10px", borderRadius: 100,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      <span style={{
        width: 4, height: 4, borderRadius: "50%", background: BRAND.teal,
        boxShadow: `0 0 6px ${BRAND.teal}`, flexShrink: 0, display: "inline-block",
      }} />
      On Hand
    </span>
  );
}

function formatETA(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

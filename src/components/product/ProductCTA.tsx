"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Minus, Plus, Share2, Heart, ChevronUp, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useWishlist } from "@/hooks/useWishlist";
import { DP_RESERVE_FEE } from "@/lib/constants";
import { now } from "@/lib/utils";
import type { Product } from "@/lib/types";

const PAYMENT_METHODS = ["GCash", "Maya", "Bank Transfer", "COD"];

export default function ProductCTA({
  product,
  selectedSize,
  quantity,
  setQuantity,
  isPreOrder,
  paymentType,
  setPaymentType,
  effectivePaymentType,
}: {
  product: Product;
  selectedSize: string | null;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  isPreOrder: boolean;
  paymentType: "full_payment" | "downpayment";
  setPaymentType: Dispatch<SetStateAction<"full_payment" | "downpayment">>;
  effectivePaymentType: "full_payment" | "downpayment";
}) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    const nowTs = now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= nowTs) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= nowTs);
  }, [product.sale_price, product.sale_start, product.sale_end]);
  const effectiveFullPrice = isOnSale ? product.sale_price! : product.full_payment_price;
  const price = effectivePaymentType === "full_payment" ? effectiveFullPrice : product.downpayment_price;

  function getStock() {
    return product.sizes.find(s => s.size === selectedSize)?.stock ?? 0;
  }
  function getInCart() {
    return useCartStore.getState().items
      .find(i => i.product.id === product.id && i.size === selectedSize && i.payment_type === effectivePaymentType)?.quantity ?? 0;
  }
  function checkStock() {
    if (!selectedSize) { toast.error("Please select a size"); return false; }
    const stock = getStock();
    const inCart = getInCart();
    if (inCart + quantity > stock) {
      const remaining = stock - inCart;
      toast.error(remaining <= 0
        ? `Only ${stock} pair${stock === 1 ? "" : "s"} available for ${selectedSize}`
        : `Only ${remaining} more pair${remaining === 1 ? "" : "s"} can be added`
      );
      return false;
    }
    return true;
  }
  function incrementQuantity() {
    if (!selectedSize) { setQuantity(q => q + 1); return; }
    if (quantity + getInCart() < getStock()) setQuantity(q => q + 1);
  }

  function handleAddToCart() {
    if (!checkStock()) return;
    addItem(product, selectedSize!, effectivePaymentType, quantity);
    toast.success(`${product.name} added to cart`);
  }

  function handleBuyNow() {
    if (!checkStock()) return;
    addItem(product, selectedSize!, effectivePaymentType, quantity);
    router.push("/cart");
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text: `${product.brand} ₱${product.full_payment_price.toLocaleString()}`, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  }

  const content = (
    <>
      {/* Price */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {product.srp_price > price && (
            <span className="text-micro text-ink-3 line-through">₱{product.srp_price.toLocaleString()}</span>
          )}
          {isOnSale && <span className="bg-paper border border-line text-state-error text-eyebrow px-2 py-0.5 rounded-sm">Sale</span>}
        </div>
        <p className="text-display-s text-ink font-display font-medium">₱{price.toLocaleString()}</p>
      </div>

      {/* Pre-order payment toggle */}
      {isPreOrder && (
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            {(["full_payment", "downpayment"] as const).map(type => (
              <button
                key={type}
                onClick={() => setPaymentType(type)}
                className={`py-3 px-3 text-center rounded-md border transition-colors ${
                  paymentType === type ? "border-ink bg-ink text-paper" : "border-line text-ink hover:border-ink"
                }`}
              >
                <p className="text-micro uppercase tracking-wide">{type === "full_payment" ? "Full payment" : "Downpayment"}</p>
                <p className="text-body-sm font-medium">
                  ₱{(type === "full_payment" ? product.full_payment_price : DP_RESERVE_FEE).toLocaleString()}{type === "downpayment" && " now"}
                </p>
              </button>
            ))}
          </div>
          {paymentType === "downpayment" && (
            <p className="text-micro text-ink-3 text-center mt-2">
              ₱{DP_RESERVE_FEE.toLocaleString()} reserve now · ₱{(product.downpayment_price - DP_RESERVE_FEE).toLocaleString()} balance upon arrival
            </p>
          )}
        </div>
      )}

      {selectedSize && <p className="text-micro text-ink-3 mb-4">Size {selectedSize} selected</p>}

      {/* Quantity */}
      <div className="flex items-center gap-3 mb-5">
        <p className="text-micro text-ink-3">Quantity</p>
        <div className="flex items-center border border-line rounded-md w-fit">
          <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-ink hover:opacity-60 transition-opacity">
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-body-sm text-ink border-l border-r border-line">{quantity}</span>
          <button onClick={incrementQuantity} className="w-8 h-8 flex items-center justify-center text-ink hover:opacity-60 transition-opacity">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleAddToCart}
          className="flex-1 py-3.5 rounded-md text-body-sm font-medium flex items-center justify-center gap-2 bg-ink text-paper hover:bg-ink-2 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {isPreOrder ? "Reserve now" : "Add to bag"}
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 py-3.5 rounded-md text-body-sm font-medium flex items-center justify-center gap-2 bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper transition-colors duration-fast"
        >
          <Zap className="w-4 h-4" />
          Buy now
        </button>
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`w-12 flex items-center justify-center rounded-md border transition-colors ${
            wishlisted ? "border-ink bg-ink text-paper" : "border-line text-ink-3 hover:border-ink"
          }`}
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className="w-4 h-4" fill={wishlisted ? "currentColor" : "none"} />
        </button>
        <button onClick={handleShare} className="w-12 flex items-center justify-center rounded-md border border-line text-ink-3 hover:border-ink transition-colors" title="Share">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Payment methods */}
      <div className="flex flex-wrap gap-1.5">
        {PAYMENT_METHODS.map(m => (
          <span key={m} className="text-micro text-ink-3 border border-line rounded-sm px-2 py-1">{m}</span>
        ))}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop inline */}
      <div className="hidden lg:block">{content}</div>

      {/* Mobile sticky bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-paper border-t border-line px-5 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-body font-display font-medium text-ink truncate">₱{price.toLocaleString()}</p>
        </div>
        <button
          onClick={handleAddToCart}
          className="flex-1 py-3 rounded-md text-body-sm font-medium flex items-center justify-center gap-2 bg-ink text-paper hover:bg-ink-2 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          {isPreOrder ? "Reserve" : "Add to bag"}
        </button>
        <button
          onClick={() => setExpanded(true)}
          aria-label="More purchase options"
          className="w-11 h-11 flex items-center justify-center border border-line rounded-md text-ink-3 shrink-0"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile expanded sheet */}
      {expanded && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setExpanded(false)} />
          <div className="fixed inset-x-0 bottom-0 bg-paper rounded-t-xl p-6 pb-8 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
            {content}
          </div>
        </div>
      )}
    </>
  );
}

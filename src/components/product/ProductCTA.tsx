"use client";

import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction } from "react";
import { ShoppingBag, Zap, Shield, Truck, Clock, Minus, Plus, Share2, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { useWishlist } from "@/hooks/useWishlist";
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

export default function ProductCTA({
  product,
  selectedSize,
  quantity,
  setQuantity,
  isPreOrder,
  effectivePaymentType,
}: {
  product: Product;
  selectedSize: string | null;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  isPreOrder: boolean;
  effectivePaymentType: "full_payment" | "downpayment";
}) {
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);

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
    toast.success(`${product.name} added to cart`);
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

  return (<>
    {/* Quantity selector */}
    <div className="mb-6">
      <p className="text-sm font-bold tracking-wide mb-3 text-snd-black">Quantity</p>
      <div className="flex items-center gap-0 w-fit border border-snd-border">
        <button
          onClick={() => setQuantity(q => Math.max(1, q - 1))}
          className="w-10 h-10 flex items-center justify-center transition-colors hover:opacity-60 text-snd-black"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-12 text-center text-sm font-bold text-snd-black border-l border-r border-snd-border">
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
          className="w-10 h-10 flex items-center justify-center transition-colors hover:opacity-60 text-snd-black"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    {/* CTAs */}
    <div className="flex flex-col gap-3 mb-8">
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          className="flex-1 py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90 bg-snd-black text-snd-bg"
        >
          <ShoppingBag className="w-4 h-4" />
          {isPreOrder ? "Reserve Now" : "Add to Cart"}
        </button>
        <button
          onClick={() => toggleWishlist(product.id)}
          className={`px-4 py-4 flex items-center justify-center transition-all border-[1.5px] ${
            wishlisted ? "bg-snd-teal/[15%] border-snd-teal text-snd-teal" : "bg-transparent border-snd-border text-snd-muted"
          }`}
          title={wishlisted ? "Remove from wishlist" : "Add wishlist"}
        >
          <Heart className="w-5 h-5" fill={wishlisted ? "var(--color-snd-teal)" : "none"} stroke={wishlisted ? "var(--color-snd-teal)" : "var(--color-snd-muted)"} />
        </button>
      </div>
      <button
        onClick={handleBuyNow}
        className="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-90 bg-snd-teal text-white"
      >
        <Zap className="w-4 h-4" />
        Buy Now
      </button>
    </div>

    {/* Trust pills */}
    <div className="flex flex-wrap gap-2 mb-8">
      {[
        { icon: <Shield className="w-3 h-3" />, text: "100% Authentic" },
        { icon: <Truck className="w-3 h-3" />, text: "Fast Shipping" },
        ...(product.eta_start ? [{ icon: <Clock className="w-3 h-3" />, text: `ETA: ${formatETA(product.eta_start, product.eta_end)}` }] : []),
      ].map(b => (
        <span key={b.text} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-snd-teal/[12%] text-snd-teal border border-snd-teal/25">
          {b.icon}{b.text}
        </span>
      ))}
      <button onClick={handleShare} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 transition-opacity hover:opacity-70 bg-snd-black/[8%] text-snd-black border border-snd-border">
        <Share2 className="w-3 h-3" />
      </button>
    </div>
  </>);
}

"use client";

import { useMemo, type Dispatch, type SetStateAction } from "react";
import { Star, Clock } from "lucide-react";
import { DP_RESERVE_FEE } from "@/lib/constants";
import type { Product, Review } from "@/lib/types";

function formatETA(start: string, end?: string) {
  const s = new Date(start);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (!end) return `${months[s.getMonth()]} ${s.getDate()}`;
  const e = new Date(end);
  if (s.getMonth() === e.getMonth())
    return `${months[s.getMonth()]} ${s.getDate()}–${e.getDate()}`;
  return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
}

export default function ProductInfo({
  product,
  reviews,
  isPreOrder,
  paymentType,
  setPaymentType,
  effectivePaymentType,
  onViewReviews,
}: {
  product: Product;
  reviews: Review[];
  isPreOrder: boolean;
  paymentType: "full_payment" | "downpayment";
  setPaymentType: Dispatch<SetStateAction<"full_payment" | "downpayment">>;
  effectivePaymentType: "full_payment" | "downpayment";
  onViewReviews: () => void;
}) {
  const isOnSale = useMemo(() => {
    if (product.sale_price == null) return false;
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return (!product.sale_start || new Date(product.sale_start).getTime() <= now) &&
           (!product.sale_end   || new Date(product.sale_end).getTime()   >= now);
  }, [product.sale_price, product.sale_start, product.sale_end]);
  const effectiveFullPrice = isOnSale ? product.sale_price! : product.full_payment_price;
  const price = effectivePaymentType === "full_payment" ? effectiveFullPrice : product.downpayment_price;
  const srpSave = effectivePaymentType === "downpayment"
    ? product.srp_price - product.downpayment_price
    : product.srp_price - product.full_payment_price;

  return (<>
    <p className="text-xs font-bold uppercase tracking-widest mb-2 text-snd-muted">{product.brand}</p>
    <h1 className="text-2xl font-bold mb-1 leading-snug text-snd-black">{product.name}</h1>
    {product.colorway && <p className="text-sm mb-2 text-snd-muted">{product.colorway}</p>}

    {/* Rating summary */}
    {reviews.length > 0 && (() => {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      return (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex">
            {[1,2,3,4,5].map(n => (
              <Star key={n} className="w-4 h-4" fill={n <= Math.round(avg) ? "#F59E0B" : "none"} stroke={n <= Math.round(avg) ? "#F59E0B" : "var(--color-snd-muted-lt)"} />
            ))}
          </div>
          <span className="text-sm font-bold text-snd-black">{avg.toFixed(1)}</span>
          <button onClick={onViewReviews} className="text-xs underline hover:opacity-70 transition-opacity text-snd-muted">
            ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
          </button>
        </div>
      );
    })()}

    {isPreOrder && product.eta_start && (
      <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm mb-5 bg-snd-red/[7%] border border-snd-red/[19%]">
        <Clock className="w-4 h-4 text-snd-red" />
        <span className="text-sm font-bold text-snd-red">
          ETA: {formatETA(product.eta_start, product.eta_end)}
        </span>
      </div>
    )}

    {/* Pricing */}
    <div className="py-5 mb-6 border-t border-b border-snd-border">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <p className={`font-heading tracking-[0.02em] text-[2.5rem] ${isOnSale ? "text-snd-red" : "text-snd-black"}`}>
            ₱{price.toLocaleString()}
          </p>
          {isOnSale && (
            <span className="text-[11px] font-black uppercase px-2.5 py-1 tracking-wider text-white bg-snd-red">SALE</span>
          )}
        </div>
        {isOnSale ? (
          <p className="text-sm text-snd-muted">
            Was: <span className="line-through">₱{product.full_payment_price.toLocaleString()}</span>
            <span className="ml-2 font-bold text-snd-red">
              Save ₱{(product.full_payment_price - product.sale_price!).toLocaleString()}
            </span>
          </p>
        ) : product.srp_price !== price ? (
          <p className="text-sm text-snd-muted">
            SRP: <span className="line-through">₱{product.srp_price.toLocaleString()}</span>
            <span className="ml-2 font-bold text-snd-red">
              Save ₱{srpSave.toLocaleString()}
            </span>
          </p>
        ) : null}
      </div>
      {isPreOrder ? (<>
        <div className="grid grid-cols-2 gap-2 mb-1">
          <button
            onClick={() => setPaymentType("full_payment")}
            className={`py-3 px-3 text-center transition-all rounded-sm border-[1.5px] ${
              paymentType === "full_payment" ? "bg-snd-teal text-white border-snd-teal" : "text-snd-muted border-snd-border"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide">Full Payment</p>
            <p className="font-heading text-[1.1rem]">&#8369;{product.full_payment_price.toLocaleString()}</p>
            {product.downpayment_price < product.full_payment_price && (
              <span className={`text-[9px] font-black tracking-wide ${paymentType === "full_payment" ? "text-white/80" : "text-snd-teal"}`}>
                Save &#8369;{(product.full_payment_price - product.downpayment_price).toLocaleString()}
              </span>
            )}
          </button>
          <button
            onClick={() => setPaymentType("downpayment")}
            className={`py-3 px-3 text-center transition-all rounded-sm border-[1.5px] ${
              paymentType === "downpayment" ? "bg-snd-teal text-white border-snd-teal" : "text-snd-muted border-snd-border"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide">Downpayment</p>
            <p className="font-heading text-[1.1rem]">&#8369;{DP_RESERVE_FEE.toLocaleString()} now</p>
            <p className="text-[9px] font-semibold opacity-80">
              Total &#8369;{product.downpayment_price.toLocaleString()}
            </p>
          </button>
        </div>
        {paymentType === "downpayment" && (
          <p className="text-xs mt-2 text-center text-snd-muted">
            &#8369;{DP_RESERVE_FEE.toLocaleString()} reserve now &nbsp;&middot;&nbsp; &#8369;{(product.downpayment_price - DP_RESERVE_FEE).toLocaleString()} balance upon arrival
          </p>
        )}
      </>) : (
        <p className="text-xs mt-1 text-snd-muted">Full payment · Ships immediately</p>
      )}
    </div>
  </>);
}

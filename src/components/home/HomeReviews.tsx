"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { X } from "lucide-react";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  title?: string | null;
  body: string;
  is_verified?: boolean;
  product_id?: string | null;
};

export default function HomeReviews({
  reviews,
  productSlugMap,
}: {
  reviews: Review[];
  productSlugMap: Map<string, string>;
}) {
  const [selected, setSelected] = useState<Review | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
        {reviews.slice(0, 6).map(r => (
          <button key={r.id}
            onClick={() => setSelected(r)}
            className="text-left block p-6 rounded-xl transition-shadow hover:shadow-md cursor-pointer w-full"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.cardBorder}` }}>
            <div className="flex gap-0.5 mb-4">
              {Array(r.rating).fill(0).map((_, i) => (
                <span key={i} className="text-sm" style={{ color: BRAND.teal }}>★</span>
              ))}
              {Array(5 - r.rating).fill(0).map((_, i) => (
                <span key={i} className="text-sm" style={{ color: BRAND.border }}>★</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-5 italic" style={{ color: BRAND.black, fontFamily: FONTS.body }}>
              &ldquo;{r.body.length > 140 ? r.body.slice(0, 140) + "…" : r.body}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm" style={{ color: BRAND.black, fontFamily: FONTS.body }}>{r.author_name}</p>
                {r.title && <p className="text-xs" style={{ color: BRAND.muted, fontFamily: FONTS.body }}>{r.title}</p>}
              </div>
              {r.is_verified && (
                <span className="text-[10px] font-semibold px-2.5 py-1"
                  style={{ background: `${BRAND.teal}15`, color: BRAND.teal, fontFamily: FONTS.body }}>
                  Verified
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex gap-0.5">
                {Array(selected.rating).fill(0).map((_, i) => (
                  <span key={i} style={{ color: BRAND.teal, fontSize: 18 }}>★</span>
                ))}
                {Array(5 - selected.rating).fill(0).map((_, i) => (
                  <span key={i} style={{ color: BRAND.border, fontSize: 18 }}>★</span>
                ))}
              </div>
              <button onClick={() => setSelected(null)} className="transition-opacity hover:opacity-60">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>
            <div className="p-6">
              {selected.title && (
                <p className="font-black text-base mb-2" style={{ color: BRAND.black }}>{selected.title}</p>
              )}
              <p className="text-sm leading-relaxed italic mb-6" style={{ color: BRAND.black, fontFamily: FONTS.body }}>
                &ldquo;{selected.body}&rdquo;
              </p>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${BRAND.border}` }}>
                <div>
                  <p className="font-bold text-sm" style={{ color: BRAND.black }}>{selected.author_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.is_verified && (
                    <span className="text-[10px] font-semibold px-2.5 py-1"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                      Verified Buyer
                    </span>
                  )}
                  {selected.product_id && productSlugMap.has(selected.product_id) && (
                    <a href={`/shop/${productSlugMap.get(selected.product_id)}#reviews`}
                      onClick={() => setSelected(null)}
                      className="text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ color: BRAND.teal }}>
                      View Product →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

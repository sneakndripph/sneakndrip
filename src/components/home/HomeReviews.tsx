"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  title?: string | null;
  body: string;
  is_verified?: boolean;
  product_id?: string | null;
  image_url?: string | null;
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
            className="text-left block p-6 rounded-xl transition-shadow hover:shadow-md cursor-pointer w-full font-body bg-snd-card border border-snd-border">
            <div className="flex gap-0.5 mb-4">
              {Array(r.rating).fill(0).map((_, i) => (
                <span key={i} className="text-sm text-snd-teal">★</span>
              ))}
              {Array(5 - r.rating).fill(0).map((_, i) => (
                <span key={i} className="text-sm text-snd-border">★</span>
              ))}
            </div>
            <p className="text-sm leading-relaxed mb-4 italic text-snd-black">
              &ldquo;{r.body.length > 140 ? r.body.slice(0, 140) + "…" : r.body}&rdquo;
            </p>
            {r.image_url && (
              <div className="mb-4 rounded-lg overflow-hidden" style={{ height: 100 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image_url} alt="Review photo" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-snd-black">{r.author_name}</p>
                {r.title && <p className="text-xs text-snd-muted">{r.title}</p>}
              </div>
              {r.is_verified && (
                <span className="text-[10px] font-semibold px-2.5 py-1 bg-snd-teal/[8%] text-snd-teal">
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
          <div className="w-full max-w-md rounded-2xl overflow-hidden bg-snd-card border border-snd-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-snd-border">
              <div className="flex gap-0.5">
                {Array(selected.rating).fill(0).map((_, i) => (
                  <span key={i} className="text-snd-teal" style={{ fontSize: 18 }}>★</span>
                ))}
                {Array(5 - selected.rating).fill(0).map((_, i) => (
                  <span key={i} className="text-snd-border" style={{ fontSize: 18 }}>★</span>
                ))}
              </div>
              <button onClick={() => setSelected(null)} className="transition-opacity hover:opacity-60">
                <X className="w-4 h-4 text-snd-muted" />
              </button>
            </div>
            <div className="p-6 font-body">
              {selected.title && (
                <p className="font-black text-base mb-2 text-snd-black">{selected.title}</p>
              )}
              <p className="text-sm leading-relaxed italic mb-4 text-snd-black">
                &ldquo;{selected.body}&rdquo;
              </p>
              {selected.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.image_url} alt="Review photo" className="w-full object-contain" style={{ maxHeight: 280 }} />
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-snd-border">
                <div>
                  <p className="font-bold text-sm text-snd-black">{selected.author_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.is_verified && (
                    <span className="text-[10px] font-semibold px-2.5 py-1 bg-snd-teal/[8%] text-snd-teal">
                      Verified Buyer
                    </span>
                  )}
                  {selected.product_id && productSlugMap.has(selected.product_id) && (
                    <a href={`/shop/${productSlugMap.get(selected.product_id)}#reviews`}
                      onClick={() => setSelected(null)}
                      className="text-xs font-semibold transition-opacity hover:opacity-70 text-snd-teal">
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

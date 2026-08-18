"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

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

function Stars({ rating, size = "text-sm" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill(0).map((_, i) => (
        <span key={i} className={`${size} ${i < rating ? "text-ink" : "text-line-strong"}`}>★</span>
      ))}
    </div>
  );
}

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
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 overflow-x-auto snap-x snap-mandatory -mx-5 px-5 sm:mx-0 sm:px-0 sm:overflow-visible">
        {reviews.slice(0, 3).map(r => (
          <button
            key={r.id}
            onClick={() => setSelected(r)}
            className="text-left bg-paper border border-line rounded-md p-6 hover:border-line-strong transition-colors shrink-0 w-[85vw] sm:w-auto snap-start"
          >
            <Stars rating={r.rating} />
            <p className="text-body-sm text-ink-2 leading-relaxed mt-4 mb-5">
              &ldquo;{r.body.length > 140 ? r.body.slice(0, 140) + "…" : r.body}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-body-sm font-medium text-ink">{r.author_name}</p>
                {r.is_verified && <Check className="w-3.5 h-3.5 text-state-onhand" strokeWidth={2.5} />}
              </div>
              {r.product_id && productSlugMap.has(r.product_id) && (
                <span className="text-eyebrow text-ink-3">View →</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <Stars rating={selected.rating} size="text-lg" />
              <button onClick={() => setSelected(null)} className="hover:opacity-60 transition-opacity">
                <X className="w-4 h-4 text-ink-3" />
              </button>
            </div>
            <div className="p-6">
              {selected.title && (
                <p className="text-body font-medium mb-2 text-ink">{selected.title}</p>
              )}
              <p className="text-body-sm text-ink-2 leading-relaxed mb-4">
                &ldquo;{selected.body}&rdquo;
              </p>
              {selected.image_url && (
                <div className="mb-6 rounded-md overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selected.image_url} alt="Review photo" className="w-full object-contain" style={{ maxHeight: 280 }} />
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-line">
                <div className="flex items-center gap-1.5">
                  <p className="text-body-sm font-medium text-ink">{selected.author_name}</p>
                  {selected.is_verified && <Check className="w-3.5 h-3.5 text-state-onhand" strokeWidth={2.5} />}
                </div>
                {selected.product_id && productSlugMap.has(selected.product_id) && (
                  <a
                    href={`/shop/${productSlugMap.get(selected.product_id)}#reviews`}
                    onClick={() => setSelected(null)}
                    className="text-eyebrow text-ink-3 hover:text-ink transition-colors"
                  >
                    View Product →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

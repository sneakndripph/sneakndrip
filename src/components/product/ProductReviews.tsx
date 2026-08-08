"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, X } from "lucide-react";
import type { Review } from "@/lib/types";

function Stars({ rating, size = "w-3 h-3" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${size} ${i < rating ? "text-ink" : "text-line-strong"}`} fill={i < rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

export default function ProductReviews({ reviews }: { reviews: Review[] }) {
  const [lightboxReview, setLightboxReview] = useState<Review | null>(null);

  return (<>
    <div className="space-y-5">
      {reviews.length === 0 ? (
        <p className="text-ink-3">No reviews yet. Purchase this product to leave a review.</p>
      ) : (
        reviews.map(r => (
          <div
            key={r.id}
            className="pb-5 cursor-pointer transition-opacity hover:opacity-80 border-b border-line"
            onClick={() => setLightboxReview(r)}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-body-sm font-medium text-ink">
                {r.author_name}
                {r.is_verified && (
                  <span className="ml-2 text-micro px-2 py-0.5 rounded-sm border border-line text-ink-3">Verified</span>
                )}
              </p>
              <Stars rating={r.rating} />
            </div>
            {r.title && <p className="text-body-sm font-medium mb-1 text-ink">{r.title}</p>}
            <p className="text-body-sm text-ink-2">{r.body}</p>
            {r.image_url && (
              <div className="mt-3 relative overflow-hidden rounded-md border border-line" style={{ width: 120, height: 120 }}>
                <Image src={r.image_url} alt="Review photo" fill className="object-cover" sizes="120px" />
              </div>
            )}
            {r.created_at && (
              <p className="text-micro mt-1 text-ink-3">
                {new Date(r.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        ))
      )}
    </div>

    {/* Review lightbox */}
    {lightboxReview && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70" onClick={() => setLightboxReview(null)}>
        <div className="w-full max-w-sm overflow-hidden rounded-md bg-paper border border-line" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div>
              <p className="text-body-sm font-medium text-ink">{lightboxReview.author_name}</p>
              <div className="mt-0.5"><Stars rating={lightboxReview.rating} /></div>
            </div>
            <button onClick={() => setLightboxReview(null)} className="p-1 transition-opacity hover:opacity-70">
              <X className="w-4 h-4 text-ink-3" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {lightboxReview.title && (
              <p className="text-body-sm font-medium text-ink">{lightboxReview.title}</p>
            )}
            <p className="text-body-sm leading-relaxed text-ink-2">{lightboxReview.body}</p>
            {lightboxReview.image_url && (
              <div className="relative w-full aspect-square overflow-hidden rounded-md border border-line">
                <Image src={lightboxReview.image_url} alt="Review photo" fill className="object-cover" sizes="400px" />
              </div>
            )}
            {lightboxReview.created_at && (
              <p className="text-micro text-ink-3">
                {new Date(lightboxReview.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </>);
}

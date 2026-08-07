"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, X } from "lucide-react";
import type { Review } from "@/lib/types";

export default function ProductReviews({ reviews }: { reviews: Review[] }) {
  const [lightboxReview, setLightboxReview] = useState<Review | null>(null);

  return (<>
    <div className="space-y-5">
      {reviews.length === 0 ? (
        <p className="text-snd-muted-lt">No reviews yet. Purchase this product to leave a review.</p>
      ) : (
        reviews.map(r => (
          <div
            key={r.id}
            className="pb-5 cursor-pointer transition-opacity hover:opacity-80 border-b border-snd-border"
            onClick={() => setLightboxReview(r)}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-sm text-snd-black">
                {r.author_name}
                {r.is_verified && (
                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-snd-teal/[15%] text-snd-teal">Verified</span>
                )}
              </p>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3" style={{ color: i < r.rating ? "#F59E0B" : "var(--color-snd-border)", fill: i < r.rating ? "#F59E0B" : "none" }} />
                ))}
              </div>
            </div>
            {r.title && <p className="font-semibold text-sm mb-1 text-snd-black">{r.title}</p>}
            <p className="text-snd-muted">{r.body}</p>
            {r.image_url && (
              <div className="mt-3 relative overflow-hidden border border-snd-border" style={{ width: 120, height: 120 }}>
                <Image src={r.image_url} alt="Review photo" fill className="object-cover" sizes="120px" />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/55 text-white">Photo</div>
              </div>
            )}
            {r.created_at && (
              <p className="text-xs mt-1 text-snd-muted-lt">
                {new Date(r.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        ))
      )}
    </div>

    {/* Review lightbox */}
    {lightboxReview && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70" onClick={() => setLightboxReview(null)}>
        <div className="w-full max-w-sm overflow-hidden bg-snd-bg border border-snd-border" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-snd-border bg-snd-card">
            <div>
              <p className="font-black text-sm text-snd-black">{lightboxReview.author_name}</p>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3 h-3" style={{ color: i < lightboxReview.rating ? "#F59E0B" : undefined }} fill={i < lightboxReview.rating ? "#F59E0B" : "none"} stroke={i < lightboxReview.rating ? "#F59E0B" : "var(--color-snd-border)"} />
                ))}
              </div>
            </div>
            <button onClick={() => setLightboxReview(null)} className="p-1 transition-opacity hover:opacity-70">
              <X className="w-4 h-4 text-snd-muted" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {lightboxReview.title && (
              <p className="font-bold text-sm text-snd-black">{lightboxReview.title}</p>
            )}
            <p className="text-sm leading-relaxed text-snd-muted">{lightboxReview.body}</p>
            {lightboxReview.image_url && (
              <div className="relative w-full aspect-square overflow-hidden border border-snd-border">
                <Image src={lightboxReview.image_url} alt="Review photo" fill className="object-cover" sizes="400px" />
              </div>
            )}
            {lightboxReview.created_at && (
              <p className="text-xs text-snd-muted-lt">
                {new Date(lightboxReview.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>
    )}
  </>);
}

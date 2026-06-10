"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Check, Trash2, Star } from "lucide-react";

type Review = {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified: boolean;
  created_at: string;
  product_name?: string;
};

export default function AdminReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const filtered = reviews.filter(r =>
    filter === "all" ? true : filter === "pending" ? !r.is_verified : r.is_verified
  );

  async function approve(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_verified: true }),
    });
    if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, is_verified: true } : r));
  }

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews(prev => prev.filter(r => r.id !== id));
  }

  const pending = reviews.filter(r => !r.is_verified).length;

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Moderation</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>REVIEWS</h1>
        {pending > 0 && (
          <p className="text-sm mt-1 font-semibold" style={{ color: BRAND.red }}>
            {pending} pending approval
          </p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all"
            style={{
              background: filter === f ? BRAND.black : BRAND.card,
              color: filter === f ? BRAND.bg : BRAND.muted,
              border: `1px solid ${filter === f ? BRAND.black : BRAND.border}`,
            }}>
            {f} {f === "all" ? `(${reviews.length})` : f === "pending" ? `(${reviews.filter(r => !r.is_verified).length})` : `(${reviews.filter(r => r.is_verified).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>
            {filter === "pending" ? "NO PENDING REVIEWS" : "NO REVIEWS YET"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="p-5 rounded-xl"
              style={{
                background: BRAND.card,
                border: `1px solid ${r.is_verified ? BRAND.border : `${BRAND.red}40`}`,
              }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: BRAND.black }}>{r.author_name}</p>
                    {r.product_name && (
                      <span className="text-xs px-2 py-0.5 rounded"
                        style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>
                        {r.product_name}
                      </span>
                    )}
                    <span className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: r.is_verified ? `${BRAND.teal}15` : `${BRAND.red}10`,
                        color: r.is_verified ? BRAND.teal : BRAND.red,
                      }}>
                      {r.is_verified ? "Approved" : "Pending"}
                    </span>
                  </div>

                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3"
                        style={{ color: i < r.rating ? "#F59E0B" : BRAND.border, fill: i < r.rating ? "#F59E0B" : "none" }} />
                    ))}
                  </div>

                  {r.title && <p className="font-semibold text-sm mb-1" style={{ color: BRAND.black }}>{r.title}</p>}
                  <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>{r.body}</p>
                  <p className="text-xs mt-2" style={{ color: BRAND.mutedLight }}>
                    {new Date(r.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>

                <div className="flex gap-2 shrink-0">
                  {!r.is_verified && (
                    <button onClick={() => approve(r.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
                      style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  <button onClick={() => remove(r.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
                    style={{ background: `${BRAND.red}10`, color: BRAND.red }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

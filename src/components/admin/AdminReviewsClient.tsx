"use client";

import { useState } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { Check, Trash2, Star, X, MessageSquare } from "lucide-react";

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

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} style={{ width: size, height: size, color: i < rating ? "#F59E0B" : BRAND.border, fill: i < rating ? "#F59E0B" : "none" }} />
      ))}
    </div>
  );
}

export default function AdminReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selected, setSelected] = useState<Review | null>(null);

  const filtered = reviews.filter(r =>
    filter === "all" ? true : filter === "pending" ? !r.is_verified : r.is_verified
  );

  async function approve(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_verified: true }),
    });
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, is_verified: true } : r));
      setSelected(prev => prev?.id === id ? { ...prev, is_verified: true } : prev);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id));
      setSelected(prev => prev?.id === id ? null : prev);
    }
  }

  const pending = reviews.filter(r => !r.is_verified).length;

  return (
    <div style={{ fontFamily: FONTS.body }}>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: BRAND.teal }}>Moderation</p>
        <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>REVIEWS</h1>
        {pending > 0 && (
          <p className="text-sm mt-1 font-semibold" style={{ color: BRAND.red }}>{pending} pending approval</p>
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
            {f}{" "}
            {f === "all" ? `(${reviews.length})`
              : f === "pending" ? `(${reviews.filter(r => !r.is_verified).length})`
              : `(${reviews.filter(r => r.is_verified).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-xl" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: BRAND.black }} />
          <p style={{ fontFamily: FONTS.display, fontSize: "1.5rem", color: BRAND.muted, letterSpacing: "0.04em" }}>
            {filter === "pending" ? "NO PENDING REVIEWS" : "NO REVIEWS YET"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ background: "rgba(13,13,13,0.02)", borderBottom: `1px solid ${BRAND.border}` }}>
                  {["Author", "Product", "Rating", "Review", "Status", "Date", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest"
                      style={{ color: BRAND.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id}
                    className="transition-colors hover:bg-black/[0.025] cursor-pointer"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BRAND.border}` : "none" }}
                    onClick={() => setSelected(r)}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold" style={{ color: BRAND.black }}>{r.author_name}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {r.product_name ? (
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>
                          {r.product_name}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: BRAND.muted }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StarRow rating={r.rating} size={11} />
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      {r.title && <p className="text-xs font-semibold truncate mb-0.5" style={{ color: BRAND.black }}>{r.title}</p>}
                      <p className="text-xs truncate" style={{ color: BRAND.muted }}>{r.body}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{
                          background: r.is_verified ? `${BRAND.teal}15` : `${BRAND.red}10`,
                          color: r.is_verified ? BRAND.teal : BRAND.red,
                        }}>
                        {r.is_verified ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs" style={{ color: BRAND.muted }}>
                      {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-2">
                        {!r.is_verified && (
                          <button onClick={() => approve(r.id)}
                            className="p-1.5 transition-opacity hover:opacity-70"
                            title="Approve" style={{ color: BRAND.teal }}>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => remove(r.id)}
                          className="p-1.5 transition-opacity hover:opacity-70"
                          title="Delete" style={{ color: BRAND.red }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-3">
                <p className="font-black text-sm" style={{ color: BRAND.black }}>{selected.author_name}</p>
                {selected.product_name && (
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${BRAND.teal}12`, color: BRAND.teal }}>
                    {selected.product_name}
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{
                    background: selected.is_verified ? `${BRAND.teal}15` : `${BRAND.red}10`,
                    color: selected.is_verified ? BRAND.teal : BRAND.red,
                  }}>
                  {selected.is_verified ? "Approved" : "Pending"}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="transition-opacity hover:opacity-60">
                <X className="w-4 h-4" style={{ color: BRAND.muted }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <StarRow rating={selected.rating} size={16} />
                <span className="text-sm font-bold" style={{ color: BRAND.black }}>{selected.rating}/5</span>
              </div>

              {selected.title && (
                <p className="font-bold text-base" style={{ color: BRAND.black }}>{selected.title}</p>
              )}

              <p className="text-sm leading-relaxed" style={{ color: BRAND.muted }}>{selected.body}</p>

              <p className="text-xs pt-2" style={{ color: BRAND.mutedLight, borderTop: `1px solid ${BRAND.border}` }}>
                {new Date(selected.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              {!selected.is_verified && (
                <button onClick={() => approve(selected.id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
                  style={{ background: `${BRAND.teal}15`, color: BRAND.teal }}>
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              <button onClick={() => remove(selected.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
                style={{ background: `${BRAND.red}10`, color: BRAND.red }}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

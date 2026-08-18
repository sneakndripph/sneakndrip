"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Trash2, Star, X, MessageSquare, ShieldCheck } from "lucide-react";
import { useConfirmDialog } from "./ConfirmDialog";

type Review = {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  is_verified: boolean;
  created_at: string;
  image_url?: string | null;
  product_name?: string;
};

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={i < rating ? "text-ink" : "text-line-strong"} style={{ width: size, height: size }} fill={i < rating ? "currentColor" : "none"} />
      ))}
    </div>
  );
}

const FILTERS = [
  { id: "all" as const, label: "All" },
  { id: "pending" as const, label: "Pending" },
  { id: "approved" as const, label: "Approved" },
];

export default function AdminReviewsClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [processing, setProcessing] = useState(false);
  const { confirm: confirmDialog, dialog } = useConfirmDialog();

  const filtered = reviews.filter(r =>
    filter === "all" ? true : filter === "pending" ? !r.is_verified : r.is_verified
  );
  const pending = reviews.filter(r => !r.is_verified).length;

  async function approve(id: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_verified: true }),
    });
    if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, is_verified: true } : r));
  }

  async function remove(id: string, reason?: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) setReviews(prev => prev.filter(r => r.id !== id));
    return res.ok;
  }

  async function handleDelete(id: string) {
    const ok = await confirmDialog({
      title: "Delete this review?",
      description: "This permanently removes the review. Use Reject instead to keep an audit trail.",
      confirmLabel: "Delete review",
      variant: "destructive",
    });
    if (!ok) return;
    remove(id);
  }

  function openReject(r: Review) { setRejectTarget(r); setRejectReason(""); setRejectError(""); }
  function closeReject() { setRejectTarget(null); setRejectReason(""); setRejectError(""); }

  async function confirmReject() {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { setRejectError("Reason is required."); return; }
    setProcessing(true);
    const ok = await remove(rejectTarget.id, rejectReason.trim());
    setProcessing(false);
    if (ok) closeReject();
    else setRejectError("Failed to reject. Please try again.");
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-admin-eyebrow text-ink-3 mb-1">Moderation</p>
        <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Reviews</h1>
        {pending > 0 && <p className="text-admin text-state-error mt-1">{pending} pending approval</p>}
      </div>

      {/* Filter tabs */}
      <div className="inline-flex bg-paper-2 rounded-md p-1 mb-6">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`text-admin-sm px-3.5 py-1.5 rounded transition-colors duration-admin-fast ${
              filter === f.id ? "bg-paper text-ink font-medium" : "text-ink-3 hover:text-ink"
            }`}>
            {f.label}{" "}
            <span className="text-ink-3">
              ({f.id === "all" ? reviews.length : f.id === "pending" ? pending : reviews.length - pending})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-paper border border-line rounded-md py-20 text-center">
          <MessageSquare className="w-9 h-9 mx-auto mb-3 text-ink-3" />
          <p className="text-admin-title text-ink">
            {filter === "pending" ? "No pending reviews" : "No reviews yet"}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map(r => (
            <div key={r.id} className="bg-paper border border-line rounded-md p-4 mb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-admin-sm font-semibold text-ink">{r.author_name}</p>
                    {r.is_verified && (
                      <span className="inline-flex items-center gap-1 text-admin-micro font-medium px-2 py-0.5 rounded-full text-state-onhand bg-state-onhand/10">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {!r.is_verified && (
                      <span className="text-admin-micro font-medium px-2 py-0.5 rounded-full text-state-preorder bg-state-preorder/10">Pending</span>
                    )}
                  </div>
                  {r.product_name && (
                    <Link href={r.product_id ? `/admin/products/${r.product_id}` : "/admin/products"}
                      className="text-admin-sm text-ink-2 hover:text-ink underline decoration-line-strong underline-offset-2 transition-colors duration-admin-fast">
                      {r.product_name}
                    </Link>
                  )}
                </div>
                <p className="text-admin-micro text-ink-3 shrink-0">
                  {new Date(r.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>

              <div className="mt-2.5">
                <StarRow rating={r.rating} />
              </div>

              {r.title && <p className="text-admin-sm font-semibold text-ink mt-2">{r.title}</p>}
              <p className="text-admin-sm text-ink-2 mt-1 whitespace-pre-line">{r.body}</p>

              {r.image_url && (
                <div className="mt-3">
                  {r.image_url.toLowerCase().endsWith(".mp4") ? (
                    <video src={r.image_url} controls className="w-full max-w-xs rounded-md max-h-56 bg-paper-2" />
                  ) : (
                    <a href={r.image_url} target="_blank" rel="noopener noreferrer"
                      className="block relative w-28 h-28 rounded-md overflow-hidden border border-line hover:opacity-80 transition-opacity duration-admin-fast">
                      <Image src={r.image_url} alt="Review attachment" fill className="object-cover" sizes="112px" />
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-line">
                {!r.is_verified && (
                  <button onClick={() => approve(r.id)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-admin-sm font-medium rounded-md bg-state-onhand/10 text-state-onhand border border-state-onhand/30 hover:bg-state-onhand/15 transition-colors duration-admin-fast">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {!r.is_verified && (
                  <button onClick={() => openReject(r)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                <button onClick={() => handleDelete(r.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-admin-sm font-medium rounded-md border border-line text-state-error hover:bg-state-error/5 transition-colors duration-admin-fast">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject confirmation */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) closeReject(); }}>
          <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
            <div className="flex items-center justify-between px-6 py-4 border-b border-line">
              <p className="text-admin-title text-ink">Reject review</p>
              <button onClick={closeReject} className="p-1 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-admin-sm text-ink-3 mb-3">
                By {rejectTarget.author_name}{rejectTarget.product_name ? ` on ${rejectTarget.product_name}` : ""}. This review will be permanently removed.
              </p>
              <label className="block text-admin-eyebrow text-ink-3 mb-1.5">Reason *</label>
              <textarea rows={2} value={rejectReason} onChange={e => { setRejectReason(e.target.value); setRejectError(""); }}
                placeholder="Reason for rejection…"
                className={`w-full px-3.5 py-2.5 text-admin bg-paper border rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast resize-none ${
                  rejectError ? "border-state-error" : "border-line"
                }`} />
              {rejectError && <p className="text-admin-sm text-state-error mt-1.5">{rejectError}</p>}
            </div>
            <div className="flex gap-2.5 px-6 pb-6">
              <button onClick={confirmReject} disabled={processing}
                className="flex-1 py-2.5 text-admin-sm font-medium rounded-md bg-state-error text-paper hover:opacity-90 disabled:opacity-50 transition-opacity duration-admin-fast">
                {processing ? "Processing…" : "Confirm rejection"}
              </button>
              <button onClick={closeReject}
                className="px-5 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}

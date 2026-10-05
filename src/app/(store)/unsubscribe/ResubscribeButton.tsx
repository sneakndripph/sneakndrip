"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmailType } from "@/lib/email/preferences";

type Outcome = { resubscribed: boolean; hasAccount: boolean };

const primaryCls = "flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest bg-ink text-paper";
const secondaryCls = "flex items-center justify-center gap-2 w-full py-4 font-bold text-sm uppercase tracking-widest border-[1.5px] border-line text-ink";

export default function ResubscribeButton({ email, category, sig }: { email: string; category: EmailType; sig: string }) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function resubscribe() {
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, category, sig }),
      });
      const data = await res.json().catch(() => ({})) as Partial<Outcome> & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Couldn't resubscribe. Please try again.");
      setOutcome({ resubscribed: Boolean(data.resubscribed), hasAccount: Boolean(data.hasAccount) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resubscribe. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (outcome?.resubscribed) {
    return (
      <div className="mt-8 space-y-3">
        <p className="text-ink font-semibold">You&apos;re subscribed again.</p>
        {outcome.hasAccount
          ? <Link href="/account?tab=emails" className={primaryCls}>Manage All Preferences →</Link>
          : <Link href="/shop" className={primaryCls}>Browse Shop</Link>}
      </div>
    );
  }

  if (outcome) {
    // No subscription to restore — a guest's restock sign-ups are one-shot.
    return (
      <div className="mt-8 space-y-3">
        <p className="text-ink">
          {category === "restock_alert"
            ? "To get restock alerts again, sign up on the product page you're interested in."
            : "We couldn't find a subscription for this address."}
        </p>
        <Link href="/shop" className={primaryCls}>Browse Shop</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-3">
      <p className="text-ink-2">Changed your mind?</p>
      <button type="button" onClick={resubscribe} disabled={pending} className={`${primaryCls} disabled:opacity-50`}>
        {pending ? "Resubscribing…" : "Resubscribe"}
      </button>
      {error && <p className="text-xs text-ink">{error}</p>}
      <Link href="/shop" className={secondaryCls}>Continue Shopping</Link>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { consentMetadata, hasCurrentConsent } from "@/lib/legal/versions";
import { safeNext } from "@/lib/safe-redirect";
import MarketingCheckbox from "@/components/auth/MarketingCheckbox";

/**
 * `next` is validated server-side by the /consent page; re-checked here before navigating.
 * `isNewAccount` (decided server-side) shows the marketing opt-in only to just-created accounts.
 */
export default function ConsentForm({ next: nextProp, isNewAccount }: { next: string; isNewAccount: boolean }) {
  const router = useRouter();
  const next = safeNext(nextProp);
  const [ready, setReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      if (hasCurrentConsent(user.user_metadata)) { router.replace(next); return; }
      setReady(true);
    });
  }, [router, next]);

  async function handleContinue() {
    if (!agreed) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: { ...consentMetadata("oauth"), ...(isNewAccount ? { marketing_opted_in: marketing } : {}) },
    });
    if (updateError) {
      setError("Couldn't save your consent. Please try again.");
      setSaving(false);
      return;
    }
    if (isNewAccount) {
      // Best effort: if this fails the choice stays in metadata and the auth
      // callback applies it on the next sign-in.
      await fetch("/api/account/marketing-choice", { method: "POST" }).catch(() => {});
    }
    router.push(next);
    router.refresh();
  }

  if (!ready) return null;

  return (
    <div>
      <h1 className="text-display-s text-ink font-display font-medium mb-2">One more step</h1>
      <p className="text-body-sm text-ink-2 mb-8 leading-relaxed">
        Before you continue, please confirm you agree to our Terms and Privacy Policy.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-paper-2 border border-line">
          <p className="text-body-sm text-state-error">{error}</p>
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 shrink-0 rounded-sm accent-ink"
        />
        <span className="text-micro text-ink-2 leading-relaxed">
          I agree to the{" "}
          <Link href="/terms" className="text-ink underline hover:opacity-60 transition-opacity">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-ink underline hover:opacity-60 transition-opacity">Privacy Policy</Link>
        </span>
      </label>

      {isNewAccount && (
        <div className="mt-4">
          <MarketingCheckbox checked={marketing} onChange={setMarketing} />
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!agreed || saving}
        className="w-full py-3.5 rounded-md text-body-sm font-medium mt-6 bg-ink text-paper hover:bg-ink-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}

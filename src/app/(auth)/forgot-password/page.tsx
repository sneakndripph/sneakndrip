"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/constants";
import toast from "react-hot-toast";

const RESEND_COOLDOWN_S = 30;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function sendResetLink(targetEmail: string) {
    const supabase = createClient();
    return supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await sendResetLink(email);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    }
    setLoading(false);
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    const { error: err } = await sendResetLink(email);
    setResending(false);
    if (err) {
      toast.error(err.message);
    } else {
      toast.success("New link sent — click it right away");
      setCooldown(RESEND_COOLDOWN_S);
    }
  }

  return (
    <div>
      {sent ? (
        <div className="text-center">
          <h1 className="text-display-s text-ink font-display font-medium mb-3">Reset link sent</h1>
          <p className="text-body text-ink mb-2 leading-relaxed">
            We&apos;ve sent a password reset link to <strong className="text-ink">{email}</strong>. Click it within 15 minutes.
          </p>
          <p className="text-body-sm text-ink-3 mb-6 leading-relaxed">
            Some email apps preview links before you open them — if the link doesn&apos;t work, request a new one and click it immediately.
          </p>

          <button
            type="button" onClick={handleResend} disabled={cooldown > 0 || resending}
            className="bg-transparent border border-ink text-ink px-4 py-2 rounded-md hover:bg-ink hover:text-paper transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-ink text-body-sm font-medium mb-6"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s...` : resending ? "Sending…" : "Send another link"}
          </button>

          <p className="text-body-sm text-ink-2 mb-4">
            <Link href="/login" className="text-ink underline hover:opacity-60 transition-opacity">Back to sign in</Link>
          </p>

          <Link
            href="/contact"
            className="text-body-sm text-ink-3 underline hover:text-ink transition-colors"
          >
            Still not working? Contact us for help
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-display-s text-ink font-display font-medium mb-2">Forgot password</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-body-sm text-ink-2 mb-4">
              Enter your account email and we&apos;ll send you a reset link.
            </p>

            <div>
              <label htmlFor="forgot-email" className="block text-eyebrow text-ink-3 mb-1.5">Email address</label>
              <input
                id="forgot-email"
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@email.com"
                className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
              />
            </div>

            {error && <p className="text-body-sm text-state-error">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-md text-body-sm font-medium bg-ink text-paper hover:bg-ink-2 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <p className="text-center text-body-sm text-ink-2">
              Remember it?{" "}
              <Link href="/login" className="text-ink underline hover:opacity-60 transition-opacity">Sign in</Link>
            </p>
          </form>
        </>
      )}
    </div>
  );
}

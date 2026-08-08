"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${SITE_URL}/reset-password`,
    });
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-display-s text-ink font-display font-medium mb-2">Forgot password</h1>

      {sent ? (
        <div className="text-center">
          <p className="text-body-sm font-medium text-ink mb-2">Check your email</p>
          <p className="text-body-sm text-ink-2 mb-6 leading-relaxed">
            We sent a password reset link to <strong className="text-ink">{email}</strong>. Check your inbox (and spam folder).
          </p>
          <Link href="/login" className="text-body-sm text-ink underline hover:opacity-60 transition-opacity">Back to sign in</Link>
        </div>
      ) : (
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
      )}
    </div>
  );
}

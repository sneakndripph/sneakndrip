"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BRAND, FONTS } from "@/lib/constants";

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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: BRAND.teal }}>Sneak N&apos; Drip</p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
            FORGOT PASSWORD
          </h1>
        </div>

        {sent ? (
          <div className="p-6 rounded-xl text-center" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <p className="font-bold mb-2" style={{ color: BRAND.black }}>Check your email</p>
            <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
              We sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder).
            </p>
            <Link href="/login" className="text-sm font-bold uppercase tracking-wide"
              style={{ color: BRAND.teal }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-xl space-y-4"
            style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <p className="text-sm" style={{ color: BRAND.muted }}>
              Enter your account email and we&apos;ll send you a reset link.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                Email Address
              </label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@email.com"
                className="w-full px-4 py-3 text-sm focus:outline-none"
                style={{ background: BRAND.bg, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
              />
            </div>

            {error && (
              <p className="text-xs font-semibold" style={{ color: BRAND.red }}>{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            <p className="text-center text-sm" style={{ color: BRAND.muted }}>
              Remember it?{" "}
              <Link href="/login" className="font-bold transition-opacity hover:opacity-70"
                style={{ color: BRAND.black }}>Sign In</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

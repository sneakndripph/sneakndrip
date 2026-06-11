"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{ background: BRAND.black }}>
        <div className="rounded-md px-3 py-2 inline-block" style={{ background: BRAND.bg }}>
          <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={120} height={48} className="object-contain" />
        </div>
        <div>
          <h2 className="text-white mb-4" style={{ fontFamily: FONTS.display, fontSize: "3.5rem", letterSpacing: "0.03em", lineHeight: 1 }}>
            AUTHENTIC<br />
            <span style={{ color: BRAND.teal }}>SNEAKERS</span><br />
            PHILIPPINES
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
            100% authentic. On Hand &amp; Pre-Order. Ships nationwide.
          </p>
        </div>
        <div className="flex gap-4">
          {["100% Auth", "GCash / COD", "Fast Ship"].map(t => (
            <span key={t} className="text-xs font-bold px-3 py-1.5 uppercase tracking-wider"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#666" }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={120} height={48} className="object-contain" />
          </div>

          <h1 className="mb-2" style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
            SIGN IN
          </h1>
          <p className="text-sm mb-8" style={{ color: BRAND.muted }}>
            Welcome back.{" "}
            <Link href="/register" className="font-bold transition-colors hover:opacity-70"
              style={{ color: BRAND.teal }}>Create account →</Link>
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded text-sm font-medium"
              style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                Email Address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@email.com" required
                className="w-full px-4 py-3.5 text-sm focus:outline-none transition-colors"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                Password
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3.5 pr-12 text-sm focus:outline-none transition-colors"
                  style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                  onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                  onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs font-semibold transition-opacity hover:opacity-60"
                style={{ color: BRAND.muted }}>Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: BRAND.black, color: BRAND.bg }}>
              {loading ? "Signing In…" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: BRAND.border }} />
            <span className="text-xs" style={{ color: BRAND.mutedLight }}>or</span>
            <div className="flex-1 h-px" style={{ background: BRAND.border }} />
          </div>

          <Link href="/register"
            className="w-full flex items-center justify-center py-4 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ border: `1.5px solid ${BRAND.black}`, color: BRAND.black }}>
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

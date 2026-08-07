"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/shop";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSocialLogin(provider: "google" | "facebook") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data.user?.user_metadata?.role === "admin") {
      router.push("/admin");
    } else {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-snd-bg font-body">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 bg-snd-black">
        <div className="rounded-md px-3 py-2 inline-block bg-snd-bg">
          <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={160} height={64} className="object-contain" />
        </div>
        <div>
          <h2 className="text-white mb-4 font-heading" style={{ fontSize: "3.5rem", letterSpacing: "0.03em", lineHeight: 1 }}>
            AUTHENTIC<br />
            <span className="text-snd-teal">SNEAKERS</span><br />
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
          <div className="flex items-center justify-between mb-8 lg:justify-end">
            <div className="lg:hidden">
              <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={160} height={64} className="object-contain" />
            </div>
            <Link href="/" className="text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-60 flex items-center gap-1 text-snd-muted">
              ← Home
            </Link>
          </div>

          <h1 className="mb-2 font-heading text-snd-black" style={{ fontSize: "2.5rem", letterSpacing: "0.04em" }}>
            SIGN IN
          </h1>
          <p className="text-sm mb-8 text-snd-muted">
            Welcome back.{" "}
            <Link href="/register" className="font-bold transition-colors hover:opacity-70 text-snd-teal">Create account →</Link>
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded text-sm font-medium bg-snd-red/[7%] text-snd-red border border-snd-red/[19%]">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">
                Email Address
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="juan@email.com" required
                className="w-full px-4 py-3.5 text-sm focus:outline-none transition-colors bg-snd-card border border-snd-border text-snd-black focus:border-snd-teal" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">
                Password
              </label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3.5 pr-12 text-sm focus:outline-none transition-colors bg-snd-card border border-snd-border text-snd-black focus:border-snd-teal" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-snd-muted">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs font-semibold transition-opacity hover:opacity-60 text-snd-muted">Forgot password?</a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-snd-black text-snd-bg">
              {loading ? "Signing In…" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-snd-border" />
            <span className="text-xs text-snd-muted-lt">or sign in with</span>
            <div className="flex-1 h-px bg-snd-border" />
          </div>

          <div className="space-y-3">
            <button onClick={() => handleSocialLogin("google")}
              className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-semibold transition-opacity hover:opacity-80 border-[1.5px] border-snd-border text-snd-black bg-snd-card">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.9 6.2C12.8 13.3 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.1-9.9 7.1-17z"/><path fill="#FBBC05" d="M10.9 28.5A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5L2.4 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.5-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.2-3.8-13.1-9.1l-8.5 6.2C6.9 42.6 14.8 48 24 48z"/></svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-snd-border" />
            <span className="text-xs text-snd-muted-lt">or</span>
            <div className="flex-1 h-px bg-snd-border" />
          </div>

          <Link href="/register"
            className="w-full flex items-center justify-center py-4 font-bold text-sm uppercase tracking-widest transition-opacity hover:opacity-70 border-[1.5px] border-snd-black text-snd-black">
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

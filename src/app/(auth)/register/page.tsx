"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSocialLogin(provider: "google" | "facebook") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, mobile: form.mobile },
      },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: `${BRAND.teal}18` }}>
            <CheckCircle className="w-8 h-8" style={{ color: BRAND.teal }} />
          </div>
          <h1 className="mb-3" style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
            CHECK YOUR EMAIL
          </h1>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: BRAND.muted }}>
            We sent a confirmation link to <strong style={{ color: BRAND.black }}>{form.email}</strong>.
            Click the link to activate your account, then sign in.
          </p>
          <button onClick={() => router.push("/login")}
            className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90"
            style={{ background: BRAND.black, color: BRAND.bg }}>
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: BRAND.bg, fontFamily: FONTS.body }}>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={120} height={48} className="object-contain" />
        </div>

        <h1 className="mb-2" style={{ fontFamily: FONTS.display, fontSize: "2.5rem", letterSpacing: "0.04em", color: BRAND.black }}>
          CREATE ACCOUNT
        </h1>
        <p className="text-sm mb-8" style={{ color: BRAND.muted }}>
          Already have one?{" "}
          <Link href="/login" className="font-bold transition-colors hover:opacity-70" style={{ color: BRAND.teal }}>
            Sign in →
          </Link>
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded text-sm font-medium"
            style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {[
            { key: "name", label: "Full Name", type: "text", placeholder: "Juan Dela Cruz" },
            { key: "email", label: "Email Address", type: "email", placeholder: "juan@email.com" },
            { key: "mobile", label: "Mobile Number", type: "tel", placeholder: "09XX XXX XXXX" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                {f.label}
              </label>
              <input type={f.type} value={form[f.key as keyof typeof form]}
                onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                placeholder={f.placeholder} required
                className="w-full px-4 py-3.5 text-sm focus:outline-none transition-colors"
                style={{ background: BRAND.card, border: `1px solid ${BRAND.border}`, color: BRAND.black }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
            </div>
          ))}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              Password
            </label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={form.password}
                onChange={e => setForm(v => ({ ...v, password: e.target.value }))}
                placeholder="Min. 8 characters" required
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

          <button type="submit" disabled={loading}
            className="w-full py-4 font-black text-sm uppercase tracking-widest mt-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: BRAND.black, color: BRAND.bg }}>
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: BRAND.border }} />
          <span className="text-xs" style={{ color: BRAND.mutedLight }}>or sign up with</span>
          <div className="flex-1 h-px" style={{ background: BRAND.border }} />
        </div>

        <div className="space-y-3">
          <button onClick={() => handleSocialLogin("google")}
            className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black, background: BRAND.card }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.9 6.2C12.8 13.3 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.1-9.9 7.1-17z"/><path fill="#FBBC05" d="M10.9 28.5A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5L2.4 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.5-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.2-3.8-13.1-9.1l-8.5 6.2C6.9 42.6 14.8 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button onClick={() => handleSocialLogin("facebook")}
            className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black, background: BRAND.card }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.32l-.53 3.5h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
            Continue with Facebook
          </button>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: BRAND.mutedLight }}>
          By creating an account, you agree to our{" "}
          <a href="#" className="underline">Terms of Service</a> and{" "}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

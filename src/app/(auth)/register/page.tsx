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

        <p className="text-xs text-center mt-5" style={{ color: BRAND.mutedLight }}>
          By creating an account, you agree to our{" "}
          <a href="#" className="underline">Terms of Service</a> and{" "}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BRAND, FONTS, SITE_URL } from "@/lib/constants";
import { Eye, EyeOff, CheckCircle, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PW_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function validate(form: { name: string; email: string; mobile: string; password: string; confirm: string }) {
  if (!form.name.trim()) return "Full name is required.";
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(form.name)) return "Full name must contain letters only.";
  if (!form.email.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
  if (!form.mobile.trim()) return "Mobile number is required.";
  if (!/^09\d{9}$/.test(form.mobile))
    return "Enter a valid PH mobile number (e.g. 09171234567).";
  if (PW_RULES.some(r => !r.test(form.password))) return "Password does not meet all requirements.";
  if (form.password !== form.confirm) return "Passwords do not match.";
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function field(key: keyof typeof form, value: string) {
    setForm(v => ({ ...v, [key]: value }));
  }
  function touch(key: string) {
    setTouched(t => ({ ...t, [key]: true }));
  }

  // Per-field inline error (only shown after blur)
  function fieldError(key: keyof typeof form): string {
    if (!touched[key]) return "";
    if (key === "name") {
      if (!form.name.trim()) return "Required.";
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(form.name)) return "Letters only — no numbers.";
    }
    if (key === "email") {
      if (!form.email.trim()) return "Required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email address.";
    }
    if (key === "mobile") {
      if (!form.mobile.trim()) return "Required.";
      if (!/^09\d{9}$/.test(form.mobile))
        return "Must be 11 digits starting with 09 (e.g. 09171234567).";
    }
    if (key === "confirm" && form.confirm && form.password !== form.confirm) return "Passwords do not match.";
    return "";
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Touch all fields to show any remaining errors
    setTouched({ name: true, email: true, mobile: true, password: true, confirm: true });
    const err = validate(form);
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.name.trim(), mobile: form.mobile },
        emailRedirectTo: `${SITE_URL}/auth/callback`,
      },
    });
    if (authError) {
      // Surface a friendly message for the most common errors
      if (authError.message.toLowerCase().includes("already registered") ||
          authError.message.toLowerCase().includes("already been registered")) {
        setError("This email is already registered. Sign in instead, or use a different email.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }
    // Supabase returns success even for duplicate unconfirmed emails —
    // detect it by checking if the user has an identity (new accounts do, dupes don't)
    if (signUpData.user && signUpData.user.identities?.length === 0) {
      setError("This email is already registered. Sign in instead, or use a different email.");
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  // Mobile: only allow digits and +, cap at 13 chars (+639XXXXXXXXX) or 11 (09XXXXXXXXX)
  function handleMobile(val: string) {
    const cleaned = val.replace(/\D/g, "");
    field("mobile", cleaned.slice(0, 11));
  }

  const pwStrength = PW_RULES.filter(r => r.test(form.password)).length;
  const strengthColor = pwStrength <= 2 ? BRAND.red : pwStrength <= 3 ? "#D97706" : BRAND.teal;
  const strengthLabel = pwStrength <= 2 ? "Weak" : pwStrength <= 3 ? "Fair" : pwStrength === 4 ? "Good" : "Strong";

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
          <p className="text-sm mb-2 leading-relaxed" style={{ color: BRAND.muted }}>
            We sent a confirmation link to
          </p>
          <p className="font-black text-base mb-6" style={{ color: BRAND.black }}>{form.email}</p>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: BRAND.muted }}>
            Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
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

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              Full Name
            </label>
            <input
              type="text" value={form.name} placeholder="Juan Dela Cruz" required
              onChange={e => field("name", e.target.value)}
              onBlur={() => touch("name")}
              className="w-full px-4 py-3.5 text-sm focus:outline-none transition-colors"
              style={{
                background: BRAND.card,
                border: `1px solid ${fieldError("name") ? BRAND.red : BRAND.border}`,
                color: BRAND.black,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
            />
            {fieldError("name") && (
              <p className="text-xs mt-1 font-medium" style={{ color: BRAND.red }}>{fieldError("name")}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              Email Address
            </label>
            <input
              type="email" value={form.email} placeholder="juan@email.com" required
              onChange={e => field("email", e.target.value)}
              onBlur={() => touch("email")}
              className="w-full px-4 py-3.5 text-sm focus:outline-none transition-colors"
              style={{
                background: BRAND.card,
                border: `1px solid ${fieldError("email") ? BRAND.red : BRAND.border}`,
                color: BRAND.black,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
            />
            {fieldError("email") && (
              <p className="text-xs mt-1 font-medium" style={{ color: BRAND.red }}>{fieldError("email")}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              Mobile Number
            </label>
            <input
              type="tel" value={form.mobile} placeholder="09171234567" required
              onChange={e => handleMobile(e.target.value)}
              onBlur={() => touch("mobile")}
              inputMode="numeric"
              className="w-full px-4 py-3.5 text-sm focus:outline-none transition-colors"
              style={{
                background: BRAND.card,
                border: `1px solid ${fieldError("mobile") ? BRAND.red : BRAND.border}`,
                color: BRAND.black,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
            />
            {fieldError("mobile") ? (
              <p className="text-xs mt-1 font-medium" style={{ color: BRAND.red }}>{fieldError("mobile")}</p>
            ) : (
              <p className="text-xs mt-1" style={{ color: BRAND.mutedLight }}>11 digits · starts with 09 · numbers only</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={form.password}
                placeholder="Create a strong password" required
                onChange={e => field("password", e.target.value)}
                onBlur={() => touch("password")}
                className="w-full px-4 py-3.5 pr-12 text-sm focus:outline-none transition-colors"
                style={{
                  background: BRAND.card,
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.black,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: i <= pwStrength ? strengthColor : BRAND.border }} />
                    ))}
                  </div>
                  <span className="text-xs font-bold" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
                <ul className="space-y-0.5">
                  {PW_RULES.map(r => (
                    <li key={r.label} className="flex items-center gap-1.5 text-xs"
                      style={{ color: r.test(form.password) ? BRAND.teal : BRAND.mutedLight }}>
                      {r.test(form.password)
                        ? <Check className="w-3 h-3 shrink-0" />
                        : <X className="w-3 h-3 shrink-0" />}
                      {r.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"} value={form.confirm}
                placeholder="Re-enter your password" required
                onChange={e => field("confirm", e.target.value)}
                onBlur={() => touch("confirm")}
                className="w-full px-4 py-3.5 pr-12 text-sm focus:outline-none transition-colors"
                style={{
                  background: BRAND.card,
                  border: `1px solid ${fieldError("confirm") ? BRAND.red : BRAND.border}`,
                  color: BRAND.black,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldError("confirm") && (
              <p className="text-xs mt-1 font-medium" style={{ color: BRAND.red }}>{fieldError("confirm")}</p>
            )}
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

        <div>
          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.black, background: BRAND.card }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

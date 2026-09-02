"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import { Eye, EyeOff, CheckCircle, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toastError } from "@/lib/toast";

type EmailCheck = { exists: boolean; providers: string[] | null };

async function checkEmail(email: string): Promise<EmailCheck | null> {
  try {
    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) return null;
    return (await res.json()) as EmailCheck;
  } catch {
    return null;
  }
}

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
  const [highlightGoogle, setHighlightGoogle] = useState(false);
  const [emailHint, setEmailHint] = useState("");

  function field(key: keyof typeof form, value: string) {
    setForm(v => ({ ...v, [key]: value }));
    if (key === "email") {
      setEmailHint("");
      setHighlightGoogle(false);
    }
  }
  function touch(key: string) {
    setTouched(t => ({ ...t, [key]: true }));
  }

  async function handleEmailBlur() {
    touch("email");
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailHint(""); return; }
    const result = await checkEmail(email);
    if (!result?.exists) { setEmailHint(""); return; }
    if (result.providers?.includes("email")) {
      setEmailHint("Already registered — sign in instead");
    } else if (result.providers?.includes("google")) {
      setEmailHint("Registered with Google — sign in with Google");
    } else {
      setEmailHint("");
    }
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
    setHighlightGoogle(false);
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

    const trimmedEmail = form.email.trim();
    const precheck = await checkEmail(trimmedEmail);
    if (precheck?.exists) {
      if (precheck.providers?.includes("email")) {
        toastError("This email is already registered. Sign in with your password instead.");
        setLoading(false);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toastError("This email is registered with Google. Sign in with Google instead.");
        setHighlightGoogle(true);
        setLoading(false);
      }
      return;
    }
    // precheck === null (rate-limited/network error) falls through to signUp() below —
    // the identities?.length === 0 check after it is the defense-in-depth backup.

    const supabase = createClient();
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
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
  const strengthBgClass = pwStrength <= 2 ? "bg-state-error" : pwStrength <= 3 ? "bg-state-preorder" : "bg-state-onhand";
  const strengthTextClass = pwStrength <= 2 ? "text-state-error" : pwStrength <= 3 ? "text-state-preorder" : "text-state-onhand";
  const strengthLabel = pwStrength <= 2 ? "Weak" : pwStrength <= 3 ? "Fair" : pwStrength === 4 ? "Good" : "Strong";

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-paper-2">
          <CheckCircle className="w-8 h-8 text-state-onhand" />
        </div>
        <h1 className="text-display-s text-ink font-display font-medium mb-3">Check your email</h1>
        <p className="text-body-sm text-ink-2 mb-2 leading-relaxed">We sent a confirmation link to</p>
        <p className="text-body-sm font-medium text-ink mb-6">{form.email}</p>
        <p className="text-body-sm text-ink-2 mb-8 leading-relaxed">
          Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-3.5 rounded-md text-body-sm font-medium bg-ink text-paper hover:bg-ink-2 transition-colors"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-display-s text-ink font-display font-medium mb-2">Create account</h1>
      <p className="text-body-sm text-ink-2 mb-8">
        Already have one?{" "}
        <Link href="/login" className="text-ink underline hover:opacity-60 transition-opacity">Sign in</Link>
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-paper-2 border border-line">
          <p className="text-body-sm text-state-error">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>

        {/* Full Name */}
        <div>
          <label htmlFor="register-name" className="block text-eyebrow text-ink-3 mb-1.5">Full name</label>
          <input
            id="register-name"
            type="text" value={form.name} placeholder="Juan Dela Cruz" required
            onChange={e => field("name", e.target.value)}
            onBlur={() => touch("name")}
            className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
          />
          {fieldError("name") && <p className="text-micro text-state-error mt-1">{fieldError("name")}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="register-email" className="block text-eyebrow text-ink-3 mb-1.5">Email address</label>
          <input
            id="register-email"
            type="email" value={form.email} placeholder="juan@email.com" required
            onChange={e => field("email", e.target.value)}
            onBlur={handleEmailBlur}
            className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
          />
          {fieldError("email") ? (
            <p className="text-micro text-state-error mt-1">{fieldError("email")}</p>
          ) : emailHint ? (
            <p className="text-micro text-ink-3 mt-1">{emailHint}</p>
          ) : null}
        </div>

        {/* Mobile */}
        <div>
          <label htmlFor="register-mobile" className="block text-eyebrow text-ink-3 mb-1.5">Mobile number</label>
          <input
            id="register-mobile"
            type="tel" value={form.mobile} placeholder="09171234567" required
            onChange={e => handleMobile(e.target.value)}
            onBlur={() => touch("mobile")}
            inputMode="numeric"
            className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
          />
          {fieldError("mobile") ? (
            <p className="text-micro text-state-error mt-1">{fieldError("mobile")}</p>
          ) : (
            <p className="text-micro text-ink-3 mt-1">11 digits · starts with 09 · numbers only</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="register-password" className="block text-eyebrow text-ink-3 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="register-password"
              type={showPw ? "text" : "password"} value={form.password}
              placeholder="Create a strong password" required
              onChange={e => field("password", e.target.value)}
              onBlur={() => touch("password")}
              className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 pr-12 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {form.password && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= pwStrength ? strengthBgClass : "bg-line"}`} />
                  ))}
                </div>
                <span className={`text-micro font-medium ${strengthTextClass}`}>{strengthLabel}</span>
              </div>
              <ul className="space-y-0.5">
                {PW_RULES.map(r => (
                  <li key={r.label} className={`flex items-center gap-1.5 text-micro ${r.test(form.password) ? "text-state-onhand" : "text-ink-3"}`}>
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
          <label htmlFor="register-confirm" className="block text-eyebrow text-ink-3 mb-1.5">Confirm password</label>
          <div className="relative">
            <input
              id="register-confirm"
              type={showConfirm ? "text" : "password"} value={form.confirm}
              placeholder="Re-enter your password" required
              onChange={e => field("confirm", e.target.value)}
              onBlur={() => touch("confirm")}
              className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 pr-12 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldError("confirm") && <p className="text-micro text-state-error mt-1">{fieldError("confirm")}</p>}
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-md text-body-sm font-medium mt-2 bg-ink text-paper hover:bg-ink-2 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-line" />
        <span className="text-micro text-ink-3">or sign up with</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <button
        onClick={handleGoogleLogin}
        className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-md text-body-sm font-medium text-ink transition-colors ${
          highlightGoogle ? "border-2 border-ink" : "border border-line hover:border-ink"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>
        Continue with Google
      </button>
      <p className="text-body-sm text-ink-3 mt-2 text-center">Use one sign-in method per email.</p>
    </div>
  );
}

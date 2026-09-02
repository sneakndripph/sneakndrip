"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toastSuccess } from "@/lib/toast";

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/shop";
  const duplicateGoogle = searchParams.get("error") === "duplicate_google";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailHint, setEmailHint] = useState("");

  async function handleEmailBlur() {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailHint(""); return; }
    const result = await checkEmail(trimmed);
    setEmailHint(result && !result.exists ? "No account with this email — register instead" : "");
  }

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
    toastSuccess("Signed in");
    if (data.user?.user_metadata?.role === "admin") {
      router.push("/admin");
    } else {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-display-s text-ink font-display font-medium mb-2">Sign in</h1>
      <p className="text-body-sm text-ink-2 mb-8">
        Welcome back.{" "}
        <Link href="/register" className="text-ink underline hover:opacity-60 transition-opacity">Create account</Link>
      </p>

      {duplicateGoogle && (
        <div className="bg-state-error/10 border-l-4 border-state-error text-ink px-4 py-3 mb-4 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <p className="text-body-sm">This email is already registered with a password. Sign in with your password instead.</p>
        </div>
      )}

      {error && (
        <div className="mb-4 px-4 py-3 rounded-md bg-paper-2 border border-line">
          <p className="text-body-sm text-state-error">{error}</p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-email" className="block text-eyebrow text-ink-3 mb-1.5">Email address</label>
          <input
            id="login-email"
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="juan@email.com" required
            className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
          />
          {emailHint && <p className="text-micro text-ink-3 mt-1">{emailHint}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="block text-eyebrow text-ink-3 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Your password" required
              className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 pr-12 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-body-sm text-ink-2 underline hover:text-ink transition-colors">Forgot password?</Link>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-md text-body-sm font-medium bg-ink text-paper hover:bg-ink-2 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-line" />
        <span className="text-micro text-ink-3">or</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <button
        onClick={() => handleSocialLogin("google")}
        className="w-full flex items-center justify-center gap-3 py-3.5 rounded-md text-body-sm font-medium border border-line text-ink hover:border-ink transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.3 0 24 0 14.8 0 6.9 5.4 3 13.3l7.9 6.2C12.8 13.3 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.1-9.9 7.1-17z"/><path fill="#FBBC05" d="M10.9 28.5A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.5L2.4 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.4 10.7l8.5-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.2-3.8-13.1-9.1l-8.5 6.2C6.9 42.6 14.8 48 24 48z"/></svg>
        Continue with Google
      </button>
      <p className="text-body-sm text-ink-3 mt-2 text-center">Sign in with the same method you registered with.</p>
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

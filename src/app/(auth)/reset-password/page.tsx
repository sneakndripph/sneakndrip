"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { toastSuccess } from "@/lib/toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "expired">("checking");

  useEffect(() => {
    // /auth/callback already verified the recovery link and set the session
    // cookie server-side — just confirm the browser client picked it up.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setStatus(user ? "ready" : "expired");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      toastSuccess("Password updated");
      router.push("/account");
    }
  }

  return (
    <div>
      <h1 className="text-display-s text-ink font-display font-medium mb-8">New password</h1>

      {status === "checking" ? (
        <p className="text-body-sm text-ink-2">Verifying reset link…</p>
      ) : status === "expired" ? (
        <div className="text-center">
          <p className="text-body-sm text-ink-2 mb-6 leading-relaxed">
            This reset link is invalid or has expired. Request a new one.
          </p>
          <Link href="/forgot-password" className="text-body-sm text-ink underline hover:opacity-60 transition-opacity">
            Request new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-eyebrow text-ink-3 mb-1.5">New password</label>
            <div className="relative">
              <input
                id="reset-password"
                type={showPw ? "text" : "password"} required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 pr-12 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-eyebrow text-ink-3 mb-1.5">Confirm password</label>
            <input
              id="reset-confirm"
              type={showPw ? "text" : "password"} required
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-paper-2 border-0 rounded-md px-4 py-3 text-body-sm text-ink focus:outline-2 focus:outline-ink focus:outline-offset-1"
            />
          </div>

          {error && <p className="text-body-sm text-state-error">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-md text-body-sm font-medium bg-ink text-paper hover:bg-ink-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Updating…" : "Set new password"}
          </button>
        </form>
      )}
    </div>
  );
}

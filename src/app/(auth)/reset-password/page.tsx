"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the session in the URL hash after the reset link is clicked.
    // The client auto-detects it when the page loads.
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
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
      router.push("/account");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-snd-bg font-body">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-snd-teal">Sneak N&apos; Drip</p>
          <h1 className="font-heading text-snd-black" style={{ fontSize: "2.5rem", letterSpacing: "0.04em" }}>
            NEW PASSWORD
          </h1>
        </div>

        {!ready ? (
          <div className="p-6 rounded-xl text-center bg-snd-card border border-snd-border">
            <p className="text-sm text-snd-muted">Verifying reset link…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-xl space-y-4 bg-snd-card border border-snd-border">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 pr-10 text-sm focus:outline-none bg-snd-bg border border-snd-border text-snd-black"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-snd-muted">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5 text-snd-black">
                Confirm Password
              </label>
              <input
                type={showPw ? "text" : "password"} required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 text-sm focus:outline-none bg-snd-bg border border-snd-border text-snd-black"
              />
            </div>

            {error && (
              <p className="text-xs font-semibold text-snd-red">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 font-black text-sm uppercase tracking-widest transition-opacity hover:opacity-90 disabled:opacity-50 bg-snd-black text-snd-bg">
              {loading ? "Updating…" : "Set New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

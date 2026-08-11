"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
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
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data.user?.user_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Access denied. This portal is for admin accounts only.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={120} height={48} className="object-contain" />
        </div>

        <div className="bg-paper border border-line rounded-md p-8">
          <h1 className="text-admin-title text-ink mb-6">Admin sign in</h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-email" className="block text-admin-eyebrow text-ink-3 mb-1.5">Email address</label>
              <input
                id="admin-email"
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@sneakndrip.com" required
                className="w-full bg-paper-2 border-0 rounded-md px-3 py-2 text-admin text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-line-strong"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-admin-eyebrow text-ink-3 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-paper-2 border-0 rounded-md px-3 py-2 pr-11 text-admin text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-line-strong"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-admin-sm text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                Forgot password?
              </a>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-ink text-paper text-admin py-2 px-4 rounded-md hover:bg-ink-2 disabled:opacity-50 transition-colors duration-admin-fast"
            >
              {loading ? "Signing in…" : "Sign in to admin"}
            </button>

            {error && (
              <p className="text-admin-micro text-state-error">{error}</p>
            )}
          </form>
        </div>

        <p className="text-center mt-6 text-admin-micro text-ink-3">
          Sneak N&apos; Drip Admin Panel
        </p>
      </div>
    </div>
  );
}

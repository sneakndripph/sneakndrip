"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BRAND, FONTS } from "@/lib/constants";
import { Eye, EyeOff, Lock } from "lucide-react";
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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0A0A0A", fontFamily: FONTS.body }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="px-4 py-2 rounded" style={{ background: BRAND.bg }}>
            <Image src="/sneakndrip-logo.gif" alt="Sneak N' Drip" width={110} height={44} className="object-contain" />
          </div>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl" style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4" style={{ color: BRAND.teal }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: BRAND.teal }}>Admin Portal</span>
          </div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2rem", letterSpacing: "0.06em", color: "#F2F0EF", lineHeight: 1, marginBottom: 24 }}>
            SIGN IN
          </h1>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm font-medium"
              style={{ background: `${BRAND.red}18`, color: "#FF6B6B", border: `1px solid ${BRAND.red}35` }}>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#777" }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@sneakndrip.com" required
                className="w-full px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{ background: "#1F1F1F", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0EF" }}
                onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "#777" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 text-sm focus:outline-none transition-colors"
                  style={{ background: "#1F1F1F", border: "1px solid rgba(255,255,255,0.08)", color: "#F2F0EF" }}
                  onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80">
                  {showPw ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 font-black text-sm uppercase tracking-widest mt-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: BRAND.teal, color: "#fff" }}
            >
              {loading ? "Signing In…" : "Sign In to Admin"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "#333" }}>
          Sneak N&apos; Drip Admin Panel
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BRAND, FONTS } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [showPw, setShowPw] = useState(false);

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

        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
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
                placeholder={f.placeholder}
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
                placeholder="Min. 8 characters"
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

          <button type="submit"
            className="w-full py-4 font-black text-sm uppercase tracking-widest mt-2 transition-opacity hover:opacity-90"
            style={{ background: BRAND.black, color: BRAND.bg }}>
            Create Account
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

import type { Metadata } from "next";
import CookieSettings from "@/components/privacy/CookieSettings";

export const metadata: Metadata = {
  title: "Cookie Settings — Sneak N' Drip",
  description: "Change which optional cookies Sneak N' Drip may use.",
};

export default function CookieSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Cookie Settings
      </h1>
      <CookieSettings />
    </div>
  );
}

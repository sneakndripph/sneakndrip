import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cookies Policy — Sneak N' Drip",
  description: "How Sneak N' Drip uses cookies and browser storage.",
};

const FALLBACK = `## Overview
This page explains the cookies and browser storage Sneak N' Drip uses to run the site. We keep this to the minimum needed to make the store work — there is no third-party advertising or analytics tracking.

## Essential Cookies
- **Supabase auth session** — keeps you signed in to your account. Required for login, checkout, and order tracking. Without it, you cannot stay signed in.

## Essential Browser Storage
- **Cart contents** (\`snd-cart\`) — stored in your browser's local storage so your cart persists across visits. Required for the cart to function.

## Functional Browser Storage
These improve your experience but aren't strictly required for the site to work:
- **Recently viewed items** — remembers products you've recently browsed.
- **Chat widget session** — keeps your support chat conversation open across page loads.
- **Announcement bar dismissal** — remembers if you've closed the site announcement banner.
- **Account page preferences** — remembers which order tabs and reviews you've already seen, so we don't repeat notifications.
- **Session identifier** — a temporary, first-party session ID used only for basic visit tracking during your session. It clears when you close your browser.

## No Third-Party Tracking
We do not use third-party advertising, analytics, or tracking cookies (e.g. Google Analytics, Meta Pixel). All cookies and storage listed above are first-party and used solely to operate the site.

## Managing Cookies and Storage
Most browsers let you clear cookies and local storage in their settings. Note that clearing them will sign you out, empty your cart, and reset the preferences above.

## Changes to This Policy
We may update this policy as the site changes. Changes will be posted on this page.

Last updated: September 2026`;

export default async function CookiesPolicyPage() {
  const content = await getPageContent("cookies-policy", FALLBACK);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Cookies Policy
      </h1>
      <PageContent text={content} />
    </div>
  );
}

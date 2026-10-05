import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cookies Policy — Sneak N' Drip",
  description: "How Sneak N' Drip uses cookies and browser storage.",
};

const FALLBACK = `## Overview
This page explains the cookies and browser storage Sneak N' Drip uses. Essential storage keeps the store working. Analytics cookies are optional and are only set if you allow them in our cookie banner. We do not use advertising or retargeting cookies.

## Essential Cookies
- **Supabase auth session** — keeps you signed in to your account. Required for login, checkout, and order tracking. Without it, you cannot stay signed in.

## Essential Browser Storage
- **Cart contents** (\`snd-cart\`) — stored in your browser's local storage so your cart persists across visits. Required for the cart to function.
- **Cookie preferences** (\`cookie-consent\`) — remembers your cookie choice and when you made it, so we don't ask again on every visit.

## Functional Browser Storage
These improve your experience but aren't strictly required for the site to work:
- **Recently viewed items** — remembers products you've recently browsed.
- **Chat widget session** — keeps your support chat conversation open across page loads.
- **Announcement bar dismissal** — remembers if you've closed the site announcement banner.
- **Account page preferences** — remembers which order tabs and reviews you've already seen, so we don't repeat notifications.
- **Session identifier** (\`snd_sid\`) — a temporary, first-party ID we use to count page visits in our own system. It is not shared with anyone and clears when you close your browser.

## Analytics Cookies (Optional)
With your permission, we use **Google Analytics 4**, a service provided by Google, to understand how visitors use the store so we can improve it. Analytics does not load until you tick "Analytics cookies" in the cookie banner and save. If you don't, no analytics cookies are set and no data is sent to Google.

When enabled, Google Analytics sets these first-party cookies:
- **\`_ga\`** — a random identifier used to distinguish visitors. Expires after 2 years.
- **\`_ga_<ID>\`** — keeps track of your current session. Expires after 2 years.

We send Google the pages you visit (including search and filter terms in the page address), the products you view, items added to your cart, checkout starts, and completed purchases (order reference, items, and amount). We do not send your name, email address, phone number, or payment details to Google. Google processes this data on our behalf and may store it on servers outside the Philippines. See Google's privacy policy at policies.google.com/privacy.

## Managing Cookies and Storage
You can decline analytics in the cookie banner. To change your choice later, use the **Cookie Settings** page, linked in the site footer and, when you're signed in, in your account. Turning analytics off takes full effect after you reload the page.

Alternatively, you can clear this site's cookies and local storage in your browser settings — the banner will appear again on your next visit. Clearing storage will also sign you out, empty your cart, and reset the preferences above.

You can also opt out of Google Analytics on all websites with Google's browser add-on at tools.google.com/dlpage/gaoptout.

## Changes to This Policy
We may update this policy as the site changes. Changes will be posted on this page.

Last updated: October 2026`;

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

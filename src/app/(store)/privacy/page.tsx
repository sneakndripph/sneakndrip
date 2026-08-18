import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — Sneak N' Drip",
  description: "Privacy policy for Sneak N' Drip — how we collect and protect your data.",
};

const FALLBACK = `## Overview
Sneak N' Drip is committed to protecting your personal information in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).

## Information We Collect
When you place an order, we collect: your full name, email address, mobile number, and shipping address. We also collect payment confirmation details for order verification purposes.

## How We Use Your Information
Your information is used solely to:
- Process and fulfill your order.
- Send order status updates and delivery notifications.
- Contact you regarding your order.
- Improve our service and customer experience.

## Data Storage
Your personal data is stored securely in our encrypted systems. Payment proofs are stored in secured cloud storage and are accessible only to authorized staff.

## Data Sharing
We do not sell, trade, or share your personal information with third parties except where necessary to fulfill your order (such as sharing your address with our courier partners).

## Your Rights
Under the Data Privacy Act, you have the right to access, correct, or request deletion of your personal data. Contact us at hello@sneakndrip.ph to exercise these rights.

## Cookies
Our website may use cookies to improve your browsing experience. You can disable cookies in your browser settings at any time.

## Changes to This Policy
We may update this policy from time to time. Changes will be posted on this page.

Last updated: June 2025`;

export default async function PrivacyPage() {
  const content = await getPageContent("privacy", FALLBACK);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 lg:py-24">
      <h1 className="text-display text-ink font-display leading-tight tracking-[-0.03em] mb-8">
        Privacy Policy
      </h1>
      <PageContent text={content} />
    </div>
  );
}

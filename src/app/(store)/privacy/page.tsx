import { getPageContent } from "@/lib/page-content";
import { PageContent } from "@/components/ui/PageContent";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — Sneak N' Drip",
  description: "Privacy policy for Sneak N' Drip — how we collect and protect your data.",
};

const FALLBACK = `## Overview
Sneak N' Drip ("we", "us", or "our") is committed to protecting your personal information in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and the issuances of the National Privacy Commission. This policy explains what we collect, why, who we share it with, how long we keep it, and the rights you have.

## Who We Are
Sneak N' Drip is an online sneaker store based in Taytay, Rizal, Philippines. We are the personal information controller for the data described in this policy.

## Information We Collect
**When you place an order:** your full name, email address, mobile number, shipping address, the items you order, and payment details for verification — including your payment reference number and the screenshot of your proof of payment. We do not collect or store card numbers.

**When you create an account:** your name, email address, mobile number, and password (stored only in encrypted form by our authentication provider). If you sign in with Google, we receive your name, email address, and profile photo from Google. We also keep your saved shipping addresses, order history, and wishlist.

**When you use other features:**
- **Reviews and return requests** — the text and photos you submit.
- **Support chat** — the messages you send us.
- **Restock alerts** — your email address and the product you want to be notified about.
- **Newsletter** — your email address, if you subscribe.
- **Saved cart** — if you're signed in, we save your cart so you can pick up where you left off, and may email you a reminder if you leave items behind.

**Automatically:** the pages you visit, recorded with a temporary session ID that is not linked to your name. If you allow analytics cookies, Google Analytics also collects usage data — see our Cookies Policy for details.

## How We Use Your Information
- Process, fulfill, and deliver your order, including pre-order deposits and balance payments.
- Verify payments and prevent fraud and abuse of the store.
- Send order updates, delivery notifications, and responses to your requests.
- Manage your account, reviews, return requests, and support conversations.
- Remind you about items left in your cart (signed-in customers only).
- Send newsletters and new arrival announcements — only if you opted in.
- Understand how the store is used so we can improve it — only if you allowed analytics cookies.
- Comply with legal, tax, and accounting obligations.

## Legal Basis for Processing
- **Contract** — to process your order and manage your account, we need your order and contact details.
- **Consent** — for marketing emails and analytics cookies. You can withdraw consent at any time.
- **Legitimate interest** — for fraud prevention, store security, cart reminders, and improving our service, balanced against your rights.
- **Legal obligation** — to keep sales and payment records as required by Philippine tax law.

## Data Sharing
We do not sell or rent your personal information. We share it only with service providers that help us run the store, under their own data protection terms:
- **Supabase** — database, account sign-in, and file storage (payment proofs, review and return photos). Servers in ap-southeast-1 (Singapore).
- **Resend** — sending order, account, and newsletter emails. Servers in the United States.
- **Google** — sign-in with Google (if you use it), and Google Analytics (only if you allow analytics cookies). Servers in the United States and other countries.
- **Couriers** — J&T Express, LBC, or Ninja Van receive your name, mobile number, and shipping address to deliver your order.

We may also disclose information when required by law, court order, or a government authority.

## International Transfers
Some of our providers store and process data outside the Philippines. When this happens, we rely on providers that apply security safeguards comparable to those required under RA 10173, and we remain responsible for your data.

## Data Security
Data is encrypted in transit and stored with access controls. Payment proofs are kept in private storage that only authorized staff can view. No system is completely secure, but we take reasonable organizational, physical, and technical measures to protect your information.

## Data Retention
- **Order and payment records** (including payment proofs) — up to 10 years, as required by Philippine tax laws.
- **Account data** — while your account is active, and up to 2 years after your last activity or your request to close it, unless we must keep order records longer.
- **Newsletter subscription** — until you unsubscribe, plus up to 30 days to process it.
- **Saved carts** — until you check out or ask us to delete it.
- **Support chat, reviews, and return requests** — while your account is active, or as long as needed to resolve the matter.
- **Analytics data** — kept by Google Analytics for 2 months.

When data is no longer needed, we delete or anonymize it.

## Your Rights
Under the Data Privacy Act, you have the right to:
- **Be informed** — know whether and how your personal data is processed.
- **Access** — get a copy of the personal data we hold about you.
- **Correct** — have inaccurate or incomplete data fixed.
- **Erasure or blocking** — ask us to delete or stop processing your data, subject to legal record-keeping requirements.
- **Object** — refuse processing based on consent or legitimate interest, including marketing.
- **Data portability** — receive your data in a commonly used electronic format.
- **Damages** — be compensated for damages caused by inaccurate, unlawfully obtained, or unauthorized use of your data.
- **Lodge a complaint** — with the National Privacy Commission.

To exercise any of these rights, email our Data Protection Officer at hello@sneakndrip.ph with your name, the email used on your orders or account, and what you're requesting. We may ask you to verify your identity. We aim to respond within 15 business days.

You can unsubscribe from the newsletter at any time using the link in any newsletter email.

## Data Protection Officer
Data Protection Officer, Sneak N' Drip
Taytay, Rizal, Philippines
Email: hello@sneakndrip.ph
Mobile: 0961 177 4119

## National Privacy Commission
If you believe we have not handled your personal data properly, you may file a complaint with the National Privacy Commission at www.privacy.gov.ph or complaints@privacy.gov.ph. We encourage you to contact us first so we can try to resolve it.

## Data Breach Notification
If a personal data breach occurs that is likely to put you at real risk of serious harm, we will notify you and the National Privacy Commission within 72 hours of becoming aware of it, as required by NPC rules, and tell you what happened and what we're doing about it.

## Minors
Our store is not directed at children under 18. We do not knowingly collect personal data from minors without a parent's or guardian's involvement. If we learn that we have, we will delete it.

## Cookies
We use essential browser storage to run the store and, only with your permission, Google Analytics cookies. See our Cookies Policy for the full list and how to manage them.

## Changes to This Policy
We may update this policy from time to time. Changes will be posted on this page with an updated date. If we make significant changes, we will notify customers by email or a notice on the site.

Last updated: October 2026`;

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

-- Editable content for store-facing info pages (shipping, returns, etc.)
CREATE TABLE IF NOT EXISTS site_pages (
  slug        text        PRIMARY KEY,
  title       text        NOT NULL,
  content     text        NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_pages" ON site_pages FOR SELECT USING (true);

INSERT INTO site_pages (slug, title, content) VALUES

('shipping', 'Shipping Information',
'## Delivery Timelines
Metro Manila: 1-3 business days after payment confirmation.
Provincial: 3-7 business days depending on location.
Pre-orders: ETA communicated at the time of order. We send updates throughout.
COD orders: dispatched after our team confirms details with you via Messenger or phone.

## Shipping Fees (Online Payment: GCash / Maya / Bank Transfer)
1-2 items — Metro Manila: 220, Provincial: 250
3 or more items — Metro Manila: 450, Provincial: 550
Free shipping on orders 5,000 and above (excludes COD).

## Shipping Fees (Cash on Delivery)
COD has no free shipping option.
1-2 items — Luzon: 250, Visayas and Mindanao: 350
3 or more items — Luzon: 450, Visayas and Mindanao: 550

## Couriers
We ship via J&T Express, LBC, and Ninja Van depending on your location. A tracking number is sent once your order is dispatched.

## Important Notes
Orders placed on weekends or public holidays are processed on the next business day. We reserve the right to cancel orders with unverifiable payment.'),

('returns', 'Returns Policy',
'## Our Policy
We stand behind every pair we sell. All sneakers are 100% authentic and inspected before shipping. We do not accept returns or exchanges for change of mind.

## Eligible Exchanges
We accept exchange requests within 7 days of receiving your order if:
- You received the wrong item (wrong model, colorway, or size).
- The item has a verified manufacturing defect.
- The size sent differs from what was ordered.

## Conditions for Exchange
Items must be unworn, with no signs of use, and in original packaging with all accessories and tags intact. Worn or used items cannot be exchanged.

## How to Request an Exchange
Message us on Facebook or Instagram within 7 days of receipt. Include your order number, photos of the issue, and your preferred resolution. We will review and respond within 48 hours.

## Return Shipping
If the exchange is due to our error, we cover the return shipping cost. If the request does not meet our criteria, the shipping cost is borne by the buyer.'),

('authenticity', 'Authenticity Guarantee',
'## Our Promise
Every pair sold by Sneak N Drip is 100% authentic. No replicas. No fakes. No exceptions. We stake our reputation on this guarantee.

## How We Source
We source directly from authorized retailers, brand distributors, and verified resellers with proven track records. Every supplier is vetted before we engage them.

## Legit Check Process
Before any pair is listed or shipped, it goes through our internal legit check process: box inspection, stitching, tongue label, insole markings, and sole pattern verification. We cross-reference with known legit check databases and community resources.

## What If a Pair Is Not Authentic?
In the extremely unlikely event that an item is proven non-authentic, we will issue a full refund including all shipping costs. No questions asked. This has never happened, and we intend to keep it that way.

## Pricing
Most of our pairs are priced below SRP. Authentic does not mean overpriced — we believe everyone deserves access to real sneakers at fair prices.'),

('contact', 'Contact Us',
'## Get in Touch
We are a team of sneaker enthusiasts based in the Philippines. We love hearing from our customers — whether you have a question about a pair, want to check availability, or just want to connect.

## Messenger (Fastest Response)
Message us directly on Facebook Messenger at m.me/SneakNDrip. We typically respond within 1-2 hours during business hours.

## Social Media
Facebook: facebook.com/SneakNDrip
Instagram: @sneakndripph
TikTok: @sneakyjuls

## Phone and Email
Mobile: 0961 177 4119
Email: hello@sneakndrip.ph

## Business Hours
Monday to Saturday, 9AM to 9PM.
Sunday: 10AM to 6PM.
We are closed on major public holidays.

## For Order Inquiries
Have your order number ready when messaging us. This helps us assist you faster.'),

('privacy', 'Privacy Policy',
'## Overview
Sneak N Drip ("we", "us", or "our") is committed to protecting your personal information in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).

## Information We Collect
When you place an order, we collect your name, email address, mobile number, and shipping address. We also collect payment confirmation details (screenshot or proof of payment) for order verification purposes.

## How We Use Your Information
Your information is used solely to process and fulfill your order, send you order status updates and delivery notifications, contact you regarding your order, and improve our service.

## Data Storage
Your personal data is stored securely in our order management system. Payment proofs are stored in encrypted cloud storage and are only accessible to authorized staff.

## Data Sharing
We do not sell, trade, or share your personal information with third parties except where necessary to fulfill your order (such as sharing your address with our courier partners).

## Your Rights
Under the Data Privacy Act, you have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at hello@sneakndrip.ph.

## Cookies
Our website may use cookies to improve your browsing experience. You can disable cookies in your browser settings at any time.

## Changes to This Policy
We may update this policy from time to time. Changes will be posted on this page with an updated date.

Last updated: June 2025'),

('terms', 'Terms of Service',
'## Acceptance of Terms
By placing an order on Sneak N Drip, you agree to these terms and conditions. Please read them carefully before purchasing.

## Orders and Payment
Orders are confirmed only upon receipt and verification of payment. For GCash, Maya, or bank transfer payments, your order is confirmed when we verify your proof of payment. For COD orders, confirmation is via a follow-up call or message before dispatch.

## Pricing
All prices are in Philippine Pesos (PHP) and are inclusive of applicable taxes. Prices are subject to change without notice, but confirmed orders will honor the price at the time of purchase.

## Delivery
We make every effort to deliver within the stated timelines, but delays due to courier issues, weather, or force majeure are beyond our control. We will notify you of any significant delays.

## Cancellations
Orders may be cancelled before dispatch. Once dispatched, cancellations are not accepted. To request a cancellation, message us immediately via Messenger.

## Product Condition
All products are brand new, authentic, and in original packaging unless explicitly stated otherwise. Any listing described as "preloved" or "used" will be clearly marked.

## Limitation of Liability
Our liability is limited to the value of the product purchased. We are not liable for indirect damages, loss of use, or consequential losses arising from the purchase.

## Disputes
In the event of a dispute, we encourage you to contact us first. We will make every effort to resolve issues fairly and promptly.

## Governing Law
These terms are governed by the laws of the Republic of the Philippines. Any unresolved disputes will be subject to the jurisdiction of Philippine courts.

Last updated: June 2025')

ON CONFLICT (slug) DO NOTHING;

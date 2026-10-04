-- customers: per-category marketing email preferences. All default to true so
-- existing customers keep receiving what they receive today; customers can
-- opt out per category from /account. Transactional email (orders, returns)
-- is not governed by these flags. Idempotent: safe to re-run.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS cart_reminders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS new_arrivals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS restock_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS newsletter_enabled BOOLEAN NOT NULL DEFAULT TRUE;

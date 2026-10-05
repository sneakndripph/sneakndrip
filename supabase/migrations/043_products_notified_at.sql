-- products.notified_at: when the new-arrival broadcast went out for a product.
-- NULL means subscribers were never notified. The admin API claims a product
-- by setting this atomically before sending, so a product is broadcast at most
-- once. Idempotent: safe to re-run.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ NULL;

-- Backfill: treat every product already published as announced, so editing an
-- existing product does not default the notify toggle on and re-broadcast it.
-- Note: re-running this later also marks any published-but-never-notified
-- products as notified.
UPDATE public.products
  SET notified_at = COALESCE(created_at, now())
  WHERE is_published AND notified_at IS NULL;

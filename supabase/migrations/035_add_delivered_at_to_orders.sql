-- Tracks when an order transitioned to status = 'delivered', so the storefront
-- can enforce a 7-day return-request window. Nullable and not backfilled:
-- orders delivered before this column existed have no way to know their true
-- delivery date, so they are treated as always-eligible (see app-layer checks).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

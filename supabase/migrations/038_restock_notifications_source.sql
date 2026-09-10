-- restock_notifications: add `source` to distinguish one-shot explicit
-- opt-ins ("notify me about this restock") from standing wishlist
-- subscriptions ("notify me every time this comes back while wishlisted").
ALTER TABLE restock_notifications
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'explicit';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restock_notifications_source_check'
  ) THEN
    ALTER TABLE restock_notifications
      ADD CONSTRAINT restock_notifications_source_check CHECK (source IN ('explicit', 'wishlist'));
  END IF;
END $$;

-- Widen the unique constraint so the same email can hold both an explicit
-- opt-in and a wishlist-derived row for the same product+size.
ALTER TABLE restock_notifications
  DROP CONSTRAINT IF EXISTS restock_notifications_product_id_size_email_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restock_notifications_product_size_email_source_key'
  ) THEN
    ALTER TABLE restock_notifications
      ADD CONSTRAINT restock_notifications_product_size_email_source_key
      UNIQUE (product_id, size, email, source);
  END IF;
END $$;

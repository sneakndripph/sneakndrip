-- newsletter_subscribers: add unsubscribe support (token + timestamp).
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_unsubscribe_token_key'
  ) THEN
    ALTER TABLE newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_unsubscribe_token_key UNIQUE (unsubscribe_token);
  END IF;
END $$;

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

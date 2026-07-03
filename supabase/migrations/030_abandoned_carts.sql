CREATE TABLE IF NOT EXISTS abandoned_carts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  cart_items    JSONB       NOT NULL DEFAULT '[]',
  subtotal      NUMERIC     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  email_1h_sent_at  TIMESTAMPTZ,
  email_24h_sent_at TIMESTAMPTZ,
  recovered_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS abandoned_carts_updated_at_idx ON abandoned_carts (updated_at);

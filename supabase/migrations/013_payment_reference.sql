-- Add payment reference number to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone inserts subscriber" ON newsletter_subscribers;
CREATE POLICY "Anyone inserts subscriber" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service reads subscribers" ON newsletter_subscribers;
CREATE POLICY "Service reads subscribers" ON newsletter_subscribers FOR SELECT USING (true);

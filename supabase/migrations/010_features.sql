-- wishlists: per-user saved products
CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlists;
CREATE POLICY "Users manage own wishlist" ON wishlists
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- coupons: promotional discount codes
CREATE TABLE IF NOT EXISTS coupons (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value       NUMERIC NOT NULL,
  min_order   NUMERIC DEFAULT 0,
  max_uses    INT,
  uses        INT DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads coupons" ON coupons;
CREATE POLICY "Anyone reads coupons" ON coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service writes coupons" ON coupons;
CREATE POLICY "Service writes coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);

-- inventory_log: immutable record of every stock change
CREATE TABLE IF NOT EXISTS inventory_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  size          TEXT NOT NULL,
  old_stock     INT NOT NULL,
  new_stock     INT NOT NULL,
  reason        TEXT,
  changed_by    TEXT DEFAULT 'system',
  order_number  TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads inventory_log" ON inventory_log;
CREATE POLICY "Anyone reads inventory_log" ON inventory_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service inserts inventory_log" ON inventory_log;
CREATE POLICY "Service inserts inventory_log" ON inventory_log FOR INSERT WITH CHECK (true);

-- restock_notifications: "notify me when this size is back in stock"
CREATE TABLE IF NOT EXISTS restock_notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size        TEXT NOT NULL,
  email       TEXT NOT NULL,
  notified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, size, email)
);
ALTER TABLE restock_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone inserts restock_notify" ON restock_notifications;
CREATE POLICY "Anyone inserts restock_notify" ON restock_notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone reads restock_notify" ON restock_notifications;
CREATE POLICY "Anyone reads restock_notify" ON restock_notifications FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS return_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text NOT NULL,
  order_number text NOT NULL,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own returns" ON return_requests
  FOR SELECT USING (customer_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Customers can create returns" ON return_requests
  FOR INSERT WITH CHECK (customer_email = (auth.jwt() ->> 'email'));

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sale_price   numeric,
  ADD COLUMN IF NOT EXISTS sale_start   timestamptz,
  ADD COLUMN IF NOT EXISTS sale_end     timestamptz;

-- Add cost_price column to products for profit tracking
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) DEFAULT NULL;

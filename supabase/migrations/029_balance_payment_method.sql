-- Add balance_payment_method to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS balance_payment_method TEXT;

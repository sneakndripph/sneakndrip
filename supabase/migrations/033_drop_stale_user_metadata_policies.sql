-- Drop leftover per-operation policies that still used user_metadata.
-- These were created by an earlier migration separately from the ALL policy
-- and are now superseded by "Admins can manage X" (ALL, app_metadata) from 032.
DROP POLICY IF EXISTS "Admins can delete products"      ON public.products;
DROP POLICY IF EXISTS "Admins can insert products"      ON public.products;
DROP POLICY IF EXISTS "Admins can update products"      ON public.products;

DROP POLICY IF EXISTS "Admins can delete product_sizes" ON public.product_sizes;
DROP POLICY IF EXISTS "Admins can insert product_sizes" ON public.product_sizes;
DROP POLICY IF EXISTS "Admins can update product_sizes" ON public.product_sizes;

-- Fix search_path on decrement_stock_for_order (Function Search Path Mutable warning)
CREATE OR REPLACE FUNCTION public.decrement_stock_for_order(p_items jsonb)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  item      jsonb;
  v_pid     uuid;
  v_size    text;
  v_qty     int;
  v_stock   int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pid  := (item->>'product_id')::uuid;
    v_size := item->>'size';
    v_qty  := (item->>'quantity')::int;

    SELECT stock INTO v_stock
    FROM product_sizes
    WHERE product_id = v_pid AND size = v_size
    FOR UPDATE;

    IF v_stock IS NULL OR v_stock < v_qty THEN
      RETURN 'INSUFFICIENT_STOCK:' || v_size;
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_pid  := (item->>'product_id')::uuid;
    v_size := item->>'size';
    v_qty  := (item->>'quantity')::int;

    UPDATE product_sizes
    SET stock = stock - v_qty
    WHERE product_id = v_pid AND size = v_size;
  END LOOP;

  RETURN 'ok';
END;
$$;

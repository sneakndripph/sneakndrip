-- Atomically deduct stock for all items in an order.
-- Locks rows with FOR UPDATE so concurrent orders can't race.
-- Returns 'ok' if all stock was available, or 'INSUFFICIENT_STOCK:<size>' if not.
CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_items jsonb)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  item      jsonb;
  v_pid     uuid;
  v_size    text;
  v_qty     int;
  v_stock   int;
BEGIN
  -- First pass: lock rows and check availability
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

  -- Second pass: deduct
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

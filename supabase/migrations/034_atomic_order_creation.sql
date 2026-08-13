-- Fix F1: atomic order creation with stock check. Run in Supabase SQL Editor.
--
-- Creates an order + order_items and deducts stock in a single transaction.
-- Row-locks product_sizes (FOR UPDATE) before checking availability, so
-- concurrent checkouts on the last unit can't oversell -- the same guarantee
-- decrement_stock_for_order had, except now the order/items insert lives in
-- the same transaction, so a failure anywhere rolls back the stock deduction
-- automatically. No manual refund/compensation step required.
CREATE OR REPLACE FUNCTION public.create_order_with_stock_check(
  p_order jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item       jsonb;
  v_pid      uuid;
  v_size     text;
  v_qty      int;
  v_stock    int;
  v_email    text;
  v_order_id uuid;
  v_failures jsonb := '[]'::jsonb;
BEGIN
  -- ── Input validation (before any locks are taken) ──────────────────
  v_email := trim(p_order->>'customer_email');
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING DETAIL = 'customer_email is required', HINT = 'invalid_input';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT' USING DETAIL = 'items array is empty', HINT = 'invalid_input';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    -- product_sizes has no single "id" the client sends; the identifying
    -- key in this schema is (product_id, size), so both are validated.
    IF item->>'product_id' IS NULL
       OR item->>'product_id' !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN
      RAISE EXCEPTION 'INVALID_INPUT'
        USING DETAIL = format('item has invalid or missing product_id: %s', item->>'product_id'),
              HINT = 'invalid_input';
    END IF;

    IF item->>'size' IS NULL OR trim(item->>'size') = '' THEN
      RAISE EXCEPTION 'INVALID_INPUT'
        USING DETAIL = format('item %s has missing size', item->>'product_id'),
              HINT = 'invalid_input';
    END IF;

    IF item->>'quantity' IS NULL OR item->>'quantity' !~ '^[0-9]+$' OR (item->>'quantity')::int <= 0 THEN
      RAISE EXCEPTION 'INVALID_INPUT'
        USING DETAIL = format('item %s/%s has invalid quantity: %s', item->>'product_id', item->>'size', item->>'quantity'),
              HINT = 'invalid_input';
    END IF;
  END LOOP;

  -- ── Pass 1: lock every product_sizes row in a stable order (product_id,
  -- size) so two orders sharing products never deadlock against each other ──
  FOR item IN
    SELECT value FROM jsonb_array_elements(p_items)
    ORDER BY value->>'product_id', value->>'size'
  LOOP
    v_pid  := (item->>'product_id')::uuid;
    v_size := item->>'size';
    v_qty  := (item->>'quantity')::int;

    SELECT stock INTO v_stock
    FROM product_sizes
    WHERE product_id = v_pid AND size = v_size
    FOR UPDATE;

    IF v_stock IS NULL OR v_stock < v_qty THEN
      v_failures := v_failures || jsonb_build_object(
        'product_id',   v_pid,
        'product_name', item->>'product_name',
        'size',         v_size,
        'requested',    v_qty,
        'available',    COALESCE(v_stock, 0)
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_failures) > 0 THEN
    -- Aborts here with nothing written -- no rows locked-then-abandoned,
    -- no compensating refund required.
    RAISE EXCEPTION 'INSUFFICIENT_STOCK' USING DETAIL = v_failures::text, HINT = 'insufficient_stock';
  END IF;

  -- ── Pass 2: every item cleared, deduct for real ─────────────────────
  FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    UPDATE product_sizes
    SET stock = stock - (item->>'quantity')::int, updated_at = now()
    WHERE product_id = (item->>'product_id')::uuid AND size = item->>'size';
  END LOOP;

  INSERT INTO orders (
    order_number, customer_id, customer_name, customer_email, customer_mobile,
    shipping_street, shipping_barangay, shipping_city, shipping_province, shipping_postal,
    subtotal, shipping_fee, discount, coupon_code, total,
    payment_method, payment_type, payment_status, proof_of_payment, payment_reference,
    status
  )
  VALUES (
    p_order->>'order_number',
    NULLIF(p_order->>'customer_id', '')::uuid,
    p_order->>'customer_name', v_email, p_order->>'customer_mobile',
    p_order->>'shipping_street', p_order->>'shipping_barangay', p_order->>'shipping_city',
    p_order->>'shipping_province', p_order->>'shipping_postal',
    (p_order->>'subtotal')::numeric,
    COALESCE((p_order->>'shipping_fee')::numeric, 0),
    COALESCE((p_order->>'discount')::numeric, 0),
    p_order->>'coupon_code',
    (p_order->>'total')::numeric,
    p_order->>'payment_method', p_order->>'payment_type',
    COALESCE(p_order->>'payment_status', 'pending'),
    p_order->>'proof_of_payment', p_order->>'payment_reference',
    COALESCE(p_order->>'status', 'pending')
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, brand, size, quantity, unit_price, payment_type)
  SELECT
    v_order_id,
    (value->>'product_id')::uuid,
    value->>'product_name',
    value->>'brand',
    value->>'size',
    (value->>'quantity')::int,
    (value->>'unit_price')::numeric,
    value->>'payment_type'
  FROM jsonb_array_elements(p_items);

  RETURN jsonb_build_object('success', true, 'id', v_order_id, 'order_number', p_order->>'order_number');
END;
$$;

-- Permissions hardening: the checkout API (src/app/api/orders/create/route.ts)
-- requires an authenticated user (returns 401 if no session) before it will
-- ever call this RPC -- guest checkout is not currently allowed at the API
-- layer, even though the orders table denormalizes customer fields for it.
-- So only `authenticated` needs EXECUTE; `anon` is deliberately excluded.
--
-- The API actually calls this RPC via the service-role admin client
-- (SUPABASE_SERVICE_ROLE_KEY), which authenticates to Postgres as
-- `service_role`, not `authenticated` -- so that role is granted explicitly
-- too rather than relying on Supabase's default-privilege bootstrap.
REVOKE ALL ON FUNCTION public.create_order_with_stock_check(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock_check(jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock_check(jsonb, jsonb) TO service_role;

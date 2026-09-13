-- Bug 1B: shipping_addresses RLS policy is missing an explicit WITH CHECK
-- clause, so customers cannot reliably INSERT their own addresses.
--
-- Fix-forward note: this migration originally used `ALTER POLICY`, but the
-- policy it targeted ("Customers can manage own addresses") did not exist
-- on the live DB, so the ALTER failed there. What was actually applied to
-- production was a DROP + CREATE of four granular policies on
-- shipping_addresses, plus a CREATE POLICY on customers (also missing live)
-- since the shipping_addresses INSERT check runs an EXISTS subquery against
-- customers, which is itself subject to customers' RLS. This file has been
-- rewritten to match what is actually live, using idempotent
-- DROP IF EXISTS / CREATE POLICY so it can be re-run safely on any DB
-- state (fresh install or already-patched production).

-- ─────────────────────────────────────────────────────────────
-- shipping_addresses: own rows only, split into granular policies
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can manage own addresses" ON public.shipping_addresses;

DROP POLICY IF EXISTS "Customers can view own addresses" ON public.shipping_addresses;
CREATE POLICY "Customers can view own addresses"
  ON public.shipping_addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = shipping_addresses.customer_id
      AND c.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can create own addresses" ON public.shipping_addresses;
CREATE POLICY "Customers can create own addresses"
  ON public.shipping_addresses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = shipping_addresses.customer_id
      AND c.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can update own addresses" ON public.shipping_addresses;
CREATE POLICY "Customers can update own addresses"
  ON public.shipping_addresses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = shipping_addresses.customer_id
      AND c.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = shipping_addresses.customer_id
      AND c.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can delete own addresses" ON public.shipping_addresses;
CREATE POLICY "Customers can delete own addresses"
  ON public.shipping_addresses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = shipping_addresses.customer_id
      AND c.auth_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- customers: own row only (re-created here since it was missing live;
-- the shipping_addresses policies above depend on it being readable)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view and edit own profile" ON public.customers;
CREATE POLICY "Customers can view and edit own profile"
  ON public.customers FOR ALL
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

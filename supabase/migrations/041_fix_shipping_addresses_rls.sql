-- Bug 1B: shipping_addresses RLS policy is missing an explicit WITH CHECK
-- clause, so customers cannot reliably INSERT their own addresses.
alter policy "Customers can manage own addresses"
  on public.shipping_addresses
  with check (
    exists (
      select 1 from public.customers c
      where c.id = shipping_addresses.customer_id
      and c.auth_user_id = auth.uid()
    )
  );

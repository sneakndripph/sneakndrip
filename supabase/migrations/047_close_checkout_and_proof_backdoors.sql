-- Security audit (Nov 2026): close direct-database paths that bypass the website's checks.
-- The app creates orders and reads/writes payment proofs only through server routes that
-- use the service role, so none of these policies or grants are needed by the site itself.

-- 1. Payment proofs: no direct Storage API reads or uploads by customers or visitors.
--    (Admin read policy "Admins can view payment proofs" from 001 is left in place.)
drop policy if exists "Authenticated users can read payment proofs"   on storage.objects; -- any signed-in user could read every proof
drop policy if exists "Authenticated users can upload payment proofs" on storage.objects; -- any signed-in user could upload any key
drop policy if exists "Users can upload payment proofs"               on storage.objects; -- 001: anyone (even signed-out) could upload

-- 2. Orders: no direct inserts that skip pricing, ownership and stock checks.
drop policy if exists "Anyone can create orders"      on public.orders;
drop policy if exists "Anyone can create order items" on public.order_items;

-- 3. Order RPC: only the server (service role) may call it, so it can't be called
--    straight from the browser with made-up prices or a "paid" status.
revoke execute on function public.create_order_with_stock_check(jsonb, jsonb) from public, anon, authenticated;
grant  execute on function public.create_order_with_stock_check(jsonb, jsonb) to service_role;

notify pgrst, 'reload schema';

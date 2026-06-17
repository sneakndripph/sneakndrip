-- Add "stock_on_hand" to the allowed order status values (pre-order items arrived in PH)
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','processing','stock_on_hand','shipped','delivered','cancelled'));

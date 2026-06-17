-- Add "arrived_ph" to the allowed order status values
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','processing','arrived_ph','shipped','delivered','cancelled'));

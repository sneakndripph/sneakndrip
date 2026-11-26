-- Deal coupons: "Buy X Take Y" (cheapest items in each group free, customer pays the highest)
-- and "bundle" (each group of X+Y items costs a fixed price, e.g. B1T1 for 5,000 mix and match).
-- product_ids limits which products count toward the deal; null = every product.

alter table public.coupons drop constraint if exists coupons_type_check;
alter table public.coupons add constraint coupons_type_check
  check (type in ('percent', 'fixed', 'bogo', 'bundle'));

alter table public.coupons
  add column if not exists buy_qty     int    not null default 1 check (buy_qty >= 1),
  add column if not exists get_qty     int    not null default 1 check (get_qty >= 1),
  add column if not exists product_ids uuid[];

notify pgrst, 'reload schema';

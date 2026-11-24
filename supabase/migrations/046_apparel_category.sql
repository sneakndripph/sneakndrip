-- Adds apparel to the allowed product categories (045 introduced the column).
alter table public.products drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_check check (category in ('sneakers', 'apparel', 'bags', 'accessories'));

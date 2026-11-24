-- Expansion beyond sneakers: every product belongs to one category.
-- Existing products are all shoes, so they default to 'sneakers'.
alter table public.products
  add column if not exists category text not null default 'sneakers';

alter table public.products drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_check check (category in ('sneakers', 'bags', 'accessories'));

create index if not exists products_category_idx on public.products (category);

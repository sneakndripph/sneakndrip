-- ============================================================
-- Sneak N' Drip — Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- CUSTOMERS
-- ──────────────────────────────────────────
create table public.customers (
  id           uuid primary key default uuid_generate_v4(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name    text not null,
  email        text not null unique,
  mobile       text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ──────────────────────────────────────────
-- SHIPPING ADDRESSES
-- ──────────────────────────────────────────
create table public.shipping_addresses (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label       text default 'Home',
  full_name   text not null,
  mobile      text not null,
  street      text not null,
  barangay    text not null,
  city        text not null,
  province    text not null,
  postal_code text not null,
  is_default  boolean default false,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────
-- PRODUCTS
-- ──────────────────────────────────────────
create table public.products (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text not null unique,
  brand               text not null,
  colorway            text,
  sku                 text unique,
  description         text,
  gender              text default 'Unisex' check (gender in ('Unisex','Men','Women','Kids')),
  status              text not null default 'on-hand' check (status in ('on-hand','pre-order','sold-out')),
  eta_start           date,
  eta_end             date,
  srp_price           numeric(10,2) not null,
  downpayment_price   numeric(10,2),
  full_payment_price  numeric(10,2) not null,
  bg                  text,
  is_featured         boolean default false,
  is_trending         boolean default false,
  is_new              boolean default true,
  is_published        boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ──────────────────────────────────────────
-- PRODUCT IMAGES
-- ──────────────────────────────────────────
create table public.product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null,
  alt         text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────
-- PRODUCT SIZES (per-size inventory)
-- ──────────────────────────────────────────
create table public.product_sizes (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      int not null default 0 check (stock >= 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (product_id, size)
);

-- ──────────────────────────────────────────
-- ORDERS
-- ──────────────────────────────────────────
create table public.orders (
  id               uuid primary key default uuid_generate_v4(),
  order_number     text not null unique,
  customer_id      uuid references public.customers(id) on delete set null,
  -- Guest checkout fields (duplicated from customer for denorm)
  customer_name    text not null,
  customer_email   text not null,
  customer_mobile  text not null,
  -- Shipping
  shipping_street   text not null,
  shipping_barangay text not null,
  shipping_city     text not null,
  shipping_province text not null,
  shipping_postal   text not null,
  -- Financials
  subtotal         numeric(10,2) not null,
  shipping_fee     numeric(10,2) not null default 0,
  total            numeric(10,2) not null,
  -- Payment
  payment_method   text not null check (payment_method in ('gcash','maya','bank_transfer','cod')),
  payment_type     text not null check (payment_type in ('full','downpayment')),
  payment_status   text not null default 'pending' check (payment_status in ('pending','paid','refunded')),
  proof_of_payment text,  -- Supabase Storage URL
  -- Order status
  status           text not null default 'pending' check (status in ('pending','paid','processing','shipped','delivered','cancelled')),
  tracking_number  text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ──────────────────────────────────────────
-- ORDER ITEMS
-- ──────────────────────────────────────────
create table public.order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references public.orders(id) on delete cascade,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null,
  brand        text not null,
  size         text not null,
  quantity     int not null default 1 check (quantity > 0),
  unit_price   numeric(10,2) not null,
  payment_type text not null check (payment_type in ('full','downpayment')),
  created_at   timestamptz default now()
);

-- ──────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references public.products(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  author_name text not null,
  rating      int not null check (rating between 1 and 5),
  title       text,
  body        text not null,
  is_verified boolean default false,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────
create index on public.products (brand);
create index on public.products (status);
create index on public.products (is_featured) where is_featured = true;
create index on public.products (is_trending) where is_trending = true;
create index on public.products (is_new) where is_new = true;
create index on public.product_sizes (product_id);
create index on public.orders (customer_id);
create index on public.orders (status);
create index on public.orders (created_at desc);
create index on public.order_items (order_id);
create index on public.reviews (product_id);

-- ──────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ──────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at before update on public.products
  for each row execute function public.handle_updated_at();

create trigger product_sizes_updated_at before update on public.product_sizes
  for each row execute function public.handle_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger customers_updated_at before update on public.customers
  for each row execute function public.handle_updated_at();

-- ──────────────────────────────────────────
-- AUTO-CREATE CUSTOMER ON SIGN UP
-- ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.customers (auth_user_id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (email) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.customers enable row level security;
alter table public.shipping_addresses enable row level security;
alter table public.reviews enable row level security;

-- Products: public read, admin write
create policy "Products are publicly readable"
  on public.products for select using (is_published = true);

create policy "Admins can manage products"
  on public.products for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- Product images & sizes: public read
create policy "Product images are publicly readable"
  on public.product_images for select using (true);

create policy "Product sizes are publicly readable"
  on public.product_sizes for select using (true);

-- Orders: customers can see their own, admins see all
create policy "Customers can view own orders"
  on public.orders for select
  using (customer_email = auth.jwt() ->> 'email');

create policy "Anyone can create orders"
  on public.orders for insert with check (true);

create policy "Admins can manage all orders"
  on public.orders for all
  using (auth.jwt() ->> 'role' = 'admin');

-- Order items: follow order access
create policy "Order items follow order access"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
      and (o.customer_email = auth.jwt() ->> 'email' or auth.jwt() ->> 'role' = 'admin')
    )
  );

create policy "Anyone can create order items"
  on public.order_items for insert with check (true);

-- Customers: own profile only
create policy "Customers can view and edit own profile"
  on public.customers for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- Shipping addresses: own only
create policy "Customers can manage own addresses"
  on public.shipping_addresses for all
  using (
    exists (
      select 1 from public.customers c
      where c.id = shipping_addresses.customer_id
      and c.auth_user_id = auth.uid()
    )
  );

-- Reviews: public read, authenticated write
create policy "Reviews are publicly readable"
  on public.reviews for select using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert
  with check (auth.uid() is not null);

-- ──────────────────────────────────────────
-- STORAGE BUCKETS
-- ──────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('product-images', 'product-images', true),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Public read for product images
create policy "Product images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.jwt() ->> 'role' = 'admin');

-- Payment proofs: user uploads, admin reads
create policy "Users can upload payment proofs"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs');

create policy "Admins can view payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs' and auth.jwt() ->> 'role' = 'admin');

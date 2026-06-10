-- ============================================================
-- Sneak N' Drip — Seed Data
-- ============================================================

-- Products
insert into public.products (name, slug, brand, colorway, sku, description, gender, status, srp_price, downpayment_price, full_payment_price, is_featured, is_trending, is_new, bg) values
(
  'Nike Air Force 1 ''07 White',
  'nike-air-force-1-07-white',
  'Nike', 'White / White', 'NK-AF1-WHT-07',
  'The radiant white colorway of the Air Force 1 ''07 keeps the legacy of the legendary hoops shoe going strong.',
  'Unisex', 'on-hand', 6295, 5990, 5700, true, false, true, '#F0EDE8'
),
(
  'Jordan 4 Retro Black Cat',
  'jordan-4-retro-black-cat',
  'Jordan', 'Black / Black', 'JD-4-BKCAT',
  'The Jordan 4 Retro Black Cat returns in its iconic all-black colorway. Reimagined for 2025 with premium suede and mesh.',
  'Men', 'on-hand', 12995, 12400, 11800, true, true, true, '#1C1C1C'
),
(
  'Nike Dunk Low Panda',
  'nike-dunk-low-panda',
  'Nike', 'White / Black', 'NK-DUNK-PANDA',
  'The Dunk Low Panda keeps things clean and classic with a black and white leather upper.',
  'Unisex', 'on-hand', 9295, 8890, 8500, false, true, false, '#F5F5F0'
),
(
  'New Balance 550 White Green',
  'new-balance-550-white-green',
  'New Balance', 'White / Green', 'NB-550-WHTGRN',
  'The BB550 returns in a crisp white and green colorway, reviving the classic basketball silhouette.',
  'Unisex', 'on-hand', 7995, 7600, 7200, false, false, true, '#E8F0E5'
),
(
  'Adidas Samba OG White Black',
  'adidas-samba-og-white-black',
  'Adidas', 'Cloud White / Core Black', 'AD-SAMBA-OG-WB',
  'The Samba OG is back. Street-ready with its iconic T-toe overlay and suede panels.',
  'Unisex', 'on-hand', 7495, 7100, 6800, false, true, false, '#FFFFFF'
),
(
  'Jordan 1 Low OG Black Toe',
  'jordan-1-low-og-black-toe',
  'Jordan', 'White / Black / Varsity Red', 'JD-1-LOW-BKTOE',
  'The Air Jordan 1 Low OG Black Toe brings the iconic Chicago colorway to a sleeker low-top.',
  'Men', 'pre-order', 9995, 9500, 9000, false, false, true, '#EDEDED'
),
(
  'Nike Air Max 90 Infrared',
  'nike-air-max-90-infrared',
  'Nike', 'White / Infrared', 'NK-AM90-INFRD',
  'The Air Max 90 Infrared is one of Nike''s most iconic colorways, celebrating 30+ years of visible Air cushioning.',
  'Men', 'pre-order', 10295, 9790, 9300, false, false, true, '#FFF0EC'
),
(
  'Yeezy Slide Onyx',
  'yeezy-slide-onyx',
  'Adidas', 'Onyx', 'YZ-SLD-ONYX',
  'The Yeezy Slide Onyx keeps things minimal in an all-dark colorway. Comfortable EVA foam construction.',
  'Unisex', 'on-hand', 7990, 7600, 7200, false, false, false, '#2A2A2A'
);

-- Product sizes
do $$
declare
  p record;
  sizes text[] := array['US 7','US 7.5','US 8','US 8.5','US 9','US 9.5','US 10','US 10.5','US 11','US 12'];
  s text;
  stock_val int;
begin
  for p in select id, status from public.products loop
    foreach s in array sizes loop
      -- randomize stock; pre-order items start lower
      if p.status = 'pre-order' then
        stock_val := floor(random() * 5)::int;
      else
        stock_val := floor(random() * 8)::int + 1;
      end if;
      insert into public.product_sizes (product_id, size, stock)
      values (p.id, s, stock_val)
      on conflict (product_id, size) do nothing;
    end loop;
  end loop;
end;
$$;

-- Reviews
insert into public.reviews (product_id, author_name, rating, title, body, is_verified)
select id, 'Marco R.', 5, 'Legit and fast!', 'Got my AF1s in 3 days. 100% legit, box was perfect. Will def order again from SND!', true
from public.products where slug = 'nike-air-force-1-07-white';

insert into public.reviews (product_id, author_name, rating, title, body, is_verified)
select id, 'Issa T.', 5, 'Pre-order worth the wait', 'Arrived on the exact ETA they gave. Communication was great throughout. Very happy!', true
from public.products where slug = 'jordan-1-low-og-black-toe';

insert into public.reviews (product_id, author_name, rating, title, body, is_verified)
select id, 'Paulo C.', 5, 'Best sneaker shop in PH!', 'Smooth transaction, legit pair, great packaging. Sneakndrip is my go-to now.', true
from public.products where slug = 'jordan-4-retro-black-cat';

insert into public.reviews (product_id, author_name, rating, title, body, is_verified)
select id, 'Karla M.', 4, 'Happy with my Sambas', 'Size was accurate and sneakers are authentic. Minor delay in shipping but overall great experience.', true
from public.products where slug = 'adidas-samba-og-white-black';

insert into public.reviews (product_id, author_name, rating, title, body, is_verified)
select id, 'Dio V.', 5, 'Grail unlocked!', 'Finally got my Black Cats. SND had them at a great price. Legit check passed easily.', true
from public.products where slug = 'jordan-4-retro-black-cat';

insert into public.reviews (product_id, author_name, rating, title, body, is_verified)
select id, 'Rica S.', 5, 'Super legit store!', 'Bought the Dunk Panda. Arrived in 2 days via Ninja Van. Box was clean. Highly recommend!', true
from public.products where slug = 'nike-dunk-low-panda';

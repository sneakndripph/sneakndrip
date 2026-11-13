-- Marketing attribution: utm_* tags from the link the buyer landed on (last touch, 30 days).
-- Written by /api/orders/create after the order RPC succeeds; best-effort, never blocks checkout.
alter table public.orders add column if not exists utm jsonb;

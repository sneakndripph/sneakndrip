-- Balance payment fields for DP pre-orders (customer pays remaining balance)
alter table public.orders add column if not exists balance_reference text;
alter table public.orders add column if not exists balance_proof_url text;
alter table public.orders add column if not exists balance_paid_at timestamptz;

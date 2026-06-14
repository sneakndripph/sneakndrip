-- Page views table for visitor tracking
create table if not exists public.page_views (
  id         uuid primary key default uuid_generate_v4(),
  session_id text,
  path       text not null default '/',
  created_at timestamptz default now()
);

alter table public.page_views enable row level security;

create policy "anyone_insert_page_views"
  on public.page_views for insert
  with check (true);

create policy "anyone_read_page_views"
  on public.page_views for select
  using (true);

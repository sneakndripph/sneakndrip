-- Customer in-app notifications (e.g. "arrived in PH")
create table public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_email   text not null,
  title        text not null,
  message      text not null,
  order_number text,
  type         text default 'order',
  is_read      boolean default false,
  created_at   timestamptz default now()
);

create index notifications_user_email_idx on public.notifications (user_email, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users see own notifications"
  on public.notifications for select
  using (user_email = (auth.jwt() ->> 'email'));

create policy "Service role full access"
  on public.notifications for all
  using (auth.role() = 'service_role');

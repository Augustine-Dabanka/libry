-- Web Push subscriptions (VAPID). One row per browser/device a reader opts in
-- from; the server signs and sends notifications to these endpoints.
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- A reader manages only their own subscriptions. The server sender uses the
-- service role (bypasses RLS) to read every subscriber it needs to reach.
drop policy if exists push_subscriptions_select on public.push_subscriptions;
create policy push_subscriptions_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists push_subscriptions_write on public.push_subscriptions;
create policy push_subscriptions_write on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

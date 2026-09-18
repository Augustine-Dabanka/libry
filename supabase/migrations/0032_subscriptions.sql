-- Libry Unlimited, reworked: not "the whole library" but a customizable book
-- box. The reader chooses a cadence (weekly / monthly / yearly), the genres and
-- max age rating they want, and how many books they keep each cycle.

create table if not exists public.subscriptions (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  plan                text not null default 'monthly' check (plan in ('weekly','monthly','yearly')),
  genres              text[] not null default '{}',
  max_age             text not null default 'Everyone',
  picks_per_cycle     int not null default 4 check (picks_per_cycle between 1 and 50),
  status              text not null default 'active' check (status in ('active','canceled')),
  reference           text,
  started_at          timestamptz not null default now(),
  current_period_end  timestamptz,
  updated_at          timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
drop policy if exists subs_owner_all on public.subscriptions;
create policy subs_owner_all on public.subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

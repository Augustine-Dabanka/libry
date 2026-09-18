-- Creator promotions: a creator pays to spotlight one of their books for a set
-- number of days. Active promotions surface in the Discover "Spotlight" shelf
-- and get a ranking nudge. Calm by design — a labelled, time-boxed placement,
-- not an auction bidding war.

create table if not exists public.promotions (
  id         bigint generated always as identity primary key,
  book_id    bigint not null references public.books(id) on delete cascade,
  creator_id uuid   not null,
  kind       text   not null check (kind in ('prerelease','boost')),
  days       int    not null check (days > 0 and days <= 30),
  amount     numeric not null default 0,   -- USD paid
  reference  text,
  status     text   not null default 'active' check (status in ('pending','active','completed','cancelled')),
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists promotions_active_idx on public.promotions(status, ends_at);
create index if not exists promotions_creator_idx on public.promotions(creator_id, created_at desc);

alter table public.promotions enable row level security;

-- Anyone signed in can read promotions (Discover needs the active ones); the
-- app filters to status='active' and ends_at in the future.
drop policy if exists promotions_select on public.promotions;
create policy promotions_select on public.promotions for select to authenticated using (true);

-- A creator may create/cancel a promotion only for a book they own.
drop policy if exists promotions_insert on public.promotions;
create policy promotions_insert on public.promotions
  for insert to authenticated
  with check (creator_id = auth.uid() and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));

drop policy if exists promotions_update on public.promotions;
create policy promotions_update on public.promotions
  for update to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

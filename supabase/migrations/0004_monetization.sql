-- ============================================================
-- Libry — Monetization: promoted books + time-gated sale campaigns
-- Run in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- ---------- promoted_books (paid home-page placement) ----------
create table if not exists public.promoted_books (
  id         bigint generated always as identity primary key,
  book_id    bigint not null references public.books (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  tier       text not null check (tier in ('Spotlight', 'Featured', 'Boost')),
  priority   integer not null default 10,
  starts_at  timestamptz not null default now(),
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_promoted_book on public.promoted_books (book_id);
create index if not exists idx_promoted_active on public.promoted_books (ends_at, priority desc);

alter table public.promoted_books enable row level security;

drop policy if exists promoted_select on public.promoted_books;
create policy promoted_select on public.promoted_books for select using (true);
drop policy if exists promoted_insert on public.promoted_books;
create policy promoted_insert on public.promoted_books for insert to authenticated
  with check (auth.uid() = user_id and exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));
drop policy if exists promoted_delete on public.promoted_books;
create policy promoted_delete on public.promoted_books for delete to authenticated using (auth.uid() = user_id);

-- ---------- sale_campaigns (platform-wide, time-gated) ----------
create table if not exists public.sale_campaigns (
  id           bigint generated always as identity primary key,
  title        text not null,
  description  text,
  kind         text not null default 'tokens' check (kind in ('tokens', 'subscription', 'featured')),
  discount_pct integer not null default 0,
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz not null default (now() + interval '14 days'),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.sale_campaigns enable row level security;

drop policy if exists sale_select on public.sale_campaigns;
create policy sale_select on public.sale_campaigns for select using (true);
-- NOTE: demo-open write. In production, gate this to an admin role.
drop policy if exists sale_write on public.sale_campaigns;
create policy sale_write on public.sale_campaigns for all to authenticated using (true) with check (true);

-- Seed one active launch sale if none is currently running.
insert into public.sale_campaigns (title, description, kind, discount_pct, starts_at, ends_at)
select 'Launch Week', '30% off every token bundle — welcome to Libry.', 'tokens', 30, now(), now() + interval '14 days'
where not exists (
  select 1 from public.sale_campaigns where active = true and now() between starts_at and ends_at
);

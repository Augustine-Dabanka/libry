-- ============================================================
-- Libry — Platform upgrades (co-authors, 3-tier age ratings, editor's pick,
-- mature toggle, purchases + referrals for monetization milestones).
-- Self-contained & idempotent. Includes everything from 0005, so running THIS
-- alone (on top of 0001–0004) is enough. Run in the Libry project's SQL editor.
-- ============================================================

-- ---------- co-authors (book_collaborators) ----------
create table if not exists public.book_collaborators (
  id         bigint generated always as identity primary key,
  book_id    bigint not null references public.books (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'editor',
  added_by   uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);
create index if not exists idx_collab_user on public.book_collaborators (user_id);
create index if not exists idx_collab_book on public.book_collaborators (book_id);
alter table public.book_collaborators enable row level security;
drop policy if exists collab_select on public.book_collaborators;
create policy collab_select on public.book_collaborators for select using (true);
drop policy if exists collab_insert on public.book_collaborators;
create policy collab_insert on public.book_collaborators for insert to authenticated
  with check (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));
drop policy if exists collab_delete on public.book_collaborators;
create policy collab_delete on public.book_collaborators for delete to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));

-- Owner OR collaborator may edit the book.
drop policy if exists books_update on public.books;
create policy books_update on public.books for update to authenticated
  using (auth.uid() = user_id or exists (select 1 from public.book_collaborators c where c.book_id = id and c.user_id = auth.uid()))
  with check (auth.uid() = user_id or exists (select 1 from public.book_collaborators c where c.book_id = id and c.user_id = auth.uid()));

-- ---------- 3-tier age ratings: Everyday / Teen / Mature ----------
-- Drop any prior age_rating constraint (e.g. the old 0005 one) BEFORE touching
-- data, or the UPDATE below trips the old rule.
alter table public.books drop constraint if exists books_age_rating_check;
alter table public.books add column if not exists age_rating text not null default 'Everyday';
-- Normalize EVERY row to a valid tier (unknown/legacy values → Everyday) so the
-- check constraint can't fail on existing data.
update public.books set age_rating = case btrim(coalesce(age_rating, ''))
  when 'All Ages'    then 'Everyday'
  when '9+'          then 'Everyday'
  when 'Everyone'    then 'Everyday'
  when '13+'         then 'Teen'
  when 'Teen'        then 'Teen'
  when '18+'         then 'Mature'
  when 'Mature 18+'  then 'Mature'
  when 'Mature'      then 'Mature'
  when 'Everyday'    then 'Everyday'
  else 'Everyday' end;
alter table public.books drop constraint if exists books_age_rating_check;
alter table public.books add constraint books_age_rating_check
  check (age_rating in ('Everyday', 'Teen', 'Mature'));

-- ---------- editor's pick ----------
alter table public.books add column if not exists is_editors_pick boolean not null default false;
create index if not exists idx_books_editors_pick on public.books (is_editors_pick) where is_editors_pick;

-- ---------- reader mature toggle (per profile) ----------
alter table public.profiles add column if not exists show_mature boolean not null default false;

-- ---------- purchases (drives the "books sold" milestone) ----------
-- Replace the retired PHP-era purchases table (had a different shape).
drop table if exists public.purchases cascade;
create table if not exists public.purchases (
  id         bigint generated always as identity primary key,
  book_id    bigint not null references public.books (id) on delete cascade,
  buyer_id   uuid not null references auth.users (id) on delete cascade,
  price      numeric(8,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_purchases_book on public.purchases (book_id);
alter table public.purchases enable row level security;
drop policy if exists purchases_select on public.purchases;
create policy purchases_select on public.purchases for select to authenticated
  using (auth.uid() = buyer_id or exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));
drop policy if exists purchases_insert on public.purchases;
create policy purchases_insert on public.purchases for insert to authenticated with check (auth.uid() = buyer_id);

-- ---------- referrals (drives the "referrals" milestone) ----------
drop table if exists public.referrals cascade;
create table if not exists public.referrals (
  id          bigint generated always as identity primary key,
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referred_id uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (referred_id)
);
create index if not exists idx_referrals_referrer on public.referrals (referrer_id);
alter table public.referrals enable row level security;
drop policy if exists referrals_select on public.referrals;
create policy referrals_select on public.referrals for select to authenticated using (auth.uid() = referrer_id);
drop policy if exists referrals_insert on public.referrals;
create policy referrals_insert on public.referrals for insert to authenticated with check (auth.uid() = referrer_id);

-- 0009 — wishlist + purchases (My Library tabs)
-- Idempotent; safe to re-run.

-- ---------- Wishlist ----------
create table if not exists public.wishlist (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  book_id    bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
alter table public.wishlist enable row level security;
drop policy if exists wishlist_all on public.wishlist;
create policy wishlist_all on public.wishlist
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Purchases ----------
-- An older purchases table used `buyer_id`; replace it with the app's schema.
-- Safe: no real purchases exist yet (payments not wired).
drop table if exists public.purchases cascade;
create table public.purchases (
  id         bigint generated always as identity primary key,
  user_id    uuid   not null references auth.users(id) on delete cascade,
  book_id    bigint not null,
  amount     numeric not null default 0,
  reference  text,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);
alter table public.purchases enable row level security;
drop policy if exists purchases_select on public.purchases;
create policy purchases_select on public.purchases
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists purchases_insert on public.purchases;
create policy purchases_insert on public.purchases
  for insert to authenticated with check (auth.uid() = user_id);

-- How many of THIS creator's books have been purchased (for the dashboard's
-- "Books sold" — bypasses the buyer-only RLS on purchases).
create or replace function public.my_books_sold()
returns integer
language sql security definer set search_path = public stable
as $$
  select count(*)::int
  from public.purchases p
  where p.book_id in (select id from public.books where user_id = auth.uid());
$$;
grant execute on function public.my_books_sold() to authenticated;

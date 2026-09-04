-- Reviews + author follows for the main site.

-- ---- Reviews: one per reader per book, readable by everyone ----
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  book_id    bigint not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_name  text,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz default now(),
  unique (book_id, user_id)
);
alter table public.reviews enable row level security;
drop policy if exists "reviews readable by all" on public.reviews;
create policy "reviews readable by all" on public.reviews for select using (true);
drop policy if exists "insert own review" on public.reviews;
create policy "insert own review" on public.reviews for insert with check (auth.uid() = user_id);
drop policy if exists "update own review" on public.reviews;
create policy "update own review" on public.reviews for update using (auth.uid() = user_id);
drop policy if exists "delete own review" on public.reviews;
create policy "delete own review" on public.reviews for delete using (auth.uid() = user_id);

-- ---- Author follows (authors keyed by name) ----
create table if not exists public.author_follows (
  id          uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  author      text not null,
  created_at  timestamptz default now(),
  unique (follower_id, author)
);
alter table public.author_follows enable row level security;
drop policy if exists "follows readable by all" on public.author_follows;
create policy "follows readable by all" on public.author_follows for select using (true);
drop policy if exists "insert own follow" on public.author_follows;
create policy "insert own follow" on public.author_follows for insert with check (auth.uid() = follower_id);
drop policy if exists "delete own follow" on public.author_follows;
create policy "delete own follow" on public.author_follows for delete using (auth.uid() = follower_id);

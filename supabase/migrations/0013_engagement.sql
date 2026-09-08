-- Pass 2 engagement: likes, post-reading challenges, grand-prize rewards,
-- and paragraph comments (comments UI ships next). All idempotent + RLS on.

-- ── Likes ──────────────────────────────────────────────────────────────────
create table if not exists public.book_likes (
  user_id uuid references auth.users on delete cascade,
  book_id bigint not null,
  created_at timestamptz default now(),
  primary key (user_id, book_id)
);
alter table public.book_likes enable row level security;
drop policy if exists "book_likes read" on public.book_likes;
drop policy if exists "book_likes write own" on public.book_likes;
create policy "book_likes read" on public.book_likes for select to public using (true);
create policy "book_likes write own" on public.book_likes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Post-reading challenges ─────────────────────────────────────────────────
create table if not exists public.reading_challenges (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  book_id bigint,
  created_at timestamptz default now(),
  unique (user_id, book_id)
);
alter table public.reading_challenges enable row level security;
drop policy if exists "reading_challenges own" on public.reading_challenges;
create policy "reading_challenges own" on public.reading_challenges
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Grand-prize rewards (all badges unlocked) ───────────────────────────────
create table if not exists public.rewards (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  kind text not null,
  code text,
  detail text,
  redeemed boolean default false,
  created_at timestamptz default now(),
  unique (user_id, kind)
);
alter table public.rewards enable row level security;
drop policy if exists "rewards own" on public.rewards;
create policy "rewards own" on public.rewards
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Paragraph comments (UI ships next) ──────────────────────────────────────
create table if not exists public.paragraph_comments (
  id bigint generated always as identity primary key,
  book_id bigint not null,
  para_index int not null,
  user_id uuid references auth.users on delete cascade,
  user_name text,
  body text not null,
  created_at timestamptz default now()
);
alter table public.paragraph_comments enable row level security;
drop policy if exists "paragraph_comments read" on public.paragraph_comments;
drop policy if exists "paragraph_comments insert own" on public.paragraph_comments;
drop policy if exists "paragraph_comments delete own" on public.paragraph_comments;
create policy "paragraph_comments read" on public.paragraph_comments for select to public using (true);
create policy "paragraph_comments insert own" on public.paragraph_comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "paragraph_comments delete own" on public.paragraph_comments
  for delete to authenticated using (user_id = auth.uid());
create index if not exists paragraph_comments_book_idx on public.paragraph_comments (book_id, para_index);

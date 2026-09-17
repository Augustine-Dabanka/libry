-- Community feed: short posts from readers and creators, with likes and replies.
-- The social heart of Libry — kept calm (no reshares, no algorithmic feed; just
-- newest-first from the people here).

create table if not exists public.community_posts (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text,
  body        text not null,
  book_id     bigint,                         -- optional: posting about a book
  created_at  timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc);

create table if not exists public.community_post_likes (
  post_id    bigint not null references public.community_posts(id) on delete cascade,
  user_id    uuid   not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.community_posts(id) on delete cascade,
  user_id     uuid not null,
  author_name text,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments(post_id);

alter table public.community_posts       enable row level security;
alter table public.community_post_likes  enable row level security;
alter table public.community_comments    enable row level security;

-- Everything is readable by any signed-in reader; you may write/delete your own.
drop policy if exists community_posts_select on public.community_posts;
create policy community_posts_select on public.community_posts for select to authenticated using (true);
drop policy if exists community_posts_insert on public.community_posts;
create policy community_posts_insert on public.community_posts for insert to authenticated with check (user_id = auth.uid());
drop policy if exists community_posts_delete on public.community_posts;
create policy community_posts_delete on public.community_posts for delete to authenticated using (user_id = auth.uid());

drop policy if exists community_likes_select on public.community_post_likes;
create policy community_likes_select on public.community_post_likes for select to authenticated using (true);
drop policy if exists community_likes_write on public.community_post_likes;
create policy community_likes_write on public.community_post_likes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists community_comments_select on public.community_comments;
create policy community_comments_select on public.community_comments for select to authenticated using (true);
drop policy if exists community_comments_insert on public.community_comments;
create policy community_comments_insert on public.community_comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists community_comments_delete on public.community_comments;
create policy community_comments_delete on public.community_comments for delete to authenticated using (user_id = auth.uid());

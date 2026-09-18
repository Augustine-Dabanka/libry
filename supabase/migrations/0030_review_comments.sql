-- Readers can reply to a review — a lightweight discussion under each one.
create table if not exists public.review_comments (
  id         bigint generated always as identity primary key,
  review_id  uuid not null references public.reviews(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_name  text,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists review_comments_review_idx on public.review_comments(review_id, created_at);

alter table public.review_comments enable row level security;

drop policy if exists rc_read on public.review_comments;
create policy rc_read on public.review_comments for select using (auth.uid() is not null);
drop policy if exists rc_insert on public.review_comments;
create policy rc_insert on public.review_comments for insert with check (user_id = auth.uid());
drop policy if exists rc_delete on public.review_comments;
create policy rc_delete on public.review_comments for delete using (user_id = auth.uid());

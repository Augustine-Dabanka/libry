-- Social layer on paragraph comments: threaded replies, like/dislike reactions,
-- and creator-pinned comments.

-- Replies (one level: a reply points at the top-level comment) + pin flag.
alter table public.paragraph_comments
  add column if not exists parent_id bigint references public.paragraph_comments(id) on delete cascade,
  add column if not exists pinned    boolean not null default false;

create index if not exists paragraph_comments_parent_idx on public.paragraph_comments(parent_id);

-- One reaction per (comment, user): +1 like or -1 dislike.
create table if not exists public.comment_reactions (
  comment_id bigint not null references public.paragraph_comments(id) on delete cascade,
  user_id    uuid   not null,
  value      smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_reactions enable row level security;

drop policy if exists comment_reactions_select on public.comment_reactions;
create policy comment_reactions_select on public.comment_reactions
  for select to authenticated using (true);

drop policy if exists comment_reactions_write on public.comment_reactions;
create policy comment_reactions_write on public.comment_reactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Only the book's creator may pin/unpin a comment on their book. Runs as
-- definer so the pin write bypasses the comment-owner RLS, after verifying the
-- caller owns the book.
create or replace function public.set_comment_pin(p_comment bigint, p_pinned boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_book bigint;
  v_owner uuid;
begin
  select pc.book_id into v_book from public.paragraph_comments pc where pc.id = p_comment;
  if v_book is null then raise exception 'comment not found'; end if;
  select b.user_id into v_owner from public.books b where b.id = v_book;
  if v_owner is distinct from auth.uid() then
    raise exception 'only the book creator can pin comments';
  end if;
  update public.paragraph_comments set pinned = p_pinned where id = p_comment;
end $$;

revoke all on function public.set_comment_pin(bigint, boolean) from public, anon;
grant execute on function public.set_comment_pin(bigint, boolean) to authenticated;

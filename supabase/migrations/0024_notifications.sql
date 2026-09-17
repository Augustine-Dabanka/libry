-- Notifications. Rows are written only by SECURITY DEFINER triggers on the
-- events that matter (someone replies to / likes your community post, someone
-- follows you, someone replies to your reader comment). Recipients read, mark
-- read, and delete their own; nobody inserts directly.
--
-- Run AFTER 0022 (paragraph_comments.parent_id) and 0023 (community tables).

create table if not exists public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,          -- recipient
  actor_id   uuid,                   -- who caused it
  actor_name text,
  kind       text not null,          -- post_reply | post_like | follow | comment_reply
  summary    text not null,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

-- Reply to your community post.
create or replace function public.notify_post_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  select user_id into v_owner from public.community_posts where id = new.post_id;
  if v_owner is null or v_owner = new.user_id then return new; end if;
  insert into public.notifications(user_id, actor_id, actor_name, kind, summary, link)
  values (v_owner, new.user_id, new.author_name, 'post_reply', coalesce(new.author_name, 'Someone') || ' replied to your post', '/community');
  return new;
end $$;
drop trigger if exists trg_notify_post_reply on public.community_comments;
create trigger trg_notify_post_reply after insert on public.community_comments for each row execute function public.notify_post_reply();

-- Like on your community post.
create or replace function public.notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_actor text;
begin
  select user_id into v_owner from public.community_posts where id = new.post_id;
  if v_owner is null or v_owner = new.user_id then return new; end if;
  select coalesce(full_name, username) into v_actor from public.profiles where id = new.user_id;
  insert into public.notifications(user_id, actor_id, actor_name, kind, summary, link)
  values (v_owner, new.user_id, v_actor, 'post_like', coalesce(v_actor, 'Someone') || ' liked your post', '/community');
  return new;
end $$;
drop trigger if exists trg_notify_post_like on public.community_post_likes;
create trigger trg_notify_post_like after insert on public.community_post_likes for each row execute function public.notify_post_like();

-- New follower (author_follows.author is a display name → match a profile).
create or replace function public.notify_follow()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_actor text;
begin
  select id into v_owner from public.profiles where pen_name = new.author or full_name = new.author or username = new.author limit 1;
  if v_owner is null or v_owner = new.follower_id then return new; end if;
  select coalesce(full_name, username) into v_actor from public.profiles where id = new.follower_id;
  insert into public.notifications(user_id, actor_id, actor_name, kind, summary, link)
  values (v_owner, new.follower_id, v_actor, 'follow', coalesce(v_actor, 'Someone') || ' started following you', '/creator#audience');
  return new;
end $$;
drop trigger if exists trg_notify_follow on public.author_follows;
create trigger trg_notify_follow after insert on public.author_follows for each row execute function public.notify_follow();

-- Reply to your reader (paragraph) comment.
create or replace function public.notify_comment_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_owner uuid;
begin
  if new.parent_id is null then return new; end if;
  select user_id into v_owner from public.paragraph_comments where id = new.parent_id;
  if v_owner is null or v_owner = new.user_id then return new; end if;
  insert into public.notifications(user_id, actor_id, actor_name, kind, summary, link)
  values (v_owner, new.user_id, new.user_name, 'comment_reply', coalesce(new.user_name, 'Someone') || ' replied to your comment', '/book/' || new.book_id);
  return new;
end $$;
drop trigger if exists trg_notify_comment_reply on public.paragraph_comments;
create trigger trg_notify_comment_reply after insert on public.paragraph_comments for each row execute function public.notify_comment_reply();

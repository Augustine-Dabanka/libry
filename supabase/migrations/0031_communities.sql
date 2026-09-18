-- Skool-style communities: joinable groups, each with channels, a media-capable
-- feed, members, and a leaderboard. Built on top of the existing community_posts
-- so the global feed keeps working (posts with a null community_id are global).

create table if not exists public.communities (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  name        text not null,
  description text,
  emoji       text default '📚',
  cover_url   text,
  is_official boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id bigint not null references public.communities(id) on delete cascade,
  user_id      uuid   not null references auth.users(id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists community_members_user_idx on public.community_members(user_id);

-- Extend posts with a home community, a channel, and optional media.
alter table public.community_posts
  add column if not exists community_id bigint references public.communities(id) on delete cascade,
  add column if not exists channel text not null default 'general',
  add column if not exists image_url text;
create index if not exists community_posts_community_idx on public.community_posts(community_id, channel, created_at desc);

alter table public.communities        enable row level security;
alter table public.community_members  enable row level security;

drop policy if exists communities_read on public.communities;
create policy communities_read on public.communities for select to authenticated using (true);
drop policy if exists communities_insert on public.communities;
create policy communities_insert on public.communities for insert to authenticated with check (created_by = auth.uid());
drop policy if exists communities_owner on public.communities;
create policy communities_owner on public.communities for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists communities_delete on public.communities;
create policy communities_delete on public.communities for delete to authenticated using (created_by = auth.uid());

drop policy if exists cmembers_read on public.community_members;
create policy cmembers_read on public.community_members for select to authenticated using (true);
drop policy if exists cmembers_join on public.community_members;
create policy cmembers_join on public.community_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists cmembers_leave on public.community_members;
create policy cmembers_leave on public.community_members for delete to authenticated using (user_id = auth.uid());

-- Leaderboard: members ranked by contribution (2 pts a post + 1 per like earned).
create or replace function public.community_leaderboard(cid bigint)
returns table(user_id uuid, name text, posts bigint, likes bigint, score bigint)
language sql stable security definer set search_path = public as $$
  select p.user_id,
         coalesce(max(p.author_name), 'Reader') as name,
         count(distinct p.id) as posts,
         count(l.user_id) as likes,
         (count(distinct p.id) * 2 + count(l.user_id)) as score
  from public.community_posts p
  left join public.community_post_likes l on l.post_id = p.id
  where p.community_id = cid
  group by p.user_id
  order by score desc
  limit 10;
$$;
grant execute on function public.community_leaderboard(bigint) to authenticated;

-- Seed a few official rooms owned by the Libry house account.
insert into public.communities (slug, name, description, emoji, is_official, created_by) values
  ('reading-room', 'The Reading Room', 'For everyone who reads on Libry — share what you''re loving, ask for recs, find your next book.', '📖', true, '185ed01a-ff28-45ed-b647-1436fc965cf7'),
  ('writers-guild', 'Writers'' Guild', 'Craft talk, feedback, wins and works-in-progress for Libry creators.', '✍️', true, '185ed01a-ff28-45ed-b647-1436fc965cf7'),
  ('interactive-fiction', 'Interactive Fiction', 'Choose-your-path storytellers and players — branching, twists and design.', '✦', true, '185ed01a-ff28-45ed-b647-1436fc965cf7'),
  ('the-lounge', 'The Lounge', 'Off-topic and easygoing — say hi, share a quote, hang out.', '🛋️', true, '185ed01a-ff28-45ed-b647-1436fc965cf7')
on conflict (slug) do nothing;

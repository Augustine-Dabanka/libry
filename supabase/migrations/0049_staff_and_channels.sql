-- Lybry 0049: staff roles + team chat, and creator channels.
--
-- STAFF
-- * Eight ranks (1 = highest): ultra_admin, super_admin, admin, manager,
--   moderator, accountant, accountant_2, staff. What each rank may do lives in
--   the app (src/lib/staff.ts); the database stores who holds which rank and
--   enforces the rules that must never be bypassed:
--     - only the server (service role) writes roles, audit entries and bans;
--     - staff can read the team list, the global chat, and their own DMs.
-- * The owner is the Ultra Admin through the ADMIN_EMAILS env var, so the app
--   can never lock its owner out even if this table is emptied.
-- * accountant_2 can only send money while `finance_access` is true, which an
--   accountant (or higher) switches on and off.
--
-- CHANNELS
-- * profiles.banner (small inline image) and profiles.tagline, both public.
-- * creator_videos: videos a creator links from YouTube or Vimeo, shown on
--   their channel. Lybry doesn't host video files yet.
--
-- Requires 0048. Safe to re-run.

create table if not exists public.staff_roles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  role           text not null check (role in ('ultra_admin','super_admin','admin','manager','moderator','accountant','accountant_2','staff')),
  finance_access boolean not null default false,
  granted_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.staff_roles enable row level security;

create or replace function public.is_staff(p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff_roles where user_id = p_user)
$$;
revoke all on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated;

drop policy if exists staff_roles_read on public.staff_roles;
create policy staff_roles_read on public.staff_roles for select to authenticated using ((select public.is_staff()));
revoke insert, update, delete on public.staff_roles from anon, authenticated;
grant select on public.staff_roles to authenticated;

create table if not exists public.staff_messages (
  id         bigint generated always as identity primary key,
  channel    text not null check (channel = 'global' or channel ~ '^dm:[0-9a-f-]{36}:[0-9a-f-]{36}$'),
  sender_id  uuid references auth.users(id) on delete set null,
  kind       text not null default 'text' check (kind in ('text','system','call','command')),
  body       text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists staff_messages_channel_idx on public.staff_messages (channel, created_at desc);
alter table public.staff_messages enable row level security;
drop policy if exists staff_messages_read on public.staff_messages;
create policy staff_messages_read on public.staff_messages for select to authenticated
  using ((select public.is_staff()) and (channel = 'global' or position((select auth.uid())::text in channel) > 0));
revoke insert, update, delete on public.staff_messages from anon, authenticated;
grant select on public.staff_messages to authenticated;

create table if not exists public.staff_audit (
  id         bigint generated always as identity primary key,
  actor_id   uuid references auth.users(id) on delete set null,
  action     text not null,
  target_id  uuid,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists staff_audit_created_idx on public.staff_audit (created_at desc);
alter table public.staff_audit enable row level security;
drop policy if exists staff_audit_read on public.staff_audit;
create policy staff_audit_read on public.staff_audit for select to authenticated using ((select public.is_staff()));
revoke insert, update, delete on public.staff_audit from anon, authenticated;
grant select on public.staff_audit to authenticated;

-- Staff IDs (format LP-4142-3699.1; the digit after the dot is the rank) and
-- the roster of people who hold them. A roster entry is linked to a Lybry
-- account by an Ultra/Super Admin in /admin → Team & ranks. Names and IDs are
-- entered from a separate SQL file, never committed to the (public) repo.
alter table public.staff_roles add column if not exists staff_code text;
do $$ begin
  alter table public.staff_roles add constraint staff_roles_code_fmt check (staff_code is null or staff_code ~ '^LP-[0-9]{4}-[0-9]{4}\.[1-8]$');
exception when duplicate_object then null; end $$;
create unique index if not exists staff_roles_code_uq on public.staff_roles (staff_code) where staff_code is not null;

create table if not exists public.staff_roster (
  staff_code   text primary key check (staff_code ~ '^LP-[0-9]{4}-[0-9]{4}\.[1-8]$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  role         text not null check (role in ('ultra_admin','super_admin','admin','manager','moderator','accountant','accountant_2','staff')),
  user_id      uuid unique references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
alter table public.staff_roster enable row level security;
drop policy if exists staff_roster_read on public.staff_roster;
create policy staff_roster_read on public.staff_roster for select to authenticated using ((select public.is_staff()));
revoke insert, update, delete on public.staff_roster from anon, authenticated;
grant select on public.staff_roster to authenticated;

-- Live updates for the team chat.
do $$ begin
  alter publication supabase_realtime add table public.staff_messages;
exception when others then null; end $$;

-- Channels ---------------------------------------------------------------------
alter table public.profiles add column if not exists banner text;
alter table public.profiles add column if not exists tagline text;
do $$ begin
  alter table public.profiles add constraint profiles_tagline_len check (tagline is null or char_length(tagline) <= 80);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.profiles add constraint profiles_banner_size check (banner is null or char_length(banner) <= 400000);
exception when duplicate_object then null; end $$;
grant select (banner, tagline) on public.profiles to anon, authenticated;

create table if not exists public.creator_videos (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  provider    text not null check (provider in ('youtube','vimeo')),
  video_id    text not null check (video_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  title       text not null check (char_length(title) between 1 and 120),
  description text check (description is null or char_length(description) <= 1000),
  created_at  timestamptz not null default now(),
  unique (user_id, provider, video_id)
);
create index if not exists creator_videos_user_idx on public.creator_videos (user_id, created_at desc);
alter table public.creator_videos enable row level security;
drop policy if exists creator_videos_read on public.creator_videos;
create policy creator_videos_read on public.creator_videos for select using (true);
drop policy if exists creator_videos_own on public.creator_videos;
create policy creator_videos_own on public.creator_videos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select on public.creator_videos to anon, authenticated;
grant insert, update, delete on public.creator_videos to authenticated;

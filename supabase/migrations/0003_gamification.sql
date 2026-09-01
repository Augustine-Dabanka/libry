-- ============================================================
-- Libry — Gamification: streaks, tokens (energy), XP, leagues, daily quests
-- Run in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- One stats row per user.
create table if not exists public.user_stats (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  streak_count      integer not null default 0,
  longest_streak    integer not null default 0,
  last_active_date  date,
  streak_broken     boolean not null default false,   -- drives the sad/frozen koala + recovery prompt
  tokens            integer not null default 20,      -- energy economy
  tokens_updated_at timestamptz not null default now(),
  xp                integer not null default 0,
  weekly_xp         integer not null default 0,
  league            text not null default 'Bronze',
  updated_at        timestamptz not null default now()
);

alter table public.user_stats enable row level security;

-- Everyone can read stats (needed for league leaderboards); you write only your own.
drop policy if exists user_stats_select on public.user_stats;
create policy user_stats_select on public.user_stats for select using (true);
drop policy if exists user_stats_insert on public.user_stats;
create policy user_stats_insert on public.user_stats for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists user_stats_update on public.user_stats;
create policy user_stats_update on public.user_stats for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Daily quests (3 per user per day).
create table if not exists public.daily_quests (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  quest_date    date not null default current_date,
  quest_key     text not null,
  label         text not null,
  target        integer not null default 1,
  progress      integer not null default 0,
  completed     boolean not null default false,
  claimed       boolean not null default false,
  reward_tokens integer not null default 5,
  reward_xp     integer not null default 10,
  created_at    timestamptz not null default now(),
  unique (user_id, quest_date, quest_key)
);

alter table public.daily_quests enable row level security;

drop policy if exists daily_quests_select on public.daily_quests;
create policy daily_quests_select on public.daily_quests for select to authenticated using (auth.uid() = user_id);
drop policy if exists daily_quests_insert on public.daily_quests;
create policy daily_quests_insert on public.daily_quests for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists daily_quests_update on public.daily_quests;
create policy daily_quests_update on public.daily_quests for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Libry: security lockdown + one trusted XP ledger
-- Run once in the Supabase SQL editor (safe to re-run).
--
-- Why: the anon key is public, so any row a user may UPDATE from the browser
-- is a row they can set to anything. XP/tokens were writable that way, and
-- XP from challenges and the onboarding bonus was never counted.
-- ============================================================

-- 1) Close open write policies -------------------------------------------------
-- Players can no longer write their own stats/quests directly. All awards go
-- through award_xp() below, which decides the amounts on the server.
drop policy if exists user_stats_update   on public.user_stats;
drop policy if exists user_stats_insert   on public.user_stats;
drop policy if exists daily_quests_insert on public.daily_quests;
drop policy if exists daily_quests_update on public.daily_quests;

-- Any signed-in user could create/edit/delete the site-wide sale banner.
-- Now only the service role (admin tools) can write it.
drop policy if exists sale_write on public.sale_campaigns;

-- Any signed-in user could insert quiz questions (and wrong answers) for any
-- book. The question route now caches with the service role instead.
drop policy if exists book_questions_insert on public.book_questions;

-- 2) XP ledger: every award is one row, unique per (user, reason, ref) ----------
create table if not exists public.xp_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  reason     text not null,
  ref        text not null default '',
  xp         integer not null,
  tokens     integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);
alter table public.xp_events enable row level security;
drop policy if exists xp_events_select on public.xp_events;
create policy xp_events_select on public.xp_events for select to authenticated using (auth.uid() = user_id);
-- (no insert/update/delete policies: only award_xp() writes here)

-- 3) The only way XP is granted -------------------------------------------------
create or replace function public.award_xp(p_reason text, p_ref text default '')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid   uuid := auth.uid();
  v_xp  integer;
  v_tok integer;
  v_ref text := coalesce(p_ref, '');
  v_id  bigint;
begin
  if uid is null then return 0; end if;

  -- Amounts live here, on the server. The client only names the reason.
  if p_reason = 'welcome' then
    v_xp := 50; v_tok := 0; v_ref := '';
  elsif p_reason = 'challenge' then
    -- Only for a challenge this user really completed.
    if not exists (select 1 from reading_challenges where user_id = uid and book_id::text = v_ref) then
      return 0;
    end if;
    -- Anti-farming: at most 5 challenge rewards per rolling 24 hours.
    if (select count(*) from xp_events
        where user_id = uid and reason = 'challenge' and created_at > now() - interval '1 day') >= 5 then
      return 0;
    end if;
    v_xp := 30; v_tok := 6;
  else
    return 0;
  end if;

  -- Idempotent: a second call for the same award does nothing (fixes double-claims).
  insert into xp_events (user_id, reason, ref, xp, tokens)
  values (uid, p_reason, v_ref, v_xp, v_tok)
  on conflict (user_id, reason, ref) do nothing
  returning id into v_id;
  if v_id is null then return 0; end if;

  insert into user_stats (user_id, xp, weekly_xp, tokens)
  values (uid, v_xp, v_xp, least(30, 20 + v_tok))
  on conflict (user_id) do update
    set xp         = user_stats.xp + v_xp,
        weekly_xp  = user_stats.weekly_xp + v_xp,
        tokens     = least(30, user_stats.tokens + v_tok),
        updated_at = now();

  return v_xp;
end;
$$;

revoke all on function public.award_xp(text, text) from public;
grant execute on function public.award_xp(text, text) to authenticated;

-- 4) Backfill: credit challenges completed before this fix ----------------------
-- Their +30 XP was often never saved (no stats row existed yet).
with ins as (
  insert into public.xp_events (user_id, reason, ref, xp, tokens)
  select rc.user_id, 'challenge', rc.book_id::text, 30, 6
  from public.reading_challenges rc
  where rc.user_id is not null and rc.book_id is not null
  on conflict (user_id, reason, ref) do nothing
  returning user_id, xp
), sums as (
  select user_id, sum(xp)::int as xp from ins group by user_id
)
insert into public.user_stats (user_id, xp, weekly_xp)
select user_id, xp, xp from sums
on conflict (user_id) do update
  set xp = public.user_stats.xp + excluded.xp,
      updated_at = now();

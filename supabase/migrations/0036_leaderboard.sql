-- ============================================================
-- Libry: weekly reading leaderboard (opt-in) + tamper-resistant reading minutes
-- Run once in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- 1) Readers could write any number of minutes to any day directly from the
--    browser. Close that: minutes are only added by add_reading_minutes().
drop policy if exists reading_days_insert on public.reading_days;
drop policy if exists reading_days_update on public.reading_days;

create table if not exists public.reading_ticks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_at timestamptz not null default now()
);
alter table public.reading_ticks enable row level security;
-- (no policies: only the function below touches it)

-- One minute per call, at most one call per ~50 seconds, and the "day" may only
-- be today give or take one day (so time zones still work, but no back-filling).
create or replace function public.add_reading_minutes(p_mins int, p_day date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  utc_today date := (now() at time zone 'utc')::date;
  v_day date := coalesce(p_day, utc_today);
  ok boolean;
begin
  if uid is null or coalesce(p_mins, 0) <= 0 then return; end if;
  if v_day < utc_today - 1 or v_day > utc_today + 1 then v_day := utc_today; end if;

  insert into reading_ticks (user_id, last_at) values (uid, now())
  on conflict (user_id) do update set last_at = now()
    where reading_ticks.last_at < now() - interval '50 seconds'
  returning true into ok;
  if ok is null then return; end if;  -- ticked too recently

  insert into reading_days (user_id, day, minutes)
  values (uid, v_day, 1)
  on conflict (user_id, day)
  do update set minutes = least(reading_days.minutes + 1, 1440);
end;
$$;
grant execute on function public.add_reading_minutes(int, date) to authenticated;

-- 2) Weekly board: minutes read since Monday (UTC), only readers who opted in.
--    Shows a display name only (username, or first name + initial), never emails.
create or replace function public.leaderboard_week(p_limit int default 25)
returns table (rank bigint, display_name text, avatar_url text, minutes bigint, is_me boolean)
language sql
security definer
set search_path = public
stable
as $$
  with wk as (
    select rd.user_id, sum(rd.minutes)::bigint as minutes
    from reading_days rd
    where rd.day >= date_trunc('week', (now() at time zone 'utc'))::date
    group by rd.user_id
  ), ranked as (
    select wk.user_id, wk.minutes,
           rank() over (order by wk.minutes desc) as rank
    from wk
    join profiles p on p.id = wk.user_id
    where coalesce(p.prefs->>'leaderboard', 'off') = 'on' and wk.minutes > 0
  )
  select r.rank,
         coalesce(nullif(p.username, ''),
                  split_part(coalesce(p.full_name, 'Reader'), ' ', 1) ||
                  case when position(' ' in coalesce(p.full_name, '')) > 0
                       then ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.' else '' end) as display_name,
         p.avatar_url,
         r.minutes,
         r.user_id = auth.uid() as is_me
  from ranked r join profiles p on p.id = r.user_id
  order by r.rank, display_name
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;
grant execute on function public.leaderboard_week(int) to anon, authenticated;

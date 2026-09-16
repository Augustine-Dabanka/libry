-- Hour-based reading streak: minutes read per (user, local day). The app writes
-- through add_reading_minutes() and reads the raw days back to compute the streak
-- client-side against the reader's daily goal (from profiles.prefs.goal).
-- Guarded in the app, so the streak UI simply stays empty until this is applied.

create table if not exists public.reading_days (
  user_id  uuid not null references auth.users (id) on delete cascade,
  day      date not null,
  minutes  int  not null default 0,
  primary key (user_id, day)
);

alter table public.reading_days enable row level security;

drop policy if exists reading_days_select on public.reading_days;
create policy reading_days_select on public.reading_days
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists reading_days_insert on public.reading_days;
create policy reading_days_insert on public.reading_days
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists reading_days_update on public.reading_days;
create policy reading_days_update on public.reading_days
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Atomically add minutes to a given local day (the client passes its own date so
-- the "day" boundary follows the reader's timezone, not UTC).
create or replace function public.add_reading_minutes(p_mins int, p_day date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or coalesce(p_mins, 0) <= 0 then
    return;
  end if;
  insert into public.reading_days (user_id, day, minutes)
  values (auth.uid(), coalesce(p_day, (now() at time zone 'utc')::date), least(p_mins, 120))
  on conflict (user_id, day)
  do update set minutes = least(public.reading_days.minutes + excluded.minutes, 1440);
end;
$$;

grant execute on function public.add_reading_minutes(int, date) to authenticated;

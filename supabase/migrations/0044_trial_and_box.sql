-- Lybry: free trial of Unlimited + make "keep books from your box" actually work.
--
-- Before this, Unlimited took a payment but gave nothing in the reader: there
-- was no way to "keep" a book. Now:
--   * Creators opt a paid book into Unlimited (books.allow_unlimited). House
--     "Lybry Originals" books are opted in by default.
--   * Subscribers keep up to `picks_per_cycle` of those books each cycle.
--   * Anyone can start ONE free trial per account: no card, nothing to cancel,
--     it simply ends. Trial length, trial picks and a daily cap on new trials
--     are switches in site_settings 'features' (defaults: 7 days, 2 picks, 200/day).
--   * A kept book is recorded in purchases (amount 0, source 'trial' or 'box'),
--     so the reader, downloads and the library treat it as owned, for good.
--
-- Change the trial later (Supabase SQL editor), e.g. 14 days and 3 picks:
--   update public.site_settings set value = value || '{"trial_days":14,"trial_picks":3}' where key = 'features';
-- Switch trials off:
--   update public.site_settings set value = value || '{"trial":false}' where key = 'features';
-- Safe to re-run. Works with or without 0042.

-- ---------- settings -------------------------------------------------------------
insert into public.site_settings (key, value, updated_by)
values ('features', '{}'::jsonb, 'migration 0044')
on conflict (key) do nothing;
update public.site_settings
   set value = '{"trial": true, "trial_days": 7, "trial_picks": 2, "trial_daily_cap": 200}'::jsonb || value
 where key = 'features';

drop policy if exists site_settings_read_schedule on public.site_settings;
create policy site_settings_read_schedule on public.site_settings
  for select to anon, authenticated using (key in ('theme_schedule', 'features'));

create or replace function public.feature_on(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value ->> p_name)::boolean from site_settings where key = 'features'), false);
$$;
create or replace function public.feature_int(p_name text, p_default int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value ->> p_name)::int from site_settings where key = 'features'), p_default);
$$;
grant execute on function public.feature_on(text) to anon, authenticated;
grant execute on function public.feature_int(text, int) to anon, authenticated;

-- ---------- books opt in ---------------------------------------------------------
alter table public.books add column if not exists allow_unlimited boolean not null default false;
grant select (allow_unlimited) on public.books to anon, authenticated;
grant update (allow_unlimited) on public.books to authenticated;   -- row policy still limits it to the owner
update public.books set allow_unlimited = true
 where coalesce(price, 0) > 0
   and (author in ('Lybry Originals', 'Libry Originals') or created_by in ('Lybry Originals', 'Libry Originals'));

-- ---------- purchases: where a book came from ----------------------------------
alter table public.purchases add column if not exists source text not null default 'sale';

-- ---------- trials ---------------------------------------------------------------
create table if not exists public.trials (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  ends_at    timestamptz not null,
  days       int not null,
  picks      int not null
);
alter table public.trials enable row level security;
drop policy if exists trials_select_own on public.trials;
create policy trials_select_own on public.trials for select to authenticated using (user_id = auth.uid());
-- no insert/update/delete policies: only start_trial() writes

-- What the signed-in reader can do right now.
create or replace function public.box_status()
returns table (
  kind text,            -- 'sub' | 'trial' | 'none'
  ends_at timestamptz,
  picks_total int,
  picks_used int,
  trial_available boolean,
  trial_days int,
  trial_picks int
)
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); s subscriptions%rowtype; t trials%rowtype; win_start timestamptz;
begin
  trial_days := feature_int('trial_days', 7);
  trial_picks := feature_int('trial_picks', 2);
  if uid is null then
    kind := 'none'; trial_available := feature_on('trial'); picks_total := 0; picks_used := 0;
    return next; return;
  end if;
  select * into s from subscriptions where user_id = uid;
  select * into t from trials where user_id = uid;
  trial_available := feature_on('trial') and t.user_id is null
                     and not (s.user_id is not null and s.status = 'active' and s.current_period_end > now());
  if s.user_id is not null and s.status = 'active' and s.current_period_end > now() then
    win_start := s.current_period_end - case s.plan when 'weekly' then interval '7 days'
                                                   when 'yearly' then interval '365 days'
                                                   else interval '30 days' end;
    kind := 'sub'; ends_at := s.current_period_end; picks_total := s.picks_per_cycle;
    select count(*) into picks_used from purchases where user_id = uid and source = 'box' and created_at >= win_start;
  elsif t.user_id is not null and t.ends_at > now() then
    kind := 'trial'; ends_at := t.ends_at; picks_total := t.picks;
    select count(*) into picks_used from purchases where user_id = uid and source = 'trial' and created_at >= t.started_at;
  else
    kind := 'none'; picks_total := 0; picks_used := 0;
  end if;
  return next;
end $$;
grant execute on function public.box_status() to anon, authenticated;

create or replace function public.start_trial()
returns table (ok boolean, message text, ends_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); d int; p int; capn int; v_end timestamptz;
begin
  if uid is null then return query select false, 'Sign in first.', null::timestamptz; return; end if;
  if not feature_on('trial') then return query select false, 'Free trials are paused right now.', null::timestamptz; return; end if;
  if exists (select 1 from trials where user_id = uid) then
    return query select false, 'You''ve already used your free trial.', null::timestamptz; return;
  end if;
  if exists (select 1 from subscriptions where user_id = uid and status = 'active' and current_period_end > now()) then
    return query select false, 'You already have Unlimited.', null::timestamptz; return;
  end if;
  if exists (select 1 from auth.users where id = uid and email_confirmed_at is null and phone_confirmed_at is null) then
    return query select false, 'Confirm your email first, then start your trial.', null::timestamptz; return;
  end if;
  capn := feature_int('trial_daily_cap', 200);
  if (select count(*) from trials where started_at > now() - interval '1 day') >= capn then
    return query select false, 'Today''s free trials are all taken. Try again tomorrow.', null::timestamptz; return;
  end if;
  d := greatest(1, least(60, feature_int('trial_days', 7)));
  p := greatest(0, least(20, feature_int('trial_picks', 2)));
  v_end := now() + make_interval(days => d);
  insert into trials (user_id, ends_at, days, picks) values (uid, v_end, d, p);
  return query select true, format('Your %s-day trial has started.', d), v_end;
end $$;
grant execute on function public.start_trial() to authenticated;

-- Keep a book from your box (subscription) or your trial.
create or replace function public.keep_book(p_book bigint)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); b record; st record; src text;
begin
  if uid is null then return query select false, 'Sign in first.'; return; end if;
  select id, price, user_id, is_published, allow_unlimited into b from books where id = p_book;
  if not found or not coalesce(b.is_published, false) then return query select false, 'Book not found.'; return; end if;
  if coalesce(b.price, 0) <= 0 then return query select false, 'This book is already free to read.'; return; end if;
  if not coalesce(b.allow_unlimited, false) then return query select false, 'This book isn''t part of Unlimited.'; return; end if;
  if b.user_id = uid or exists (select 1 from purchases where user_id = uid and book_id = p_book) then
    return query select false, 'It''s already in your library.'; return;
  end if;
  select * into st from box_status();
  if st.kind = 'none' then return query select false, 'Start your free trial or Unlimited to keep books.'; return; end if;
  if st.picks_used >= st.picks_total then
    return query select false, case when st.kind = 'trial' then 'You''ve used your trial picks.' else 'You''ve used this cycle''s picks.' end; return;
  end if;
  src := case when st.kind = 'trial' then 'trial' else 'box' end;
  insert into purchases (user_id, book_id, amount, reference, simulated, source)
  values (uid, p_book, 0, src || '-' || p_book || '-' || uid, false, src)
  on conflict do nothing;
  return query select true, 'Kept. It''s yours for good.';
end $$;
grant execute on function public.keep_book(bigint) to authenticated;

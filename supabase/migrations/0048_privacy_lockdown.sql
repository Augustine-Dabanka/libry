-- Lybry 0048: close the data leaks found in the October 2026 audit.
--
-- Before this, anyone holding the public API key (it ships in every browser)
-- could read every user's email, preferences and marketing choice from
-- `profiles`, read AND rewrite everyone's reading progress, turn any username
-- into its email via login_email(), and (signed in) read any creator's
-- earnings. This file:
--   1. profiles: only public columns are readable by others. Your own private
--      columns come from the `my_profile` view, which only ever returns your row.
--   2. reading_progress: you can only see and change your own rows. Pages that
--      need totals use aggregate functions that never expose who read what.
--   3. login_email() is removed (sign-in is by email only now).
--   4. creator_net_earned() answers only for yourself (or the server).
--   5. Payout details need two-step sign-in when the account has it on.
--   6. Housekeeping from the Supabase advisor: fixed search paths, trigger
--      functions not callable as API endpoints, missing foreign-key indexes.
--
-- Requires 0045 + 0046 (run the bundle in order). Safe to re-run.

-- 1. profiles ---------------------------------------------------------------
revoke select on public.profiles from anon, authenticated;
grant select (id, username, full_name, pen_name, avatar_url, creator_avatar_url, bio,
              is_creator, created_at, pronouns, avatar, partner_status)
  on public.profiles to anon, authenticated;

create or replace view public.my_profile
with (security_barrier = true) as
  select id, email, prefs, show_mature, marketing_opt_in, referred_by,
         creator_status, creator_status_reason, creator_status_until, payout_frozen,
         partner_status, partner_applied_at, partner_reviewed_at,
         adult_confirmed_at, mature_locked_until
    from public.profiles
   where id = auth.uid();
revoke all on public.my_profile from public, anon;
grant select on public.my_profile to authenticated;

-- 2. reading_progress -------------------------------------------------------
alter table public.reading_progress enable row level security;
drop policy if exists rp_select on public.reading_progress;
drop policy if exists rp_insert on public.reading_progress;
drop policy if exists rp_update on public.reading_progress;
drop policy if exists rp_delete on public.reading_progress;
create policy rp_select on public.reading_progress for select to authenticated
  using (lower(user_email) = lower((select auth.jwt() ->> 'email')));
create policy rp_insert on public.reading_progress for insert to authenticated
  with check (lower(user_email) = lower((select auth.jwt() ->> 'email')));
create policy rp_update on public.reading_progress for update to authenticated
  using (lower(user_email) = lower((select auth.jwt() ->> 'email')))
  with check (lower(user_email) = lower((select auth.jwt() ->> 'email')));
revoke all on public.reading_progress from anon;
create index if not exists reading_progress_email_idx on public.reading_progress (lower(user_email));
create index if not exists reading_progress_book_idx on public.reading_progress (book_id);

-- Readers and finishers per book, for ranking shelves. Counts only.
create or replace function public.book_reading_stats()
returns table (book_id bigint, readers integer, finishers integer)
language sql stable security definer set search_path = public as $$
  select rp.book_id,
         count(distinct lower(rp.user_email))::int,
         count(*) filter (where coalesce(rp.progress_percentage, 0) >= 100)::int
    from public.reading_progress rp
   group by rp.book_id
$$;
revoke all on function public.book_reading_stats() from public;
grant execute on function public.book_reading_stats() to anon, authenticated;

-- Books someone has finished, for their public profile; null if they hide activity.
create or replace function public.profile_finished_count(p_user uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select case when coalesce((p.prefs ->> 'hide_activity')::boolean, false) then null
    else (select count(*)::int from public.reading_progress rp
           where lower(rp.user_email) = lower(p.email) and coalesce(rp.progress_percentage, 0) >= 100) end
    from public.profiles p where p.id = p_user
$$;
revoke all on function public.profile_finished_count(uuid) from public;
grant execute on function public.profile_finished_count(uuid) to anon, authenticated;

-- A creator's audience: distinct readers of their books, and countries readers
-- chose in their preferences. Never returns who the readers are.
create or replace function public.creator_audience()
returns jsonb
language sql stable security definer set search_path = public as $$
  with r as (
    select distinct lower(rp.user_email) as em
      from public.reading_progress rp join public.books b on b.id = rp.book_id
     where b.user_id = auth.uid()
  ), c as (
    select p.prefs ->> 'country' as country, count(*)::int as n
      from r join public.profiles p on lower(p.email) = r.em
     where coalesce(p.prefs ->> 'country', '') <> ''
     group by 1
  )
  select jsonb_build_object(
    'readers', (select count(*) from r),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('country', country, 'n', n) order by n desc) from c), '[]'::jsonb))
$$;
revoke all on function public.creator_audience() from public, anon;
grant execute on function public.creator_audience() to authenticated;

-- 3. login_email ------------------------------------------------------------
drop function if exists public.login_email(text);

-- 4. creator_net_earned -----------------------------------------------------
create or replace function public.creator_net_earned(p_user uuid)
returns numeric
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is not null and auth.uid() <> p_user then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return round((
    coalesce((select sum(p.amount) from public.purchases p join public.books b on b.id = p.book_id where b.user_id = p_user), 0)
    + coalesce((select sum(pp.amount) from public.product_purchases pp join public.products pr on pr.id = pp.product_id where pr.user_id = p_user), 0)
  ) * public.creator_share(), 2);
end $$;

-- 5. Payout details need two-step sign-in when the account has it on.
-- (A helper with definer rights, because signed-in users can't read auth.mfa_factors.)
create or replace function public.mfa_satisfied()
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status = 'verified')
$$;
revoke all on function public.mfa_satisfied() from public, anon;
grant execute on function public.mfa_satisfied() to authenticated;
drop policy if exists payout_accounts_mfa on public.payout_accounts;
create policy payout_accounts_mfa on public.payout_accounts as restrictive for all to authenticated
  using ((select public.mfa_satisfied()));

-- 6. Housekeeping -------------------------------------------------------------
do $$
declare f text;
begin
  foreach f in array array['set_updated_at()', 'creator_share()', 'books_search_tsv_update()'] loop
    begin execute format('alter function public.%s set search_path = public', f); exception when undefined_function then null; end;
  end loop;
end $$;
do $$
declare r record;
begin
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prorettype = 'trigger'::regtype loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
  for r in select p.oid::regprocedure as sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = 'search_books' loop
    execute format('alter function %s set search_path = public', r.sig);
  end loop;
end $$;

create index if not exists ad_views_user_idx on public.ad_views (user_id);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);
create index if not exists book_collaborators_added_by_idx on public.book_collaborators (added_by);
create index if not exists communities_created_by_idx on public.communities (created_by);
create index if not exists community_posts_user_idx on public.community_posts (user_id);
create index if not exists coupon_redemptions_user_idx on public.coupon_redemptions (user_id);
create index if not exists paragraph_comments_user_idx on public.paragraph_comments (user_id);
create index if not exists payment_references_user_idx on public.payment_references (user_id);
create index if not exists product_reviews_user_idx on public.product_reviews (user_id);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);
create index if not exists promoted_books_book_idx on public.promoted_books (book_id);
create index if not exists promoted_books_user_idx on public.promoted_books (user_id);
create index if not exists promotions_book_idx on public.promotions (book_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists review_comments_user_idx on public.review_comments (user_id);
create index if not exists reviews_user_idx on public.reviews (user_id);

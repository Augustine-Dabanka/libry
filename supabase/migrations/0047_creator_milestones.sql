-- Lybry 0047: creator milestones (badges + awards) and age limits for creators.
--
-- 1. Milestones are worked out live from real numbers, never stored, so they
--    can't drift or be faked by editing a row:
--      followers -> badge tier   Bronze 100 · Silver 500 · Gold 2,500 ·
--                                Platinum 10,000 · Diamond 50,000 (Diamond
--                                is the "verified" outline on the profile)
--      paid sales -> award        100 · 1,000 · 10,000 books sold
--    Change the thresholds here; the app reads them from creator_milestones().
-- 2. Physical awards (like a Play Button) are by request from Gold upward.
--    Only the request is stored. The shipping address is collected by email
--    when the request is approved, so Lybry doesn't keep home addresses.
-- 3. Creators under 18 (by the date of birth on file) can't publish or switch
--    a book to "Mature". The limit lifts by itself on their 18th birthday.
--    A creator with no date of birth on file (older accounts, Google sign-in)
--    is asked for it before publishing Mature.
--
-- Requires 0044 (purchases.source) and 0046 (profile_private). Safe to re-run.

create or replace function public.creator_milestones(p_author text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  f int;
  s int;
  tiers text[] := array['bronze','silver','gold','platinum','diamond'];
  at int[]     := array[100, 500, 2500, 10000, 50000];
  awards int[] := array[100, 1000, 10000];
  tier text := null;
  next_tier text := 'bronze';
  next_at int := 100;
  award int := null;
  i int;
begin
  if p_author is null or btrim(p_author) = '' then return null; end if;
  select count(*) into f from public.author_follows where author = p_author;
  select count(*) into s
    from public.purchases p join public.books b on b.id = p.book_id
   where b.author = p_author and coalesce(p.amount, 0) > 0;
  for i in 1 .. array_length(at, 1) loop
    if f >= at[i] then
      tier := tiers[i];
      if i < array_length(at, 1) then next_tier := tiers[i + 1]; next_at := at[i + 1]; else next_tier := null; next_at := null; end if;
    end if;
  end loop;
  for i in 1 .. array_length(awards, 1) loop
    if s >= awards[i] then award := awards[i]; end if;
  end loop;
  return jsonb_build_object('followers', f, 'sales', s, 'tier', tier, 'next_tier', next_tier, 'next_at', next_at, 'sales_award', award);
end $$;
revoke all on function public.creator_milestones(text) from public;
grant execute on function public.creator_milestones(text) to anon, authenticated;

create table if not exists public.award_requests (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  tier       text not null check (tier in ('gold','platinum','diamond')),
  status     text not null default 'requested' check (status in ('requested','approved','shipped','declined')),
  created_at timestamptz not null default now(),
  unique (user_id, tier)
);
alter table public.award_requests enable row level security;
drop policy if exists award_requests_own on public.award_requests;
create policy award_requests_own on public.award_requests for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.award_requests from anon, authenticated;
grant select on public.award_requests to authenticated;

-- Ask for the physical award for a tier you've actually reached.
create or replace function public.request_physical_award(p_tier text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  pen text;
  m jsonb;
  rank_have int;
  rank_want int;
  order_ text[] := array['bronze','silver','gold','platinum','diamond'];
begin
  if me is null then raise exception 'Sign in first'; end if;
  if p_tier not in ('gold','platinum','diamond') then raise exception 'Physical awards start at Gold'; end if;
  select coalesce(nullif(pen_name, ''), full_name) into pen from public.profiles where id = me and coalesce(is_creator, false);
  if pen is null then raise exception 'Only creators can request awards'; end if;
  m := public.creator_milestones(pen);
  rank_have := coalesce(array_position(order_, m->>'tier'), 0);
  rank_want := array_position(order_, p_tier);
  if rank_have < rank_want then raise exception 'You haven''t reached % yet', p_tier; end if;
  insert into public.award_requests (user_id, tier) values (me, p_tier) on conflict (user_id, tier) do nothing;
  return 'requested';
end $$;
revoke all on function public.request_physical_award(text) from public;
grant execute on function public.request_physical_award(text) to authenticated;

-- Under-18 creators can't publish Mature books.
create or replace function public.guard_minor_mature()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dob date;
begin
  if auth.uid() is null then return new; end if;              -- admin / service tasks
  if new.age_rating is distinct from 'Mature' then return new; end if;
  if tg_op = 'UPDATE' and old.age_rating = 'Mature' then return new; end if; -- unchanged
  select date_of_birth into dob from public.profile_private where user_id = coalesce(new.user_id, auth.uid());
  if dob is null then
    raise exception 'Add your date of birth in Settings before publishing a Mature book.' using errcode = 'P0001';
  end if;
  if dob > (current_date - interval '18 years')::date then
    raise exception 'Mature books can be published from your 18th birthday.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists guard_minor_mature on public.books;
create trigger guard_minor_mature before insert or update of age_rating on public.books
  for each row execute function public.guard_minor_mature();

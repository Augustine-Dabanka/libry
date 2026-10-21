-- Lybry 0046: richer sign-up (date of birth, pronouns, koala avatar).
--
-- * Date of birth is asked at sign-up and STORED, privately:
--     - in its own table (profile_private), readable only by its owner,
--     - never changeable by the user afterwards (stops a minor editing it),
--     - used to block sign-ups under 13 and to pass the 18+ check without
--       asking again (see set_mature below).
--   Fix a wrong date for someone: update public.profile_private set date_of_birth = '...' where user_id = '...';
-- * Pronouns (optional, public on the profile) and the koala avatar (public).
--
-- Requires 0045. Safe to re-run.

alter table public.profiles add column if not exists pronouns text;
alter table public.profiles add column if not exists avatar jsonb;
do $$ begin
  alter table public.profiles add constraint profiles_pronouns_len check (pronouns is null or char_length(pronouns) <= 24);
exception when duplicate_object then null; end $$;

create table if not exists public.profile_private (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date not null,
  created_at    timestamptz not null default now()
);
alter table public.profile_private enable row level security;
drop policy if exists profile_private_own on public.profile_private;
create policy profile_private_own on public.profile_private for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.profile_private from anon, authenticated;
grant select on public.profile_private to authenticated;

-- Shared rule for a date of birth: real date, not in the future, 13 or older.
create or replace function public.leep_check_birth(p_birth date)
returns text language plpgsql immutable as $$
begin
  if p_birth is null then return 'Enter your date of birth.'; end if;
  if p_birth > current_date or p_birth < date '1900-01-01' then return 'That date of birth doesn''t look right.'; end if;
  if date_part('year', age(current_date, p_birth)) < 13 then return 'You need to be at least 13 to join Lybry.'; end if;
  return null;
end $$;

-- After a new auth user is created (runs after on_auth_user_created, which
-- makes the profile): store date of birth + pronouns from sign-up metadata.
-- Google/Discord sign-ups have no date of birth; they are asked later.
create or replace function public.leep_signup_extras()
returns trigger language plpgsql security definer set search_path = public as $$
declare raw text := nullif(new.raw_user_meta_data->>'date_of_birth', ''); dob date; err text; pr text;
begin
  if raw is not null then
    begin dob := raw::date; exception when others then dob := null; end;
    err := leep_check_birth(dob);
    if err is not null then raise exception '%', err; end if;
    insert into profile_private (user_id, date_of_birth) values (new.id, dob) on conflict (user_id) do nothing;
  end if;
  pr := nullif(trim(new.raw_user_meta_data->>'pronouns'), '');
  if pr is not null and pr <> 'Prefer not to say' then
    update profiles set pronouns = left(pr, 24) where id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists zz_leep_signup_extras on auth.users;
create trigger zz_leep_signup_extras after insert on auth.users
  for each row execute function public.leep_signup_extras();

-- For accounts without a date of birth yet (Google/Discord): set it once.
create or replace function public.set_birthdate(p_birth date)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); err text;
begin
  if uid is null then return query select false, 'Sign in first.'; return; end if;
  if exists (select 1 from profile_private where user_id = uid) then
    return query select false, 'Your date of birth is already set. Contact us to change it.'; return;
  end if;
  err := leep_check_birth(p_birth);
  if err is not null then return query select false, err; return; end if;
  insert into profile_private (user_id, date_of_birth) values (uid, p_birth);
  return query select true, 'Saved.';
end $$;
revoke all on function public.set_birthdate(date) from public, anon;
grant execute on function public.set_birthdate(date) to authenticated;

-- 18+ check (replaces 0045's version): uses the stored date of birth when
-- there is one, so readers who gave it at sign-up aren't asked again. A date
-- given here is stored too (once), so the account has one consistent birthday.
create or replace function public.set_mature(p_user uuid, p_on boolean, p_birth date default null)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare pr profiles%rowtype; stored date; dob date; age_years int;
begin
  select * into pr from profiles where id = p_user;
  if not found then return query select false, 'Profile not found.'; return; end if;
  perform set_config('leep.age_rpc', 'on', true);

  if not p_on then
    update profiles set show_mature = false where id = p_user;
    return query select true, 'Mature content is hidden.'; return;
  end if;

  if pr.mature_locked_until is not null and pr.mature_locked_until > now() then
    return query select false, 'Mature content can''t be turned on for this account yet.'; return;
  end if;

  select date_of_birth into stored from profile_private where user_id = p_user;
  dob := coalesce(stored, p_birth);

  if pr.adult_confirmed_at is null or stored is not null then
    if dob is null then return query select false, 'Enter your date of birth.'; return; end if;
    if dob > current_date or dob < date '1900-01-01' then
      return query select false, 'That date of birth doesn''t look right.'; return;
    end if;
    if stored is null then
      insert into profile_private (user_id, date_of_birth) values (p_user, dob) on conflict (user_id) do nothing;
    end if;
    age_years := date_part('year', age(current_date, dob))::int;
    if age_years < 18 then
      update profiles set show_mature = false,
             mature_locked_until = case when stored is null then now() + interval '30 days' else mature_locked_until end
       where id = p_user;
      return query select false, 'Mature content is only for readers 18 and over.'; return;
    end if;
    if pr.adult_confirmed_at is null then update profiles set adult_confirmed_at = now() where id = p_user; end if;
  end if;

  update profiles set show_mature = true where id = p_user;
  return query select true, 'Mature content is on.';
end $$;
revoke all on function public.set_mature(uuid, boolean, date) from public, anon, authenticated;
grant execute on function public.set_mature(uuid, boolean, date) to service_role;

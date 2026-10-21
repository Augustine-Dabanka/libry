-- Lybry 0045: focus on reading + a real 18+ gate.
--
-- 1) Digital products are switched off (features.products = false). The code
--    hides them while the switch is off; people who bought one keep access.
--    Turn back on later:
--      update public.site_settings set value = value || '{"products": true}' where key = 'features';
--
-- 2) Mature (18+) content can no longer be switched on with one tap.
--    Turning it ON now needs, on the server:
--      * the reader to prove it's them (password again, or a sign-in in the
--        last 15 minutes for Google/Discord accounts), and
--      * a one-time date-of-birth check showing 18 or older. The date itself
--        is NOT stored, only when the check passed. Under 18 locks the switch
--        for 30 days so it can't be retried with another date.
--    The database enforces it: a trigger refuses show_mature = true unless the
--    adult check has passed, and only the service role (the Lybry server) can
--    record that check. Turning it OFF is always allowed.
--
-- Honest limit: this is self-declared age plus re-authentication, not ID
-- verification. For legally required age checks you need an ID provider.
--
-- Safe to re-run. Run after 0044 (works without it too).

-- ---------- 1) products off ------------------------------------------------------
insert into public.site_settings (key, value, updated_by)
values ('features', '{}'::jsonb, 'migration 0045')
on conflict (key) do nothing;
update public.site_settings
   set value = value || '{"products": false}'::jsonb
 where key = 'features';

-- ---------- 2) age gate ----------------------------------------------------------
alter table public.profiles add column if not exists adult_confirmed_at timestamptz;
alter table public.profiles add column if not exists mature_locked_until timestamptz;

-- Anyone who had mature content on before this migration keeps it, but must
-- pass the new check the next time they turn it on after turning it off.
-- (We don't silently switch people's settings.)

create or replace function public.guard_mature()
returns trigger language plpgsql as $$
begin
  -- Only set_mature() (below) may touch the age-check columns.
  if coalesce(current_setting('leep.age_rpc', true), '') <> 'on' then
    if tg_op = 'INSERT' then
      new.adult_confirmed_at := null;
      new.mature_locked_until := null;
      if coalesce(new.show_mature, false) then new.show_mature := false; end if;
    else
      if new.adult_confirmed_at is distinct from old.adult_confirmed_at
         or new.mature_locked_until is distinct from old.mature_locked_until then
        raise exception 'age check fields can only be changed by the server';
      end if;
      if coalesce(new.show_mature, false) and not coalesce(old.show_mature, false) then
        raise exception 'turning on mature content needs the 18+ check';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_mature on public.profiles;
create trigger profiles_guard_mature
  before insert or update on public.profiles
  for each row execute function public.guard_mature();

-- Called only by the Lybry server (service role) AFTER it has re-authenticated
-- the reader. p_birth is only needed the first time.
create or replace function public.set_mature(p_user uuid, p_on boolean, p_birth date default null)
returns table (ok boolean, message text)
language plpgsql security definer set search_path = public as $$
declare pr profiles%rowtype; age_years int;
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

  if pr.adult_confirmed_at is null then
    if p_birth is null then
      return query select false, 'Enter your date of birth.'; return;
    end if;
    if p_birth > current_date or p_birth < date '1900-01-01' then
      return query select false, 'That date of birth doesn''t look right.'; return;
    end if;
    age_years := date_part('year', age(current_date, p_birth))::int;
    if age_years < 18 then
      update profiles set show_mature = false, mature_locked_until = now() + interval '30 days' where id = p_user;
      return query select false, 'Mature content is only for readers 18 and over.'; return;
    end if;
    update profiles set adult_confirmed_at = now() where id = p_user;
  end if;

  update profiles set show_mature = true where id = p_user;
  return query select true, 'Mature content is on.';
end $$;

revoke all on function public.set_mature(uuid, boolean, date) from public, anon, authenticated;
grant execute on function public.set_mature(uuid, boolean, date) to service_role;

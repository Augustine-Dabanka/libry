-- ============================================================
-- Libry — richer signup (full name + username) and username-or-email login.
-- Adds profiles.email (kept out of public reads) + a security-definer lookup
-- so the login form can accept a username OR an email. Run in the SQL editor.
-- ============================================================

alter table public.profiles add column if not exists email text;

-- Backfill existing profiles' email from auth.users (server-side has access).
update public.profiles p set email = u.email
from auth.users u where u.id = p.id and p.email is null;

-- New signups: carry full_name + username from metadata, store email.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(nullif(new.raw_user_meta_data->>'username', ''),
             split_part(coalesce(new.email, ''), '@', 1) || '-' || substr(md5(random()::text), 1, 4)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- Don't let unauthenticated clients bulk-scrape emails.
revoke select (email) on public.profiles from anon;

-- Login helper: given an email OR a username/full name, return the email to
-- sign in with. Security-definer so it can read the (revoked) email column.
create or replace function public.login_email(identifier text)
returns text language sql security definer set search_path = public stable as $$
  select case
    when position('@' in identifier) > 0 then identifier
    else (
      select email from public.profiles
      where lower(username) = lower(trim(identifier))
         or lower(full_name) = lower(trim(identifier))
      order by created_at limit 1
    )
  end;
$$;
grant execute on function public.login_email(text) to anon, authenticated;

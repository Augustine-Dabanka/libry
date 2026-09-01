-- ============================================================
-- Libry — Supabase Auth: profiles + RLS + auto-create trigger
-- Run this in the Supabase SQL editor. Safe to re-run (idempotent).
--
-- With Supabase Auth, identity lives in auth.users (managed by Supabase).
-- We mirror the public-facing bits into public.profiles, keyed by auth.uid().
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  full_name   text,
  avatar_url  text,
  is_creator  boolean not null default false,
  prefs       jsonb not null default '{}'::jsonb,   -- onboarding taste-quiz answers
  created_at  timestamptz not null default now()
);

-- If the table already existed without prefs, add it.
alter table public.profiles add column if not exists prefs jsonb not null default '{}'::jsonb;

alter table public.profiles enable row level security;

-- Public can read profiles (author names/avatars); a user manages only their own.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user is created (Google sign-in, etc.).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    split_part(coalesce(new.email, ''), '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

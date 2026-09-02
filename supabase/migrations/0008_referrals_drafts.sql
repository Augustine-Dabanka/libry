-- 0008 — draft/published books + referral tracking
-- Idempotent: safe to re-run.

-- ---------- Drafts ----------
-- New stories start as drafts; every existing row is treated as published.
alter table public.books
  add column if not exists is_published boolean not null default true;

-- ---------- Referrals ----------
-- Who referred this reader. Points at another profile.
alter table public.profiles
  add column if not exists referred_by uuid references public.profiles(id);

-- Record a referral for the CURRENT user. `referrer` may be a profile id or a
-- username. Self-referrals, unknown referrers, and overwrites are ignored, so
-- the credit is set once and only once.
create or replace function public.record_referral(referrer text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_id uuid;
begin
  if referrer is null or length(trim(referrer)) = 0 then
    return;
  end if;

  -- Try to read it as a uuid; fall back to a username lookup.
  begin
    ref_id := referrer::uuid;
    perform 1 from public.profiles where id = ref_id;
    if not found then ref_id := null; end if;
  exception when others then
    ref_id := null;
  end;

  if ref_id is null then
    select id into ref_id from public.profiles where username = referrer limit 1;
  end if;

  if ref_id is null or ref_id = auth.uid() then
    return;
  end if;

  update public.profiles
     set referred_by = ref_id
   where id = auth.uid()
     and referred_by is null;
end;
$$;

grant execute on function public.record_referral(text) to authenticated;

-- How many readers this creator has referred (bypasses profile-row RLS).
create or replace function public.my_referral_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.profiles where referred_by = auth.uid();
$$;

grant execute on function public.my_referral_count() to authenticated;

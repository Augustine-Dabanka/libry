-- Creator account governance (ban engine), decoupled from the reader account.
-- A profile is one person; `is_creator` says they can publish, and
-- `creator_status` governs whether that creator side is in good standing:
--   active    — normal.
--   suspended — temporary (14–30d) hold: publishing + payouts frozen, but the
--               person keeps full READER access. `creator_status_until` is when
--               it lifts; `creator_status_reason` is shown to them.
--   banned    — permanent: creator profile deactivated, payouts blocked; the
--               reader account survives (read-only creator side).
-- `payout_frozen` is a separate switch so payouts can be held (e.g. a Paystack
-- dispute) without suspending the whole creator account.
alter table public.profiles
  add column if not exists creator_status        text not null default 'active',
  add column if not exists creator_status_reason text,
  add column if not exists creator_status_until  timestamptz,
  add column if not exists payout_frozen         boolean not null default false;

do $$ begin
  alter table public.profiles
    add constraint profiles_creator_status_chk
    check (creator_status in ('active','suspended','banned'));
exception when duplicate_object then null; end $$;

-- Moderation fields must NOT be self-editable — otherwise a suspended/banned
-- creator could just flip themselves back to 'active'. This trigger silently
-- preserves the OLD moderation values on any UPDATE that isn't coming from the
-- service role (i.e. the backend / an admin), while letting the owner keep
-- editing their normal profile fields.
create or replace function public.guard_creator_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.creator_status        := old.creator_status;
    new.creator_status_reason := old.creator_status_reason;
    new.creator_status_until  := old.creator_status_until;
    new.payout_frozen         := old.payout_frozen;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_creator_status on public.profiles;
create trigger trg_guard_creator_status
  before update on public.profiles
  for each row execute function public.guard_creator_status();

-- Convenience: an admin/service-role call to change a creator's standing.
-- (Reader access is never touched here — that's a separate concern.)
create or replace function public.set_creator_status(
  p_user uuid,
  p_status text,
  p_reason text default null,
  p_until timestamptz default null,
  p_freeze_payout boolean default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active','suspended','banned') then
    raise exception 'invalid status %', p_status;
  end if;
  update public.profiles
     set creator_status        = p_status,
         creator_status_reason = p_reason,
         creator_status_until  = p_until,
         payout_frozen         = coalesce(p_freeze_payout, payout_frozen)
   where id = p_user;
end $$;

revoke all on function public.set_creator_status(uuid, text, text, timestamptz, boolean) from public, anon, authenticated;

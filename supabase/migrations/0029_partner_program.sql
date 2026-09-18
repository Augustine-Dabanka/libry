-- Library Partnership Program — Libry's equivalent of the YouTube Partner
-- Program. Creators earn from day one, but payouts unlock only after they're
-- reviewed and accepted into the program (identity + payout details verified,
-- good standing). Once approved, payouts are processed by the platform via
-- Paystack Transfers rather than by hand.
--
-- partner_status: none | pending | approved | rejected

alter table public.profiles
  add column if not exists partner_status     text not null default 'none',
  add column if not exists partner_applied_at timestamptz,
  add column if not exists partner_reviewed_at timestamptz;

-- A creator can move themselves none -> pending (apply). Only staff/service can
-- approve; the RLS update policy already restricts profiles to the owner, so we
-- gate the value transition in the app layer + a guard trigger.
create or replace function public.guard_partner_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- A normal user may only apply (none/rejected -> pending) or withdraw
  -- (pending -> none). Any other transition is reverted unless done by a
  -- service-role / definer context (auth.uid() is null under service key).
  if auth.uid() is not null and new.partner_status is distinct from old.partner_status then
    if not (
      (old.partner_status in ('none','rejected') and new.partner_status = 'pending') or
      (old.partner_status = 'pending' and new.partner_status = 'none')
    ) then
      new.partner_status := old.partner_status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_partner_status on public.profiles;
create trigger trg_guard_partner_status
  before update of partner_status on public.profiles
  for each row execute function public.guard_partner_status();

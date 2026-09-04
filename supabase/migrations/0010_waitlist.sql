-- Waitlist with referral positions.
-- The table is locked down (RLS on, no anon policies); everything goes through
-- the join_waitlist() RPC below, which runs as the definer so the browser can
-- add an entry and read its own position without seeing anyone else's email.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  ref_code    text unique not null,
  referred_by text,
  referrals   int  not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.waitlist enable row level security;
-- (no policies for anon/authenticated: direct table access is denied; use the RPC)

create or replace function public.join_waitlist(p_email text, p_ref text default null)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email   text := lower(trim(p_email));
  v_ref     text := nullif(trim(p_ref), '');
  v_code    text;
  v_created timestamptz;
  v_refs    int;
  v_total   int;
  v_position int;
  v_new     boolean := false;
begin
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return json_build_object('error', 'Please enter a valid email.');
  end if;

  select ref_code, created_at, referrals into v_code, v_created, v_refs
    from public.waitlist where email = v_email;

  if not found then
    -- generate a unique short referral code
    loop
      v_code := substr(md5(random()::text || clock_timestamp()::text || v_email), 1, 8);
      exit when not exists (select 1 from public.waitlist where ref_code = v_code);
    end loop;

    insert into public.waitlist (email, ref_code, referred_by)
      values (v_email, v_code, v_ref)
      returning created_at, referrals into v_created, v_refs;
    v_new := true;

    -- credit the referrer (can't credit yourself)
    if v_ref is not null then
      update public.waitlist
        set referrals = referrals + 1
        where ref_code = v_ref and email <> v_email;
    end if;
  end if;

  -- re-read referrals in case this signup just changed via a self-referral edge
  select referrals, created_at into v_refs, v_created from public.waitlist where email = v_email;

  select count(*) into v_total from public.waitlist;

  -- position: how many rank strictly above me (more referrals, or same referrals
  -- and joined earlier), plus one.
  select count(*) + 1 into v_position
    from public.waitlist w
    where w.referrals > v_refs
       or (w.referrals = v_refs and w.created_at < v_created);

  return json_build_object(
    'ref_code', v_code,
    'position', v_position,
    'total',    v_total,
    'referrals', v_refs,
    'is_new',   v_new
  );
end;
$$;

grant execute on function public.join_waitlist(text, text) to anon, authenticated;

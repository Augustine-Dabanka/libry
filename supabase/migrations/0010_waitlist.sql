-- Waitlist shared by the app's /waitlist page and the gated investor/preview
-- portal (investors.html). The table is locked down (RLS on, no policies); the
-- only way in or out is the two SECURITY DEFINER functions, so the public/anon
-- key can join and read the count without ever exposing the email list.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  role        text default 'reader',           -- 'reader' | 'author' | 'investor'
  ref_code    text unique default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  referred_by text,                             -- ref_code of whoever invited them
  referrals   int  default 0,
  created_at  timestamptz default now()
);

alter table public.waitlist enable row level security;
-- (intentionally no SELECT/INSERT policies — only the definer functions touch it)

-- Live count of everyone in line.
create or replace function public.waitlist_count()
returns int
language sql security definer set search_path = public
as $$
  select count(*)::int from public.waitlist;
$$;

-- Join the line (idempotent by email). Credits the referrer, then returns a
-- superset both front-ends can read:
--   position  : this joiner's rank (referrals first, then who joined earliest)
--   total     : everyone in line   (also returned as `count` for the portal)
--   referrals : how many this joiner has brought in
--   ref_code  : this joiner's own code to share
--   already   : true if they were already on the list
create or replace function public.join_waitlist(
  p_email text,
  p_role  text default 'reader',
  p_ref   text default null
)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  v_email   text := lower(trim(p_email));
  v_row     public.waitlist;
  v_total   int;
  v_pos     int;
  v_already boolean := false;
begin
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return json_build_object('error', 'invalid_email');
  end if;

  select * into v_row from public.waitlist where email = v_email;
  if found then
    v_already := true;
  else
    insert into public.waitlist (email, role, referred_by)
    values (v_email, coalesce(nullif(p_role, ''), 'reader'), nullif(p_ref, ''))
    returning * into v_row;

    if p_ref is not null and p_ref <> '' then
      update public.waitlist set referrals = referrals + 1 where ref_code = p_ref;
    end if;
  end if;

  select count(*)::int into v_total from public.waitlist;

  -- Rank: more referrals first; ties broken by who joined earliest.
  select count(*)::int + 1 into v_pos
  from public.waitlist w
  where w.referrals > v_row.referrals
     or (w.referrals = v_row.referrals and w.created_at < v_row.created_at);

  return json_build_object(
    'already',   v_already,
    'ref_code',  v_row.ref_code,
    'referrals', v_row.referrals,
    'position',  v_pos,
    'total',     v_total,
    'count',     v_total
  );
end;
$$;

grant execute on function public.waitlist_count() to anon, authenticated;
grant execute on function public.join_waitlist(text, text, text) to anon, authenticated;

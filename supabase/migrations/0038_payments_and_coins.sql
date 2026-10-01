-- ============================================================
-- Libry batch 6: payment hardening + coins, coupons, rewarded ads
-- Run once in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- ---------- 1) Purchases: no more self-granted sales ----------------------------
-- Before: any signed-in user could insert a purchase row for any book (or product)
-- with any amount, straight from the browser. That unlocked paid books for free
-- AND created fake creator earnings, which feed real payouts.
-- Now only the server (service role) records purchases, after verifying payment.
drop policy if exists purchases_insert on public.purchases;
drop policy if exists pp_buyer_insert  on public.product_purchases;

alter table public.purchases         add column if not exists simulated boolean not null default false;
alter table public.product_purchases add column if not exists simulated boolean not null default false;

-- Pre-launch "demo" checkouts gave access but were recorded at full price, which
-- counted as creator revenue. Keep the access, zero the money.
update public.purchases set amount = 0, simulated = true
  where reference ~ '^(demo|free)-' and (amount <> 0 or simulated = false);
update public.product_purchases set amount = 0, simulated = true
  where reference ~ '^(demo|free)-' and (amount <> 0 or simulated = false);
-- A creator "buying" their own book is not a sale.
update public.purchases p set amount = 0
  from public.books b where b.id = p.book_id and b.user_id = p.user_id and p.amount <> 0;

-- One Paystack reference can only ever pay for one order (no replaying a receipt).
create table if not exists public.payment_references (
  reference  text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  purpose    text not null,
  amount_minor bigint not null,
  created_at timestamptz not null default now()
);
alter table public.payment_references enable row level security;
-- (no policies: server only)

-- ---------- 2) Coins -----------------------------------------------------------
-- Two buckets: bonus coins (earned, coupons, ads) and paid coins (bought).
-- Spending uses paid coins first, and only paid coins turn into creator revenue,
-- so free coins can never become real payouts.
create table if not exists public.coin_wallets (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  bonus      integer not null default 0 check (bonus >= 0),
  paid       integer not null default 0 check (paid >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.coin_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  delta_bonus integer not null default 0,
  delta_paid  integer not null default 0,
  reason     text not null,
  ref        text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);
alter table public.coin_wallets enable row level security;
alter table public.coin_ledger  enable row level security;
drop policy if exists coin_wallets_own on public.coin_wallets;
create policy coin_wallets_own on public.coin_wallets for select to authenticated using (auth.uid() = user_id);
drop policy if exists coin_ledger_own on public.coin_ledger;
create policy coin_ledger_own on public.coin_ledger for select to authenticated using (auth.uid() = user_id);

-- Internal: apply one idempotent change. Returns false if this (reason, ref) was already applied.
create or replace function public._coins_apply(p_user uuid, p_bonus int, p_paid int, p_reason text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  insert into coin_ledger (user_id, delta_bonus, delta_paid, reason, ref)
  values (p_user, p_bonus, p_paid, p_reason, coalesce(p_ref, ''))
  on conflict (user_id, reason, ref) do nothing
  returning id into v_id;
  if v_id is null then return false; end if;
  insert into coin_wallets (user_id, bonus, paid) values (p_user, greatest(p_bonus, 0), greatest(p_paid, 0))
  on conflict (user_id) do update
    set bonus = coin_wallets.bonus + p_bonus, paid = coin_wallets.paid + p_paid, updated_at = now();
  return true;
end $$;
revoke all on function public._coins_apply(uuid, int, int, text, text) from public, anon, authenticated;

-- ---------- 3) Coupons ---------------------------------------------------------
create table if not exists public.coupons (
  code        text primary key check (code = upper(code) and code ~ '^[A-Z0-9-]{4,32}$'),
  coins       integer not null check (coins between 1 and 10000),
  max_uses    integer not null default 100 check (max_uses > 0),
  used        integer not null default 0,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  active      boolean not null default true,
  created_by  text,
  created_at  timestamptz not null default now()
);
create table if not exists public.coupon_redemptions (
  code       text not null references public.coupons (code) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (code, user_id)
);
alter table public.coupons enable row level security;            -- codes stay secret: no policies
alter table public.coupon_redemptions enable row level security;
drop policy if exists coupon_redemptions_own on public.coupon_redemptions;
create policy coupon_redemptions_own on public.coupon_redemptions for select to authenticated using (auth.uid() = user_id);

create or replace function public.redeem_coupon(p_code text)
returns table (ok boolean, message text, coins integer)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); c coupons%rowtype; v_code text := upper(trim(coalesce(p_code, '')));
begin
  if uid is null then return query select false, 'Sign in to redeem a code.', 0; return; end if;
  -- Throttle guessing: at most 10 attempts per hour per account.
  if (select count(*) from coin_ledger where user_id = uid and reason = 'coupon_attempt' and created_at > now() - interval '1 hour') >= 10 then
    return query select false, 'Too many tries. Wait an hour and try again.', 0; return;
  end if;
  perform _coins_apply(uid, 0, 0, 'coupon_attempt', gen_random_uuid()::text);

  select * into c from coupons where code = v_code for update;
  if not found or not c.active or c.starts_at > now() or (c.ends_at is not null and c.ends_at < now()) then
    return query select false, 'That code isn''t valid.', 0; return;
  end if;
  if c.used >= c.max_uses then return query select false, 'That code has been fully claimed.', 0; return; end if;
  begin
    insert into coupon_redemptions (code, user_id) values (v_code, uid);
  exception when unique_violation then
    return query select false, 'You''ve already used this code.', 0; return;
  end;
  update coupons set used = used + 1 where code = v_code;
  perform _coins_apply(uid, c.coins, 0, 'coupon', v_code);
  return query select true, 'Code redeemed.', c.coins;
end $$;
grant execute on function public.redeem_coupon(text) to authenticated;

-- ---------- 4) Rewarded ads ----------------------------------------------------
-- Opt-in only. The server stamps the start; the reward is paid only if the viewer
-- finishes at least 15 s later. Max 5 rewarded ads per rolling 24 h.
create table if not exists public.ad_views (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  started_at   timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.ad_views enable row level security;           -- server only

create or replace function public.start_rewarded_ad()
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_id uuid;
begin
  if uid is null then return null; end if;
  if (select count(*) from ad_views where user_id = uid and completed_at > now() - interval '1 day') >= 5 then return null; end if;
  insert into ad_views (user_id) values (uid) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.start_rewarded_ad() to authenticated;

create or replace function public.finish_rewarded_ad(p_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v ad_views%rowtype;
begin
  if uid is null then return 0; end if;
  select * into v from ad_views where id = p_id and user_id = uid for update;
  if not found or v.completed_at is not null then return 0; end if;
  if now() - v.started_at < interval '15 seconds' or now() - v.started_at > interval '10 minutes' then return 0; end if;
  if (select count(*) from ad_views where user_id = uid and completed_at > now() - interval '1 day') >= 5 then return 0; end if;
  update ad_views set completed_at = now() where id = p_id;
  perform _coins_apply(uid, 5, 0, 'rewarded_ad', p_id::text);
  return 5;
end $$;
grant execute on function public.finish_rewarded_ad(uuid) to authenticated;

-- ---------- 5) Spend: unlock a paid book with coins ------------------------------
-- 20 coins = 1 unit of list price (so a 2.00 book costs 40 coins). Paid coins are
-- spent first; only the paid share is recorded as purchase revenue (65% to the creator).
create or replace function public.unlock_book_with_coins(p_book bigint)
returns table (ok boolean, message text, cost integer)
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); b record; w coin_wallets%rowtype; v_cost int; use_paid int; use_bonus int;
begin
  if uid is null then return query select false, 'Sign in first.', 0; return; end if;
  select id, price, user_id, is_published into b from books where id = p_book;
  if not found or coalesce(b.price, 0) <= 0 or not coalesce(b.is_published, false) then
    return query select false, 'This book can''t be unlocked with coins.', 0; return;
  end if;
  if b.user_id = uid then return query select false, 'You already own this book.', 0; return; end if;
  if exists (select 1 from purchases where user_id = uid and book_id = p_book) then
    return query select false, 'You already own this book.', 0; return;
  end if;
  v_cost := ceil(b.price * 20)::int;
  select * into w from coin_wallets where user_id = uid for update;
  if not found or w.paid + w.bonus < v_cost then
    return query select false, 'Not enough coins.', v_cost; return;
  end if;
  use_paid := least(w.paid, v_cost); use_bonus := v_cost - use_paid;
  if not _coins_apply(uid, -use_bonus, -use_paid, 'unlock_book', p_book::text) then
    return query select false, 'You already own this book.', 0; return;
  end if;
  insert into purchases (user_id, book_id, amount, reference, simulated)
  values (uid, p_book, round(use_paid / 20.0, 2), 'coins-' || p_book || '-' || uid, false)
  on conflict (user_id, book_id) do nothing;
  return query select true, 'Unlocked.', v_cost;
end $$;
grant execute on function public.unlock_book_with_coins(bigint) to authenticated;

-- ---------- 6) Buying coins (server only, after Paystack verification) ----------
create or replace function public.grant_paid_coins(p_user uuid, p_coins int, p_reference text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_coins is null or p_coins <= 0 or p_coins > 100000 then return false; end if;
  return _coins_apply(p_user, 0, p_coins, 'purchase', p_reference);
end $$;
revoke all on function public.grant_paid_coins(uuid, int, text) from public, anon, authenticated;
grant execute on function public.grant_paid_coins(uuid, int, text) to service_role;

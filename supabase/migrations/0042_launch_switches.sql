-- Lybry: launch switches. Risky money features start OFF and are turned on
-- deliberately, in the database, where a modified browser can't bypass them.
--
--   rewarded_ads       : watch-to-earn coins. OFF until a real ad network pays
--                        you for each view; otherwise every ad is a free gift.
--   bonus_coins_unlock : earned (non-bought) coins can unlock PAID books. OFF,
--                        because a book unlocked with earned coins pays the
--                        creator nothing.
--
-- Flip one later (in the Supabase SQL editor):
--   update public.site_settings set value = value || '{"rewarded_ads": true}' where key = 'features';
-- Requires 0037 and 0038. Safe to re-run.

insert into public.site_settings (key, value, updated_by)
values ('features', '{"rewarded_ads": false, "bonus_coins_unlock": false}'::jsonb, 'migration 0042')
on conflict (key) do nothing;

drop policy if exists site_settings_read_schedule on public.site_settings;
create policy site_settings_read_schedule on public.site_settings
  for select to anon, authenticated using (key in ('theme_schedule', 'features'));

create or replace function public.feature_on(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value ->> p_name)::boolean from site_settings where key = 'features'), false);
$$;
grant execute on function public.feature_on(text) to anon, authenticated;

create or replace function public.start_rewarded_ad()
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_id uuid;
begin
  if uid is null or not feature_on('rewarded_ads') then return null; end if;
  if (select count(*) from ad_views where user_id = uid and completed_at > now() - interval '1 day') >= 5 then return null; end if;
  insert into ad_views (user_id) values (uid) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.start_rewarded_ad() to authenticated;

create or replace function public.finish_rewarded_ad(p_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v ad_views%rowtype;
begin
  if uid is null or not feature_on('rewarded_ads') then return 0; end if;
  select * into v from ad_views where id = p_id and user_id = uid for update;
  if not found or v.completed_at is not null then return 0; end if;
  if now() - v.started_at < interval '15 seconds' or now() - v.started_at > interval '10 minutes' then return 0; end if;
  if (select count(*) from ad_views where user_id = uid and completed_at > now() - interval '1 day') >= 5 then return 0; end if;
  update ad_views set completed_at = now() where id = p_id;
  perform _coins_apply(uid, 5, 0, 'rewarded_ad', p_id::text);
  return 5;
end $$;
grant execute on function public.finish_rewarded_ad(uuid) to authenticated;

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
  if not found then return query select false, 'Not enough coins.', v_cost; return; end if;
  if feature_on('bonus_coins_unlock') then
    if w.paid + w.bonus < v_cost then return query select false, 'Not enough coins.', v_cost; return; end if;
  else
    if w.paid < v_cost then
      return query select false, 'Paid books need bought coins for now (earned coins can''t be used here yet).', v_cost; return;
    end if;
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

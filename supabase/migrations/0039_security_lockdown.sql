-- ============================================================
-- Libry: security lockdown (run after 0038). Safe to re-run.
-- ============================================================

-- ---------- 1) Paid book text was readable by anyone ------------------------------
-- The books/chapters read policies let any visitor (even signed out, using the
-- public key) select `content`, i.e. download every paid book in full. Keep the
-- rows public (titles, covers, prices) but make the text columns server-only.
-- The site now fetches text with the service role after checking access.
alter table public.books add column if not exists has_content boolean
  generated always as (content is not null and length(content) > 0) stored;

do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'books' and column_name <> 'content';
  execute 'revoke select on public.books from anon, authenticated';
  execute format('grant select (%s) on public.books to anon, authenticated', cols);

  select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'chapters' and column_name <> 'content';
  execute 'revoke select on public.chapters from anon, authenticated';
  execute format('grant select (%s) on public.chapters to anon, authenticated', cols);
end $$;
-- NOTE: a column added to books/chapters later must be granted explicitly:
--   grant select (new_column) on public.books to anon, authenticated;

-- ---------- 2) Free Unlimited and free promotions --------------------------------
-- Readers could write their own subscriptions row (status active, any end date).
drop policy if exists subs_owner_all on public.subscriptions;
drop policy if exists subs_select_own on public.subscriptions;
create policy subs_select_own on public.subscriptions for select to authenticated using (user_id = auth.uid());

-- Creators could insert an "active" promotion or placement without paying.
drop policy if exists promotions_insert on public.promotions;
drop policy if exists promotions_update on public.promotions;
drop policy if exists promoted_insert   on public.promoted_books;

-- ---------- 3) Book fields owners must not set themselves -------------------------
-- Collaborators could hand a book (and its earnings) to themselves by changing
-- user_id; owners could mark their own book as an Editor's pick.
create or replace function public.guard_book_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- pg_trigger_depth() = 1: only direct edits by a user; updates made by other
  -- database triggers (e.g. recomputing stats) pass through.
  if auth.role() is distinct from 'service_role' and pg_trigger_depth() = 1 then
    if tg_op = 'INSERT' then
      new.is_editors_pick := false;
    else
      new.user_id := old.user_id;
      new.is_editors_pick := old.is_editors_pick;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_book_fields on public.books;
create trigger trg_guard_book_fields before insert or update on public.books
  for each row execute function public.guard_book_fields();

-- Star ratings are computed from reviews, never typed in by the author.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='books' and column_name='rating') then
    execute $f$
      create or replace function public.guard_book_rating()
      returns trigger language plpgsql security definer set search_path = public as $b$
      begin
        if auth.role() is distinct from 'service_role' and pg_trigger_depth() = 1 then
          if tg_op = 'INSERT' then new.rating := null; else new.rating := old.rating; end if;
        end if;
        return new;
      end $b$;
    $f$;
    execute 'drop trigger if exists trg_guard_book_rating on public.books';
    execute 'create trigger trg_guard_book_rating before insert or update on public.books for each row execute function public.guard_book_rating()';
  end if;
  -- Community member counts: owners could set any number.
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='communities' and column_name='member_count') then
    execute $f$
      create or replace function public.guard_community_count()
      returns trigger language plpgsql security definer set search_path = public as $b$
      begin
        if auth.role() is distinct from 'service_role' and pg_trigger_depth() = 1 then
          if tg_op = 'INSERT' then new.member_count := 0; else new.member_count := old.member_count; end if;
        end if;
        return new;
      end $b$;
    $f$;
    execute 'drop trigger if exists trg_guard_community_count on public.communities';
    execute 'create trigger trg_guard_community_count before insert or update on public.communities for each row execute function public.guard_community_count()';
  end if;
end $$;

-- ---------- 4) Referral attribution can only be set once --------------------------
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='referred_by') then
    execute $f$
      create or replace function public.guard_referred_by()
      returns trigger language plpgsql security definer set search_path = public as $b$
      begin
        if auth.role() is distinct from 'service_role' then
          if old.referred_by is not null then new.referred_by := old.referred_by; end if;
          if new.referred_by = new.id then new.referred_by := old.referred_by; end if;
        end if;
        return new;
      end $b$;
    $f$;
    execute 'drop trigger if exists trg_guard_referred_by on public.profiles';
    execute 'create trigger trg_guard_referred_by before update on public.profiles for each row execute function public.guard_referred_by()';
  end if;
end $$;

-- Creator revenue share moves from 70% to 65%.
-- The platform keeps 35% total: a 30% platform cut + a 5% platform/infra fee.
-- One immutable helper is the single source of truth so every earnings figure
-- (books today, digital products next) stays in lock-step.

create or replace function public.creator_share()
returns numeric
language sql
immutable
as $$ select 0.65::numeric $$;
grant execute on function public.creator_share() to authenticated, anon;

-- Aggregate creator earnings (gross / net / sales count).
create or replace function public.my_earnings()
returns table(gross numeric, net numeric, sales bigint)
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(p.amount),0)::numeric,
         (coalesce(sum(p.amount),0) * public.creator_share())::numeric,
         count(*)::bigint
  from purchases p join books b on b.id = p.book_id
  where b.user_id = auth.uid();
$$;
grant execute on function public.my_earnings() to authenticated;

-- Per-book revenue.
create or replace function public.my_book_sales()
returns table(book_id bigint, sales bigint, revenue numeric)
language sql
security definer
set search_path = public
as $$
  select p.book_id, count(*)::bigint,
         (coalesce(sum(p.amount),0) * public.creator_share())::numeric
  from purchases p join books b on b.id = p.book_id
  where b.user_id = auth.uid()
  group by p.book_id;
$$;
grant execute on function public.my_book_sales() to authenticated;

-- Lifetime net earned for a creator (used by the payout/balance engine).
create or replace function public.creator_net_earned(p_user uuid)
returns numeric
language sql
stable security definer
set search_path = public
as $$
  select round(coalesce(sum(p.amount), 0) * public.creator_share(), 2)
  from public.purchases p
  join public.books b on b.id = p.book_id
  where b.user_id = p_user;
$$;
grant execute on function public.creator_net_earned(uuid) to authenticated;

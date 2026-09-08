-- Pass 3B: creator earnings, derived from real purchases of a creator's books.
-- SECURITY DEFINER so a creator sees only their own aggregate totals without
-- exposing other users' purchase rows. Creators keep 70%; Libry keeps 30%.

create or replace function public.my_earnings()
returns table(gross numeric, net numeric, sales bigint)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(p.amount), 0)::numeric              as gross,
    (coalesce(sum(p.amount), 0) * 0.70)::numeric     as net,
    count(*)::bigint                                 as sales
  from purchases p
  join books b on b.id = p.book_id
  where b.user_id = auth.uid();
$$;
grant execute on function public.my_earnings() to authenticated;

create or replace function public.my_book_sales()
returns table(book_id bigint, sales bigint, revenue numeric)
language sql
security definer
set search_path = public
as $$
  select
    p.book_id,
    count(*)::bigint                              as sales,
    (coalesce(sum(p.amount), 0) * 0.70)::numeric  as revenue
  from purchases p
  join books b on b.id = p.book_id
  where b.user_id = auth.uid()
  group by p.book_id;
$$;
grant execute on function public.my_book_sales() to authenticated;

-- Digital products marketplace: creators sell more than books — templates,
-- audio, downloads, and (once a video host is wired) video & courses.
-- Earnings flow through the same 65% creator_share() as book sales.

create table if not exists public.products (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  type         text not null default 'download'
               check (type in ('download','template','audio','ebook','video','course','bundle')),
  price        numeric not null default 0 check (price >= 0),
  currency     text not null default 'USD',
  cover_url    text,
  file_path    text,          -- object path in the private 'product-files' bucket
  file_name    text,
  file_size    bigint,
  external_url text,          -- streaming/playback URL for video & course types
  category     text,
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_user_idx on public.products(user_id);
create index if not exists products_pub_idx  on public.products(is_published, created_at desc);

create table if not exists public.product_purchases (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  amount     numeric not null default 0,
  reference  text,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);
create index if not exists product_purchases_prod_idx on public.product_purchases(product_id);

alter table public.products          enable row level security;
alter table public.product_purchases enable row level security;

-- Products: published ones are readable by any signed-in user; owners see & manage all of theirs.
drop policy if exists products_read_published on public.products;
create policy products_read_published on public.products
  for select using (is_published = true or user_id = auth.uid());
drop policy if exists products_owner_insert on public.products;
create policy products_owner_insert on public.products
  for insert with check (user_id = auth.uid());
drop policy if exists products_owner_update on public.products;
create policy products_owner_update on public.products
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists products_owner_delete on public.products;
create policy products_owner_delete on public.products
  for delete using (user_id = auth.uid());

-- Product purchases: buyer sees their own; product owner sees who bought theirs.
drop policy if exists pp_buyer_read on public.product_purchases;
create policy pp_buyer_read on public.product_purchases
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid())
  );
drop policy if exists pp_buyer_insert on public.product_purchases;
create policy pp_buyer_insert on public.product_purchases
  for insert with check (user_id = auth.uid());

-- Earnings now span book + product sales, still on the 65% share.
create or replace function public.creator_net_earned(p_user uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select round((
    coalesce((select sum(p.amount) from public.purchases p
              join public.books b on b.id = p.book_id where b.user_id = p_user), 0)
    + coalesce((select sum(pp.amount) from public.product_purchases pp
              join public.products pr on pr.id = pp.product_id where pr.user_id = p_user), 0)
  ) * public.creator_share(), 2);
$$;
grant execute on function public.creator_net_earned(uuid) to authenticated;

-- Aggregate earnings tiles (books + products).
create or replace function public.my_earnings()
returns table(gross numeric, net numeric, sales bigint)
language sql security definer set search_path = public as $$
  with g as (
    select coalesce(sum(p.amount),0)::numeric amt, count(*)::bigint n
      from purchases p join books b on b.id = p.book_id where b.user_id = auth.uid()
  ), gp as (
    select coalesce(sum(pp.amount),0)::numeric amt, count(*)::bigint n
      from product_purchases pp join products pr on pr.id = pp.product_id where pr.user_id = auth.uid()
  )
  select (g.amt + gp.amt)::numeric,
         ((g.amt + gp.amt) * public.creator_share())::numeric,
         (g.n + gp.n)::bigint
  from g, gp;
$$;
grant execute on function public.my_earnings() to authenticated;

-- Private bucket for paid downloadable files. Delivered via server-signed URLs
-- only after a verified purchase, so it stays non-public.
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- Creators may upload/manage objects only inside their own <uid>/ folder.
drop policy if exists pf_owner_all on storage.objects;
create policy pf_owner_all on storage.objects
  for all to authenticated
  using (bucket_id = 'product-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'product-files' and (storage.foldername(name))[1] = auth.uid()::text);

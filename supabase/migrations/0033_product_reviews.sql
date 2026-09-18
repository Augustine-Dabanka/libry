-- Ratings + reviews for digital products, mirroring book reviews.
create table if not exists public.product_reviews (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  user_name  text,
  rating     int not null check (rating between 1 and 5),
  body       text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists product_reviews_product_idx on public.product_reviews(product_id, created_at desc);

alter table public.product_reviews enable row level security;
drop policy if exists pr_read on public.product_reviews;
create policy pr_read on public.product_reviews for select using (auth.uid() is not null);
drop policy if exists pr_upsert on public.product_reviews;
create policy pr_upsert on public.product_reviews for insert with check (user_id = auth.uid());
drop policy if exists pr_update on public.product_reviews;
create policy pr_update on public.product_reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists pr_delete on public.product_reviews;
create policy pr_delete on public.product_reviews for delete using (user_id = auth.uid());

-- Leep: let signed-out visitors preview products safely.
-- 1) The hosted video/course link (products.external_url) is what buyers pay
--    for, so visitors and other users can no longer read it straight from the
--    API. The app reads it on the server after checking ownership.
-- 2) Product reviews are public to read (writing still needs an account).
-- Run after the code from the same update is deployed. Safe to re-run.

revoke select on public.products from anon, authenticated;
grant select (id, user_id, title, description, type, price, currency, cover_url,
              file_path, file_name, file_size, category, is_published, created_at, updated_at)
  on public.products to anon, authenticated;

drop policy if exists pr_read on public.product_reviews;
create policy pr_read on public.product_reviews for select using (true);

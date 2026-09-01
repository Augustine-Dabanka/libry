-- ============================================================
-- Libry — books/chapters ownership + RLS for Supabase Auth
-- Run in the Supabase SQL editor (safe to re-run).
--
-- Ties book ownership to auth.uid() via a new user_id column, and adds
-- row-level security so: everyone can read PUBLISHED books, and a creator
-- can insert/update/delete only their own.
-- ============================================================

-- Ownership column (older rows created under custom-auth stay null).
alter table public.books add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists idx_books_user on public.books (user_id);

-- ---------- books ----------
alter table public.books enable row level security;

drop policy if exists books_select on public.books;
create policy books_select on public.books
  for select
  using (status <> 'Draft' or auth.uid() = user_id);   -- public sees published; owner sees own drafts

drop policy if exists books_insert on public.books;
create policy books_insert on public.books
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists books_update on public.books;
create policy books_update on public.books
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists books_delete on public.books;
create policy books_delete on public.books
  for delete to authenticated
  using (auth.uid() = user_id);

-- ---------- chapters ----------
alter table public.chapters enable row level security;

drop policy if exists chapters_select on public.chapters;
create policy chapters_select on public.chapters
  for select using (true);

drop policy if exists chapters_insert on public.chapters;
create policy chapters_insert on public.chapters
  for insert to authenticated
  with check (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));

drop policy if exists chapters_update on public.chapters;
create policy chapters_update on public.chapters
  for update to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));

drop policy if exists chapters_delete on public.chapters;
create policy chapters_delete on public.chapters
  for delete to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));

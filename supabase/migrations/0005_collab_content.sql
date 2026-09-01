-- ============================================================
-- Libry — Collaboration (co-authors) + Content controls (age ratings)
-- Run in the Supabase SQL editor (safe to re-run).
-- ============================================================

-- ---------- book_collaborators ----------
create table if not exists public.book_collaborators (
  id         bigint generated always as identity primary key,
  book_id    bigint not null references public.books (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'editor',
  added_by   uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (book_id, user_id)
);
create index if not exists idx_collab_user on public.book_collaborators (user_id);
create index if not exists idx_collab_book on public.book_collaborators (book_id);

alter table public.book_collaborators enable row level security;

drop policy if exists collab_select on public.book_collaborators;
create policy collab_select on public.book_collaborators for select using (true);
-- Only a book's owner may add/remove collaborators.
drop policy if exists collab_insert on public.book_collaborators;
create policy collab_insert on public.book_collaborators for insert to authenticated
  with check (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));
drop policy if exists collab_delete on public.book_collaborators;
create policy collab_delete on public.book_collaborators for delete to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.user_id = auth.uid()));

-- ---------- age rating on books ----------
alter table public.books
  add column if not exists age_rating text not null default 'All Ages'
  check (age_rating in ('All Ages', '9+', '13+', '18+'));

-- Let collaborators edit the book too (owner OR accepted collaborator).
drop policy if exists books_update on public.books;
create policy books_update on public.books
  for update to authenticated
  using (
    auth.uid() = user_id
    or exists (select 1 from public.book_collaborators c where c.book_id = id and c.user_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.book_collaborators c where c.book_id = id and c.user_id = auth.uid())
  );

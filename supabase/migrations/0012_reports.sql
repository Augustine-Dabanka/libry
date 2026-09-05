-- Trust & safety: let readers flag a book. Reports are write-only for users
-- (insert your own); only the team reads them via the service role.
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  book_id     bigint not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason      text not null,
  note        text,
  created_at  timestamptz default now()
);
alter table public.reports enable row level security;
drop policy if exists "insert own report" on public.reports;
create policy "insert own report" on public.reports for insert with check (auth.uid() = reporter_id);
-- (no SELECT policy — reports are reviewed by the team, not exposed to users)

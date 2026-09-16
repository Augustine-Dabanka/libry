-- Cache for AI-generated mid-read comprehension questions. Generated once per
-- (book, checkpoint) from the book's own text and shared across readers, so the
-- model is called ~3 times per book, ever — not per read. Guarded in the app:
-- with no cache table (or no ANTHROPIC_API_KEY) the reader falls back to the
-- gentle reflection prompt.
create table if not exists public.book_questions (
  book_id    bigint not null,
  checkpoint int not null,          -- 25 | 50 | 75
  question   text not null,
  options    jsonb not null,        -- ["A","B","C"]
  answer     int not null,          -- 0-based index of the correct option
  created_at timestamptz not null default now(),
  primary key (book_id, checkpoint)
);

alter table public.book_questions enable row level security;

-- Questions are derived from public book content and shared across readers.
drop policy if exists book_questions_select on public.book_questions;
create policy book_questions_select on public.book_questions
  for select to authenticated using (true);

drop policy if exists book_questions_insert on public.book_questions;
create policy book_questions_insert on public.book_questions
  for insert to authenticated with check (true);

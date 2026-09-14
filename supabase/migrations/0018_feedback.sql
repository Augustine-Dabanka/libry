-- Exit-survey / general feedback. Optional: the logout survey no-ops gracefully
-- until this exists, then starts persisting responses.
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users (id) on delete set null,
  kind        text not null default 'exit_survey',
  reason      text,
  note        text,
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- A signed-in user may leave feedback as themselves (or anonymously via null).
drop policy if exists feedback_insert on public.feedback;
create policy feedback_insert on public.feedback
  for insert to authenticated
  with check (user_id is null or auth.uid() = user_id);

-- No public read: feedback is for the owner (read it via the dashboard / service role).

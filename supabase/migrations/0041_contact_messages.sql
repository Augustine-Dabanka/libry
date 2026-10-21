-- Lybry: contact form inbox (replaces every "[CONTACT EMAIL]" placeholder).
-- Messages are written ONLY through submit_contact(), which rate-limits;
-- nobody can read them except staff via the dashboard / service role.
-- Safe to run any time, safe to re-run.

create table if not exists public.contact_messages (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null check (char_length(name) between 1 and 80),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  topic       text not null check (topic in ('support','refund','privacy','safety','creators','other')),
  body        text not null check (char_length(body) between 10 and 4000),
  ip_hash     text,
  handled     boolean not null default false
);
create index if not exists contact_messages_recent on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
-- No policies on purpose: anon/authenticated can't select, insert or update directly.
revoke all on public.contact_messages from anon, authenticated;

create or replace function public.submit_contact(
  p_name text, p_email text, p_topic text, p_body text, p_ip_hash text
) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  new_id bigint;
begin
  -- Per-sender limit (signed-in user, else hashed IP): 5 an hour.
  if (select count(*) from contact_messages
       where created_at > now() - interval '1 hour'
         and ((auth.uid() is not null and user_id = auth.uid())
              or (p_ip_hash is not null and ip_hash = p_ip_hash))) >= 5 then
    raise exception 'rate_limited';
  end if;
  -- Global flood brake: 300 an hour across everyone.
  if (select count(*) from contact_messages where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate_limited';
  end if;

  insert into contact_messages (user_id, name, email, topic, body, ip_hash)
  values (auth.uid(), trim(p_name), lower(trim(p_email)), p_topic, trim(p_body), left(p_ip_hash, 64))
  returning id into new_id;
  return new_id;
end $$;

revoke all on function public.submit_contact(text, text, text, text, text) from public;
grant execute on function public.submit_contact(text, text, text, text, text) to anon, authenticated;

-- Optional marketing consent captured at sign-up (never required).
alter table public.profiles add column if not exists marketing_opt_in boolean default false;

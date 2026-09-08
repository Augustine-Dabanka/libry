-- Pass 3A: creator identity. A single auth system with a creator role + a
-- public author profile (pen name + bio) that powers "About the Author".
alter table public.profiles add column if not exists is_creator boolean default false;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists pen_name text;

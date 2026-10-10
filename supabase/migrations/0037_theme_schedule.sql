-- Libry: site-wide settings (currently the seasonal theme schedule).
-- Everyone can read the schedule (the site needs it to pick today's theme);
-- only staff can change it, through /admin, which writes with the service role.
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
alter table public.site_settings enable row level security;
drop policy if exists site_settings_read_schedule on public.site_settings;
create policy site_settings_read_schedule on public.site_settings
  for select to anon, authenticated using (key = 'theme_schedule');
-- (no insert/update/delete policies)

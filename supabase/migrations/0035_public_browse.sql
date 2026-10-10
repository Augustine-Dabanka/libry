-- Libry: let signed-out visitors see the community directory (name, description,
-- cover, member count). Joining, posting and creating still need an account.
drop policy if exists communities_read_public on public.communities;
create policy communities_read_public on public.communities for select to anon using (true);

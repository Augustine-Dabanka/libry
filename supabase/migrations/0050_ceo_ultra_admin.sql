-- Libry 0050: grant CEO Ultra Admin role after 0049_staff_and_channels.sql.
-- Run only after the staff_roles table from migration 0049 exists.
-- This SQL does not create or modify the Supabase Auth account.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  IF to_regclass('public.staff_roles') IS NULL THEN
    RAISE EXCEPTION 'public.staff_roles does not exist. Apply supabase/migrations/0049_staff_and_channels.sql first.';
  END IF;

  SELECT id
    INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower('gamehigh31@gmail.com')
     AND email_confirmed_at IS NOT NULL
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No confirmed Supabase Auth account found for gamehigh31@gmail.com. Create/confirm that account, then rerun this SQL.';
  END IF;

  INSERT INTO public.staff_roles
    (user_id, role, finance_access, granted_by, updated_at)
  VALUES
    (v_user_id, 'ultra_admin', true, NULL, now())
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'ultra_admin',
        finance_access = true,
        updated_at = now();
END $$;

-- Verify the mapping without exposing other users:
SELECT u.email, sr.role, sr.finance_access
  FROM auth.users AS u
  JOIN public.staff_roles AS sr ON sr.user_id = u.id
 WHERE lower(u.email) = lower('gamehigh31@gmail.com');

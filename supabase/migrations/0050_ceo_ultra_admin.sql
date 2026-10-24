-- Libry 0050: split CEO Ultra Admin from standard Ultra Admin and grant CEO.
-- Apply after 0049_staff_and_channels.sql has created staff_roles and staff_roster.
-- Existing 'ultra_admin' staff keep the standard Ultra Admin role.

DO $$
BEGIN
  IF to_regclass('public.staff_roles') IS NULL THEN
    RAISE EXCEPTION 'Apply 0049_staff_and_channels.sql first: public.staff_roles is missing.';
  END IF;

  IF to_regclass('public.staff_roster') IS NULL THEN
    RAISE EXCEPTION 'Apply 0049_staff_and_channels.sql first: public.staff_roster is missing.';
  END IF;
END $$;

-- Expand allowed roles without deleting or demoting existing staff.
ALTER TABLE public.staff_roles
  DROP CONSTRAINT IF EXISTS staff_roles_role_check;
ALTER TABLE public.staff_roles
  ADD CONSTRAINT staff_roles_role_check
  CHECK (role IN (
    'ceo_ultra_admin',
    'ultra_admin',
    'super_admin',
    'admin',
    'manager',
    'moderator',
    'accountant',
    'accountant_2',
    'staff'
  ));

ALTER TABLE public.staff_roster
  DROP CONSTRAINT IF EXISTS staff_roster_role_check;
ALTER TABLE public.staff_roster
  ADD CONSTRAINT staff_roster_role_check
  CHECK (role IN (
    'ceo_ultra_admin',
    'ultra_admin',
    'super_admin',
    'admin',
    'manager',
    'moderator',
    'accountant',
    'accountant_2',
    'staff'
  ));

-- Grant CEO Ultra Admin to the existing, confirmed Auth account.
-- This is idempotent. It does not create an Auth account.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id
    INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower('gamehigh31@gmail.com')
     AND email_confirmed_at IS NOT NULL
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No confirmed Supabase Auth account found for gamehigh31@gmail.com.';
  END IF;

  INSERT INTO public.staff_roles
    (user_id, role, finance_access, granted_by, updated_at)
  VALUES
    (v_user_id, 'ceo_ultra_admin', true, NULL, now())
  ON CONFLICT (user_id) DO UPDATE
    SET role = 'ceo_ultra_admin',
        finance_access = true,
        updated_at = now();

  -- Keep a matching roster role if this user already has a roster entry.
  UPDATE public.staff_roster
     SET role = 'ceo_ultra_admin'
   WHERE user_id = v_user_id;
END $$;

-- Verify CEO role.
SELECT u.email, sr.role, sr.finance_access
  FROM auth.users AS u
  JOIN public.staff_roles AS sr ON sr.user_id = u.id
 WHERE lower(u.email) = lower('gamehigh31@gmail.com');

-- To grant another staff admin, use their confirmed Auth UUID and a permitted role:
-- INSERT INTO public.staff_roles (user_id, role, finance_access, granted_by)
-- VALUES ('REPLACE-WITH-AUTH-USER-UUID', 'admin', false, NULL)
-- ON CONFLICT (user_id) DO UPDATE
-- SET role = EXCLUDED.role, finance_access = EXCLUDED.finance_access, updated_at = now();
-- Allowed roles: ultra_admin (standard), super_admin, admin, manager, moderator,
-- accountant, accountant_2, staff. Do not assign ceo_ultra_admin except to the CEO.

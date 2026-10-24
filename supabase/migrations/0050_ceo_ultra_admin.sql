-- Libry 0050: separate CEO Ultra Admin from standard Ultra Admin.
-- Apply after 0049_staff_and_channels.sql creates staff_roles and staff_roster.
-- Existing ultra_admin staff remain standard Ultra Admin.

DO $$
BEGIN
  IF to_regclass('public.staff_roles') IS NULL THEN
    RAISE EXCEPTION 'Apply 0049_staff_and_channels.sql first: public.staff_roles is missing.';
  END IF;
  IF to_regclass('public.staff_roster') IS NULL THEN
    RAISE EXCEPTION 'Apply 0049_staff_and_channels.sql first: public.staff_roster is missing.';
  END IF;
END $$;

-- Allow all nine staff roles in both tables.
ALTER TABLE public.staff_roles
  DROP CONSTRAINT IF EXISTS staff_roles_role_check;
ALTER TABLE public.staff_roles
  ADD CONSTRAINT staff_roles_role_check CHECK (role IN (
    'ceo_ultra_admin', 'ultra_admin', 'super_admin', 'admin', 'manager',
    'moderator', 'accountant', 'accountant_2', 'staff'
  ));

ALTER TABLE public.staff_roster
  DROP CONSTRAINT IF EXISTS staff_roster_role_check;
ALTER TABLE public.staff_roster
  ADD CONSTRAINT staff_roster_role_check CHECK (role IN (
    'ceo_ultra_admin', 'ultra_admin', 'super_admin', 'admin', 'manager',
    'moderator', 'accountant', 'accountant_2', 'staff'
  ));

-- There are now nine ranks. Keep the staff-code suffix format compatible.
ALTER TABLE public.staff_roles
  DROP CONSTRAINT IF EXISTS staff_roles_code_fmt;
ALTER TABLE public.staff_roles
  ADD CONSTRAINT staff_roles_code_fmt
  CHECK (staff_code IS NULL OR staff_code ~ '^LP-[0-9]{4}-[0-9]{4}\.[1-9]$');

ALTER TABLE public.staff_roster
  DROP CONSTRAINT IF EXISTS staff_roster_staff_code_check;
ALTER TABLE public.staff_roster
  ADD CONSTRAINT staff_roster_staff_code_check
  CHECK (staff_code ~ '^LP-[0-9]{4}-[0-9]{4}\.[1-9]$');

-- Update suffixes to match the new rank order. Staff codes are identifiers,
-- not the authorization source.
UPDATE public.staff_roles
SET staff_code = left(staff_code, length(staff_code) - 1) ||
  CASE role
    WHEN 'ceo_ultra_admin' THEN '1'
    WHEN 'ultra_admin' THEN '2'
    WHEN 'super_admin' THEN '3'
    WHEN 'admin' THEN '4'
    WHEN 'manager' THEN '5'
    WHEN 'moderator' THEN '6'
    WHEN 'accountant' THEN '7'
    WHEN 'accountant_2' THEN '8'
    WHEN 'staff' THEN '9'
  END
WHERE staff_code IS NOT NULL;

UPDATE public.staff_roster
SET staff_code = left(staff_code, length(staff_code) - 1) ||
  CASE role
    WHEN 'ceo_ultra_admin' THEN '1'
    WHEN 'ultra_admin' THEN '2'
    WHEN 'super_admin' THEN '3'
    WHEN 'admin' THEN '4'
    WHEN 'manager' THEN '5'
    WHEN 'moderator' THEN '6'
    WHEN 'accountant' THEN '7'
    WHEN 'accountant_2' THEN '8'
    WHEN 'staff' THEN '9'
  END;

-- Assign CEO Ultra Admin to the existing, confirmed CEO Auth account.
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
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
        staff_code = CASE
          WHEN public.staff_roles.staff_code IS NULL THEN NULL
          ELSE left(public.staff_roles.staff_code, length(public.staff_roles.staff_code) - 1) || '1'
        END,
        updated_at = now();

  UPDATE public.staff_roster
  SET role = 'ceo_ultra_admin',
      staff_code = left(staff_code, length(staff_code) - 1) || '1'
  WHERE user_id = v_user_id
    AND staff_code IS NOT NULL;
END $$;

-- Verify the CEO assignment.
SELECT u.email, sr.role, sr.finance_access
FROM auth.users AS u
JOIN public.staff_roles AS sr ON sr.user_id = u.id
WHERE lower(u.email) = lower('gamehigh31@gmail.com');

-- To grant another staff member, use their confirmed Auth UUID and a role
-- other than ceo_ultra_admin. Example:
-- INSERT INTO public.staff_roles (user_id, role, finance_access, granted_by)
-- VALUES ('REPLACE-WITH-AUTH-USER-UUID', 'admin', false, NULL)
-- ON CONFLICT (user_id) DO UPDATE
-- SET role = EXCLUDED.role,
--     finance_access = EXCLUDED.finance_access,
--     updated_at = now();
-- Allowed non-CEO roles: ultra_admin, super_admin, admin, manager,
-- moderator, accountant, accountant_2, staff.

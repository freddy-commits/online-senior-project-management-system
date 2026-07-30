-- ============================================================================
-- MIGRATION: Fix handle_new_user trigger to save department from registration
-- Date:       2026-07-30
-- Problem:    The trigger only inserted (id, email, full_name, role) into profiles.
--             Department selected at registration was never written by the trigger,
--             and the subsequent upsert's ON CONFLICT clause would also miss it.
-- Fix:        Read department from user_metadata in the trigger and include it
--             in both the INSERT and ON CONFLICT UPDATE — preserving any existing
--             department value (COALESCE prefers existing over new).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $func$
DECLARE
  v_role text;
  v_fullname text;
  v_department text;
BEGIN
  v_role       := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_fullname   := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  v_department := COALESCE(NEW.raw_user_meta_data->>'department', NULL);

  -- Enforce canonical role names — unknown roles default to 'student'
  IF v_role NOT IN ('student', 'instructor', 'supervisor', 'industry_partner', 'examiner', 'admin') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, department)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_fullname, v_role, v_department)
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name,  profiles.full_name),
    role       = COALESCE(EXCLUDED.role,       profiles.role),
    -- Preserve any department already on the profile; fall back to the new value
    department = COALESCE(profiles.department, EXCLUDED.department);

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE LOG 'handle_new_user failed silently: %', SQLERRM;
  RETURN NEW;
END;
$func$;

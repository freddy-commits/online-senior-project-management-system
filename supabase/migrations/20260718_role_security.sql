-- ============================================================================
-- MIGRATION: Role Security Hardening & Role Request System
-- Date:       2026-07-18
-- Description:
--   1. Migrates legacy role values (industry → industry_partner, examiner_panel → examiner)
--   2. Adds/replaces the CHECK constraint on profiles.role to enforce the new enum
--   3. Sets profiles.role DEFAULT to 'student' at the database level
--   4. Updates public.handle_new_user trigger function to use new roles
--   5. Creates the role_requests table for the approval workflow
--   6. Adds a trigger that prevents authenticated users from changing their own role
--      (only the service_role can update the role column)
--   7. Adds RLS policies on role_requests
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Migrate legacy role values to canonical names
-- Run data migration BEFORE altering the constraint so existing rows are valid
-- ----------------------------------------------------------------------------
UPDATE public.profiles SET role = 'industry_partner' WHERE role = 'industry';
UPDATE public.profiles SET role = 'examiner'         WHERE role = 'examiner_panel';

-- ----------------------------------------------------------------------------
-- STEP 2: Replace the check constraint on profiles.role
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'instructor', 'supervisor', 'industry_partner', 'examiner', 'admin'));

-- Set the database-level default so all new rows start as 'student' regardless
-- of what the application layer sends (defense-in-depth).
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student';

-- ----------------------------------------------------------------------------
-- STEP 3: Update public.handle_new_user trigger function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $func$
DECLARE
  v_role text;
  v_fullname text;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_fullname := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- Use canonical list of role names
  IF v_role NOT IN ('student', 'instructor', 'supervisor', 'industry_partner', 'examiner', 'admin') THEN
    v_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.email, ''), v_fullname, v_role)
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role       = COALESCE(EXCLUDED.role, profiles.role);

  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE LOG 'handle_new_user failed silently: %', SQLERRM;
  RETURN NEW;
END;
$func$;

-- ----------------------------------------------------------------------------
-- STEP 4: Create the role_requests table
-- Users with non-student roles submit requests here; admins/instructors approve them.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_role text        NOT NULL
                             CHECK (requested_role IN ('instructor', 'supervisor', 'industry_partner', 'examiner')),
  department     text,
  status         text        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  reviewed_by    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_role  text,
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_role_requests_user_id   ON public.role_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_role_requests_status    ON public.role_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_requests_dept      ON public.role_requests(department);

-- ----------------------------------------------------------------------------
-- STEP 5: Trigger to block self-role-update on profiles
--
-- Any UPDATE that changes the `role` column is rejected UNLESS the caller is
-- the Supabase service_role (i.e., called from server-side admin client).
-- This is the primary security backstop — even if RLS is misconfigured, this
-- trigger prevents privilege escalation.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if the caller is the service role (server-side admin operations)
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Reject any attempt by a regular authenticated user to change their own role
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION
      'Permission denied: you cannot change your own role. '
      'Submit a role request via the role_requests table instead.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate to ensure idempotency
DROP TRIGGER IF EXISTS trg_prevent_role_self_update ON public.profiles;

CREATE TRIGGER trg_prevent_role_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_update();

-- ----------------------------------------------------------------------------
-- STEP 6: Enable RLS on role_requests and add policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can view their own requests
DROP POLICY IF EXISTS "role_requests_select_own" ON public.role_requests;
CREATE POLICY "role_requests_select_own"
  ON public.role_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: admins can view all requests
DROP POLICY IF EXISTS "role_requests_select_admin" ON public.role_requests;
CREATE POLICY "role_requests_select_admin"
  ON public.role_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: instructors can view requests relevant to their department scope
DROP POLICY IF EXISTS "role_requests_select_instructor" ON public.role_requests;
CREATE POLICY "role_requests_select_instructor"
  ON public.role_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'instructor'
        AND (
          -- Instructor can see requests for their department
          p.department = role_requests.department
          -- Or requests where requested_role is not department-scoped
          OR role_requests.department IS NULL
        )
    )
  );

-- Policy: authenticated users can insert their own requests
DROP POLICY IF EXISTS "role_requests_insert_own" ON public.role_requests;
CREATE POLICY "role_requests_insert_own"
  ON public.role_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: only service_role can UPDATE role_requests (approvals happen server-side)
-- Regular users and even admins via the browser cannot UPDATE directly.
-- Approval Server Actions use the admin client (service_role) to update.
DROP POLICY IF EXISTS "role_requests_update_service" ON public.role_requests;
CREATE POLICY "role_requests_update_service"
  ON public.role_requests
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

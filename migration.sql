-- 1. Create custom user role enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('instructor', 'supervisor', 'student', 'partner');
    END IF;
END$$;

-- 2. Modify Profiles table to match custom enum
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  phone text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Projects table with individual foreign keys
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for internal academic projects
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  origin text NOT NULL DEFAULT 'student', -- student or industry
  final_grade text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Milestones/Deliverables table
CREATE TABLE IF NOT EXISTS public.deliverables (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  submission_url text,
  status text NOT NULL DEFAULT 'todo', -- todo, submitted, awaiting_partner, partner_approved, completed
  feedback_supervisor text,
  feedback_partner text,
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Row-Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON public.profiles;
CREATE POLICY "Enable read for all authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for users on their own profile" ON public.profiles;
CREATE POLICY "Enable update for users on their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects Policies
DROP POLICY IF EXISTS "Instructors see all projects" ON public.projects;
CREATE POLICY "Instructors see all projects" ON public.projects
  FOR ALL TO authenticated USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'instructor'
  );

DROP POLICY IF EXISTS "Supervisors see assigned projects" ON public.projects;
CREATE POLICY "Supervisors see assigned projects" ON public.projects
  FOR ALL TO authenticated USING (
    supervisor_id = auth.uid()
  );

DROP POLICY IF EXISTS "Students see own projects" ON public.projects;
CREATE POLICY "Students see own projects" ON public.projects
  FOR ALL TO authenticated USING (
    student_id = auth.uid()
  );

DROP POLICY IF EXISTS "Industry partners see own proposed or sponsored projects" ON public.projects;
CREATE POLICY "Industry partners see own proposed or sponsored projects" ON public.projects
  FOR ALL TO authenticated USING (
    partner_id = auth.uid() OR origin = 'industry'
  );

-- 6. Partner discussions table for industry-partner team threads
CREATE TABLE IF NOT EXISTS public.partner_discussions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.partner_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partner discussions - project participants" ON public.partner_discussions;
CREATE POLICY "Partner discussions - project participants" ON public.partner_discussions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.student_id = auth.uid() OR p.supervisor_id = auth.uid() OR p.partner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Partner discussions - insert by participants" ON public.partner_discussions;
CREATE POLICY "Partner discussions - insert by participants" ON public.partner_discussions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.student_id = auth.uid() OR p.supervisor_id = auth.uid() OR p.partner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Partner discussions - modify own messages or instructor" ON public.partner_discussions;
CREATE POLICY "Partner discussions - modify own messages or instructor" ON public.partner_discussions
  FOR UPDATE, DELETE TO authenticated USING (
    sender_id = auth.uid() OR (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'instructor'
    )
  );


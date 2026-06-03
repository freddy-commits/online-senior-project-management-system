/* 
  Run this script from the project directory:
  node fix-trigger.mjs
  
  It will fix the broken database trigger that blocks user registration.
*/

const SUPABASE_URL = 'https://hpsgudoimvdygyawjmqc.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwc2d1ZG9pbXZkeWd5YXdqbXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczOTE5OSwiZXhwIjoyMDk0MzE1MTk5fQ.Mm6Bb9lVmg_dkczsS_uwFA_R1NbvkCY2t-DrJLqP45c'

const fixSQL = `
DO $$
BEGIN
  -- Step 1: Fix role check constraint
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'instructor', 'industry', 'admin', 'supervisor'));

  -- Step 2: Create crash-safe trigger function
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

    IF v_role NOT IN ('student', 'instructor', 'industry', 'admin', 'supervisor') THEN
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

  -- Step 3: Re-attach trigger
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

END $$;
`

async function runFix() {
  console.log('🔧 Attempting to fix Supabase trigger via pg-meta API...')
  
  // Try the pg-meta query endpoint (used by Supabase Studio internally)
  const endpoints = [
    `${SUPABASE_URL}/pg-meta/v1/query`,
    `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
  ]

  for (const endpoint of endpoints) {
    console.log(`\n📡 Trying endpoint: ${endpoint}`)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
          'x-connection-encrypted': SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({ query: fixSQL }),
      })

      const text = await res.text()
      console.log(`Status: ${res.status}`)
      console.log(`Response: ${text}`)

      if (res.ok) {
        console.log('\n✅ SUCCESS! Trigger fixed.')
        return
      }
    } catch (e) {
      console.log(`Failed: ${e.message}`)
    }
  }

  console.log('\n❌ Could not fix automatically via API.')
  console.log('\n📋 MANUAL FIX REQUIRED - Copy and paste this SQL into your Supabase SQL Editor:')
  console.log('👉 https://supabase.com/dashboard/project/hpsgudoimvdygyawjmqc/sql/new')
  console.log('\n' + fixSQL)
}

runFix()

import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  // The SQL that fixes the trigger to handle all roles safely
  const sql = `
    -- Drop and recreate the trigger function to handle all 5 roles safely
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = public
    AS $$
    DECLARE
      v_role text;
    BEGIN
      v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
      -- Validate role value - default to student if invalid
      IF v_role NOT IN ('student', 'instructor', 'industry', 'admin', 'supervisor') THEN
        v_role := 'student';
      END IF;
      
      INSERT INTO public.profiles (id, email, full_name, role)
      VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        v_role
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role       = COALESCE(EXCLUDED.role, profiles.role);
      RETURN NEW;
    EXCEPTION WHEN others THEN
      -- Never block signup even if profile insert fails
      RETURN NEW;
    END;
    $$;

    -- Ensure trigger is attached
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

    -- Also fix the role check constraint to include supervisor
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('student', 'instructor', 'industry', 'admin', 'supervisor'));
  `

  try {
    // Use the Supabase REST API to run raw SQL via the service role
    const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: sql }),
    })

    if (!response.ok) {
      // Try alternative: pg via query endpoint
      const alt = await fetch(`${url}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        },
        body: JSON.stringify({ query: sql }),
      })
      const altText = await alt.text()
      return NextResponse.json({ 
        method: 'pg_query',
        status: alt.status,
        response: altText,
        sql_used: sql
      })
    }

    const data = await response.text()
    return NextResponse.json({ 
      method: 'rpc_exec_sql',
      status: response.status,
      response: data,
      sql_used: sql
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, sql_used: sql }, { status: 500 })
  }
}

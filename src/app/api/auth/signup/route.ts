import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// This route uses the service role to create users server-side,
// completely bypassing any broken database trigger issues.
export async function POST(request: NextRequest) {
  // Guard: ensure required env vars are present on the server
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables on the server.')
    return NextResponse.json(
      { error: 'Server configuration error: missing environment variables. Please contact the administrator.' },
      { status: 500 }
    )
  }

  try {
    const { email, password, fullName, role } = await request.json()

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validRoles = ['student', 'instructor', 'industry', 'admin', 'supervisor']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create admin Supabase client using service role key
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Step 1: Create the auth user using admin API (email auto-confirmed)
    const { data: createData, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })

    if (createError) {
      // If user already exists, return a clear message
      if (createError.message?.includes('already been registered') || createError.status === 422) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!createData.user) {
      return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
    }

    const userId = createData.user.id

    // Step 2: Upsert profile row using admin client (bypasses RLS)
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
      }, { onConflict: 'id' })

    if (profileError) {
      // Profile insert failed — log it but don't block the user
      console.error('Profile upsert error (non-fatal):', profileError.message)
    }

    // Step 3: Now sign the user in on the client side
    // We return the credentials so the client can call signInWithPassword
    return NextResponse.json({ 
      success: true,
      userId,
      email,
      role,
    })

  } catch (e: any) {
    console.error('Server signup error:', e)
    return NextResponse.json({ error: e.message || 'Unexpected error' }, { status: 500 })
  }
}

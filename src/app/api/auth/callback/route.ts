import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Roles that require admin approval — their profiles are created as 'student'
// and a role_request row is inserted with status='pending'.
const ELEVATED_ROLES = ['instructor', 'supervisor', 'industry_partner', 'examiner']

// Maps a database profile role to its dashboard path
const DASHBOARD_MAP: Record<string, string> = {
  student:          '/student/dashboard',
  instructor:       '/instructor/dashboard',
  supervisor:       '/supervisor/dashboard',
  industry_partner: '/partner/dashboard',
  examiner:         '/admin/dashboard',
  admin:            '/admin',
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const cookieStore = await cookies()

  // Read the role the user selected on the register page (passed as URL param
  // AND as a cookie for redundancy).
  const role =
    searchParams.get('role') ||
    cookieStore.get('oauth_role')?.value ||
    'student'

  const department =
    searchParams.get('department') ||
    cookieStore.get('oauth_dept')?.value ||
    null

  const next = searchParams.get('next')

  if (!code) {
    // No code present — something went wrong before we even got here
    return NextResponse.redirect(
      `${origin}/login?error=Google+sign-in+failed.+Please+try+again.`
    )
  }

  try {
    const supabase = await createClient()

    // Exchange the OAuth code for a session
    // NOTE: Do NOT call supabase.auth.signOut() here, because it deletes
    // the PKCE code_verifier cookie needed by exchangeCodeForSession!
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !sessionData?.user) {
      console.error('[OAuth Callback] Code exchange failed:', exchangeError?.message)
      return NextResponse.redirect(
        `${origin}/login?error=Google+sign-in+failed.+Please+try+again.`
      )
    }

    const user = sessionData.user

    // Use admin client for DB operations (bypasses RLS)
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fetch existing profile
    const { data: existingProfile } = await adminSupabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle()

    const isElevatedRole = ELEVATED_ROLES.includes(role)

    // 1. Check if the user has ANY pending role approval request
    const { data: pendingRequest } = await adminSupabase
      .from('role_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    // If user is waiting for admin approval on any pending request → redirect to /hub
    if (pendingRequest) {
      return NextResponse.redirect(`${origin}/hub`)
    }

    // 2. If user already exists in profiles table:
    if (existingProfile) {
      // If they selected an ELEVATED role on the register page, but their profile role is still 'student':
      if (isElevatedRole && existingProfile.role === 'student') {
        // Check if this specific request already exists
        const { data: reqExists } = await adminSupabase
          .from('role_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('requested_role', role)
          .maybeSingle()

        if (!reqExists) {
          // Use insert (NOT upsert with onConflict, because role_requests table lacks a unique constraint on user_id,requested_role)
          const { error: insErr } = await adminSupabase
            .from('role_requests')
            .insert({
              user_id:        user.id,
              requested_role: role,
              department:     department || null,
              status:         'pending',
            })

          if (insErr) {
            console.error('[OAuth Callback] Error inserting role_request for existing user:', insErr.message)
          }
        }

        // Redirect to /hub (waiting room for admin approval)
        return NextResponse.redirect(`${origin}/hub`)
      }

      // Otherwise, redirect according to their actual stored/approved role in profiles
      const redirectPath = next || DASHBOARD_MAP[existingProfile.role] || '/student/dashboard'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }

    // 3. BRAND NEW USER (no profile yet):
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'New User'

    // Create profile with role = 'student' (security default)
    const profilePayload: Record<string, any> = {
      id:         user.id,
      email:      user.email,
      full_name:  fullName,
      avatar_url: user.user_metadata?.avatar_url || null,
      role:       'student', // default
    }

    if (department && (role === 'instructor' || role === 'student' || role === 'supervisor')) {
      profilePayload.department = department
    }

    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })

    if (profileError) {
      console.error('[OAuth Callback] Profile upsert failed:', profileError.message)
    }

    // If elevated role requested, create a role_request and redirect to /hub
    if (isElevatedRole) {
      const { error: roleRequestError } = await adminSupabase
        .from('role_requests')
        .insert({
          user_id:        user.id,
          requested_role: role,
          department:     department || null,
          status:         'pending',
        })

      if (roleRequestError) {
        console.error('[OAuth Callback] role_request insert failed:', roleRequestError.message)
      }

      return NextResponse.redirect(`${origin}/hub`)
    }

    // New student: redirect to /student/dashboard
    return NextResponse.redirect(`${origin}/student/dashboard`)

  } catch (err: any) {
    console.error('[OAuth Callback] Unexpected error:', err?.message || err)
    return NextResponse.redirect(
      `${origin}/login?error=Google+sign-in+failed.+Please+try+again.`
    )
  }
}

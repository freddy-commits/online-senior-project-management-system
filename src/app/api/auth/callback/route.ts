import { createServerClient } from '@supabase/ssr'
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
    return NextResponse.redirect(
      `${origin}/register?error=Google+sign-in+failed.+Please+try+again.`
    )
  }

  try {
    let targetPath = '/student/dashboard'
    const cookiesToSetStore: Array<{ name: string; value: string; options: any }> = []

    // Create Supabase SSR client for code exchange
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options)
              } catch {}
              cookiesToSetStore.push({ name, value, options })
            })
          },
        },
      }
    )

    // Exchange the OAuth code for a session
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !sessionData?.user) {
      console.error('[OAuth Callback] Code exchange failed:', exchangeError?.message)
      return NextResponse.redirect(
        `${origin}/register?error=Google+sign-in+failed.+Please+try+again.`
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

    // 1. Check if user has ANY pending role approval request
    const { data: pendingRequest } = await adminSupabase
      .from('role_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingRequest) {
      targetPath = '/hub'
    } else if (existingProfile) {
      // 2. Existing profile logic
      if (isElevatedRole && existingProfile.role === 'student') {
        const { data: reqExists } = await adminSupabase
          .from('role_requests')
          .select('id')
          .eq('user_id', user.id)
          .eq('requested_role', role)
          .maybeSingle()

        if (!reqExists) {
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

        targetPath = '/hub'
      } else {
        targetPath = next || DASHBOARD_MAP[existingProfile.role] || '/student/dashboard'
      }
    } else {
      // 3. Brand new user logic
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'New User'

      const profilePayload: Record<string, any> = {
        id:         user.id,
        email:      user.email,
        full_name:  fullName,
        avatar_url: user.user_metadata?.avatar_url || null,
        role:       'student',
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

        targetPath = '/hub'
      } else {
        targetPath = '/student/dashboard'
      }
    }

    // Construct response redirect AND explicitly attach all session Set-Cookie headers!
    const response = NextResponse.redirect(`${origin}${targetPath}`)
    cookiesToSetStore.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })

    // Clear the oauth_switch flag — it's no longer needed after the session is set
    response.cookies.set('oauth_switch', '', { path: '/', maxAge: 0 })

    return response

  } catch (err: any) {
    console.error('[OAuth Callback] Unexpected error:', err?.message || err)
    return NextResponse.redirect(
      `${origin}/register?error=Google+sign-in+failed.+Please+try+again.`
    )
  }
}

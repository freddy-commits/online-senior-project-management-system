// Force Turbopack recompile
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  student:          '/student/dashboard',
  instructor:       '/instructor/dashboard',
  supervisor:       '/supervisor/dashboard',
  industry_partner: '/partner/dashboard',
  examiner:         '/admin',
  admin:            '/admin/dashboard',
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // Paths that never require authentication
  const isPublicPath =
    path === '/' ||
    path.startsWith('/api') ||
    path.startsWith('/auth') ||
    path.startsWith('/debug') ||
    path.startsWith('/sandbox') ||
    path.startsWith('/preview') ||
    path.startsWith('/hub')

  // Auth pages — if the user is already logged in, redirect them to their dashboard
  const isAuthPage = path.startsWith('/login') || path.startsWith('/register')

  // Get user session (lightweight — uses cached cookie, no extra round-trip)
  const { data: { user } } = await supabase.auth.getUser()

  // ── Already authenticated trying to visit /login or /register ─────────────
  // BUT skip this redirect if the user just clicked "Continue with Google" on
  // login/register — the oauth_switch cookie signals a new sign-in is in flight.
  const oauthSwitch = request.cookies.get('oauth_switch')?.value
  if (user && isAuthPage && !oauthSwitch) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || 'student'
    const destination = ROLE_DASHBOARD_MAP[role] || '/student/dashboard'

    // Check for pending role request first
    const { data: pending } = await supabase
      .from('role_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    const url = request.nextUrl.clone()
    url.pathname = pending ? '/hub' : destination
    return NextResponse.redirect(url)
  }

  // ── Unauthenticated user trying to access a protected page ─────────────────
  if (!user && !isPublicPath && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

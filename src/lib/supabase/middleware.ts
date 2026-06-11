import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const VALID_DEMO_ROLES = ['student', 'instructor', 'supervisor', 'industry', 'admin']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  const isPublicPath =
    path === '/' ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/auth') ||
    path.startsWith('/debug') ||
    path.startsWith('/sandbox') ||
    path.startsWith('/api') ||
    path.startsWith('/preview')

  // ── Demo / OAuth-mock mode ─────────────────────────────────────────────────
  // If the request carries a valid demo_role cookie (set by the Google/GitHub
  // mock OAuth handler), let the user through without requiring a real Supabase
  // session. This makes the "Continue with Google" / "Continue with GitHub"
  // buttons fully functional in the local-dev / demo environment.
  const demoRole = request.cookies.get('demo_role')?.value
  if (demoRole && VALID_DEMO_ROLES.includes(demoRole)) {
    // Already authenticated via demo — allow through
    return supabaseResponse
  }

  // ── Real Supabase session check ────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !isPublicPath
  ) {
    // No real session and no demo cookie — redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

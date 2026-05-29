import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key',
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

  const hasDemoCookie = request.cookies.has('demo_mode')
  const isDemo = hasDemoCookie || 
    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const path = request.nextUrl.pathname

  // Legacy redirects to avoid any 404s
  if (path.startsWith('/student/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/student'
    return NextResponse.redirect(url)
  }
  if (path.startsWith('/instructor/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/instructor'
    return NextResponse.redirect(url)
  }
  if (path.startsWith('/partner/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/partner'
    return NextResponse.redirect(url)
  }
  if (path.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard/instructor'
    return NextResponse.redirect(url)
  }

  if (isDemo) {
    const demoRole = request.cookies.get('demo_role')?.value
    
    const isPublicPath = 
      path === '/' || 
      path.startsWith('/login') || 
      path.startsWith('/register') || 
      path.startsWith('/auth') || 
      path.startsWith('/debug') || 
      path.startsWith('/api')

    if (!demoRole && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (path === '/dashboard' || path === '/dashboard/') {
      const url = request.nextUrl.clone()
      let mappedRole = demoRole || 'student'
      if (mappedRole === 'industry') mappedRole = 'partner'
      if (mappedRole === 'admin') mappedRole = 'instructor'
      url.pathname = `/dashboard/${mappedRole}`
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/debug') &&
    !request.nextUrl.pathname.startsWith('/api/debug') &&
    request.nextUrl.pathname !== '/'
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && (path === '/dashboard' || path === '/dashboard/')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    let role = profile?.role || 'student'
    if (role === 'industry') role = 'partner'
    if (role === 'admin') role = 'instructor'
    const url = request.nextUrl.clone()
    url.pathname = `/dashboard/${role}`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

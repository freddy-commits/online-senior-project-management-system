import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'student'
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()

    // Exchange the OAuth code for a session
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && sessionData?.user) {
      const user = sessionData.user

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      // A user is considered "newly created" if their auth record was created in the last 30 seconds.
      // This is crucial for OAuth signups where the database trigger defaults the role to 'student'
      // because Google/GitHub OAuth doesn't supply the selected role metadata to the database trigger.
      const isNewUser = new Date(user.created_at).getTime() >= Date.now() - 30 * 1000

      if (existingProfile && !isNewUser) {
        // Existing user — redirect to their dashboard based on stored role
        const dashboardMap: Record<string, string> = {
          student: '/student/dashboard',
          instructor: '/instructor/dashboard',
          industry: '/partner/dashboard',
          supervisor: '/supervisor/dashboard',
          admin: '/admin'
        }
        const redirectPath = next || dashboardMap[existingProfile.role] || '/'
        return NextResponse.redirect(`${origin}${redirectPath}`)
      }

      // New user — create profile with the selected role
      const fullName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || 'New User'

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: user.user_metadata?.avatar_url || null,
          role: role
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Failed to create profile for OAuth user:', profileError.message)
      }

      // Redirect to the appropriate dashboard
      const dashboardMap: Record<string, string> = {
        student: '/student/dashboard',
        instructor: '/instructor/dashboard',
        industry: '/partner/dashboard',
        supervisor: '/supervisor/dashboard',
        admin: '/admin'
      }
      const redirectPath = next || dashboardMap[role] || '/'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }

    console.error('OAuth code exchange failed:', exchangeError?.message)
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=OAuth+authentication+failed.+Please+try+again.`)
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingContent from '@/components/layout/LandingContent'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already logged in, redirect them to their dashboard
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      if (profile.role === 'student') {
        return redirect('/student/dashboard')
      } else if (profile.role === 'instructor') {
        return redirect('/instructor/dashboard')
      } else if (profile.role === 'industry') {
        return redirect('/partner/dashboard')
      } else {
        return redirect(`/${profile.role}`)
      }
    }
  }

  return <LandingContent />
}

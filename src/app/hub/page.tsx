import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PendingApprovalScreen from '@/components/hub/PendingApprovalScreen'
import RejectedScreen from '@/components/hub/RejectedScreen'

export const dynamic = 'force-dynamic'

export default async function HubPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's current profile details
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Failed to load profile for hub page:', profileError)
    // Fallback: if profile doesn't exist, route to login or wait
    redirect('/login')
  }

  // Decision Tree:
  // If the user already has an approved elevated role, redirect them directly to their portal.
  if (profile.role && profile.role !== 'student') {
    const roleDashboardMap: Record<string, string> = {
      admin: '/admin/dashboard',
      examiner: '/admin', // examiner panel uses '/admin'
      instructor: '/instructor/dashboard',
      supervisor: '/supervisor/dashboard',
      industry_partner: '/partner/dashboard',
    }

    const targetRoute = roleDashboardMap[profile.role]
    if (targetRoute) {
      redirect(targetRoute)
    }
  }

  // If their current role is 'student', check if they have a pending or rejected role request
  const { data: request } = await supabase
    .from('role_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (request) {
    if (request.status === 'pending') {
      return (
        <PendingApprovalScreen
          requestedRole={request.requested_role}
          department={request.department}
        />
      )
    } else if (request.status === 'rejected') {
      return (
        <RejectedScreen
          requestedRole={request.requested_role}
          department={request.department}
          reviewerNotes={request.reviewer_notes}
        />
      )
    }
  }

  // If role is 'student' AND no row exists in role_requests for this user, redirect to student dashboard
  redirect('/student/dashboard')
}

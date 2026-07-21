import { createClient } from '@/lib/supabase/server'

export async function requireInstructor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: No active session.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'instructor') {
    throw new Error('Access denied. Only instructors are allowed to perform this action.')
  }

  return { userId: user.id, user, profile }
}

export async function requireInstructorOrSupervisor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized: No active session.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'instructor' && profile.role !== 'supervisor')) {
    throw new Error('Access denied. Only instructors or supervisors are allowed to perform this action.')
  }

  return { userId: user.id, user, profile }
}

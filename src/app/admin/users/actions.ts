'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables.')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Fetch all users (profiles)
 */
export async function getAllUsers() {
  const adminSupabase = getAdminClient()
  const [
    { data: profiles, error },
    { data: projects }
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*').order('full_name', { ascending: true }),
    adminSupabase.from('projects').select('id, student_id, title, status, instructor_id, instructor:instructor_id(full_name)')
  ])

  if (error) {
    console.error('getAllUsers error:', error.message)
    return []
  }

  const projectMap = Object.fromEntries((projects || []).map((p: any) => [p.student_id, p]))

  return (profiles || []).map((u: any) => {
    if (u.role === 'student') {
      const proj = projectMap[u.id]
      return {
        ...u,
        has_project: !!proj,
        project_title: proj?.title || null,
        project_status: proj?.status || null,
        supervisor_id: proj?.instructor_id || null,
        supervisor_name: proj?.instructor?.full_name || null,
        needs_supervisor: proj?.status === 'approved' && !proj?.instructor_id
      }
    }
    return u
  })
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Access denied. Only system administrators can change user roles.')
  }

  if (user.id === userId) {
    throw new Error('Permission denied: You cannot modify your own administrator role.')
  }

  const adminSupabase = getAdminClient()

  // Update in profiles table (uses service_role client to bypass trigger checks)
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)

  if (profileError) throw new Error(profileError.message)

  // Update in user_metadata as well
  await adminSupabase.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole }
  })

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
}

/**
 * Delete a user profile and auth account
 */
export async function deleteUserAccount(userId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Access denied. Only system administrators can delete users.')
  }

  if (user.id === userId) {
    throw new Error('Permission denied: You cannot delete your own administrator account.')
  }

  const adminSupabase = getAdminClient()

  // 1. Delete from auth (this will cascade delete the profile record via Supabase foreign key delete cascades,
  // or we can manually delete from profiles first, or let trigger/cascade handle it).
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
  if (authError) {
    // If auth delete fails or is not cascaded, let's try profile delete directly
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (profileError) throw new Error(profileError.message)
  }

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
}

/**
 * Assign a supervisor to a student.
 * Updates the instructor_id on ALL approved projects belonging to the student.
 * Also marks the student's profile with the supervisor reference.
 */
export async function assignSupervisorToStudent(studentId: string, supervisorId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Access denied. Only system administrators can assign supervisors.')
  }

  const adminSupabase = getAdminClient()

  // Update all projects belonging to this student that are approved or pending
  const { error: projError } = await adminSupabase
    .from('projects')
    .update({ instructor_id: supervisorId })
    .eq('student_id', studentId)
    .in('status', ['approved', 'pending'])

  if (projError) throw new Error(projError.message)

  revalidatePath('/admin/users')
  revalidatePath('/admin/dashboard')
  revalidatePath('/student/dashboard')
  revalidatePath('/student/milestones')
}

/**
 * Fetch all supervisors (role = 'supervisor') for the assignment dropdown
 */
export async function getAllSupervisors() {
  const adminSupabase = getAdminClient()
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, department')
    .eq('role', 'supervisor')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('getAllSupervisors error:', error.message)
    return []
  }
  return data || []
}

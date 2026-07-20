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
 * Fetch all pending role requests.
 * Uses a two-step query to avoid foreign key join issues in PostgREST.
 */
export async function getPendingRequests() {
  const adminSupabase = getAdminClient()

  // Step 1: Get all pending role requests
  const { data: requests, error: reqError } = await adminSupabase
    .from('role_requests')
    .select('id, user_id, requested_role, department, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (reqError) {
    console.error('getPendingRequests error:', reqError.message)
    return []
  }

  if (!requests || requests.length === 0) return []

  // Step 2: Fetch profiles for all the user_ids
  const userIds = requests.map((r: any) => r.user_id)
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, university_id')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))

  // Step 3: Merge
  return requests.map((r: any) => ({
    ...r,
    profiles: profileMap[r.user_id] || { full_name: 'Unknown', email: 'N/A', university_id: null }
  }))
}

/**
 * Approve a role request:
 * 1. Update role_requests.status to 'approved'
 * 2. Update profiles.role to the requested_role
 */
export async function approveRequest(
  requestId: string,
  userId: string,
  requestedRole: string
) {
  // Verify the calling user is an admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'examiner'].includes(profile.role)) {
    throw new Error('Access denied. Only admins can approve role requests.')
  }

  const adminSupabase = getAdminClient()

  // 1. Update the role_requests row
  const { error: reqError } = await adminSupabase
    .from('role_requests')
    .update({ status: 'approved', reviewed_by: user.id })
    .eq('id', requestId)

  if (reqError) throw new Error(reqError.message)

  // 2. Update the user's actual profile role
  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update({ role: requestedRole })
    .eq('id', userId)

  if (profileError) throw new Error(profileError.message)

  revalidatePath('/admin/approvals')
  revalidatePath('/admin/dashboard')
}

/**
 * Reject a role request:
 * Updates role_requests.status to 'rejected'.
 * The user's profile.role stays as 'student'.
 */
export async function rejectRequest(
  requestId: string,
  reviewerNotes?: string
) {
  // Verify the calling user is an admin
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'examiner'].includes(profile.role)) {
    throw new Error('Access denied. Only admins can reject role requests.')
  }

  const adminSupabase = getAdminClient()

  const { error } = await adminSupabase
    .from('role_requests')
    .update({
      status: 'rejected',
      reviewed_by: user.id,
      ...(reviewerNotes ? { reviewer_notes: reviewerNotes } : {}),
    })
    .eq('id', requestId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/approvals')
  revalidatePath('/admin/dashboard')
}

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
    .select('id, full_name, email, university_id, phone, department, avatar_url')
    .in('id', userIds)

  // Step 3: For any profile with missing name/email, pull from auth.users as fallback
  const incompleteIds = (profiles || []).filter((p: any) => !p.full_name || !p.email).map((p: any) => p.id)
  const missingIds = userIds.filter((id: string) => !(profiles || []).find((p: any) => p.id === id))
  const needsAuthLookup = [...incompleteIds, ...missingIds]

  let authUsersMap: Record<string, any> = {}
  if (needsAuthLookup.length > 0) {
    // Fetch each user from auth.users to get their metadata
    const authResults = await Promise.all(
      needsAuthLookup.map(async (uid: string) => {
        const { data } = await adminSupabase.auth.admin.getUserById(uid)
        return data?.user
      })
    )
    authUsersMap = Object.fromEntries(
      authResults.filter(Boolean).map((u: any) => [
        u.id,
        {
          full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
          email: u.email || null,
        }
      ])
    )

    // Patch the profiles table for any users with missing data so future loads work
    for (const uid of needsAuthLookup) {
      const auth = authUsersMap[uid]
      if (auth?.full_name || auth?.email) {
        await adminSupabase
          .from('profiles')
          .upsert({
            id: uid,
            ...(auth.full_name ? { full_name: auth.full_name } : {}),
            ...(auth.email ? { email: auth.email } : {}),
          }, { onConflict: 'id' })
      }
    }
  }

  const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))

  // Step 4: Merge profiles with auth fallback data
  return requests.map((r: any) => {
    const profile = profileMap[r.user_id] || {}
    const authFallback = authUsersMap[r.user_id] || {}
    return {
      ...r,
      profiles: {
        full_name: profile.full_name || authFallback.full_name || 'Name not provided',
        email: profile.email || authFallback.email || 'No email',
        university_id: profile.university_id || null,
        phone: profile.phone || null,
        department: profile.department || r.department || null,
        avatar_url: profile.avatar_url || null,
      }
    }
  })
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

  // 1. Fetch the request details to get the selected department
  const { data: roleReq } = await adminSupabase
    .from('role_requests')
    .select('department')
    .eq('id', requestId)
    .single()

  // 2. Update the role_requests row
  const { error: reqError } = await adminSupabase
    .from('role_requests')
    .update({ status: 'approved', reviewed_by: user.id })
    .eq('id', requestId)

  if (reqError) throw new Error(reqError.message)

  // 3. Update the user's profile with their new role AND department from registration
  const profileUpdatePayload: Record<string, any> = { role: requestedRole }
  if (roleReq?.department) {
    profileUpdatePayload.department = roleReq.department
  }

  const { error: profileError } = await adminSupabase
    .from('profiles')
    .update(profileUpdatePayload)
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

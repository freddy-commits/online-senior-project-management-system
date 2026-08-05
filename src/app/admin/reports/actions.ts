'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

/**
 * Fetch ALL system data for the admin reports page.
 * Uses the service-role admin client to bypass RLS restrictions,
 * so every row across all users is included.
 */
export async function fetchAllReportData() {
  try {
    // Verify the requesting user is an admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized', data: null }

    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return { success: false, error: 'Access denied', data: null }
    }

    const admin = createAdminClient()

    // Fetch all data in parallel using service role (bypasses RLS)
    const [
      profilesRes,
      projectsRes,
      deliverablesRes,
      teamsRes,
      roleRequestsRes,
      notificationsRes,
    ] = await Promise.all([
      admin.from('profiles').select('*').order('created_at', { ascending: false }),
      admin
        .from('projects')
        .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name, email), industry_partner:industry_partner_id(full_name, email)')
        .order('created_at', { ascending: false }),
      admin
        .from('deliverables')
        .select('*, project:project_id(title, student_id)')
        .order('created_at', { ascending: false }),
      admin
        .from('teams')
        .select('*, leader:leader_id(full_name, email), project:project_id(title, status)')
        .order('created_at', { ascending: false }),
      admin
        .from('role_requests')
        .select('*, profile:user_id(full_name, email, department)')
        .order('created_at', { ascending: false }),
      admin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

    return {
      success: true,
      data: {
        profiles:      profilesRes.data      || [],
        projects:      projectsRes.data      || [],
        deliverables:  deliverablesRes.data  || [],
        teams:         teamsRes.data         || [],
        roleRequests:  roleRequestsRes.data  || [],
        notifications: notificationsRes.data || [],
      },
      errors: {
        profiles:      profilesRes.error?.message,
        projects:      projectsRes.error?.message,
        deliverables:  deliverablesRes.error?.message,
        teams:         teamsRes.error?.message,
        roleRequests:  roleRequestsRes.error?.message,
        notifications: notificationsRes.error?.message,
      }
    }
  } catch (err: any) {
    console.error('fetchAllReportData failed:', err)
    return { success: false, error: err.message, data: null }
  }
}

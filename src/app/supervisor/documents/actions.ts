'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function fetchSupervisorDocumentsData(supervisorId: string) {
  try {
    const adminClient = createAdminClient()

    // Fetch projects where supervisor is assigned (instructor_id = supervisorId)
    const { data: projects, error: projErr } = await adminClient
      .from('projects')
      .select('*, student:student_id(full_name, email)')
      .eq('instructor_id', supervisorId)
      .order('created_at', { ascending: false })

    if (projErr) throw projErr

    const projectIds = (projects || []).map((p: any) => p.id)

    let deliverables: any[] = []
    if (projectIds.length > 0) {
      const { data: delivs, error: delivErr } = await adminClient
        .from('deliverables')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })

      if (delivErr) throw delivErr
      deliverables = delivs || []
    }

    const { data: teamMembers, error: tmErr } = await adminClient
      .from('team_members')
      .select('*, profiles:user_id(id, full_name, email, avatar_url)')

    return {
      success: true,
      projects: projects || [],
      deliverables: deliverables,
      teamMembers: teamMembers || []
    }
  } catch (err: any) {
    console.error('fetchSupervisorDocumentsData failed:', err)
    return { success: false, error: err.message }
  }
}

export async function supervisorUpdateDeliverableStatus(
  deliverableId: string,
  status: 'graded' | 'rejected', // graded = Approved, rejected = Flagged (Revisions Requested)
  grade: string | null,
  feedback: string
) {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('deliverables')
      .update({
        status: status,
        grade: status === 'graded' ? grade : null,
        recommendation: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliverableId)
      .select()

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error('supervisorUpdateDeliverableStatus failed:', err)
    return { success: false, error: err.message }
  }
}

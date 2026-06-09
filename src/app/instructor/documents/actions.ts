'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function fetchInstructorDocumentsData() {
  try {
    const adminClient = createAdminClient()
    
    const { data: projects, error: projErr } = await adminClient
      .from('projects')
      .select('*, student:student_id(full_name, email)')
      .order('created_at', { ascending: false })

    const { data: deliverables, error: delivErr } = await adminClient
      .from('deliverables')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: teamMembers, error: tmErr } = await adminClient
      .from('team_members')
      .select('*, profiles:user_id(id, full_name, email, avatar_url)')

    if (projErr) throw projErr
    if (delivErr) throw delivErr

    return {
      success: true,
      projects: projects || [],
      deliverables: deliverables || [],
      teamMembers: teamMembers || []
    }
  } catch (err: any) {
    console.error('fetchInstructorDocumentsData failed:', err)
    return { success: false, error: err.message }
  }
}

export async function updateDeliverableStatusAdmin(
  deliverableId: string, 
  status: 'graded' | 'rejected', 
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
    console.error('updateDeliverableStatusAdmin failed:', err)
    return { success: false, error: err.message }
  }
}

export async function updateProjectGradeAdmin(projectId: string, grade: string) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('projects')
      .update({
        grade: grade,
        grade_published: true
      })
      .eq('id', projectId)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('updateProjectGradeAdmin failed:', err)
    return { success: false, error: err.message }
  }
}

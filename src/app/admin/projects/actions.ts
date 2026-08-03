'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function fetchAdminProjectsAndDeliverables() {
  try {
    const adminClient = createAdminClient()

    const { data: projects, error: projErr } = await adminClient
      .from('projects')
      .select(`
        *,
        student:student_id(full_name, email, department),
        instructor:instructor_id(full_name, email)
      `)
      .order('created_at', { ascending: false })

    const { data: deliverables, error: delivErr } = await adminClient
      .from('deliverables')
      .select('id, project_id, status, title, grade')

    if (projErr) throw projErr
    if (delivErr) throw delivErr

    return {
      success: true,
      projects: projects || [],
      deliverables: deliverables || []
    }
  } catch (err: any) {
    console.error('fetchAdminProjectsAndDeliverables failed:', err)
    return { success: false, error: err.message, projects: [], deliverables: [] }
  }
}

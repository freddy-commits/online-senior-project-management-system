'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function fetchAdminProjectsAndDeliverables() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userRole = 'admin'
    let userDept: string | null = null
    let userId: string | null = null

    if (user) {
      userId = user.id
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department')
        .eq('id', user.id)
        .single()

      if (profile) {
        userRole = profile.role
        userDept = profile.department || null
      }
    }

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

    let filteredProjects = projects || []

    // If logged in as Panel Examiner (role === 'examiner' or 'examiner_panel'),
    // restrict view to ONLY projects from their department or assigned to them!
    if (userRole === 'examiner' || userRole === 'examiner_panel') {
      filteredProjects = filteredProjects.filter((p: any) => {
        // 1. Explicitly assigned to this examiner
        if (p.examiner_panel && Array.isArray(p.examiner_panel) && p.examiner_panel.includes(userId)) {
          return true
        }
        if (p.examiner_id === userId) {
          return true
        }

        // 2. Department match
        if (userDept) {
          let targetDept = 'General'
          if (p.description?.includes('Target Department:')) {
            const match = p.description.match(/Target Department:\s*([^|\n]+)/)
            if (match && match[1]) targetDept = match[1].trim()
          }
          const studentDept = p.student?.department

          if (studentDept && studentDept === userDept) return true
          if (targetDept && targetDept === userDept) return true

          return false
        }

        return true
      })
    }

    return {
      success: true,
      userRole,
      userDept,
      projects: filteredProjects,
      deliverables: deliverables || []
    }
  } catch (err: any) {
    console.error('fetchAdminProjectsAndDeliverables failed:', err)
    return { success: false, error: err.message, projects: [], deliverables: [] }
  }
}

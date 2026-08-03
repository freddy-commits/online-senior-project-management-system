'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerUserClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase admin credentials or service role key are missing.')
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

export async function createInstructorMilestone(
  projectIds: string[],
  title: string,
  description: string,
  dueDate: string,
  meetingUrl?: string
) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized session.' }
    }

    if (!projectIds || projectIds.length === 0) {
      return { success: false, error: 'Please select at least one project.' }
    }

    const isoDueDate = new Date(dueDate).toISOString()
    const payload = projectIds.map(pid => {
      let finalTitle = title
      if (meetingUrl) {
        finalTitle = `${title} [Zoom Defense]`
      } else if (description) {
        finalTitle = `${title} (${description})`
      }

      let finalDesc = description
      if (meetingUrl) {
        finalDesc = `${description ? description + ' | ' : ''}Zoom Defense Link: ${meetingUrl}`
      }

      return {
        project_id: pid,
        title: finalTitle,
        description: finalDesc,
        due_date: isoDueDate,
        status: 'todo',
        meeting_url: meetingUrl || null
      }
    })

    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('deliverables')
      .insert(payload)
      .select()

    if (error) throw error

    revalidatePath('/instructor/milestones')
    revalidatePath('/instructor/dashboard')
    revalidatePath('/student/milestones')
    return { success: true, data }
  } catch (err: any) {
    console.error('createInstructorMilestone error:', err)
    return { success: false, error: err.message || 'Failed to create milestone.' }
  }
}

export async function fetchDepartmentDeliverables(projectIds: string[]) {
  try {
    if (!projectIds || projectIds.length === 0) return { success: true, data: [] }
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('deliverables')
      .select('*, project:project_id(title)')
      .in('project_id', projectIds)
      .order('due_date', { ascending: true })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('fetchDepartmentDeliverables error:', err)
    return { success: false, error: err.message || 'Failed to fetch deliverables.' }
  }
}

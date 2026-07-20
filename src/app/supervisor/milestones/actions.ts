'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireInstructorOrSupervisor } from '@/lib/auth-guard'

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

export async function addSupervisorMilestone(projectId: string, title: string, description: string, dueDate: string) {
  try {
    await requireInstructorOrSupervisor()
    const adminClient = createAdminClient()

    const dbPayload = {
      project_id: projectId,
      title,
      description: description || 'No description provided.',
      due_date: new Date(dueDate).toISOString(),
      status: 'todo',
      created_at: new Date().toISOString()
    }

    const { data, error } = await adminClient
      .from('deliverables')
      .insert([dbPayload])
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (err: any) {
    console.error('addSupervisorMilestone failed:', err)
    return { success: false, error: err.message || 'Failed to add milestone.' }
  }
}

export async function updateSupervisorMilestone(milestoneId: string, title: string, description: string, dueDate: string) {
  try {
    await requireInstructorOrSupervisor()
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('deliverables')
      .update({
        title,
        description,
        due_date: new Date(dueDate).toISOString()
      })
      .eq('id', milestoneId)
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (err: any) {
    console.error('updateSupervisorMilestone failed:', err)
    return { success: false, error: err.message || 'Failed to update milestone.' }
  }
}

export async function deleteSupervisorMilestone(milestoneId: string) {
  try {
    await requireInstructorOrSupervisor()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('deliverables')
      .delete()
      .eq('id', milestoneId)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('deleteSupervisorMilestone failed:', err)
    return { success: false, error: err.message || 'Failed to delete milestone.' }
  }
}

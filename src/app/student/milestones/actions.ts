'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient as createServerUserClient } from '@/lib/supabase/server'

// Private helper to create an admin Supabase client with service role key
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

/**
 * Server action to seed default deliverables for a student project.
 * Bypasses RLS by verifying project ownership and using the service role client.
 */
export async function seedDeliverables(projectId: string, defaultDelivs: any[]) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    // Verify project belongs to user
    const { data: proj, error: projError } = await userClient
      .from('projects')
      .select('id, student_id')
      .eq('id', projectId)
      .single()

    if (projError || !proj) {
      return { success: false, error: 'Associated project not found or access denied.' }
    }

    if (proj.student_id !== user.id) {
      return { success: false, error: 'Access denied. Project ownership check failed.' }
    }

    const adminSupabase = createAdminClient()

    // Omit non-existent columns (like description) from database payload
    const cleanPayload = defaultDelivs.map((d: any) => ({
      project_id: projectId,
      title: d.title,
      due_date: d.due_date,
      status: d.status || 'todo'
    }))

    const { data: seeded, error: seedError } = await adminSupabase
      .from('deliverables')
      .insert(cleanPayload)
      .select()

    if (seedError) {
      throw seedError
    }

    return { success: true, data: seeded }
  } catch (err: any) {
    console.error('seedDeliverables server action failed:', err)
    return { success: false, error: err.message || 'Seeding action failed.' }
  }
}

/**
 * Server action to add a custom milestone.
 * Bypasses RLS by verifying project ownership and using the service role client.
 */
export async function addCustomMilestone(projectId: string, title: string, dueDate: string) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    // Verify project belongs to user
    const { data: proj, error: projError } = await userClient
      .from('projects')
      .select('id, student_id')
      .eq('id', projectId)
      .single()

    if (projError || !proj) {
      return { success: false, error: 'Associated project not found or access denied.' }
    }

    if (proj.student_id !== user.id) {
      return { success: false, error: 'Access denied. Project ownership check failed.' }
    }

    const adminSupabase = createAdminClient()

    const dbPayload = {
      project_id: projectId,
      title,
      due_date: new Date(dueDate).toISOString(),
      status: 'todo'
    }

    const { data, error } = await adminSupabase
      .from('deliverables')
      .insert([dbPayload])
      .select()

    if (error) {
      throw error
    }

    return { success: true, data: data[0] }
  } catch (err: any) {
    console.error('addCustomMilestone server action failed:', err)
    return { success: false, error: err.message || 'Milestone addition failed.' }
  }
}

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireInstructor } from '@/lib/auth-guard'

/**
 * Fetch all instructor resource files from Supabase.
 * These are templates/guidelines uploaded by instructors for students to reference.
 */
export async function fetchInstructorResources() {
  try {
    await requireInstructor()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('instructor_resources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err: any) {
    console.error('fetchInstructorResources failed:', err)
    return { success: false, error: err.message, data: [] }
  }
}

/**
 * Save a newly uploaded instructor resource reference to Supabase.
 */
export async function saveInstructorResource(resource: {
  name: string
  size: string
  file_url: string
  uploaded_by?: string
}) {
  try {
    await requireInstructor()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('instructor_resources')
      .insert({
        name: resource.name,
        size: resource.size,
        file_url: resource.file_url,
        uploaded_by: resource.uploaded_by || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error('saveInstructorResource failed:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete an instructor resource from Supabase (metadata + storage file).
 */
export async function deleteInstructorResource(id: string, storagePath?: string) {
  try {
    await requireInstructor()
    const adminClient = createAdminClient()

    // Delete from storage if path provided
    if (storagePath) {
      await adminClient.storage
        .from('instructor-resources')
        .remove([storagePath])
    }

    const { error } = await adminClient
      .from('instructor_resources')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('deleteInstructorResource failed:', err)
    return { success: false, error: err.message }
  }
}

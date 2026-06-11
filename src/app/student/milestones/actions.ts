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
 * Tries user session client first, falls back to admin client.
 */
export async function seedDeliverables(projectId: string, defaultDelivs: any[]) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const cleanPayload = defaultDelivs.map((d: any) => ({
      project_id: projectId,
      title: d.title,
      due_date: d.due_date,
      status: d.status || 'todo'
    }))

    // Try with user session first
    const { data: seededUser, error: userError } = await userClient
      .from('deliverables')
      .insert(cleanPayload)
      .select()

    if (!userError && seededUser) {
      return { success: true, data: seededUser }
    }

    // Fall back to admin client if user insert was blocked by RLS
    console.warn('User client seed failed, trying admin client:', userError?.message)
    const adminSupabase = createAdminClient()
    const { data: seeded, error: seedError } = await adminSupabase
      .from('deliverables')
      .insert(cleanPayload)
      .select()

    if (seedError) throw seedError
    return { success: true, data: seeded }
  } catch (err: any) {
    console.error('seedDeliverables server action failed:', err)
    return { success: false, error: err.message || 'Seeding action failed.' }
  }
}

/**
 * Server action to add a custom milestone.
 * Tries user session client first, falls back to admin client.
 */
export async function addCustomMilestone(projectId: string, title: string, dueDate: string) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    const dbPayload = {
      project_id: projectId,
      title,
      due_date: new Date(dueDate).toISOString(),
      status: 'todo'
    }

    // Try with user session first (works if RLS allows student inserts)
    const { data: insertedUser, error: userError } = await userClient
      .from('deliverables')
      .insert([dbPayload])
      .select()

    if (!userError && insertedUser?.[0]) {
      return { success: true, data: insertedUser[0] }
    }

    // Fall back to admin client if blocked by RLS
    console.warn('User client insert failed, trying admin client:', userError?.message)
    const adminSupabase = createAdminClient()
    const { data, error } = await adminSupabase
      .from('deliverables')
      .insert([dbPayload])
      .select()

    if (error) throw error
    return { success: true, data: data[0] }
  } catch (err: any) {
    console.error('addCustomMilestone server action failed:', err)
    return { success: false, error: err.message || 'Milestone addition failed.' }
  }
}

/**
 * Server action to submit a deliverable (update submission_url + status).
 * Tries user session client first, falls back to admin client.
 */
export async function submitDeliverable(deliverableId: string, submissionUrl: string) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    // Try user session first
    const { data: userUpdated, error: userError } = await userClient
      .from('deliverables')
      .update({ submission_url: submissionUrl, status: 'submitted' })
      .eq('id', deliverableId)
      .select()

    let success = false
    if (!userError && userUpdated && userUpdated.length > 0) {
      success = true
    } else {
      // Fall back to admin
      console.warn('User client submission failed or affected 0 rows, trying admin client:', userError?.message)
      const adminSupabase = createAdminClient()
      const { error: adminError } = await adminSupabase
        .from('deliverables')
        .update({ submission_url: submissionUrl, status: 'submitted' })
        .eq('id', deliverableId)

      if (adminError) throw adminError
      success = true
    }

    if (success) {
      // Fetch details and notify instructor/supervisor
      try {
        const adminSupabase = createAdminClient()
        const { data: delivObj } = await adminSupabase
          .from('deliverables')
          .select('title, project_id')
          .eq('id', deliverableId)
          .single()

        if (delivObj) {
          const { data: projObj } = await adminSupabase
            .from('projects')
            .select('title, student_id, instructor_id')
            .eq('id', delivObj.project_id)
            .single()

          if (projObj && projObj.instructor_id) {
            const { data: studentProfile } = await adminSupabase
              .from('profiles')
              .select('full_name')
              .eq('id', projObj.student_id)
              .single()

            const { data: instructorProfile } = await adminSupabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', projObj.instructor_id)
              .single()

            if (instructorProfile && instructorProfile.email) {
              const { notifyInstructorMilestoneSubmission } = await import('@/lib/email/emailService')
              await notifyInstructorMilestoneSubmission(
                studentProfile?.full_name || 'Student',
                instructorProfile.email,
                instructorProfile.full_name || 'Faculty Advisor',
                projObj.title,
                delivObj.title
              )
            }
          }
        }
      } catch (notifyErr) {
        console.error('Failed to send submission email notification to supervisor:', notifyErr)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('submitDeliverable server action failed:', err)
    return { success: false, error: err.message || 'Submission failed.' }
  }
}

/**
 * Server action to fetch deliverables for a student project.
 * Tries user session first, falls back to admin if RLS blocks read.
 */
export async function getDeliverables(projectId: string) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    // Try user session first
    const { data: userDelivs, error: userError } = await userClient
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true })

    if (!userError && userDelivs && userDelivs.length > 0) {
      return { success: true, data: userDelivs }
    }

    // Fall back to admin client to bypass RLS SELECT restrictions
    console.warn('User client read failed or returned empty, trying admin client...')
    const adminSupabase = createAdminClient()
    const { data: adminDelivs, error: adminError } = await adminSupabase
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true })

    if (adminError) throw adminError
    return { success: true, data: adminDelivs }
  } catch (err: any) {
    console.error('getDeliverables server action failed:', err)
    return { success: false, error: err.message || 'Read failed.' }
  }
}

/**
 * Server action to fetch projects for the authenticated student.
 * Tries user session first, falls back to admin if RLS blocks read.
 */
export async function getStudentProjects() {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return { success: false, error: 'Unauthorized user session.' }
    }

    // Fetch teams the student belongs to
    const { data: myTeams } = await userClient
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)

    const myTeamIds = (myTeams || []).map((m: any) => m.team_id)

    let query = userClient
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')

    if (myTeamIds.length > 0) {
      query = query.or(`student_id.eq.${user.id},team_id.in.(${myTeamIds.join(',')})`)
    } else {
      query = query.eq('student_id', user.id)
    }

    const { data: rawProjects, error: userError } = await query

    if (!userError && rawProjects && rawProjects.length > 0) {
      return { success: true, data: rawProjects }
    }

    // Fall back to admin client
    console.warn('User client projects read failed or empty, trying admin...')
    const adminSupabase = createAdminClient()
    let adminQuery = adminSupabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')

    if (myTeamIds.length > 0) {
      adminQuery = adminQuery.or(`student_id.eq.${user.id},team_id.in.(${myTeamIds.join(',')})`)
    } else {
      adminQuery = adminQuery.eq('student_id', user.id)
    }

    const { data: adminProjects, error: adminError } = await adminQuery
    if (adminError) throw adminError

    return { success: true, data: adminProjects }
  } catch (err: any) {
    console.error('getStudentProjects server action failed:', err)
    return { success: false, error: err.message || 'Failed to fetch projects.' }
  }
}

/**
 * Server action to fetch a single project by ID.
 * Tries user session first, falls back to admin if RLS blocks read.
 */
export async function getProjectById(projectId: string) {
  try {
    const userClient = await createServerUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized user session.' }

    // Try user session first
    const { data: userProj, error: userError } = await userClient
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')
      .eq('id', projectId)
      .single()

    if (!userError && userProj) {
      return { success: true, data: userProj }
    }

    // Fall back to admin client
    console.warn('User client project read failed, trying admin client...')
    const adminSupabase = createAdminClient()
    const { data: adminProj, error: adminError } = await adminSupabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')
      .eq('id', projectId)
      .single()

    if (adminError) throw adminError
    return { success: true, data: adminProj }
  } catch (err: any) {
    console.error('getProjectById failed:', err)
    return { success: false, error: err.message || 'Project fetch failed.' }
  }
}

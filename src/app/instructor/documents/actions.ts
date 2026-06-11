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

    // Fetch details and notify student
    try {
      const { data: delivObj } = await adminClient
        .from('deliverables')
        .select('title, project_id')
        .eq('id', deliverableId)
        .single()

      if (delivObj) {
        const { data: projObj } = await adminClient
          .from('projects')
          .select('title, student_id, instructor_id')
          .eq('id', delivObj.project_id)
          .single()

        if (projObj && projObj.student_id) {
          const { data: studentProfile } = await adminClient
            .from('profiles')
            .select('full_name, email')
            .eq('id', projObj.student_id)
            .single()

          const { data: instructorProfile } = await adminClient
            .from('profiles')
            .select('full_name')
            .eq('id', projObj.instructor_id || '')
            .single()

          if (studentProfile && studentProfile.email) {
            const { notifyStudentMilestoneGraded } = await import('@/lib/email/emailService')
            await notifyStudentMilestoneGraded(
              studentProfile.email,
              studentProfile.full_name || 'Student',
              instructorProfile?.full_name || 'Faculty Advisor',
              projObj.title,
              delivObj.title,
              status === 'graded' ? (grade || 'Reviewed') : 'Revisions Requested',
              feedback
            )
          }

          // Trigger SMS notification
          const { sendSMS } = await import('@/lib/sms/smsService')
          await sendSMS({
            recipientId: projObj.student_id,
            message: `🎯 Milestone Updated: Your deliverable "${delivObj.title}" has been graded/reviewed by Dr. ${instructorProfile?.full_name || 'Faculty Advisor'}. Grade: ${status === 'graded' ? (grade || 'Reviewed') : 'Revisions Requested'}.`
          })
        }
      }
    } catch (notifyErr) {
      console.error('Failed to notify student of milestone evaluation:', notifyErr)
    }

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

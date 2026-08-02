'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireInstructorOrSupervisor } from '@/lib/auth-guard'

export async function getSupervisorProjectDetails(projectId: string) {
  try {
    await requireInstructorOrSupervisor()

    const adminClient = createAdminClient()
    const { data: project, error } = await adminClient
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return { success: true, project }
  } catch (err: any) {
    console.error('getSupervisorProjectDetails failed:', err)
    return { success: false, error: err.message }
  }
}

export async function getSupervisorProjectDeliverables(projectId: string) {
  try {
    await requireInstructorOrSupervisor()

    const adminClient = createAdminClient()
    const { data: deliverables, error } = await adminClient
      .from('deliverables')
      .select('*')
      .eq('project_id', projectId)
      .order('due_date', { ascending: true })

    if (error) throw error
    return { success: true, deliverables }
  } catch (err: any) {
    console.error('getSupervisorProjectDeliverables failed:', err)
    return { success: false, error: err.message }
  }
}

export async function supervisorGradeDeliverableAction(deliverableId: string, grade: string) {
  try {
    await requireInstructorOrSupervisor()

    // Validate grade input: must be a number between 0 and 20
    let numericGrade = parseFloat(grade)
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 20) {
      // Check if it is already in "X/20" format
      const match = grade.match(/^(\d+(?:\.\d+)?)\/20$/)
      if (match) {
        numericGrade = parseFloat(match[1])
        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 20) {
          return { success: false, error: 'Mark must be between 0 and 20.' }
        }
      } else {
        return { success: false, error: 'Mark must be between 0 and 20.' }
      }
    }

    const formattedGrade = `${numericGrade}/20`

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('deliverables')
      .update({ grade: formattedGrade, status: 'graded' })
      .eq('id', deliverableId)


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
              instructorProfile?.full_name || 'Faculty Supervisor',
              projObj.title,
              delivObj.title,
              grade,
              'Your milestone deliverable has been successfully graded.'
            )
          }

          // Trigger SMS notification
          const { sendSMS } = await import('@/lib/sms/smsService')
          await sendSMS({
            recipientId: projObj.student_id,
            message: `Milestone Updated: Your deliverable "${delivObj.title}" has been graded/reviewed by Dr. ${instructorProfile?.full_name || 'Faculty Supervisor'}. Grade: ${grade}.`
          })
        }
      }
    } catch (notifyErr) {
      console.error('Failed to notify student of milestone evaluation:', notifyErr)
    }

    return { success: true }
  } catch (err: any) {
    console.error('supervisorGradeDeliverableAction failed:', err)
    return { success: false, error: err.message }
  }
}

export async function supervisorSubmitFeedbackAction(
  deliverableId: string, 
  feedback: string, 
  studentId: string, 
  projectTitle: string, 
  deliverableTitle: string
) {
  try {
    const { userId } = await requireInstructorOrSupervisor()

    const adminClient = createAdminClient()

    // 1. Insert recommendation comment message to the student
    const { error: msgErr } = await adminClient.from('messages').insert({
      sender_id: userId,
      receiver_id: studentId,
      content: `[Supervisor Recommendation] Milestone "${deliverableTitle}": ${feedback}`
    })
    if (msgErr) throw msgErr

    // 2. Insert notification
    const { error: notifErr } = await adminClient.from('notifications').insert({
      user_id: studentId,
      title: `New Recommendation on ${deliverableTitle}`,
      message: `Your supervisor added recommendations: "${feedback.slice(0, 80)}..."`,
      type: 'system'
    })
    if (notifErr) throw notifErr

    // Fetch supervisor name
    const { data: profile } = await adminClient
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single()

    // 3. Send email to student
    const { data: studentProfile } = await adminClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', studentId)
      .single()

    if (studentProfile && studentProfile.email) {
      try {
        const { notifyStudentMilestoneGraded } = await import('@/lib/email/emailService')
        await notifyStudentMilestoneGraded(
          studentProfile.email,
          studentProfile.full_name || 'Student',
          profile?.full_name || 'Faculty Supervisor',
          projectTitle,
          deliverableTitle,
          'Pending Grade',
          feedback
        )
      } catch (emailErr) {
        console.error('Feedback email notify error:', emailErr)
      }
    }

    return { success: true }
  } catch (err: any) {
    console.error('supervisorSubmitFeedbackAction failed:', err)
    return { success: false, error: err.message }
  }
}

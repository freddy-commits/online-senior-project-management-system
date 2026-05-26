import { createClient } from '@/lib/supabase/client'

export interface EmailPayload {
  toEmail: string
  toName: string
  subject: string
  bodyHtml: string
  bodyText: string
}

/**
 * Sends a notification email (Simulated for this stage, with browser toast visualizer + server console logging).
 * Connects to real transactional email services (like Resend, SendGrid, or Nodemailer) with standard code provided in comments.
 */
export async function sendNotificationEmail(payload: EmailPayload): Promise<{ success: boolean }> {
  let apiSuccess = false
  let simulationMode = true

  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (response.ok) {
      const res = await response.json()
      if (res.success) {
        apiSuccess = true
        simulationMode = false
      } else if (res.simulated) {
        simulationMode = true
      }
    }
  } catch (err) {
    console.warn('Failed to call secure server email API, falling back to client simulation:', err)
  }

  // Log clearly in server-side stdout for debug auditing
  console.log(`
========================================================================
📧  [EMAIL ${simulationMode ? 'SIMULATED' : 'DISPATCHED REAL'}]
To: ${payload.toName} <${payload.toEmail}>
Subject: ${payload.subject}
------------------------------------------------------------------------
${payload.bodyText}
========================================================================
  `)

  // Show premium visual toast notification in browser client
  if (typeof window !== 'undefined') {
    showEmailToast(
      payload.toEmail, 
      payload.toName, 
      payload.subject, 
      simulationMode ? 'Simulated Dispatch' : 'Real Email Sent'
    )
  }

  return { success: apiSuccess }
}

/**
 * Notification Helper: Student submits a proposal milestone or final presentation
 * Recipient: Faculty Advisor / Instructor
 */
export async function notifyInstructorMilestoneSubmission(
  studentName: string,
  instructorEmail: string,
  instructorName: string,
  projectTitle: string,
  milestoneTitle: string
) {
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`
  
  await sendNotificationEmail({
    toEmail: instructorEmail,
    toName: instructorName,
    subject: `📝 Milestone Submitted: ${studentName} - ${milestoneTitle}`,
    bodyText: `Dear Dr. ${instructorName},\n\nStudent ${studentName} has submitted the milestone "${milestoneTitle}" for their capstone project: "${projectTitle}".\n\nPlease log in to review the submission, deliver grades, and post feedback.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background: #fff;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">📝 Milestone Submission Alert</h2>
        <p>Dear Dr. <strong>${instructorName}</strong>,</p>
        <p>Student <strong>${studentName}</strong> has submitted a milestone deliverable for their project:</p>
        <blockquote style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; margin: 16px 0; font-style: italic;">
          <strong>Project:</strong> ${projectTitle}<br/>
          <strong>Milestone:</strong> ${milestoneTitle}
        </blockquote>
        <p>Please log in to your Instructor Dashboard to grade the submission, request revisions, or add detailed comments.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Log In & Grade</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated system notification from Project Hub.</p>
      </div>
    `
  })
}

/**
 * Notification Helper: Instructor grades a milestone or delivers feedback
 * Recipient: Capstone Student
 */
export async function notifyStudentMilestoneGraded(
  studentEmail: string,
  studentName: string,
  instructorName: string,
  projectTitle: string,
  milestoneTitle: string,
  grade: string,
  feedbackText: string
) {
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

  await sendNotificationEmail({
    toEmail: studentEmail,
    toName: studentName,
    subject: `🎯 Grade Posted: ${milestoneTitle}`,
    bodyText: `Hi ${studentName},\n\nYour Faculty Advisor, Dr. ${instructorName}, has reviewed and graded your milestone: "${milestoneTitle}" for project "${projectTitle}".\n\nGrade: ${grade}\nFeedback Summary: "${feedbackText}"\n\nPlease log in to view detailed feedback.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background: #fff;">
        <h2 style="color: #10b981; margin-bottom: 20px;">🎯 Milestone Evaluation Posted</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Dr. <strong>${instructorName}</strong> has graded and left feedback on your deliverable:</p>
        <blockquote style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0;">
          <strong>Milestone:</strong> ${milestoneTitle}<br/>
          <strong>Grade Assigned:</strong> <span style="color: #10b981; font-weight: bold;">${grade}</span><br/>
          <strong>Feedback:</strong> "${feedbackText || 'No comments left.'}"
        </blockquote>
        <p>Please log in to your Student Dashboard to check the grade breakdown and work on subsequent milestones.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Dashboard</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated system notification from Project Hub.</p>
      </div>
    `
  })
}

/**
 * Notification Helper: Team formed/allocated to an Industry-sponsored project
 * Recipient: Industry Partner
 */
export async function notifyIndustryTeamFormed(
  industryEmail: string,
  industryName: string,
  projectTitle: string,
  teamMembersNames: string[]
) {
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

  await sendNotificationEmail({
    toEmail: industryEmail,
    toName: industryName,
    subject: `👥 Team Formed for Sponsored Project: ${projectTitle}`,
    bodyText: `Dear ${industryName},\n\nWe are pleased to inform you that a student team has been formed and allocated to your sponsored project proposal: "${projectTitle}".\n\nAllocated Roster: ${teamMembersNames.join(', ')}\n\nPlease log in to see the team roadmap, deliverables, and to initiate collaboration.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background: #fff;">
        <h2 style="color: #6366f1; margin-bottom: 20px;">👥 Student Team Allocated</h2>
        <p>Dear <strong>${industryName}</strong>,</p>
        <p>A capstone team has been successfully allocated to your sponsored project:</p>
        <blockquote style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px; margin: 16px 0;">
          <strong>Project Statement:</strong> ${projectTitle}<br/>
          <strong>Assigned Team Members:</strong> ${teamMembersNames.join(', ')}
        </blockquote>
        <p>Please log in to your Industry Dashboard to view their progress, comment on roadmap files, and organize milestone meetings.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Access Industry Hub</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated system notification from Project Hub.</p>
      </div>
    `
  })
}

/**
 * Notification Helper: Student is added to a capstone team
 * Recipient: Capstone Student
 */
export async function notifyStudentAddedToTeam(
  studentEmail: string,
  studentName: string,
  projectTitle: string,
  teamMembersNames: string[]
) {
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

  await sendNotificationEmail({
    toEmail: studentEmail,
    toName: studentName,
    subject: `🎉 You've Been Added to a Capstone Team! - ${projectTitle}`,
    bodyText: `Hi ${studentName},\n\nYou have been added as a member of the capstone project team: "${projectTitle}".\n\nAssigned Team Members: ${teamMembersNames.join(', ')}\n\nPlease log in to view your team dashboard and start collaborating.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;">
        <h2 style="color: #6366f1; margin-bottom: 20px;">🎉 You've Been Added to a Team!</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>You have been successfully added to the team for the following capstone project:</p>
        <blockquote style="background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px; margin: 16px 0;">
          <strong>Project:</strong> ${projectTitle}<br/>
          <strong>Full Team Roster:</strong> ${teamMembersNames.join(', ')}
        </blockquote>
        <p>Please log in to your Student Dashboard to view the milestones, access deliverables, and collaborate with your teammates.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Access Student Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated system notification from Project Hub.</p>
      </div>
    `
  })
}

/**
 * Notification Helper: Instructor is assigned to supervise a capstone project
 * Recipient: Faculty Advisor / Supervisor
 */
export async function notifyInstructorAssigned(
  instructorEmail: string,
  instructorName: string,
  projectTitle: string,
  studentName: string
) {
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

  await sendNotificationEmail({
    toEmail: instructorEmail,
    toName: instructorName,
    subject: `🛡️ New Capstone Supervision Assigned: ${studentName}`,
    bodyText: `Dear Dr. ${instructorName},\n\nYou have been assigned by the department administrator to supervise the senior capstone project: "${projectTitle}", proposed by student: "${studentName}".\n\nPlease log in to review their milestones roadmap and begin academic mentoring.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">🛡️ Supervision Assignment Alert</h2>
        <p>Dear Dr. <strong>${instructorName}</strong>,</p>
        <p>You have been officially assigned as the **Faculty Supervisor / Mentor** for the following senior capstone project:</p>
        <blockquote style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; margin: 16px 0;">
          <strong>Project Title:</strong> ${projectTitle}<br/>
          <strong>Student Lead:</strong> ${studentName}
        </blockquote>
        <p>Please log in to your Instructor Portal to approve their proposal description, view their milestones roadmap, and grade milestone deliverables.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Supervisor Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated system notification from Project Hub.</p>
      </div>
    `
  })
}

/**
 * Notification Helper: Student has been assigned a supervisor for their capstone project
 * Recipient: Capstone Student
 */
export async function notifyStudentSupervisorAssigned(
  studentEmail: string,
  studentName: string,
  instructorName: string,
  projectTitle: string
) {
  const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

  await sendNotificationEmail({
    toEmail: studentEmail,
    toName: studentName,
    subject: `🎉 Faculty Supervisor Assigned! — Start Your Capstone Project`,
    bodyText: `Hi ${studentName},\n\nWe are pleased to inform you that Dr. ${instructorName} has been assigned as your Faculty Supervisor for your senior capstone project: "${projectTitle}".\n\nYour milestone locked restrictions are now fully lifted! You can officially begin working on your project and submitting milestones for review.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
    bodyHtml: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;">
        <h2 style="color: #10b981; margin-bottom: 20px;">🎉 Supervisor Match Successful!</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your senior capstone project has officially been paired with a Faculty Advisor:</p>
        <blockquote style="background: #f8fafc; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0;">
          <strong>Project Title:</strong> ${projectTitle}<br/>
          <strong>Assigned Supervisor:</strong> Dr. <strong>${instructorName}</strong>
        </blockquote>
        <p>All submission locks have been lifted! You can now start collaborating, checking milestone requirements, and submitting deliverables for Dr. ${instructorName}'s evaluation.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${loginUrl}" style="background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Start Your Project</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
        <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated system notification from Project Hub.</p>
      </div>
    `
  })
}

/**
 * Creates a floating toast notification that mimics a desktop email receipt.
 */
function showEmailToast(email: string, recipientName: string, subject: string, statusText: string = 'Email Dispatched') {
  if (typeof document === 'undefined') return

  let container = document.getElementById('email-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'email-toast-container'
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `
    document.body.appendChild(container)
  }

  const isReal = statusText === 'Real Email Sent'
  const badgeColor = isReal ? '#10b981' : '#818cf8'

  const toast = document.createElement('div')
  toast.style.cssText = `
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 380px;
    pointer-events: auto;
    transform: translateX(-120%);
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease;
    opacity: 0;
    border: 1px solid rgba(99, 102, 241, 0.2);
  `

  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px;">
        ✉️
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; color: ${badgeColor};">${statusText}</span>
          <span style="font-size: 10px; color: #64748b; font-weight: 600;">just now</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 4px; font-weight: 600;">
          To: ${recipientName} &lt;${email}&gt;
        </div>
        <div style="font-size: 12px; color: #e2e8f0; font-weight: 700; line-height: 1.4;">
          ${subject}
        </div>
      </div>
    </div>
  `

  container.appendChild(toast)

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)'
    toast.style.opacity = '1'
  })

  setTimeout(() => {
    toast.style.transform = 'translateX(-120%)'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 400)
  }, 6000)
}

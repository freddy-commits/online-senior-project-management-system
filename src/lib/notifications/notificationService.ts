import { createClient } from '@/lib/supabase/client'
import { sendSMS } from '@/lib/sms/smsService'

export interface Announcement {
  id?: string
  title: string
  content: string
  target_role: 'all' | 'student' | 'instructor' | 'industry'
}

/**
 * Creates notifications in the Supabase 'notifications' table for all users matching the target role.
 * Also triggers simulated SMS delivery for matching users who have a phone number.
 */
export async function createAnnouncementNotifications(announcement: Announcement) {
  const supabase = createClient()

  try {
    // 1. Fetch matching user profiles from Supabase
    let query = supabase.from('profiles').select('id, full_name, email, phone, role')

    if (announcement.target_role !== 'all') {
      query = query.eq('role', announcement.target_role)
    }

    const { data: users, error: fetchError } = await query

    if (fetchError) {
      console.error('[NotificationService] Error fetching recipients:', fetchError)
      return
    }

    if (!users || users.length === 0) {
      console.log('[NotificationService] No recipients found for target role:', announcement.target_role)
      return
    }

    // 2. Prepare notifications to insert
    const notificationsToInsert = users.map((user: any) => ({
      user_id: user.id,
      title: `University Announcement: ${announcement.title}`,
      message: announcement.content.slice(0, 150) + (announcement.content.length > 150 ? '...' : ''),
      type: 'system',
      is_read: false,
      action_url: `/dashboard/${user.role}`,
      action_label: 'View Announcement'
    }))

    // 3. Batch insert notifications
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsToInsert)

    if (insertError) {
      console.error('[NotificationService] Error inserting notifications:', insertError)
    } else {
      console.log(`[NotificationService] Inserted ${notificationsToInsert.length} notifications successfully.`)
    }

    // 4. Send SMS to users with phone numbers
    const smsPromises = users
      .filter((user: any) => user.phone)
      .map((user: any) => 
        sendSMS({
          recipientId: user.id,
          message: `📣 [Project Hub Announcement] ${announcement.title}: "${announcement.content.slice(0, 60)}..." Log in to view details.`
        }).catch(err => {
          console.error(`[NotificationService] Error sending SMS to ${user.full_name}:`, err)
        })
      )

    await Promise.all(smsPromises)

  } catch (error) {
    console.error('[NotificationService] Unexpected error creating notifications:', error)
  }
}

// SMS Notification Service
// Currently simulates SMS delivery with visual toast feedback.
// To connect to real SMS (Twilio/Africa's Talking), replace sendSMS() body with API call.

import { createClient } from '@/lib/supabase/client'

export interface SMSPayload {
  recipientId: string
  message: string
}

// In-memory log of sent SMS for demo purposes
const smsLog: Array<{ to: string; message: string; timestamp: string; status: 'delivered' | 'failed' }> = []

/**
 * Look up phone number from user profile in Supabase and simulate sending SMS.
 * Shows a browser notification toast when SMS is "sent".
 * In production, replace the body with a fetch() to your SMS API endpoint.
 */
export async function sendSMS(payload: SMSPayload): Promise<{ success: boolean; phone?: string }> {
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', payload.recipientId)
    .single()
  
  if (error || !profile?.phone) {
    console.warn(`[SMS] No phone number or profile found for user ${payload.recipientId}`, error)
    return { success: false }
  }

  const phone = profile.phone

  // --- PRODUCTION: Replace this block with real API call ---
  // Example for Twilio:
  // await fetch('/api/sms/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ to: phone, body: payload.message })
  // })
  // ---------------------------------------------------------

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Log the SMS
  smsLog.push({
    to: phone,
    message: payload.message,
    timestamp: new Date().toISOString(),
    status: 'delivered'
  })

  // Show visual toast notification in the browser
  if (typeof window !== 'undefined') {
    showSMSToast(phone, payload.message, profile.full_name)
  }

  console.log(`[SMS ✓] Sent to ${profile.full_name} (${phone}): "${payload.message.slice(0, 60)}..."`)
  return { success: true, phone }
}

/**
 * Send SMS to multiple recipients (e.g., all team members).
 */
export async function sendBulkSMS(recipientIds: string[], message: string): Promise<void> {
  await Promise.all(
    recipientIds.map(id => sendSMS({ recipientId: id, message }))
  )
}

/**
 * Get the SMS delivery log (for admin dashboard / debugging).
 */
export function getSMSLog() {
  return [...smsLog]
}

/**
 * Creates a floating toast notification that mimics a phone SMS receipt.
 */
function showSMSToast(phone: string, message: string, recipientName: string) {
  // Prevent SSR issues
  if (typeof document === 'undefined') return

  // Create or reuse toast container
  let container = document.getElementById('sms-toast-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'sms-toast-container'
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `
    document.body.appendChild(container)
  }

  const toast = document.createElement('div')
  toast.style.cssText = `
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 380px;
    pointer-events: auto;
    transform: translateX(120%);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
    opacity: 0;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
  `

  const maskedPhone = phone.slice(0, 7) + '***' + phone.slice(-2)

  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #22c55e, #16a34a); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px;">
        📱
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-weight: 700; font-size: 13px; color: #22c55e;">SMS Sent</span>
          <span style="font-size: 10px; color: #64748b; font-weight: 600;">just now</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px; font-weight: 600;">
          To: ${recipientName} (${maskedPhone})
        </div>
        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${message}
        </div>
      </div>
    </div>
  `

  container.appendChild(toast)

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)'
    toast.style.opacity = '1'
  })

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)'
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 400)
  }, 5000)
}

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { toEmail, toName, subject, bodyHtml, bodyText } = await request.json()
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.warn('⚠️ [API EMAIL SERVICE] RESEND_API_KEY is not defined in environment variables. Email simulation logged to console.')
      return NextResponse.json({ 
        success: false, 
        simulated: true, 
        message: 'RESEND_API_KEY is missing in .env.local. Emails are running in simulation mode.'
      })
    }

    // Call Resend REST API securely
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'Project Hub <onboarding@resend.dev>', // Resend\'s free tier sender domain
        to: toEmail,
        subject: subject,
        html: bodyHtml,
        text: bodyText
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [API EMAIL SERVICE] Resend API error:', errorData)
      return NextResponse.json({ success: false, error: errorData }, { status: response.status })
    }

    const result = await response.json()
    console.log('✅ [API EMAIL SERVICE] Real email successfully sent via Resend API!', result)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('❌ [API EMAIL SERVICE] Internal Server Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

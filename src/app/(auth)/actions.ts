'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  console.log('--- LOGIN START ---')
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('Attempting login for:', email)
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('Login error:', error.message)
    return redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // Get user profile to determine role
  const { data: { user } } = await supabase.auth.getUser()
  let role = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role

    // Fallback to user metadata role if database profile has a null role
    if (!role && user.user_metadata?.role) {
      role = user.user_metadata.role
      await supabase.from('profiles').update({ role }).eq('id', user.id)
    }
  }

  console.log('User logged in. Role:', role)
  revalidatePath('/', 'layout')
  
  if (role) {
    return redirect(`/${role}`)
  }

  return redirect('/')
}

export async function signup(formData: FormData) {
  console.log('--- SIGNUP START ---')
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const full_name = formData.get('full_name') as string

  console.log('Attempting signup for:', email, 'as', role)

  // Guard: ensure required env vars are present on the server
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables on the server.')
    return redirect('/register?error=' + encodeURIComponent('Server configuration error: missing environment variables.'))
  }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Create the auth user using admin API (email auto-confirmed)
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  })

  if (error) {
    console.error('Signup error:', error.message)
    return redirect('/register?error=' + encodeURIComponent(error.message))
  }

  console.log('User created in Auth successfully:', data.user?.id)

  if (data.user) {
    console.log('Creating/updating profile in database...')
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: email,
        full_name: full_name,
        role: role,
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error updating profile:', profileError.message)
    } else {
      console.log('Profile created/updated successfully.')
    }
  }

  // Attempt to sign in on standard client-side/server-side
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    console.error('SignIn error after signup:', signInError.message)
  }

  console.log('Redirecting to dashboard:', `/${role}`)
  revalidatePath('/', 'layout')
  return redirect(`/${role}`)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return redirect('/')
}

export async function resetUserPasswordByEmail(email: string) {
  if (!email) {
    return { success: false, error: 'Email is required.' }
  }

  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'Server configuration error: missing environment variables.' }
    }

    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Fetch users using admin API
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
    if (listError) throw listError

    const targetUser = usersData.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!targetUser) {
      return { success: false, error: 'No account registered with this email address.' }
    }

    // Generate a secure temporary password
    // Format: Proj-XXXXXX (where X is uppercase alphanumeric)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let tempPassword = 'Proj-'
    for (let i = 0; i < 6; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Update user password directly
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      targetUser.id,
      { password: tempPassword }
    )
    if (updateError) throw updateError

    // Try to send real email using Resend API
    const apiKey = process.env.RESEND_API_KEY
    let emailSent = false
    let simulated = true

    if (apiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: 'Project Hub <onboarding@resend.dev>',
            to: email,
            subject: 'Temporary Password for Project Station',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px; background: #fff; color: #334155; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h2 style="color: #4f46e5; margin-bottom: 12px; font-weight: 800; text-align: center; font-size: 22px;">Temporary Password Issued</h2>
                <p style="font-size: 14px; line-height: 1.6; text-align: center; color: #64748b;">We received a request to recover your password. Please use the temporary password below to sign in:</p>
                
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 24px 0; text-align: center;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 700; display: block; margin-bottom: 8px;">Temporary Password</span>
                  <span style="font-family: monospace; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 2px;">${tempPassword}</span>
                </div>
                
                <p style="font-size: 13px; line-height: 1.6; color: #64748b;">Once logged in, you can update this to a permanent password of your choice in your <strong>Security Settings</strong>.</p>
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login" style="background: #4f46e5; color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">Go to Sign In</a>
                </div>
                
                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 24px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.4;">This is an automated security notification from Project Station.</p>
              </div>
            `,
            text: `Hello,\n\nWe received a request to recover your password. Please use the temporary password below to sign in:\n\nTemporary Password: ${tempPassword}\n\nOnce logged in, please update this in your security settings.\n\nBest regards,\nProject Station`
          }),
        })

        if (response.ok) {
          emailSent = true
          simulated = false
          console.log(`✅ [PASSWORD RESET] Real email sent successfully to ${email}.`)
        } else {
          console.error('❌ [PASSWORD RESET] Resend API responded with error:', await response.text())
        }
      } catch (emailErr: any) {
        console.error('❌ [PASSWORD RESET] Failed to request Resend API:', emailErr.message)
      }
    }

    if (simulated) {
      console.log(`
========================================================================
🔑  [PASSWORD RESET EMAIL SIMULATED]
To: ${email}
Temporary Password: ${tempPassword}
------------------------------------------------------------------------
Please copy this temporary password to log in.
========================================================================
      `)
    }

    return { success: true, simulated, tempPassword }
  } catch (err: any) {
    console.error('Password reset action failed:', err.message)
    return { success: false, error: err.message || 'Failed to reset password.' }
  }
}

export async function checkEmailExists(email: string) {
  if (!email) return { success: false, error: 'Email is required.' }
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return { success: false, error: 'Server configuration error: missing environment variables.' }
    }
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers()
    if (listError) throw listError
    const exists = usersData.users.some(u => u.email?.toLowerCase() === email.toLowerCase())
    return { success: true, exists }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to verify email.' }
  }
}

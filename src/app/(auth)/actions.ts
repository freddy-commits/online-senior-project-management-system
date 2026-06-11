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

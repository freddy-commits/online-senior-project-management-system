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
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .single()

  console.log('User logged in. Role:', profile?.role)
  revalidatePath('/', 'layout')
  
  if (profile?.role) {
    return redirect(`/${profile.role}`)
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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name,
      }
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    return redirect('/register?error=' + encodeURIComponent(error.message))
  }

  console.log('User created in Auth successfully:', data.user?.id)

  if (data.user) {
    console.log('Updating profile in database...')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('id', data.user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError.message)
    } else {
      console.log('Profile updated successfully.')
    }
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

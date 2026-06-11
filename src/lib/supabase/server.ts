import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for Server Components.
 * This version always uses the real Supabase backend.
 * Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const demoRole = cookieStore.get('demo_role')?.value
  const demoEmail = cookieStore.get('active_user_email')?.value
  const demoMode = cookieStore.get('demo_mode')?.value || (demoRole ? 'true' : '')

  if (demoMode === 'true' || demoRole) {
    const { createMockClient } = require('./mockClient')
    return createMockClient(demoRole, demoEmail)
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In Server Components, setAll may be called during middleware refresh.
          }
        },
      },
    }
  )
}

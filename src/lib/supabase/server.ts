import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockClient } from './mockClient'

/**
 * Create a Supabase client for Server Components.
 * Automatically falls back to mock client if in demo mode or keys are missing.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const isDemo = cookieStore.has('demo_mode') || 
    !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (isDemo) {
    return createMockClient() as any
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

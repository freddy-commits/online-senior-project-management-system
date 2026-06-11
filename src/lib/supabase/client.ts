import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  if (typeof window !== 'undefined' && (localStorage.getItem('demo_mode') === 'true' || document.cookie.includes('demo_role='))) {
    const { createMockClient } = require('./mockClient')
    const activeEmail = localStorage.getItem('active_user_email') || undefined
    const match = document.cookie.match(/^(.*;)?\s*demo_role\s*=\s*([^;]+)(.*)?$/)
    const activeRole = match ? match[2] : undefined
    return createMockClient(activeRole, activeEmail)
  }

  // Ensure Supabase credentials are provided
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

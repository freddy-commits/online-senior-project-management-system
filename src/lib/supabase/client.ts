import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mockClient'

export function createClient() {
  const isDemo = typeof window !== 'undefined' && 
    (document.cookie.includes('demo_mode=true') || 
     !process.env.NEXT_PUBLIC_SUPABASE_URL || 
     !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (isDemo) {
    return createMockClient() as any
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

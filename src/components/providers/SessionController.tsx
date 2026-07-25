'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SessionController() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    // Monitor authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isProtectedRoute = 
        pathname.startsWith('/student') || 
        pathname.startsWith('/supervisor') || 
        pathname.startsWith('/instructor') || 
        pathname.startsWith('/partner') || 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/hub')

      if (event === 'SIGNED_OUT' && isProtectedRoute) {
        // If the user signed out, redirect them to login page immediately
        router.replace('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router])

  return null
}

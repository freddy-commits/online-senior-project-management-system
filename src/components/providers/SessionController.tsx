'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SessionController() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 1. Path protection check
    const isProtectedRoute = 
      pathname.startsWith('/student') || 
      pathname.startsWith('/supervisor') || 
      pathname.startsWith('/instructor') || 
      pathname.startsWith('/partner') || 
      pathname.startsWith('/admin') || 
      pathname.startsWith('/archive') || 
      pathname.startsWith('/hub')

    if (!isProtectedRoute) return

    const supabase = createClient()

    // 2. Page reload detection & Session validation
    const checkSessionAndReload = async () => {
      // Check if this window mount was caused by a page reload/refresh
      const navEntries = performance.getEntriesByType('navigation')
      const isReload = 
        performance.navigation?.type === 1 || 
        (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload')

      const isSessionActive = sessionStorage.getItem('dashboard_session_active') === 'true'

      if (isReload || !isSessionActive) {
        console.log('SessionController: Force logout due to page reload or inactive session.')
        sessionStorage.removeItem('dashboard_session_active')
        await supabase.auth.signOut()
        window.location.href = '/login'
        return
      }

      // If we are on a protected route and verified, keep the session active flag
      sessionStorage.setItem('dashboard_session_active', 'true')
    }

    checkSessionAndReload()

    // 3. Inactivity tracker (1 minute timeout)
    let inactivityTimer: NodeJS.Timeout

    const handleLogout = async () => {
      console.log('SessionController: Logging out due to 1 minute of inactivity.')
      sessionStorage.removeItem('dashboard_session_active')
      await supabase.auth.signOut()
      window.location.href = '/login'
    }

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      // 1 minute = 60,000 milliseconds
      inactivityTimer = setTimeout(handleLogout, 60000)
    }

    // Initialize timer on mount
    resetInactivityTimer()

    // Listen to user activity events
    const activityEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'click', 'touchstart']
    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer)
    })

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer)
      })
    }
  }, [pathname])

  return null
}

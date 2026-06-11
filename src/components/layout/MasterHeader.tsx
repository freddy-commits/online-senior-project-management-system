'use client'

import { useState, useEffect } from 'react'
import TrackSwitcher from '@/components/navigation/TrackSwitcher'
import { Bell, Menu } from 'lucide-react'

export default function MasterHeader({ role = 'student' }: { role?: string }) {
  const [fullName, setFullName] = useState('User')
  
  useEffect(() => {
    async function loadProfile() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
          if (data?.full_name) {
            setFullName(data.full_name)
          }
        }
      } catch (e) {
        console.error("Supabase user load error:", e)
      }
    }
    loadProfile()
  }, [])

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          className="md:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Dual-pill track switcher + Switch Track button */}
        <TrackSwitcher />

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors pr-2" title="Notifications">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}

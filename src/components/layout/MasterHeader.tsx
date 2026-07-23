'use client'

import { useState, useEffect } from 'react'
import TrackSwitcher from '@/components/navigation/TrackSwitcher'
import { Bell, Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MasterHeader({ role = 'student' }: { role?: string }) {
  const [fullName, setFullName] = useState('User')
  const t = useTranslations('Header')
  
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

  const pathname = usePathname()

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between shrink-0 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
          title={t('toggle_sidebar')}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Dual-pill track switcher + Switch Track button */}
        {role !== 'examiner_panel' && <TrackSwitcher />}

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 transition-colors pr-2" title={t('notifications')}>
          <Bell className="w-5 h-5" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Profile Link */}
        <Link 
          href={`/${role}/profile`}
          className={`flex items-center gap-3 p-1.5 rounded-xl transition-colors cursor-pointer border ${
            pathname.startsWith(`/${role}/profile`)
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
              : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-850/60'
          }`}
        >
          <div className="w-9 h-9 bg-[#F59E0B] text-[#111827] rounded-xl flex items-center justify-center font-black text-xs shadow-sm select-none shrink-0">
            {initials}
          </div>
          <span className="hidden sm:block text-xs font-black text-slate-900 dark:text-white leading-none">
            {fullName}
          </span>
        </Link>
      </div>
    </header>
  )
}

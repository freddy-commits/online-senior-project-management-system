'use client'

import TrackSwitcher from '@/components/navigation/TrackSwitcher'
import { Bell } from 'lucide-react'

export default function MasterHeader({ role = 'student' }: { role?: string }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 z-40 sticky top-0">
      <div className="flex items-center gap-4">
        {/* We can place contextual breadcrumbs or search here */}
      </div>

      <div className="flex items-center gap-6">
        {/* Dual-pill track switcher + Switch Track button */}
        <TrackSwitcher />

        {/* Divider */}
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />

        {/* Notifications */}
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* Dark User Avatar */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-xs font-black text-slate-900 leading-none">Alex Rivera</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1">{role}</span>
          </div>
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
            AR
          </div>
        </div>
      </div>
    </header>
  )
}

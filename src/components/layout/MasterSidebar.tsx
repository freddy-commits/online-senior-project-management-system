'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Target, Users, FileText, Settings, Menu, LogOut } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MasterSidebar({ role = 'student' }: { role?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { name: 'Dashboard', path: `/${role}/dashboard`, match: `/${role}/dashboard`, icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Milestones', path: `/${role}/milestones`, match: `/${role}/milestones`, icon: <Target className="w-5 h-5" /> },
    { name: 'Team', path: `/${role}/teams`, match: `/${role}/teams`, icon: <Users className="w-5 h-5" /> },
    { name: 'Documents', path: `/${role}/documents`, match: `/${role}/documents`, icon: <FileText className="w-5 h-5" /> },
  ]

  return (
    <aside className="bg-white border-r border-slate-200 hidden md:flex flex-col h-screen shrink-0 w-64 shadow-sm z-50">
      {/* Brand Logo Container */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200 shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">
              Project Station
            </span>
            <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5 leading-tight">
              {role.toUpperCase()} WORKSPACE
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.match)
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${
                isActive 
                  ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Settings & Logout */}
      <div className="p-4 border-t border-slate-200 shrink-0 space-y-1">
        <Link 
          href={`/${role}/settings`} 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm ${
            pathname.startsWith(`/${role}/settings`)
              ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span>Settings</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
}

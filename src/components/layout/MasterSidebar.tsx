'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Target, Users, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Archive, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MasterSidebar({ role = 'student' }: { role?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ full_name: string; role: string; email: string } | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (data) setProfile(data)
        }
      } catch (e) {
        console.error("Supabase user load error:", e)
      }
    }
    loadProfile()

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('seniorproj_sidebar_collapsed')
      setIsCollapsed(saved === 'true')
    }

    const handleToggle = () => setMobileOpen(prev => !prev)
    window.addEventListener('toggle-mobile-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle)
  }, [])

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    if (typeof window !== 'undefined') {
      localStorage.setItem('seniorproj_sidebar_collapsed', String(nextState))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active_user_email')
    }
    router.push('/login')
  }

  const activeRole = profile?.role || role
  const menuItems = activeRole === 'admin'
    ? [
        { name: 'Dashboard', path: `/admin`, match: `/admin`, icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'Allocations', path: `/admin/projects`, match: `/admin/projects`, icon: <Users className="w-5 h-5" /> },
        { name: 'Archive', path: `/student/archive`, match: `/student/archive`, icon: <Archive className="w-5 h-5" /> },
      ]
    : [
        { name: 'Dashboard', path: `/${activeRole}/dashboard`, match: `/${activeRole}/dashboard`, icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'Milestones', path: `/${activeRole}/milestones`, match: `/${activeRole}/milestones`, icon: <Target className="w-5 h-5" /> },
        { name: 'Team', path: `/${activeRole}/teams`, match: `/${activeRole}/teams`, icon: <Users className="w-5 h-5" /> },
        { name: 'Documents', path: `/${activeRole}/documents`, match: `/${activeRole}/documents`, icon: <FileText className="w-5 h-5" /> },
        { name: 'Archive', path: `/student/archive`, match: `/student/archive`, icon: <Archive className="w-5 h-5" /> },
      ]

  const fullName = profile?.full_name || 'User'
  const displayRole = profile?.role === 'instructor' 
    ? 'Lead Coordinator' 
    : profile?.role === 'supervisor' 
      ? 'Academic Supervisor' 
      : profile?.role === 'student' 
        ? 'Student Lead' 
        : profile?.role === 'industry' 
          ? 'Industry Partner' 
          : profile?.role === 'admin'
            ? 'Panel Member'
            : profile?.role || role
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden cursor-pointer"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`bg-white border-r border-slate-200 flex flex-col h-screen shrink-0 shadow-sm z-50 transition-all duration-300 
        fixed md:sticky top-0 left-0 h-full
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Brand Logo Container */}
        <div className={`h-20 flex items-center justify-between border-b border-slate-200 shrink-0 ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight">
                  Project Station
                </span>
                <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5 leading-tight">
                  {activeRole.toUpperCase()} WORKSPACE
                </span>
              </div>
            )}
          </Link>
          
          {/* Mobile close button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors border border-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {(!isCollapsed && !mobileOpen) && (
            <button 
              onClick={toggleCollapse}
              className="hidden md:block p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        {(isCollapsed && !mobileOpen) && (
          <div className="hidden md:flex justify-center py-2 border-b border-slate-100">
            <button 
              onClick={toggleCollapse}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.match)
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center px-0' : 'px-3'} ${
                  isActive 
                    ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="shrink-0">{item.icon}</div>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer Settings, Logout & Profile Card */}
        <div className={`p-4 border-t border-slate-200 shrink-0 space-y-3 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <div className="space-y-1">
          <Link 
            href={`/${activeRole}/settings`} 
            className={`flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center px-0' : 'px-3'} ${
              pathname.startsWith(`/${activeRole}/settings`)
                ? 'bg-indigo-700 text-white shadow-md shadow-indigo-700/20' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
            title={isCollapsed ? 'Log Out' : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Log Out</span>}
          </button>
        </div>

        {/* User profile footer card */}
        <div className={`flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 ${isCollapsed ? 'justify-center p-1.5' : ''}`}>
          <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm select-none shrink-0">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-xs font-black text-slate-900 truncate block leading-none">{fullName}</span>
              <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block mt-1.5 leading-none">{displayRole}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  )
}

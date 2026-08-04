'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Target, Users, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Archive, X, Sliders } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'

export default function MasterSidebar({ role = 'student' }: { role?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('Sidebar')

  const [profile, setProfile] = useState<{ full_name: string; role: string; email: string } | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAssignedExaminer, setIsAssignedExaminer] = useState(false)
  
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
          if (data) {
            setProfile(data)
            
            // Check if supervisor or instructor is assigned as an examiner
            if (data.role === 'supervisor' || data.role === 'instructor') {
              let assignedAsExaminer = false
              
              // 1. Check Supabase first
              const { data: examinerProjs } = await supabase
                .from('projects')
                .select('id')
                .contains('examiner_panel', [user.id])
                .limit(1)
              if (examinerProjs && examinerProjs.length > 0) {
                assignedAsExaminer = true
              }

              if (assignedAsExaminer) {
                setIsAssignedExaminer(true)
              }
            }
          }
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
  const isExaminer = activeRole === 'examiner' || activeRole === 'examiner_panel' || pathname.startsWith('/examiner')
  const showAdminMenu = pathname.startsWith('/admin')

  const menuItems = isExaminer
    ? [
        { name: 'Dashboard', path: `/examiner/dashboard`, match: `/examiner/dashboard`, icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'Assigned Projects', path: `/examiner/projects`, match: `/examiner/projects`, icon: <FileText className="w-5 h-5" /> },
      ]
    : showAdminMenu
      ? [
          { name: 'Dashboard', path: `/admin/dashboard`, match: `/admin/dashboard`, icon: <LayoutDashboard className="w-5 h-5" /> },
          { name: 'Role Approvals', path: `/admin/approvals`, match: `/admin/approvals`, icon: <Sliders className="w-5 h-5" /> },
          { name: 'All Projects', path: `/admin/projects`, match: `/admin/projects`, icon: <FileText className="w-5 h-5" /> },
          { name: 'User Management', path: `/admin/users`, match: `/admin/users`, icon: <Users className="w-5 h-5" /> },
          { name: 'Reports', path: `/admin/reports`, match: `/admin/reports`, icon: <FileText className="w-5 h-5" /> }
        ]
      : [
          { name: t('dashboard'), path: `/${activeRole}/dashboard`, match: `/${activeRole}/dashboard`, icon: <LayoutDashboard className="w-5 h-5" /> },
          { name: t('milestones'), path: `/${activeRole}/milestones`, match: `/${activeRole}/milestones`, icon: <Target className="w-5 h-5" /> },
          { name: t('teams'), path: `/${activeRole}/teams`, match: `/${activeRole}/teams`, icon: <Users className="w-5 h-5" /> },
          { name: t('documents'), path: `/${activeRole}/documents`, match: `/${activeRole}/documents`, icon: <FileText className="w-5 h-5" /> },
          ...(activeRole === 'instructor' || activeRole === 'supervisor' ? [{ name: 'Reports', path: `/${activeRole}/reports`, match: `/${activeRole}/reports`, icon: <FileText className="w-5 h-5" /> }] : []),
          { name: t('archive'), path: `/archive`, match: `/archive`, icon: <Archive className="w-5 h-5" /> },
        ]

  const fullName = profile?.full_name || 'User'
  const displayRole = profile?.role === 'instructor' 
    ? 'Lead Coordinator' 
    : profile?.role === 'supervisor' 
      ? 'Academic Supervisor' 
      : profile?.role === 'student' 
        ? 'Student Lead' 
        : profile?.role === 'industry_partner' || profile?.role === 'industry'
          ? 'Industry Partner' 
          : profile?.role === 'examiner'
            ? 'Panel Examiner'
            : profile?.role === 'admin'
              ? 'System Administrator'
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

      <aside className={`bg-[#111827] border-r border-white/5 flex flex-col h-screen shrink-0 shadow-sm z-50 transition-all duration-300 
        fixed md:sticky top-0 left-0 h-full
        ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Brand Logo Container */}
        <div className={`h-20 flex items-center justify-between border-b border-white/5 shrink-0 ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#F59E0B] rounded-xl flex items-center justify-center text-[#111827] shrink-0 shadow-sm font-black text-lg">
              P
            </div>
            {(!isCollapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white tracking-tight leading-tight">
                  Project Station
                </span>
                <span className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5 leading-tight">
                  {showAdminMenu 
                    ? (profile?.role === 'admin' ? 'ADMIN' : 'PANEL EXAMINER') 
                    : activeRole.replace('_', ' ').toUpperCase()} WORKSPACE
                </span>
              </div>
            )}
          </Link>
          
          {/* Mobile close button */}
          <button 
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 hover:bg-white/5 rounded-lg text-slate-450 hover:text-white transition-colors border border-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {(!isCollapsed && !mobileOpen) && (
            <button 
              onClick={toggleCollapse}
              className="hidden md:block p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        {(isCollapsed && !mobileOpen) && (
          <div className="hidden md:flex justify-center py-2 border-b border-white/5">
            <button 
              onClick={toggleCollapse}
              className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
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
                    ? 'bg-[#F59E0B] text-[#111827] shadow-md shadow-[#F59E0B]/10' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
        <div className={`p-4 border-t border-white/5 shrink-0 space-y-3 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {isAssignedExaminer && (
            <div className="pb-2">
              {showAdminMenu ? (
                <Link 
                  href={`/${activeRole}/dashboard`}
                  className={`flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
                  title={isCollapsed ? "Back to Dashboard" : undefined}
                >
                  <Sliders className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">Supervisor/Instructor View</span>}
                </Link>
              ) : (
                <Link 
                  href="/admin"
                  className={`flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
                  title={isCollapsed ? "Examiner Portal" : undefined}
                >
                  <Sliders className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">Switch to Examiner View</span>}
                </Link>
              )}
            </div>
          )}
          <div className="space-y-1">
          <Link 
            href={`/${activeRole}/settings`} 
            className={`flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-sm ${isCollapsed ? 'justify-center px-0' : 'px-3'} ${
              pathname.startsWith(`/${activeRole}/settings`)
                ? 'bg-[#F59E0B] text-[#111827] shadow-md shadow-[#F59E0B]/10' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
            title={isCollapsed ? t('settings') : undefined}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{t('settings')}</span>}
          </Link>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 py-2.5 rounded-xl transition-all font-bold text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
            title={isCollapsed ? t('logout') : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>


      </div>
    </aside>
    </>
  )
}

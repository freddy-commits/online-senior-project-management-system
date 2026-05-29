'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import SandboxToolbar from '@/components/dashboard/SandboxToolbar'
import { 
  LayoutDashboard, 
  BookOpen,
  MessageSquare,
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Building,
  GraduationCap
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          // Check for demo mode cookies
          const hasDemo = document.cookie.includes('demo_mode=true')
          if (!hasDemo) {
            router.push('/login')
            return
          }
        }
        
        setUser(authUser)

        // Fetch profile
        const activeRole = document.cookie.match(/^(.*;)?\s*demo_role\s*=\s*([^;]+)(.*)?$/)?.[2] || 'student'
        if (authUser) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
          setProfile(userProfile || { full_name: authUser.user_metadata?.full_name || 'User', role: activeRole })
        } else {
          // Seeded fallback profiles
          const nameMap: Record<string, string> = {
            student: 'Alex Carter',
            instructor: 'Dr. Sarah Johnson',
            supervisor: 'Dr. Robert Miller',
            partner: 'TechCorp Mentorship'
          }
          setProfile({
            full_name: nameMap[activeRole] || 'Demo User',
            role: activeRole,
            email: `${activeRole}@university.edu`
          })
        }
      } catch (e) {
        console.error('Error fetching auth state:', e)
      } finally {
        setLoading(false)
      }
    }
    
    loadUser()
    fetchNotifications()

    // Listen to cookie changes (Sandbox Switcher triggers role updates)
    const interval = setInterval(() => {
      const activeRole = document.cookie.match(/^(.*;)?\s*demo_role\s*=\s*([^;]+)(.*)?$/)?.[2] || 'student'
      if (profile && profile.role !== activeRole) {
        loadUser()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [profile?.role])

  async function fetchNotifications() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const userId = authUser?.id || 'demo-student-id'
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (data) setNotifications(data)
    } catch (e) {
      // Fallback notifications if table doesn't exist
      setNotifications([
        { id: '1', title: 'Milestone Submitted', message: 'Alex Carter submitted Proposal deliverable', type: 'system', is_read: false },
        { id: '2', title: 'Upcoming Deadline', message: 'System Design report is due in 3 days', type: 'deadline', is_read: false }
      ])
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    window.location.href = '/'
  }

  const role = profile?.role || 'student'
  const userName = profile?.full_name || 'Academic User'
  const userEmail = profile?.email || 'user@university.edu'

  const menuItems = [
    { name: 'Dashboard Workspace', icon: <LayoutDashboard className="w-5 h-5" />, path: `/dashboard/${role}` },
    { name: 'Discussion Channel', icon: <MessageSquare className="w-5 h-5" />, path: '/messages' }
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Beautiful badge mapping
  const roleBadgeMap: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    student: { 
      label: 'Student Portal', 
      bg: 'bg-violet-500/10', 
      text: 'text-violet-300', 
      border: 'border-violet-500/20',
      icon: <GraduationCap className="w-3.5 h-3.5" />
    },
    instructor: { 
      label: 'Course Coordinator', 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-300', 
      border: 'border-emerald-500/20',
      icon: <ShieldAlert className="w-3.5 h-3.5" />
    },
    supervisor: { 
      label: 'Academic Supervisor', 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-300', 
      border: 'border-amber-500/20',
      icon: <UserCheck className="w-3.5 h-3.5" />
    },
    partner: { 
      label: 'Industry Partner', 
      bg: 'bg-indigo-500/10', 
      text: 'text-indigo-300', 
      border: 'border-indigo-500/20',
      icon: <Building className="w-3.5 h-3.5" />
    }
  }

  const currentBadge = roleBadgeMap[role] || roleBadgeMap.student

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Synchronizing academic session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex overflow-hidden font-sans">
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-violet-600/10 blur-[180px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[180px] rounded-full" />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-emerald-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 bg-slate-950/60 backdrop-blur-3xl border-r border-slate-800/40 flex flex-col transition-all duration-300 shadow-2xl"
      >
        {/* Brand */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/40">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
              <span className="text-white font-extrabold text-xl">P</span>
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
                <span className="font-black text-base tracking-tight text-white leading-tight">
                  GRADUATE HUB
                </span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider">
                  ACADEMIC GOVERNANCE
                </span>
              </motion.div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative border ${
                  isActive 
                    ? 'bg-slate-900 border-slate-700/60 text-white shadow-xl shadow-slate-900/30' 
                    : 'border-transparent text-slate-400 hover:bg-slate-900/40 hover:text-white hover:border-slate-800/30'
                }`}
              >
                <div className={`shrink-0 ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-sm">
                    {item.name}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User profile drawer */}
        <div className="p-4 border-t border-slate-800/40">
          <div className="bg-slate-900/80 border border-slate-800/50 rounded-3xl p-3.5 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-black text-lg shrink-0 text-white shadow-md shadow-violet-500/10">
              {userName[0]}
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <div className="font-black text-sm truncate text-white leading-tight">{userName}</div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{userEmail}</div>
              </motion.div>
            )}
            {isSidebarOpen && (
              <button 
                onClick={handleLogout} 
                className="p-2 hover:bg-slate-800 border border-transparent hover:border-slate-700/40 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400 transition-colors" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Header toolbar */}
        <header className="h-20 flex items-center justify-between px-8 bg-slate-950/20 border-b border-slate-800/20 shrink-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-slate-900/60 border border-transparent hover:border-slate-800/40 rounded-xl transition-all"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
            </button>
            
            {/* Elegant role badge */}
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-bold ${currentBadge.bg} ${currentBadge.text} border ${currentBadge.border} rounded-full transition-all duration-300`}>
              {currentBadge.icon}
              {currentBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/40 rounded-xl transition-all relative"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border border-slate-950" />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-14 w-80 bg-slate-950 border border-slate-800/80 rounded-3xl shadow-2xl p-4 overflow-hidden z-50 shadow-slate-950/80"
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-extrabold text-sm text-white">Notifications</h3>
                    <button className="text-[10px] text-violet-400 font-bold hover:underline">Mark all as read</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className="p-3 bg-slate-900/60 border border-slate-800/40 rounded-2xl hover:border-slate-700/40 transition-all">
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'deadline' ? 'bg-red-500/10 text-red-400' : 'bg-violet-500/10 text-violet-400'
                          }`}>
                            {n.type === 'deadline' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-200 mb-0.5">{n.title}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{n.message}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-500">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-8 w-[1px] bg-slate-800/60 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-black text-white">{userName}</div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{role}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-violet-500/15">
                {userName[0]}
              </div>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {children}
        </div>
      </main>
      <SandboxToolbar />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import SandboxToolbar from './SandboxToolbar'
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: string
  userName: string
}

export default function DashboardLayout({ children, role, userName }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          setNotifications(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) setNotifications(data)
  }

  const menuItems = [
    { name: 'Workspace', icon: <LayoutDashboard className="w-5 h-5" />, path: `/dashboard/${role}` },
    { name: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: `/messages` },
    { name: 'Project Overview', icon: <FolderKanban className="w-5 h-5" />, path: `/dashboard/${role}` },
    { name: 'Team', icon: <Users className="w-5 h-5" />, path: `/messages` },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: `/dashboard/${role}` },
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length

  const isAdmin = role === 'admin'

  return (
    <div className={`min-h-screen flex overflow-hidden font-sans transition-colors duration-300 ${
      isAdmin ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#020617] text-white'
    }`}>
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isAdmin ? (
          <>
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-100/60 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
          </>
        )}
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={`relative z-50 flex flex-col transition-all duration-300 ${
          isAdmin ? 'bg-white border-r border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-2xl border-r border-white/5'
        }`}
      >
        <div className={`h-20 flex items-center px-6 border-b ${
          isAdmin ? 'border-slate-200' : 'border-white/5'
        }`}>
          <Link href="/" className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isAdmin ? 'bg-gradient-to-br from-violet-600 to-indigo-700' : 'bg-blue-600'
            }`}>
              <span className="text-white font-bold text-lg">P</span>
            </div>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className={`font-bold text-lg tracking-tight ${isAdmin ? 'text-slate-900' : 'text-white'}`}
              >
                Project Hub
              </motion.span>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative ${
                  isActive 
                    ? (isAdmin ? 'bg-slate-950 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20') 
                    : (isAdmin ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-white/5 hover:text-white')
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-sm">
                    {item.name}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className={`p-4 border-t ${isAdmin ? 'border-slate-200' : 'border-white/5'}`}>
          <div className={`rounded-2xl p-3 flex items-center gap-3 overflow-hidden ${
            isAdmin ? 'bg-slate-50 border border-slate-200' : 'bg-white/5'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 text-white ${
              isAdmin ? 'bg-gradient-to-br from-violet-600 to-indigo-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
            }`}>
              {userName[0]}
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate ${isAdmin ? 'text-slate-900' : 'text-white'}`}>{userName}</div>
                <div className={`text-[10px] uppercase font-black tracking-widest ${isAdmin ? 'text-slate-400' : 'text-slate-500'}`}>{role}</div>
              </motion.div>
            )}
            {isSidebarOpen && (
              <button onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }} className={`p-2 rounded-lg transition-colors ${isAdmin ? 'hover:bg-slate-200' : 'hover:bg-white/10'}`}>
                <LogOut className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className={`h-20 flex items-center justify-between px-8 backdrop-blur-md shrink-0 z-40 border-b ${
          isAdmin ? 'bg-white/80 border-slate-200' : 'bg-slate-950/20 border-white/5'
        }`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-xl transition-colors ${
              isAdmin ? 'hover:bg-slate-100' : 'hover:bg-white/5'
            }`}>
              {isSidebarOpen ? (
                <X className={`w-5 h-5 ${isAdmin ? 'text-slate-500' : 'text-slate-400'}`} />
              ) : (
                <Menu className={`w-5 h-5 ${isAdmin ? 'text-slate-500' : 'text-slate-400'}`} />
              )}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search projects..." 
                className={`border rounded-xl py-2 pl-10 pr-4 text-sm w-64 ${
                  isAdmin 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400' 
                    : 'bg-white/5 border-white/10 text-white focus:outline-none'
                }`} 
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-colors relative ${
                isAdmin ? 'hover:bg-slate-100' : 'hover:bg-white/5'
              }`}
            >
              <Bell className={`w-5 h-5 ${isAdmin ? 'text-slate-500' : 'text-slate-400'}`} />
              {unreadCount > 0 && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border-2 ${
                  isAdmin ? 'bg-violet-600 border-white' : 'bg-blue-500 border-slate-950'
                }`} />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 top-14 w-80 border rounded-3xl shadow-2xl p-4 overflow-hidden z-50 ${
                    isAdmin ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200' : 'bg-[#0f172a] border-white/10 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button className={`text-[10px] font-bold hover:underline ${
                      isAdmin ? 'text-violet-600' : 'text-blue-400'
                    }`}>Mark all as read</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-2xl border transition-all ${
                        n.is_read 
                          ? 'bg-transparent border-transparent' 
                          : (isAdmin ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5')
                      }`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'deadline' 
                              ? (isAdmin ? 'bg-red-50 text-red-500' : 'bg-red-500/10 text-red-400') 
                              : (isAdmin ? 'bg-violet-50 text-violet-600' : 'bg-blue-500/10 text-blue-400')
                          }`}>
                            {n.type === 'deadline' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className={`text-xs font-bold mb-0.5 ${isAdmin ? 'text-slate-900' : 'text-white'}`}>{n.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${isAdmin ? 'text-slate-300' : 'text-slate-700'}`} />
                        <p className="text-[10px] text-slate-600">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`h-8 w-[1px] mx-2 ${isAdmin ? 'bg-slate-200' : 'bg-white/5'}`} />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className={`text-xs font-bold ${isAdmin ? 'text-slate-700' : 'text-white'}`}>System Status</div>
                <div className={`text-[10px] font-bold ${isAdmin ? 'text-violet-600' : 'text-green-400'}`}>Operational</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                isAdmin ? 'bg-gradient-to-br from-violet-600 to-indigo-700' : 'bg-blue-600'
              }`}>
                {userName[0]}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
      <SandboxToolbar />
    </div>
  )
}

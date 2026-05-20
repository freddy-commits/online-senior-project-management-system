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
    { name: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, path: `/${role}` },
    { name: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: `/messages` },
    { name: 'My Projects', icon: <FolderKanban className="w-5 h-5" />, path: `/${role}/projects` },
    { name: 'Team', icon: <Users className="w-5 h-5" />, path: `/${role}/team` },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: `/${role}/settings` },
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-[#020617] text-white flex overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 bg-white/5 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-300"
      >
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg tracking-tight">
                SeniorProj
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
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
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

        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg shrink-0">
              {userName[0]}
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{userName}</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{role}</div>
              </motion.div>
            )}
            {isSidebarOpen && (
              <button onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/'
              }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <LogOut className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md border-b border-white/5 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              {isSidebarOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input placeholder="Search projects..." className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-64" />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950" />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-14 w-80 bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl p-4 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button className="text-[10px] text-blue-400 font-bold hover:underline">Mark all as read</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-2xl border transition-all ${n.is_read ? 'bg-transparent border-transparent' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'deadline' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {n.type === 'deadline' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white mb-0.5">{n.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-600">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-8 w-[1px] bg-white/5 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white">Project Status</div>
                <div className="text-[10px] text-green-400 font-bold">On Track</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
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

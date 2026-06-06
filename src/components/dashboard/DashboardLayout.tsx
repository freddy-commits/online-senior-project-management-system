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
    <div className={`min-h-screen flex overflow-hidden font-sans transition-colors duration-300 bg-[#f8fafc] text-slate-900`}>
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/60 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full" />
      </div>

      {/* Main Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className={`h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md shrink-0 z-40 border-b border-slate-200`}>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 mr-6 select-none shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                <span className="text-white font-bold text-base">P</span>
              </div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight hidden sm:block">
                Project Station
              </span>
            </Link>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search projects..." 
                className={`border rounded-xl py-2 pl-10 pr-4 text-sm w-64 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400`} 
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-colors relative hover:bg-slate-100`}
            >
              <Bell className={`w-5 h-5 text-slate-500`} />
              {unreadCount > 0 && (
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full border-2 bg-blue-500 border-white`} />
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute right-0 top-14 w-80 border rounded-3xl shadow-2xl p-4 overflow-hidden z-50 bg-white border-slate-200 text-slate-900 shadow-slate-200`}
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button className={`text-[10px] font-bold hover:underline text-blue-600`}>Mark all as read</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-2xl border transition-all ${
                        n.is_read 
                          ? 'bg-transparent border-transparent' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'deadline' 
                              ? 'bg-red-50 text-red-500' 
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {n.type === 'deadline' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className={`text-xs font-bold mb-0.5 text-slate-900`}>{n.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <AlertCircle className={`w-8 h-8 mx-auto mb-2 text-slate-300`} />
                        <p className="text-[10px] text-slate-600">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={`h-8 w-[1px] mx-2 bg-slate-200`} />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className={`text-xs font-bold text-slate-700`}>System Status</div>
                <div className={`text-[10px] font-bold text-green-500`}>Operational</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white bg-blue-600`}>
                {userName[0]}
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('active_user_email')
                    document.cookie = "demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
                  }
                  window.location.href = '/login'
                }}
                title="Log Out"
                className="p-2 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
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

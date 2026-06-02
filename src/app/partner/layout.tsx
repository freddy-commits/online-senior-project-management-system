'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import SandboxToolbar from '@/components/dashboard/SandboxToolbar'
import { 
  LayoutDashboard, 
  Lightbulb, 
  Target, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react'

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userName, setUserName] = useState('Partner')
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (profile?.full_name) {
          setUserName(profile.full_name)
        }
      }
    }
    initUser()
    fetchNotifications()

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
    { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/partner/dashboard' },
    { name: 'Pitch Proposals', icon: <Lightbulb className="w-5 h-5" />, path: '/partner/pitch' },
    { name: 'Milestone Evaluation', icon: <Target className="w-5 h-5" />, path: '/partner/evaluation' },
    { name: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: '/messages' },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/partner/settings' },
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/60 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 blur-[120px] rounded-full" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 bg-[#0b192f] flex flex-col transition-all duration-300 shadow-xl"
      >
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e37b2d] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-lg tracking-tight text-white">
                Project Station
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

        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 flex items-center gap-3 overflow-hidden border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg shrink-0 text-white">
              {userName[0]}
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate text-white">{userName}</div>
                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Industry Partner</div>
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
        <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              {isSidebarOpen ? <X className="w-5 h-5 text-slate-500" /> : <Menu className="w-5 h-5 text-slate-500" />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input placeholder="Search projects..." className="bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm w-64 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400" />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-5 h-5 text-slate-500" />
              {unreadCount > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-14 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200 p-4 overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                    <button className="text-[10px] text-indigo-600 font-bold hover:underline">Mark all as read</button>
                  </div>
                  <div className="space-y-2">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={`p-3 rounded-2xl border transition-all ${n.is_read ? 'bg-transparent border-transparent' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            n.type === 'deadline' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {n.type === 'deadline' ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{n.message}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400">No new notifications</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-900">Sponsorship</div>
                <div className="text-[10px] text-indigo-600 font-bold">Active</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white">
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

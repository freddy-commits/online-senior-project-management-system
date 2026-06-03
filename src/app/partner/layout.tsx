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
    { name: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: '/messages' },
    { name: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/partner/settings' },
  ]

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/60 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-100/50 blur-[120px] rounded-full" />
      </div>

      {/* Full-width Header with Top Navigation */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#e37b2d] rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 hidden md:inline-block">
              Project Station
            </span>
          </Link>
        </div>

        {/* Header Actions */}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white">
              {userName[0]}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{userName}</div>
              <div className="text-[9px] text-indigo-600 font-extrabold uppercase tracking-wider mt-0.5">Industry Partner</div>
            </div>
          </div>

          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors ml-2"
            title="Log Out"
          >
            <LogOut className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {children}
      </main>
      <SandboxToolbar />
    </div>
  )
}

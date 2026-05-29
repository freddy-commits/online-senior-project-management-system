'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  UserCheck, 
  Building2, 
  Shield, 
  RotateCcw, 
  Database,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { resetDbState } from '@/lib/supabase/mockDb'

export default function SandboxToolbar() {
  const [active, setActive] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [currentRole, setCurrentRole] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(/^(.*;)?\s*demo_role\s*=\s*([^;]+)(.*)?$/)
      const role = match ? match[2] : ''
      setCurrentRole(role)
      
      const isDemo = document.cookie.includes('demo_mode=true') || 
                     localStorage.getItem('demo_mode') === 'true' ||
                     !process.env.NEXT_PUBLIC_SUPABASE_URL ||
                     !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      setActive(isDemo)
    }
  }, [])

  if (!active) return null

  const switchRole = (role: string) => {
    document.cookie = `demo_mode=true; path=/`
    document.cookie = `demo_role=${role}; path=/`
    localStorage.setItem('demo_mode', 'true')
    if (role === 'student') {
      window.location.href = '/dashboard/student'
    } else if (role === 'instructor') {
      window.location.href = '/dashboard/instructor'
    } else if (role === 'industry') {
      window.location.href = '/dashboard/partner'
    } else {
      window.location.href = `/dashboard/${role}`
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the mock database? All your local submissions and updates will be wiped.')) {
      resetDbState()
      window.location.reload()
    }
  }

  const handleExitSandbox = () => {
    document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = 'demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    localStorage.removeItem('demo_mode')
    window.location.href = '/'
  }

  const roles = [
    { label: 'Student', role: 'student', icon: <GraduationCap className="w-4 h-4" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Instructor', role: 'instructor', icon: <UserCheck className="w-4 h-4" />, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Industry', role: 'industry', icon: <Building2 className="w-4 h-4" />, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Admin', role: 'admin', icon: <Shield className="w-4 h-4" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-slate-950/80 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-4 max-w-[95vw] md:max-w-max"
          >
            {/* Header / Active indicator */}
            <div className="flex items-center gap-2 border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-4">
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse shrink-0" />
              <div className="text-left shrink-0">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Sandbox Mode</div>
                <div className="text-xs font-black text-white capitalize mt-0.5">{currentRole || 'Unknown'}</div>
              </div>
            </div>

            {/* Role switchers */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
              {roles.map((r) => {
                const isActive = currentRole === r.role
                return (
                  <button
                    key={r.role}
                    onClick={() => switchRole(r.role)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {r.icon}
                    <span>{r.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Utility buttons */}
            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-4">
              <button
                onClick={handleReset}
                title="Reset Database"
                className="p-2 hover:bg-white/5 border border-white/5 hover:border-white/10 text-slate-400 hover:text-yellow-400 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleExitSandbox}
                title="Exit Sandbox"
                className="flex items-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center hover:scale-105 transition-all shadow-xl shadow-slate-950/50 cursor-pointer shrink-0"
      >
        {collapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
    </div>
  )
}

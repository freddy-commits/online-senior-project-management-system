'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, RefreshCcw, CheckCircle2, LogOut, Loader2, ArrowRight } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  instructor:       'Instructor',
  supervisor:       'Academic Supervisor',
  industry_partner: 'Industry Partner',
  examiner:         'Examiner / Panel Member',
}

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  instructor:       '/instructor/dashboard',
  supervisor:       '/supervisor/dashboard',
  industry_partner: '/partner/dashboard',
  examiner:         '/admin/dashboard',
  admin:            '/admin/dashboard',
}

type CheckState = 'idle' | 'checking' | 'still_pending' | 'approved'

export default function PendingApprovalScreen({
  requestedRole,
  department,
}: {
  requestedRole: string
  department: string | null
}) {
  const router = useRouter()
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [isPending, startTransition] = useTransition()

  async function handleCheckStatus() {
    setCheckState('checking')
    const supabase = createClient()

    try {
      // Re-fetch the user's role request status
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: request } = await supabase
        .from('role_requests')
        .select('status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!request || request.status === 'pending') {
        setCheckState('still_pending')
        // Reset back to idle after 4 seconds
        setTimeout(() => setCheckState('idle'), 4000)
      } else if (request.status === 'approved') {
        setCheckState('approved')
        // Refresh profile and redirect to the right dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const destination = ROLE_DASHBOARD_MAP[profile?.role ?? requestedRole] || '/student/dashboard'
        setTimeout(() => {
          startTransition(() => router.replace(destination))
        }, 1500)
      } else {
        // Rejected or other — reload to show RejectedScreen
        router.refresh()
      }
    } catch {
      setCheckState('still_pending')
      setTimeout(() => setCheckState('idle'), 4000)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  const roleLabel = ROLE_LABELS[requestedRole] || requestedRole.replace(/_/g, ' ')

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: '#111827' }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
            style={{ background: '#F59E0B', color: '#111827' }}
          >
            P
          </div>
          <span className="font-extrabold text-white text-base tracking-tight">Project Station</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Glow backdrop */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl opacity-20 blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, #F59E0B, transparent 70%)' }}
            />

            <div
              className="relative rounded-3xl p-8 space-y-6 text-center"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Animated clock icon */}
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                <Clock className="w-8 h-8" style={{ color: '#F59E0B' }} />
              </motion.div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Pending Approval
                </h1>
                <p className="text-sm text-white/55 font-semibold leading-relaxed">
                  Your account is under review by an administrator.
                  You'll get access to your <strong className="text-white/80">{roleLabel}</strong> workspace
                  {department && <> in <strong className="text-white/80">{department}</strong></>} once approved.
                </p>
              </div>

              {/* Info pill */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#F59E0B',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: '#F59E0B' }}
                />
                {roleLabel} · {department || 'General'}
              </div>

              {/* Feedback message */}
              <AnimatePresence mode="wait">
                {checkState === 'still_pending' && (
                  <motion.div
                    key="still-pending"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-2xl p-4 text-sm font-bold"
                    style={{
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      color: '#F59E0B',
                    }}
                  >
                    ⏳ Your request is still under review. Approval typically takes 24–48 hours.
                  </motion.div>
                )}

                {checkState === 'approved' && (
                  <motion.div
                    key="approved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl p-4 flex items-center gap-3 text-sm font-bold"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#10B981',
                    }}
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>You're approved! Redirecting to your dashboard…</span>
                    <ArrowRight className="w-4 h-4 shrink-0 ml-auto animate-bounce" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Check Status button */}
              <button
                onClick={handleCheckStatus}
                disabled={checkState === 'checking' || checkState === 'approved'}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: '#F59E0B',
                  color: '#111827',
                  boxShadow: '0 4px 24px rgba(245,158,11,0.25)',
                }}
              >
                {checkState === 'checking' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <RefreshCcw className="w-4 h-4" />
                    Check Status
                  </>
                )}
              </button>

              <p className="text-[11px] text-white/25 font-semibold">
                Having trouble? Contact{' '}
                <a
                  href="mailto:admin@ueab.ac.ke"
                  className="underline text-white/40 hover:text-white/60 transition-colors"
                >
                  admin@ueab.ac.ke
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

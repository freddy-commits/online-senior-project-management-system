'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { XCircle, LogOut, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  instructor:       'Instructor',
  supervisor:       'Academic Supervisor',
  industry_partner: 'Industry Partner',
  examiner:         'Examiner / Panel Member',
}

export default function RejectedScreen({
  requestedRole,
  department,
  reviewerNotes,
}: {
  requestedRole: string
  department: string | null
  reviewerNotes: string | null
}) {
  const router = useRouter()

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

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div
            className="rounded-3xl p-8 space-y-6 text-center"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(239,68,68,0.2)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <XCircle className="w-8 h-8" style={{ color: '#EF4444' }} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Request Not Approved</h1>
              <p className="text-sm text-white/55 font-semibold leading-relaxed">
                Your request for the <strong className="text-white/80">{roleLabel}</strong> role
                {department && <> in <strong className="text-white/80">{department}</strong></>} was not approved at this time.
              </p>
            </div>

            {reviewerNotes && (
              <div
                className="text-left rounded-2xl p-4 text-sm"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-2">Admin Notes</p>
                <p className="text-white/60 font-semibold leading-relaxed">{reviewerNotes}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all hover:opacity-90"
                style={{ background: '#F59E0B', color: '#111827' }}
              >
                <RotateCcw className="w-4 h-4" />
                Apply Again
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-2xl text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ClipboardCheck,
  MessageSquare,
  ShieldCheck,
  Play,
  Pause,
  ArrowRight,
  Briefcase,
  Building,
  Users,
} from 'lucide-react'

// ─── Slide definitions ────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 1,
    badge: 'Welcome',
    title: 'One Platform for Your Entire Capstone Journey',
    subtitle:
      'Project Station connects students, instructors, supervisors, industry partners, and examiners — every milestone in one place.',
    visual: <WelcomeVisual />,
    accent: '#3B82F6',
  },
  {
    id: 2,
    badge: 'Step 1 — Register',
    title: 'Choose Your Role & Get Started',
    subtitle:
      'Sign up as a Student, Instructor, Supervisor, Industry Partner, or Examiner. Elevated roles are approved by an administrator before granting access.',
    visual: <RoleVisual />,
    accent: '#8B5CF6',
  },
  {
    id: 3,
    badge: 'Step 2 — Propose',
    title: 'Submit Your Project Proposal',
    subtitle:
      'Students submit structured capstone proposals with title, objectives, methodology, and team members — all reviewed by instructors in real time.',
    visual: <ProposalVisual />,
    accent: '#F59E0B',
  },
  {
    id: 4,
    badge: 'Step 3 — Track',
    title: 'Hit Every Milestone on Time',
    subtitle:
      'A visual milestone tracker keeps your team on schedule — from proposal approval through final defence. Supervisors can mark milestones and leave feedback.',
    visual: <MilestoneVisual />,
    accent: '#10B981',
  },
  {
    id: 5,
    badge: 'Step 4 — Collaborate',
    title: 'Messaging & Document Sharing',
    subtitle:
      'Real-time messaging and a shared document station eliminate email chains. Upload reports, share revisions, and communicate in context.',
    visual: <CollaborateVisual />,
    accent: '#06B6D4',
  },
  {
    id: 6,
    badge: 'Ready?',
    title: 'Start Your Project Journey Today',
    subtitle:
      'Join hundreds of students and staff already using Project Station to manage capstone projects with clarity and confidence.',
    visual: <CtaVisual />,
    accent: '#F59E0B',
    isCta: true,
  },
]

// ─── Inline visuals ───────────────────────────────────────────────────────────

function WelcomeVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {[
          { label: 'Students', color: '#3B82F6', Icon: GraduationCap },
          { label: 'Instructors', color: '#8B5CF6', Icon: ClipboardCheck },
          { label: 'Supervisors', color: '#10B981', Icon: Briefcase },
          { label: 'Partners', color: '#F59E0B', Icon: Building },
          { label: 'Examiners', color: '#EF4444', Icon: Users },
          { label: 'Admins', color: '#6B7280', Icon: ShieldCheck },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * SLIDES.indexOf(SLIDES[0]) + 0.05 }}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border"
            style={{ borderColor: item.color + '40', background: item.color + '12' }}
          >
            <item.Icon className="w-5 h-5 text-white/90" />
            <span className="text-[9px] font-black uppercase tracking-wider text-white/80">{item.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function RoleVisual() {
  const roles = [
    { label: 'Student', color: '#3B82F6', selected: true },
    { label: 'Instructor', color: '#8B5CF6', selected: false },
    { label: 'Supervisor', color: '#10B981', selected: false },
  ]
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs px-4">
      {roles.map((r, i) => (
        <motion.div
          key={r.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-3 p-3 rounded-2xl border"
          style={{
            borderColor: r.selected ? r.color : 'rgba(255,255,255,0.1)',
            background: r.selected ? r.color + '25' : 'rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black"
            style={{ background: r.color + '30', color: r.color }}
          >
            {r.label[0]}
          </div>
          <span className="text-xs font-bold text-white">{r.label}</span>
          {r.selected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-black"
              style={{ background: r.color }}
            >
              ✓
            </motion.div>
          )}
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 0.5, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-[10px] text-white/40 font-semibold text-center"
      >
        + Industry Partner · Examiner
      </motion.div>
    </div>
  )
}

function ProposalVisual() {
  const fields = ['Project Title', 'Objectives', 'Methodology', 'Team Members']
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs px-4">
      {fields.map((f, i) => (
        <motion.div
          key={f}
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
        >
          <div className="text-[8px] text-white/40 font-black uppercase tracking-wider mb-1">{f}</div>
          <div
            className="h-1.5 rounded-full bg-white/15"
            style={{ width: i === 0 ? '80%' : i === 1 ? '60%' : i === 2 ? '90%' : '55%' }}
          />
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-1 rounded-xl py-2.5 text-center text-[10px] font-black uppercase tracking-wider"
        style={{ background: '#F59E0B', color: '#111827' }}
      >
        Submit Proposal →
      </motion.div>
    </div>
  )
}

function MilestoneVisual() {
  const stages = [
    { label: 'Propose', color: '#3B82F6', done: true },
    { label: 'Approve', color: '#8B5CF6', done: true },
    { label: 'Build', color: '#F59E0B', done: false, active: true },
    { label: 'Review', color: '#10B981', done: false },
    { label: 'Defend', color: '#1E293B', done: false },
  ]
  return (
    <div className="flex flex-col items-center gap-4 w-full px-4">
      <div className="relative flex items-center justify-between w-full max-w-xs">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10" />
        {stages.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex flex-col items-center gap-1.5 z-10"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm"
              style={{
                background: s.done ? s.color : s.active ? s.color : 'rgba(255,255,255,0.1)',
                color: s.done || s.active ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: s.active ? `0 0 12px ${s.color}60` : undefined,
              }}
            >
              {s.done ? '✓' : i + 1}
            </div>
            <span className="text-[8px] font-bold text-white/60">{s.label}</span>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[10px] font-bold text-amber-400"
      >
        Currently on: Build phase
      </motion.div>
    </div>
  )
}

function CollaborateVisual() {
  const messages = [
    { from: 'Supervisor', text: 'Great progress on chapter 2!', align: 'left', color: '#8B5CF6' },
    { from: 'Student', text: 'Thank you! Uploading the final draft now.', align: 'right', color: '#3B82F6' },
    { from: 'Supervisor', text: 'Approved — see you at the defence.', align: 'left', color: '#8B5CF6' },
  ]
  return (
    <div className="flex flex-col gap-2 w-full max-w-xs px-4">
      {messages.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: m.align === 'left' ? -15 : 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.18 }}
          className={`flex flex-col gap-0.5 ${m.align === 'right' ? 'items-end' : 'items-start'}`}
        >
          <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: m.color }}>
            {m.from}
          </span>
          <div
            className="px-3 py-2 rounded-2xl text-[10px] font-bold text-white max-w-[85%]"
            style={{ background: m.color + '30', border: `1px solid ${m.color}40` }}
          >
            {m.text}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function CtaVisual() {
  return (
    <div className="flex flex-col items-center gap-4 text-center px-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="flex items-center justify-center p-3 rounded-full bg-amber-400/10 text-amber-400"
      >
        <GraduationCap className="w-12 h-12" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-1"
      >
        {['Free to join', 'No credit card needed', 'Instant access'].map((item, i) => (
          <div key={item} className="flex items-center gap-2 justify-center">
            <span className="text-emerald-400 font-black text-xs">✓</span>
            <span className="text-white/70 text-xs font-semibold">{item}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

interface DemoModalProps {
  open: boolean
  onClose: () => void
}

export default function DemoModal({ open, onClose }: DemoModalProps) {
  const [current, setCurrent] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)
  const total = SLIDES.length

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, total - 1)), [total])
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), [])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, next, prev, onClose])

  // Auto-play
  useEffect(() => {
    if (!open || !autoPlay) return
    const timer = setInterval(() => {
      setCurrent((c) => {
        if (c >= total - 1) {
          setAutoPlay(false)
          return c
        }
        return c + 1
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [open, autoPlay, total])

  // Reset on open
  useEffect(() => {
    if (open) {
      setCurrent(0)
      setAutoPlay(true)
    }
  }, [open])

  const slide = SLIDES[current]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl font-sans"
            style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Accent glow */}
            <div
              className="absolute top-0 left-0 w-full h-1 transition-all duration-500"
              style={{ background: slide.accent }}
            />
            <div
              className="absolute top-0 left-0 w-full h-32 opacity-10 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 0%, ${slide.accent}, transparent 70%)` }}
            />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: slide.accent + '25', color: slide.accent }}
              >
                {slide.badge}
              </span>
              <div className="flex items-center gap-2">
                {/* Auto-play toggle */}
                <button
                  onClick={() => setAutoPlay((a) => !a)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 transition-colors"
                  title={autoPlay ? 'Pause auto-play' : 'Resume auto-play'}
                >
                  {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 transition-colors"
                  title="Close demo (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slide content */}
            <div className="relative z-10 px-6 pb-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Text */}
                  <div className="space-y-2 pt-2">
                    <h2 className="text-xl font-black text-white leading-tight tracking-tight">
                      {slide.title}
                    </h2>
                    <p className="text-xs text-white/55 font-semibold leading-relaxed">
                      {slide.subtitle}
                    </p>
                  </div>

                  {/* Visual area */}
                  <div
                    className="w-full rounded-2xl overflow-hidden flex items-center justify-center"
                    style={{
                      minHeight: '180px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {slide.visual}
                  </div>

                  {/* CTA slide action */}
                  {slide.isCta && (
                    <Link
                      href="/register"
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
                      style={{ background: '#F59E0B', color: '#111827' }}
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer: progress dots + nav */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5">
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrent(i); setAutoPlay(false) }}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === current ? '20px' : '6px',
                      height: '6px',
                      background: i === current ? slide.accent : 'rgba(255,255,255,0.2)',
                    }}
                  />
                ))}
              </div>

              {/* Nav buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prev}
                  disabled={current === 0}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white disabled:opacity-20 transition-all border border-white/10 hover:border-white/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { if (current < total - 1) { next(); setAutoPlay(false) } else onClose() }}
                  className="px-4 h-8 rounded-xl flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider transition-all hover:opacity-90"
                  style={{ background: slide.accent, color: '#fff' }}
                >
                  {current < total - 1 ? (
                    <>Next <ChevronRight className="w-3 h-3" /></>
                  ) : (
                    'Done'
                  )}
                </button>
              </div>
            </div>

            {/* Auto-play progress bar */}
            {autoPlay && (
              <motion.div
                key={`progress-${current}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 5, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-0.5 origin-left"
                style={{ background: slide.accent, width: '100%' }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import Link from 'next/link'
import {
  GraduationCap,
  Users,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Briefcase,
  ClipboardCheck
} from 'lucide-react'

const FEATURES = [
  {
    icon: <GraduationCap className="w-5 h-5" />,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
    title: 'Student Portal',
    desc: 'Submit proposals and track milestones in one place.',
  },
  {
    icon: <ClipboardCheck className="w-5 h-5" />,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    title: 'Instructor Vetting',
    desc: 'Approve projects and roles with a clear audit trail.',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    title: 'Real-Time Messaging',
    desc: 'Supervisors and teams stay in sync, no email chains.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    iconBg: '#D1FAE5',
    iconColor: '#059669',
    title: 'Role-Based Security',
    desc: 'Every permission verified server-side, never self-assigned.',
  },
]

const STAGES = [
  { step: 1, label: 'Propose',  bg: '#3B82F6', text: '#fff' },
  { step: 2, label: 'Approve',  bg: '#8B5CF6', text: '#fff' },
  { step: 3, label: 'Build',    bg: '#F59E0B', text: '#fff' },
  { step: 4, label: 'Review',   bg: '#10B981', text: '#fff' },
  { step: 5, label: 'Defend',   bg: '#1E293B', text: '#fff' },
]

const NAVY = '#111827'

export default function LandingContent() {
  return (
    <div className="min-h-screen font-sans" style={{ background: '#F9FAFB' }}>

      {/* ===== NAVBAR ===== */}
      <header style={{ background: NAVY }} className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
              style={{ background: '#F59E0B', color: '#111827' }}
            >
              P
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">Project Station</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-white transition-colors"
            >
              Roles
            </button>
            <button
              onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-white transition-colors"
            >
              Workflow
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:opacity-90 active:scale-95"
            style={{ background: '#F59E0B', color: '#111827' }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section style={{ background: NAVY }} className="border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center space-y-8">

          {/* Headline */}
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight max-w-3xl mx-auto">
            Manage Your Senior Capstone<br />
            From Proposal to Defense
          </h1>

          {/* Subtext */}
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            One platform for students, instructors, supervisors, industry partners,
            and examiners — every milestone tracked, every role verified.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/register"
              className="px-7 py-3 rounded-lg text-sm font-bold transition-all shadow hover:opacity-90 active:scale-95"
              style={{ background: '#F59E0B', color: '#111827' }}
            >
              Get Started Free
            </Link>
            <button
              onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-7 py-3 rounded-lg text-sm font-bold border border-white/20 text-white hover:bg-white/5 transition-all"
            >
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div
            className="border-t mt-10 pt-8 grid grid-cols-3 gap-6 max-w-sm mx-auto"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            {[
              { value: '5', label: 'User Roles' },
              { value: '100%', label: 'Auditable' },
              { value: '1', label: 'Single Record' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <span className="block text-2xl font-black" style={{ color: '#F59E0B' }}>
                  {s.value}
                </span>
                <span className="block text-xs text-slate-400 mt-1 font-semibold">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-16 px-6 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto space-y-10">

          <p
            className="text-xs font-black tracking-widest text-center uppercase"
            style={{ color: '#2563EB' }}
          >
            Everything your department needs
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:shadow-sm hover:border-slate-300 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: f.iconBg, color: f.iconColor }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WORKFLOW / STAGES SECTION ===== */}
      <section id="workflow" className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto space-y-10">

          <p
            className="text-xs font-black tracking-widest text-center uppercase"
            style={{ color: '#2563EB' }}
          >
            From proposal to defense
          </p>

          {/* Stages row */}
          <div className="relative flex items-start justify-between gap-2 max-w-2xl mx-auto">
            {/* connecting line */}
            <div
              className="absolute top-5 left-5 right-5 h-0.5"
              style={{ background: '#E2E8F0', zIndex: 0 }}
            />

            {STAGES.map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-2 z-10 flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-sm"
                  style={{ background: s.bg, color: s.text }}
                >
                  {s.step}
                </div>
                <span className="text-xs font-bold text-slate-700 text-center">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer style={{ background: NAVY }} className="border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 font-semibold">
            © {new Date().getFullYear()} Project Station · Senior Capstone Platform
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
            <span className="cursor-pointer hover:text-white transition-colors">English</span>
            <span className="text-slate-600">·</span>
            <span className="cursor-pointer hover:text-white transition-colors">Français</span>
            <span className="text-slate-600">·</span>
            <span className="cursor-pointer hover:text-white transition-colors">Kiswahili</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

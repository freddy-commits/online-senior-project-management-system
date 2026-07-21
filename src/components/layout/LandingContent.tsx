'use client'

import Link from 'next/link'
import {
  GraduationCap,
  Users,
  Briefcase,
  Building2,
  ClipboardList,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'

const ROLES = [
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: 'Student',
    desc: 'Submit proposals, track milestones, and collaborate with your team.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Instructor',
    desc: 'Vet, assign, and grade projects across your department.',
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: 'Supervisor',
    desc: 'Mentor teams, monitor progress, and grade deliverables.',
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: 'Industry Partner',
    desc: 'Post real-world problems and monitor assigned student teams.',
  },
  {
    icon: <ClipboardList className="w-5 h-5" />,
    title: 'Examiner Panel',
    desc: 'Review and evaluate submissions before the final defense.',
  },
]

const STAGES = [
  { step: 1, label: 'Pending' },
  { step: 2, label: 'Approved' },
  { step: 3, label: 'In Progress' },
  { step: 4, label: 'Under Review' },
  { step: 5, label: 'Completed' },
]

export default function LandingContent() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">

      {/* ===== NAVBAR ===== */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight">Project Station</span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <button
              onClick={() => document.getElementById('stages')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Portals
            </button>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Senior Capstone Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
              One system, five roles,{' '}
              <span className="relative inline-block">
                <span className="relative z-10">one finish line.</span>
                <span
                  className="absolute bottom-1 left-0 w-full h-3 -z-10 rounded"
                  style={{ background: 'rgba(245,158,11,0.25)' }}
                />
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-sm md:text-base text-slate-600 max-w-xl leading-relaxed mb-8">
              From proposal to final defense — students, instructors, supervisors,
              industry partners and examiners work off the same record, not five different inboxes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all"
              >
                Get started
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 hover:border-blue-300 text-slate-700 hover:text-blue-600 text-sm font-bold rounded-lg transition-all"
              >
                Sign in to your account
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ===== PROJECT STAGES ===== */}
      <section id="stages" className="border-b border-slate-100 py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto space-y-10">

          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
              Every project moves through the same five stages
            </p>
          </div>

          {/* Timeline */}
          <div className="relative flex items-start justify-between gap-2">
            {/* connecting line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 z-0" />

            {STAGES.map((s, i) => {
              const isLast = i === STAGES.length - 1
              return (
                <div key={s.step} className="flex flex-col items-center gap-2 z-10 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                      isLast
                        ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                        : 'bg-white border-blue-300 text-blue-600'
                    }`}
                  >
                    {isLast ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <span className={`text-[10px] font-bold text-center leading-tight ${
                    isLast ? 'text-amber-600' : 'text-slate-600'
                  }`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ===== ROLE PORTALS ===== */}
      <section id="roles" className="border-b border-slate-100 py-16 px-6 bg-slate-50/40">
        <div className="max-w-6xl mx-auto space-y-8">

          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">
              One portal per role
            </p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Every stakeholder has a dedicated workspace
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((role, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  {role.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{role.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===== PARTNER / CTA BANNER ===== */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div
            className="rounded-2xl border-2 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ borderColor: '#F59E0B', background: 'rgba(245,158,11,0.04)' }}
          >
            <div className="space-y-1.5 max-w-lg">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider mb-2"
                style={{ borderColor: '#F59E0B', color: '#B45309', background: 'rgba(245,158,11,0.08)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B' }} />
                For Organizations
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Become a Partner Organization
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Post real-world challenges, mentor student teams, and source talent before graduation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/register"
                className="px-6 py-3 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm"
                style={{ background: '#F59E0B' }}
              >
                Register as Partner
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 border border-slate-300 text-slate-700 hover:border-blue-300 hover:text-blue-600 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                Partner Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-[10px]">P</span>
            </div>
            <span className="text-xs font-bold text-slate-900">Project Station</span>
          </div>
          <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Link href="/register" className="hover:text-blue-600 transition-colors">Dashboards</Link>
            <Link href="/register" className="hover:text-blue-600 transition-colors">Milestones</Link>
            <span className="cursor-pointer hover:text-blue-600 transition-colors">Privacy</span>
          </div>
          <p className="text-[10px] text-slate-400 font-semibold">
            © {new Date().getFullYear()} Project Station. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}

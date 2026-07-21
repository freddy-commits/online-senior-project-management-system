'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Check, 
  ArrowRight, 
  GraduationCap, 
  Users, 
  Building,
  Sliders,
  Sparkles
} from 'lucide-react'

export default function LandingContent() {
  const [activeDot, setActiveDot] = useState(2)

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col lg:flex-row relative overflow-x-hidden">
      
      {/* ================== LEFT HALF: STATIC LARGE IMAGE ================== */}
      <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0 left-0 overflow-hidden border-r border-slate-100 bg-slate-50">
        <Image 
          src="/kenyan_students_collaborating.png" 
          alt="Kenyan Students Collaborating" 
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        {/* Premium Blue overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-blue-900/20 to-blue-950/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-blue-900/10" />
        
        {/* Brand statement overlay at bottom-left */}
        <div className="absolute bottom-12 left-12 z-10 text-white space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/30 border border-white/20 text-white text-[9px] font-black uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-blue-300 animate-pulse" />
            University Portal
          </div>
          <h2 className="text-3xl font-black tracking-tight drop-shadow-md">Project Station</h2>
          <p className="text-xs font-semibold text-white/90 max-w-sm drop-shadow-sm leading-relaxed">
            Connecting academic research and industry collaboration in one centralized environment.
          </p>
        </div>
      </div>

      {/* ================== RIGHT HALF: SCROLLABLE WHITE CONTENT ================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between min-h-screen bg-white relative z-10">
        
        {/* ===== HEADER / NAVBAR ===== */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
          <nav className="px-6 md:px-10 h-16 flex items-center justify-between">
            <Link href="/" className="text-md font-black text-blue-600 tracking-tight hover:opacity-90 transition-opacity">
              Project Station
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/register" 
                className="text-[11px] font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition-colors py-2"
              >
                Register
              </Link>
              <Link 
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black tracking-wider uppercase rounded-lg transition-all shadow-sm hover:shadow active:scale-95 text-center cursor-pointer"
              >
                Login
              </Link>
            </div>
          </nav>
        </header>

        {/* ===== MAIN CONTENT WRAPPER WITH COMPACT SPACE ===== */}
        <main className="flex-1 px-6 md:px-10 py-8 space-y-12">

          {/* ================== HERO CONTENT ================== */}
          <section className="space-y-6 pt-4">
            <div className="space-y-3">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Your Projects.<br />
                <span className="text-blue-600">Fully Centralized.</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-600 font-bold max-w-md leading-relaxed">
                Connect academic rigor with industrial relevance. Track deliverables, manage client milestones, and collaborate in one modern, premium workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black tracking-wider uppercase transition-all shadow-sm hover:shadow active:scale-95 text-center cursor-pointer min-w-[140px]"
              >
                Access Workspaces
              </Link>
              <Link
                href="/register"
                className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-black tracking-wider uppercase transition-all active:scale-95 text-center cursor-pointer min-w-[140px]"
              >
                Create Account
              </Link>
            </div>
          </section>

          {/* ================== PATHWAY SECTION (COMPACT) ================== */}
          <section className="space-y-4 pt-2">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-blue-600 tracking-widest uppercase block">
                Academic Framework
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Choose Your Pathway
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              
              {/* Pathway 1 */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex gap-4 hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Years 1 - 3 | Team Challenge Solves</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Work in interdisciplinary student teams to solve real-world problems submitted by corporate partners. Build your portfolio.
                  </p>
                </div>
              </div>

              {/* Pathway 2 */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex gap-4 hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Year 4 | Independent Thesis Milestone</h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Pinnacle independent research thesis demonstrating field mastery, overseen by assigned faculty chairs.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* ================== COLLABORATIVE BENEFITS (COMPACT) ================== */}
          <section className="space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-blue-600 tracking-widest uppercase block">
                Platform Workflows
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Built For Collaboration
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '01', title: 'Submit Challenges', desc: 'Post real challenges.' },
                { num: '02', title: 'Mentor Teams', desc: 'Active check-ins.' },
                { num: '03', title: 'Evaluate Deliverables', desc: 'Review submissions.' },
                { num: '04', title: 'Source Talent', desc: 'Build pipeline early.' }
              ].map((b, i) => (
                <div key={i} className="space-y-1">
                  <span className="text-xs font-black text-blue-600 block">{b.num}. {b.title}</span>
                  <p className="text-[10px] text-slate-500 font-semibold leading-normal">{b.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ================== PARTNERS METRICS ================== */}
          <section className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 grid grid-cols-2 gap-4 text-center">
            {[
              { value: '450+', label: 'Active Tracks' },
              { value: '92%', label: 'Hire Rate' },
              { value: '12k', label: 'Hours Researched' },
              { value: '50+', label: 'Global Partners' }
            ].map((stat, i) => (
              <div key={i}>
                <span className="text-lg font-black text-blue-600 block">
                  {stat.value}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                  {stat.label}
                </span>
              </div>
            ))}
          </section>

        </main>

        {/* ===== PROJECT STATION FOOTER ===== */}
        <footer className="border-t border-slate-100 px-6 md:px-10 py-8 bg-slate-50/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-900">Project Station</span>
              <p className="text-slate-500 text-[10px] font-semibold">Connecting academic rigor with industry relevance.</p>
            </div>
            <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Link href="/register" className="hover:text-blue-650">Dashboards</Link>
              <Link href="/register" className="hover:text-blue-650">Milestones</Link>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-slate-400 text-[9px] font-black uppercase tracking-wider">
            © {new Date().getFullYear()} PROJECT STATION SYSTEMS. ALL RIGHTS RESERVED.
          </div>
        </footer>

      </div>

    </div>
  )
}

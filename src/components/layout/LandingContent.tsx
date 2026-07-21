'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Check, 
  ArrowRight, 
  GraduationCap, 
  Users
} from 'lucide-react'

export default function LandingContent() {
  const [activeDot, setActiveDot] = useState(2)

  return (
    <div className="min-h-screen text-slate-800 bg-white font-sans flex flex-col justify-between relative overflow-x-hidden">
      
      {/* ================== FIRST HALF: TOP VIEWPORT WITH LARGE BACKGROUND IMAGE ================== */}
      <section className="relative min-h-[90vh] flex flex-col justify-between border-b border-slate-200">
        
        {/* Full-bleed background image */}
        <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
          <Image 
            src="/kenyan_students_collaborating.png" 
            alt="Kenyan Students Collaborating" 
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Overlay to darken and make text legible */}
          <div className="absolute inset-0 bg-slate-950/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-blue-950/20 to-transparent" />
        </div>

        {/* Navbar (Overlaid on top of image background) */}
        <header className="w-full relative z-20">
          <nav className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
            <Link href="/" className="text-xl font-extrabold text-white tracking-tight hover:opacity-90 transition-opacity">
              Project Station
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/register" 
                className="text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors py-2"
              >
                Register
              </Link>
              <Link 
                href="/login"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-sm hover:shadow active:scale-95 text-center cursor-pointer"
              >
                Login
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Copy (Centered overlaid text) */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow">
                Your Projects.<br />
                <span className="text-blue-500">Fully Centralized.</span>
              </h1>
              <p className="text-sm md:text-base text-slate-200/90 font-bold max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
                Connect academic rigor with industrial relevance. Track deliverables, manage client milestones, and collaborate in one modern, premium workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center pt-2">
              <Link
                href="/login"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-550 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-95 text-center cursor-pointer min-w-[150px]"
              >
                Access Workspaces
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all active:scale-95 text-center cursor-pointer min-w-[150px] backdrop-blur-sm"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom anchor padding */}
        <div className="h-10 relative z-10 w-full bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ================== SECOND HALF: BOTTOM CONTENT (PURE WHITE BACKGROUND, COMPACT SPACING) ================== */}
      <main className="flex-1 w-full bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 space-y-16">

          {/* ================== CHOOSE YOUR PATHWAY ================== */}
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase block">
                Academic Framework
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Choose Your Pathway
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Pathway 1 */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between items-start space-y-4 hover:border-blue-200 transition-colors">
                <div className="space-y-4 w-full">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                      <Users className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">Team-Based Industry Solve</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mt-0.5">
                        Years 1, 2, & 3
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Work in interdisciplinary student teams to solve real-world problems submitted by corporate partners. Build your professional portfolio.
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                  <Link href="/register" className="font-extrabold text-blue-600 hover:underline flex items-center gap-1">
                    Read Case Studies <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <button 
                        key={dot}
                        onClick={() => setActiveDot(dot)}
                        className={`w-3.5 h-1 rounded-full transition-all duration-300 ${
                          activeDot === dot ? 'bg-blue-600 w-5' : 'bg-slate-200'
                        }`}
                        aria-label={`Dot ${dot}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Pathway 2 */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between items-start space-y-4 hover:border-blue-200 transition-colors">
                <div className="space-y-4 w-full">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
                      <GraduationCap className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">Independent Thesis</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-650 block mt-0.5">
                        Year 4 Only
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Pinnacle independent research thesis demonstrating field mastery, overseen by assigned faculty chairs and defended before a panel.
                  </p>
                </div>
                <div className="w-full pt-4 border-t border-slate-100">
                  <Link 
                    href="/register"
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors text-center block"
                  >
                    View Thesis Archives
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* ================== COLLABORATIVE WORKFLOWS ================== */}
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase block">
                Platform Workflows
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                Built For Collaboration
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { number: '01', title: 'Submit Challenges', desc: 'Post real challenges and project scope.' },
                { number: '02', title: 'Mentor Teams', desc: 'Assign industry supervisors and guide milestones.' },
                { number: '03', title: 'Evaluate Deliverables', desc: 'Review submissions, comment and score.' },
                { number: '04', title: 'Source Talent', desc: 'Identify top performers and hire directly.' }
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 hover:border-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-650 font-black text-sm">
                    {benefit.number}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900">{benefit.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ================== STATISTICS STRIP ================== */}
          <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '450+', label: 'Active Tracks' },
              { value: '92%', label: 'Hire Rate' },
              { value: '12k', label: 'Hours Researched' },
              { value: '50+', label: 'Global Partners' }
            ].map((stat, i) => (
              <div key={i}>
                <span className="text-2xl font-black text-blue-600 block">
                  {stat.value}
                </span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mt-1">
                  {stat.label}
                </span>
              </div>
            ))}
          </section>

          {/* ================== PARTNER CALL TO ACTION ================== */}
          <section className="bg-gradient-to-r from-blue-50/50 via-slate-50 to-blue-50/50 border border-blue-100 rounded-3xl p-8 text-center space-y-5">
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-950">Become a Partner Organization</h3>
              <p className="text-xs font-semibold text-slate-600 max-w-md mx-auto leading-relaxed">
                Join 50+ companies already shaping the next generation of professionals. Register your organization and start submitting challenges today.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/register"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black tracking-wider uppercase transition-all shadow shadow-blue-600/10 active:scale-95"
              >
                Register as Partner
              </Link>
              <Link
                href="/login"
                className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-black tracking-wider uppercase transition-all active:scale-95"
              >
                Partner Login
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* ===== PROJECT STATION FOOTER ===== */}
      <footer className="border-t border-slate-250 px-6 py-10 bg-slate-50/50 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-xs">
          <div className="max-w-xs space-y-3">
            <span className="text-sm font-extrabold text-slate-950 tracking-tight block">Project Station</span>
            <p className="text-slate-650 text-[11px] leading-relaxed font-semibold">
              Connecting academic rigor with industry relevance. A centralized workstation for the modern student professional.
            </p>
          </div>
          
          <div className="flex gap-10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div>
              <h4 className="font-extrabold text-slate-900 mb-2">Platform</h4>
              <ul className="space-y-1">
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Dashboards</Link></li>
                <li><Link href="/register" className="hover:text-blue-600 transition-colors">Milestones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 mb-2">Legal</h4>
              <ul className="space-y-1">
                <li><span className="hover:text-blue-600 transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-blue-600 transition-colors cursor-pointer">Compliance</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-100 text-center text-slate-450 text-[9px] font-black uppercase tracking-widest">
          © {new Date().getFullYear()} PROJECT STATION SYSTEMS. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  )
}

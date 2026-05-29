'use client'

import { useState, PointerEvent } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowRight, 
  Shield, 
  Sparkles, 
  Workflow, 
  CheckCircle2, 
  Building, 
  GraduationCap, 
  Menu, 
  X,
  UserCheck,
  ShieldAlert,
  Award,
  Layers
} from 'lucide-react'

export default function LandingContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 })

  const startSandbox = (role: string) => {
    document.cookie = `demo_mode=true; path=/`
    document.cookie = `demo_role=${role}; path=/`
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_mode', 'true')
      window.location.href = `/dashboard/${role}`
    }
  }

  const updateHeroTilt = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 24
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * -24
    setHeroTilt({ x, y })
  }

  const resetHeroTilt = () => {
    setHeroTilt({ x: 0, y: 0 })
  }

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Academic Flow', href: '#workflow' },
    { label: 'Personas', href: '#personas' },
  ]

  return (
    <div className="relative min-h-screen bg-[#070a13] text-slate-100 overflow-hidden font-sans">
      
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        
        <motion.div 
          animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.1, 0.9, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-br from-violet-600/10 to-indigo-600/10 blur-[130px] rounded-full"
        />
        <motion.div 
          animate={{ x: [0, -50, 50, 0], y: [0, 50, -50, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-600/10 to-emerald-600/5 blur-[150px] rounded-full"
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-800/40 bg-slate-950/60 backdrop-blur-2xl shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-xl">P</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-white leading-tight">
                GRADUATE HUB
              </span>
              <span className="text-[8px] text-slate-400 font-semibold tracking-wider">
                ACADEMIC GOVERNANCE
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="px-5 py-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-white text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-md">
              Register
            </Link>
          </div>

          <button
            className="md:hidden p-2 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-300" /> : <Menu className="w-6 h-6 text-slate-300" />}
          </button>
        </nav>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-slate-950 border-t border-slate-900 px-6 py-4 space-y-3 shadow-xl"
          >
            {navLinks.map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-900">
              <Link href="/login" className="text-center py-2.5 border border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-300 hover:bg-slate-900">
                Log In
              </Link>
              <Link href="/register" className="text-center py-2.5 bg-white rounded-xl text-xs font-black uppercase tracking-widest text-slate-950 hover:bg-slate-100 transition-all">
                Register
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        <motion.div
          className="relative"
          onPointerMove={updateHeroTilt}
          onPointerLeave={resetHeroTilt}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3rem]">
            <motion.div
              animate={{ x: heroTilt.x * 0.35, y: heroTilt.y * 0.35 }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              className="absolute top-8 left-1/2 w-[420px] h-[420px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl"
            />
            <motion.div
              animate={{ x: heroTilt.x * -0.35, y: heroTilt.y * -0.35 }}
              transition={{ type: 'spring', stiffness: 80, damping: 18 }}
              className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl"
            />
            <motion.div
              animate={{ x: heroTilt.x * 0.5, y: heroTilt.y * -0.25 }}
              transition={{ type: 'spring', stiffness: 70, damping: 18 }}
              className="absolute top-24 left-8 w-24 h-24 rounded-full bg-emerald-400/10 blur-2xl"
            />
            <motion.div
              animate={{ x: heroTilt.x * -0.45, y: heroTilt.y * 0.2 }}
              transition={{ type: 'spring', stiffness: 70, damping: 18 }}
              className="absolute bottom-24 left-20 w-28 h-28 rounded-full bg-pink-500/10 blur-2xl"
            />
          </div>

          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-violet-400 uppercase bg-violet-500/10 border border-violet-500/20 rounded-full backdrop-blur-sm">
            Individual Capstone Compliance Gateway
          </span>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.05] tracking-tight text-white">
            Academic Governance <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-400 to-emerald-400">
              &amp; Milestone Compliance
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto mb-12 text-slate-400 text-sm md:text-base leading-relaxed">
            The premium university workspace for managing senior graduation projects. Track academic compliance, submit deliverables directly, and review supervisor vetting feedback in a fully secure individual learning ecosystem.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/login" className="group relative px-6 py-4 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all shadow-xl shadow-violet-500/10 flex items-center gap-2 cursor-pointer">
              Access Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#personas"
              className="px-6 py-4 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-black uppercase tracking-widest text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Explore Portals
            </a>
          </div>

          <motion.div
            style={{ transform: `perspective(1300px) rotateX(${heroTilt.y}deg) rotateY(${heroTilt.x}deg)` }}
            transition={{ type: 'spring', stiffness: 55, damping: 22 }}
            className="relative mx-auto mb-14 max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/90 p-8 shadow-2xl backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),_transparent_35%),radial-gradient(circle_at_30%_80%,rgba(129,140,248,0.12),transparent_40%)] pointer-events-none" />
            <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.9fr] items-center">
              <div className="space-y-5 text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-violet-300">
                  Live 3D Portal Experience
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Your project command center with motion-driven depth
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                  Explore the student workspace with layered parallax, animated content blocks, and a modern academic flow that feels alive from the first interaction.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4 text-left">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Milestone workflow</p>
                    <p className="mt-3 text-sm font-black text-white">Animated checkpoint cards</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-4 text-left">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Collaboration Hub</p>
                    <p className="mt-3 text-sm font-black text-white">Fast access to team messaging</p>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="absolute -right-12 top-6 h-28 w-28 rounded-full bg-violet-500/10 blur-3xl" />
                <div className="absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl" />
                <img
                  src="/assets/student-dash.png"
                  alt="Interactive student dashboard preview"
                  className="relative w-full rounded-[2rem] border border-white/10 shadow-2xl object-cover"
                />
              </div>
            </div>
          </motion.div>

          {/* Sandbox picker panel */}
          <div className="max-w-3xl mx-auto bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Shield className="w-16 h-16 text-white" />
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              One-Click Sandbox Login (Instant Testing Environment)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '🎓 Student Portal', role: 'student', color: 'hover:border-violet-500/40 hover:bg-violet-500/5 border-slate-800' },
                { label: '👨‍🏫 Coordinator', role: 'instructor', color: 'hover:border-emerald-500/40 hover:bg-emerald-500/5 border-slate-800' },
                { label: '🔍 Supervisor', role: 'supervisor', color: 'hover:border-amber-500/40 hover:bg-amber-500/5 border-slate-800' },
                { label: '🏢 Industry Partner', role: 'partner', color: 'hover:border-indigo-500/40 hover:bg-indigo-500/5 border-slate-800' }
              ].map((b) => (
                <button
                  key={b.role}
                  onClick={() => startSandbox(b.role)}
                  className={`py-3.5 px-2 border rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer bg-slate-950/80 ${b.color} active:scale-95`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-semibold">
              Bypasses real database connections using mock fallbacks, enabling instant interface layout inspections.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Academic Workflow Timeline */}
      <section id="workflow" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-800/20">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-violet-400 uppercase bg-violet-500/10 border border-violet-500/20 rounded-full">
            <Workflow className="w-3.5 h-3.5" />
            Milestone Governance
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Dual-Track Milestone Timeline
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-semibold">
            Standard milestones mapping that supports both internal academic and industry-sponsored graduation requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm flex flex-col justify-between min-h-[12rem]">
            <div className="flex justify-between items-center">
              <span className="text-violet-400 text-[10px] font-black uppercase tracking-widest bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">Phase 1</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Milestone 1</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-4">Proposal Submission</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Student pitches the abstract, methodology, and tech stack options. Supervisors vet requirements for university scope approval.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm flex flex-col justify-between min-h-[12rem]">
            <div className="flex justify-between items-center">
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">Phase 2</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Milestone 2</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-4">System Architecture Vetting</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Students upload data schema diagrams and API outlines. If sponsored, this milestone triggers dynamic level-1 industry approvals.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm flex flex-col justify-between min-h-[12rem]">
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Phase 3</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Milestone 3</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-4">Code Inspection &amp; Grading</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Final demonstration, repository reviews, and code auditing. The course coordinator inputs final graduation grades.
            </p>
          </div>
        </div>
      </section>

      {/* Role Personas Overview */}
      <section id="personas" className="py-24 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-800/20">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Layers className="w-3.5 h-3.5" />
            Course Roles
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Target Academic Roles
          </h2>
          <p className="text-slate-400 text-xs mt-2 font-semibold">
            Governed exclusively by exactly four user roles, optimized for individual capstones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white">Student Portal</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Individual workspace to submit deliverable repository links, review supervisor evaluation feedback, and track compliance.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
              <UserCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white">Academic Supervisor</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Faculty mentor portal to view assigned students, provide assessment remarks, and mark standard milestones completed.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white">Course Coordinator</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Global dashboard to vet proposals, use double allocation matrices to assign supervisor/student pairs, and submit final grades.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-lg backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Building className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-white">Industry Partner</h4>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Optional external portal to pitch sponsored projects and trigger level-1 sign-offs for sponsored deliverables.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800/40 py-12 px-6 text-center z-10 relative">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
          © {new Date().getFullYear()} Graduate Hub. Academic Governance Ecosystem. All Rights Reserved.
        </p>
      </footer>

    </div>
  )
}

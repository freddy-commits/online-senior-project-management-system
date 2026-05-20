'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { ArrowRight, CheckCircle, Rocket, Shield, Users, Code2 } from 'lucide-react'

export default function LandingContent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  const startSandbox = (role: string) => {
    document.cookie = `demo_mode=true; path=/`
    document.cookie = `demo_role=${role}; path=/`
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_mode', 'true')
      window.location.href = `/${role}`
    }
  }

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SeniorProj
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</Link>
            <Link href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Process</Link>
            <Link href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Showcase</Link>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => startSandbox('student')}
              className="px-4 py-2 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full hover:bg-blue-500/10 transition-all cursor-pointer"
            >
              Interactive Sandbox
            </button>
            <Link href="/login" className="px-5 py-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-white text-slate-950 text-sm font-bold rounded-full hover:bg-slate-200 transition-all shadow-xl shadow-white/5">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ y: y1 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-400/10 border border-blue-400/20 rounded-full">
            Revolutionizing Senior Projects
          </span>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight">
            The Future of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Academic Collaboration
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            A premium management system designed for the next generation of engineers, researchers, and industry leaders.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Link href="/register" className="group relative px-8 py-4 bg-blue-600 rounded-full font-bold text-lg hover:bg-blue-500 transition-all shadow-2xl shadow-blue-500/25 flex items-center gap-2">
              Start Your Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button 
              onClick={() => startSandbox('student')}
              className="px-8 py-4 bg-white/5 rounded-full font-bold text-lg hover:bg-white/10 transition-all border border-white/10"
            >
              Explore Sandbox Mode
            </button>
          </div>

          <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">One-Click Sandbox Login (No DB Configuration Required)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '🎓 Student', role: 'student', color: 'hover:border-blue-500 hover:bg-blue-500/10' },
                { label: '👨‍🏫 Instructor', role: 'instructor', color: 'hover:border-green-500 hover:bg-green-500/10' },
                { label: '🏢 Industry Partner', role: 'industry', color: 'hover:border-indigo-500 hover:bg-indigo-500/10' },
                { label: '🛠️ Administrator', role: 'admin', color: 'hover:border-purple-500 hover:bg-purple-500/10' }
              ].map((b) => (
                <button
                  key={b.role}
                  onClick={() => startSandbox(b.role)}
                  className={`py-3 px-2 border border-white/10 rounded-2xl text-xs font-bold text-slate-300 transition-all cursor-pointer ${b.color}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 3D Dashboard Mockup with Parallax */}
        <motion.div 
          className="mt-24 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          style={{ y: y2 }}
        >
          <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl shadow-blue-500/10 bg-slate-900">
            <div className="flex items-center gap-2 px-6 py-4 bg-white/5 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="mx-auto text-xs text-slate-500 font-medium">project-dashboard.university.edu</div>
            </div>
            <Image 
              src="/assets/student-dash.png" 
              alt="Dashboard Preview" 
              width={1400} 
              height={800}
              className="w-full h-auto opacity-90"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { 
              icon: <Rocket className="w-6 h-6 text-blue-400" />,
              title: "Rapid Deployment",
              desc: "Set up your project team and environment in seconds. Focus on building, not administration."
            },
            { 
              icon: <Users className="w-6 h-6 text-indigo-400" />,
              title: "Industry Collaboration",
              desc: "Direct access to industry partners for sponsorship, mentorship, and real-world evaluation."
            },
            { 
              icon: <Shield className="w-6 h-6 text-purple-400" />,
              title: "Secure Submissions",
              desc: "Grade-level security for all deliverables. Private, encrypted, and accessible to authorized staff."
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Showcase Section */}
      <section className="py-32 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-8">For Instructors & <br /> Administrators</h2>
            <div className="space-y-6">
              {[
                "Automated grade tracking and milestone management",
                "Advanced analytics for team performance",
                "Centralized communication for all projects",
                "Audit-ready reports for accreditation"
              ].map((text, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1 shrink-0" />
                  <p className="text-slate-300 font-medium">{text}</p>
                </div>
              ))}
            </div>
            <button className="mt-12 px-8 py-3 bg-white/10 rounded-full font-bold hover:bg-white/20 transition-all border border-white/10">
              Request Demo
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <Image 
                src="/assets/instructor-dash.png" 
                alt="Instructor View" 
                width={800} 
                height={600}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-lg font-bold">SeniorProj</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Building the next generation of engineers through seamless project management and industry collaboration.
            </p>
            <div className="flex gap-4">
              <Code2 className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold mb-6 text-sm">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-white cursor-pointer transition-colors">Features</li>
                <li className="hover:text-white cursor-pointer transition-colors">Security</li>
                <li className="hover:text-white cursor-pointer transition-colors">Process</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm">Resources</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-white cursor-pointer transition-colors">Guides</li>
                <li className="hover:text-white cursor-pointer transition-colors">API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
                <li className="hover:text-white cursor-pointer transition-colors">Terms</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-slate-600 text-xs">
          © {new Date().getFullYear()} SeniorProj Management System. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

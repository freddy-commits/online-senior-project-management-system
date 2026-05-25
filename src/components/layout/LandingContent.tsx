'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { 
  ArrowRight, 
  Rocket, 
  Shield, 
  Users, 
  Code2, 
  Sparkles, 
  Workflow, 
  Layout, 
  Target, 
  LineChart,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  GraduationCap,
  Menu,
  X
} from 'lucide-react'

// --- REUSABLE TYPEWRITER TEXT ENGINE ---
interface TypewriterTextProps {
  text: string;
  isHovered: boolean;
  speed?: number;
}

function TypewriterText({ text, isHovered, speed = 35 }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState(text)
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    if (!isHovered) {
      setDisplayedText(text)
      return
    }

    if (hasPlayed) return

    const timeout = setTimeout(() => {
      setDisplayedText("")
      let currentIndex = 0
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          clearInterval(interval)
          setHasPlayed(true)
        }
      }, speed)

      return () => clearInterval(interval)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [isHovered, text, speed, hasPlayed])

  useEffect(() => {
    if (!isHovered) {
      setHasPlayed(false)
    }
  }, [isHovered])

  return (
    <span className="relative inline-block w-full text-slate-500">
      {displayedText}
      {isHovered && !hasPlayed && <span className="inline-block w-1.5 h-4 ml-0.5 bg-violet-600 animate-pulse align-middle" />}
    </span>
  )
}

// --- SYSTEM PROCESS: TIMELINE CARD ---
interface TimelineCardProps {
  phase: string;
  stepNumber: string;
  desc: string;
}

function TimelineCard({ phase, stepNumber, desc }: TimelineCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="p-6 md:p-8 rounded-[2rem] bg-white border border-slate-200/80 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all flex flex-col justify-between min-h-[17rem] relative select-none shadow-sm cursor-pointer"
    >
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-violet-600 text-xs font-black uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
            {stepNumber}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Flow State
          </span>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-4">{phase}</h3>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed min-h-[6.5rem]">
        <TypewriterText text={desc} isHovered={hovered} />
      </p>
    </div>
  )
}

// --- CORE CAPABILITIES: FEATURE CARD ---
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  iconBg: string;
}

function FeatureCard({ icon, title, desc, iconBg }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="p-8 rounded-[2rem] bg-white border border-slate-200/80 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all select-none group min-h-[17rem] shadow-sm cursor-pointer"
    >
      <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-6 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed min-h-[6.5rem]">
        <TypewriterText text={desc} isHovered={hovered} />
      </p>
    </div>
  )
}

// --- PORTAL VALUE PROPOSITIONS: ROLE CARD ---
interface RoleCardProps {
  role: string;
  subtitle: string;
  desc: string;
  badgeColor: string;
  borderHover: string;
}

function RoleCard({ role, subtitle, desc, badgeColor, borderHover }: RoleCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-8 rounded-[2.5rem] bg-white border border-slate-200/80 ${borderHover} hover:shadow-lg transition-all select-none min-h-[16rem] shadow-sm cursor-pointer`}
    >
      <span className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${badgeColor}`}>
        Platform Persona
      </span>
      <h3 className="text-2xl font-black text-slate-900 leading-none">{role}</h3>
      <div className="text-slate-500 font-bold text-sm mt-1.5 mb-4">{subtitle}</div>
      <p className="text-slate-500 text-sm leading-relaxed min-h-[6.5rem]">
        <TypewriterText text={desc} isHovered={hovered} />
      </p>
    </div>
  )
}

// --- STATISTICS SHOWCASE: METRIC CARD ---
interface MetricCardProps {
  value: string;
  label: string;
  desc: string;
  gradient: string;
}

function MetricCard({ value, label, desc, gradient }: MetricCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="p-8 rounded-[2rem] bg-white border border-slate-200/80 hover:border-violet-200 hover:shadow-lg transition-all text-center select-none min-h-[14rem] shadow-sm cursor-pointer"
    >
      <div className={`text-4xl lg:text-5xl font-black text-transparent bg-clip-text ${gradient} mb-2`}>
        {value}
      </div>
      <h4 className="text-slate-900 font-bold text-base mb-3">{label}</h4>
      <p className="text-slate-500 text-xs leading-relaxed min-h-[5rem]">
        <TypewriterText text={desc} isHovered={hovered} speed={30} />
      </p>
    </div>
  )
}

// --- MAIN LANDING CONTENT EXPORT ---
export default function LandingContent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start']
  })

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150])
  
  const [heroHovered, setHeroHovered] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSent, setContactSent] = useState(false)

  const heroSubtitle = "A premium management system designed for the next generation of engineers, researchers, and industry leaders. Project Hub streamlines your academic requirements, deliverables, and team dynamics in one integrated space."

  const startSandbox = (role: string) => {
    document.cookie = `demo_mode=true; path=/`
    document.cookie = `demo_role=${role}; path=/`
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_mode', 'true')
      window.location.href = `/${role}`
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setContactSent(true)
    setContactForm({ name: '', email: '', message: '' })
    setTimeout(() => setContactSent(false), 4000)
  }

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Process', href: '#timeline' },
    { label: 'Features', href: '#features' },
    { label: 'Portals', href: '#portals' },
    { label: 'Showcase', href: '#showcase' },
    { label: 'Contact', href: '#contact' },
  ]

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      
      {/* Subtle animated background orbs and pictures behind the world */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <img src="/images/dashboard-hero.png" alt="" className="absolute top-[-10%] right-[-10%] w-[800px] h-auto object-cover opacity-[0.10] transform rotate-12" />
        <img src="/images/collaboration-hero.png" alt="" className="absolute bottom-[10%] left-[-10%] w-[800px] h-auto object-cover opacity-[0.10] transform -rotate-12" />
        <motion.div 
          animate={{
            x: [0, 45, -25, 0],
            y: [0, -35, 45, 0],
            scale: [1, 1.08, 0.92, 1]
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-100/60 blur-[135px] rounded-full" 
        />
        <motion.div 
          animate={{
            x: [0, -35, 35, 0],
            y: [0, 45, -35, 0],
            scale: [1, 0.92, 1.08, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/60 blur-[135px] rounded-full" 
        />
        <motion.div 
          animate={{
            x: [-20, 20, -10, -20],
            y: [20, -20, 10, 20],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-[30%] left-[25%] w-[40%] h-[40%] bg-emerald-100/30 blur-[150px] rounded-full" 
        />
      </div>

      {/* ===== HEADER ===== */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-violet-700 transition-colors">
              Project Hub
            </span>
          </Link>
          
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Log In
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-violet-700 transition-all shadow-lg shadow-slate-900/10">
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-slate-600" /> : <Menu className="w-6 h-6 text-slate-600" />}
          </button>
        </nav>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-200/80 px-6 py-4 space-y-3 shadow-xl"
          >
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-600 hover:text-violet-700 py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
              <Link href="/login" className="text-center py-2.5 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50">
                Log In
              </Link>
              <Link href="/register" className="text-center py-2.5 bg-slate-900 rounded-2xl text-sm font-bold text-white hover:bg-violet-700 transition-all">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section id="home" className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center z-10">
        
        {/* Floating continuous motion cards */}
        <div className="hidden xl:block">
          {/* Left Floating Card */}
          <motion.div
            animate={{
              y: [0, -15, 0, 15, 0],
              x: [0, 8, 0, -8, 0],
              rotate: [0, 1, 0, -1, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute left-[-5%] top-[35%] w-60 bg-white border border-slate-200 shadow-xl p-4 rounded-2xl flex items-center gap-3.5 text-left select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 border border-violet-200">
              <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Active Roster</h4>
              <p className="text-xs text-slate-900 font-bold mt-1">142 Capstones</p>
              <span className="text-[9px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Tracking Active
              </span>
            </div>
          </motion.div>

          {/* Right Floating Card */}
          <motion.div
            animate={{
              y: [0, 15, 0, -15, 0],
              x: [0, -6, 0, 6, 0],
              rotate: [0, -1.5, 0, 1.5, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
            className="absolute right-[-5%] top-[30%] w-64 bg-white border border-slate-200 shadow-xl p-4 rounded-2xl flex items-center gap-3.5 text-left select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Industry Vetted</h4>
              <p className="text-xs text-slate-900 font-bold mt-1">48 Trusted Sponsors</p>
              <div className="flex gap-1.5 mt-2">
                <span className="text-[8px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium text-slate-500">Microsoft</span>
                <span className="text-[8px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium text-slate-500">Google AI</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ y: y1 }}
          onMouseEnter={() => setHeroHovered(true)}
          onMouseLeave={() => setHeroHovered(false)}
          className="cursor-pointer"
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-violet-600 uppercase bg-violet-50 border border-violet-200 rounded-full">
            Revolutionizing Senior Projects
          </span>
          <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight text-slate-900">
            The Future of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600">
              Academic Collaboration
            </span>
          </h1>
          
          <div className="min-h-[5.5rem] max-w-2xl mx-auto mb-12 text-slate-500 text-lg md:text-xl leading-relaxed">
            <TypewriterText text={heroSubtitle} speed={35} isHovered={true} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <Link href="/register" className="group relative px-8 py-4 bg-slate-900 hover:bg-violet-700 rounded-full font-black text-lg text-white transition-all shadow-2xl shadow-slate-900/20 flex items-center gap-2 cursor-pointer uppercase tracking-wider">
              Start Your Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#showcase"
              className="px-8 py-4 bg-white rounded-full font-bold text-lg text-slate-700 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm cursor-pointer"
            >
              Explore Sandbox Mode
            </a>
          </div>

          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-lg">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">One-Click Sandbox Login (No DB Configuration Required)</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '🎓 Student', role: 'student', color: 'hover:border-violet-400 hover:bg-violet-50' },
                { label: '👨‍🏫 Instructor', role: 'instructor', color: 'hover:border-emerald-400 hover:bg-emerald-50' },
                { label: '🏢 Industry Partner', role: 'industry', color: 'hover:border-indigo-400 hover:bg-indigo-50' },
                { label: '🛠️ Administrator', role: 'admin', color: 'hover:border-amber-400 hover:bg-amber-50' }
              ].map((b) => (
                <button
                  key={b.role}
                  onClick={() => startSandbox(b.role)}
                  className={`py-3 px-2 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 transition-all cursor-pointer ${b.color}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div 
          className="mt-24 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          style={{ y: y2 }}
        >
          <div className="absolute inset-0 bg-violet-200/40 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200 bg-white">
            <div className="flex items-center gap-2 px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="mx-auto text-xs text-slate-400 font-medium">project-dashboard.university.edu</div>
            </div>
            <div className="aspect-[16/9] w-full bg-[#f8fafc] relative flex items-center justify-center p-8">
              <div className="border border-slate-200 bg-white rounded-3xl p-6 w-full max-w-4xl text-left shadow-lg relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Project Hub Dashboard</h3>
                    <p className="text-xs text-slate-400">Academic Year Capstones</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full font-bold">Roster Verified</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block font-bold">Overall Ranks</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">Roster Alpha</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block font-bold">Vetted Milestones</span>
                    <span className="text-2xl font-black text-slate-900 mt-1 block">4 / 4 Completed</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block font-bold">Current Standing</span>
                    <span className="text-2xl font-black text-violet-600 mt-1 block">94.8% Grade (A+)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 pt-2">
                  <span>Instructor: Dr. Elizabeth Vance</span>
                  <span>Deliverable: Design Specs &amp; UI Renders</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== SECTION 1: THE CAPSTONE JOURNEY TIMELINE ===== */}
      <section id="timeline" className="py-32 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-200/80">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-violet-600 uppercase bg-violet-50 border border-violet-200 rounded-full">
            <Workflow className="w-3.5 h-3.5" />
            Structured Process
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            The Capstone Journey
          </h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold">
            Observe the fully integrated pipeline for managing academic engineering caps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TimelineCard 
            stepNumber="Step 1"
            phase="Proposal & Pitching"
            desc="Students or industry partners submit comprehensive project abstracts outlining the problem space, technology stacks, hardware, and specific engineering targets. Faculty advisors review the abstracts to ensure academic rigor and feasibility."
          />
          <TimelineCard 
            stepNumber="Step 2"
            phase="Roster Allocation"
            desc="Instructors utilize advanced algorithms to calibrate cohorts and assign teams based on student GPA, skills preferences, and workload ratios. Faculty mentors are matched to direct engineering guidance."
          />
          <TimelineCard 
            stepNumber="Step 3"
            phase="Milestone Vetting"
            desc="Teams execute standard milestones (UI Mockups, Design Specifications, Prototype Audits, Testing). Instructors grade and deliver granular feedback in real-time, enforcing rigid checkmarks."
          />
          <TimelineCard 
            stepNumber="Step 4"
            phase="Final Demonstration"
            desc="Graduating engineers demonstrate their prototype to university staff and industry sponsors. Grading matrices compile, achievements archive, and rosters close for ABET accreditation audits."
          />
        </div>
      </section>

      {/* ===== SECTION 2: SYSTEM CAPABILITIES MATRIX ===== */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-200/80">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 rounded-full">
            <Layout className="w-3.5 h-3.5" />
            System Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Core Modules &amp; Features
          </h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold">
            Fully integrated subsystems to manage your academic pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureCard 
            icon={<Rocket className="w-6 h-6 text-violet-600" />}
            iconBg="bg-violet-50 border border-violet-200"
            title="Milestone Upload Subsystem"
            desc="Supports heavy code payloads, designs, and documentations. Automatically syncs with student repositories, schedules pipeline tests, and logs visual project health marks in a simple centralized feed."
          />
          <FeatureCard 
            icon={<Users className="w-6 h-6 text-emerald-600" />}
            iconBg="bg-emerald-50 border border-emerald-200"
            title="Roster Balancing Allocator"
            desc="Reduces administrative stress. Formulates balanced groups by considering student tech backgrounds, specific grading weights, and team-size constraints, eliminating manually negotiated sign-ups."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6 text-indigo-600" />}
            iconBg="bg-indigo-50 border border-indigo-200"
            title="Evaluation & Rubric Engine"
            desc="Enforces consistent grading schemas. Instructors define rubric items and threshold limits. The engine automatically aggregates peer assessments, sponsor metrics, and mentor evaluations."
          />
          <FeatureCard 
            icon={<Code2 className="w-6 h-6 text-pink-600" />}
            iconBg="bg-pink-50 border border-pink-200"
            title="Industry Sponsor Interface"
            desc="Connects universities with real-world companies. Enables sponsors to pitch concrete engineering problems, micro-fund student supplies, log evaluation notes, and recruit vetted technical talent."
          />
        </div>
      </section>

      {/* ===== SECTION 3: ROLE-BASED VALUE PROPOSITIONS ===== */}
      <section id="portals" className="py-32 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-200/80">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-indigo-700 uppercase bg-indigo-50 border border-indigo-200 rounded-full">
            <Target className="w-3.5 h-3.5" />
            Role-Based Value
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Tailored Dashboard Portals
          </h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold">
            Dedicated experiences designed specifically for your role
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RoleCard 
            role="🎓 For Capstone Students"
            subtitle="Focus on Engineering Excellence"
            badgeColor="text-violet-600"
            borderHover="hover:border-violet-300 hover:shadow-violet-100"
            desc="Review vetted project requirements, coordinate files and deliverables easily, receive direct chat evaluations from your advisor, collaborate on Git workflows, and build an accredited career portfolio."
          />
          <RoleCard 
            role="👨‍🏫 For Faculty & Instructors"
            subtitle="Effortless Roster Management"
            badgeColor="text-emerald-700"
            borderHover="hover:border-emerald-300 hover:shadow-emerald-100"
            desc="Standardize class-wide syllabus thresholds, automate student team balancing, track milestone queues, score project phases with comprehensive grids, and generate audit documentation for accreditation."
          />
          <RoleCard 
            role="🏢 For Industry Partners"
            subtitle="Engage and Recruit Innovators"
            badgeColor="text-indigo-600"
            borderHover="hover:border-indigo-300 hover:shadow-indigo-100"
            desc="Propose authentic challenges, mentor teams via interactive evaluation channels, monitor supply chain budgets, verify deliverable statuses, and gain early recruitment access to graduating engineers."
          />
          <RoleCard 
            role="🛠️ For System Administrators"
            subtitle="Full Control Over Academics"
            badgeColor="text-amber-600"
            borderHover="hover:border-amber-300 hover:shadow-amber-100"
            desc="Initiate new semester cohorts, synchronise directories, manage database rosters, review audit logs, and oversee cross-departmental capstone compliance benchmarks smoothly."
          />
        </div>
      </section>

      {/* ===== SECTION 4: SHOWCASE AND STATISTICS ===== */}
      <section id="showcase" className="py-32 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-200/80">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-pink-700 uppercase bg-pink-50 border border-pink-200 rounded-full">
            <LineChart className="w-3.5 h-3.5" />
            System Traction
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Project Hub in Numbers
          </h2>
          <p className="text-slate-500 text-sm mt-3 font-semibold">
            Real impact across leading university programs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MetricCard 
            value="142+"
            label="Capstones Tracked"
            gradient="bg-gradient-to-r from-violet-600 to-indigo-600"
            desc="Senior capstones across software, mechanical, hardware, and biotechnology sectors successfully managing sprint phases on Project Hub this semester."
          />
          <MetricCard 
            value="48"
            label="Industry Partners"
            gradient="bg-gradient-to-r from-emerald-600 to-teal-600"
            desc="Global corporations and local tech agencies providing sponsorship funds, mentor guidance, and final project sign-off reviews."
          />
          <MetricCard 
            value="98.4%"
            label="Evaluation Accuracy"
            gradient="bg-gradient-to-r from-pink-600 to-rose-600"
            desc="Our peer-assessment matrices and dynamic grading algorithms ensure clear, accredited evaluations, eliminating grading discrepancies."
          />
        </div>
      </section>

      {/* ===== SECTION 5: CONTACT ===== */}
      <section id="contact" className="py-32 px-6 max-w-7xl mx-auto relative z-10 border-t border-slate-200/80">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-violet-600 uppercase bg-violet-50 border border-violet-200 rounded-full">
            <Mail className="w-3.5 h-3.5" />
            Get In Touch
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">
            Contact &amp; Support
          </h2>
          <p className="text-slate-400 text-sm mt-3">
            Reach out to the Project Hub team or your capstone coordinator
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Coordinator Info */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6">Capstone Coordinator</h3>
              <div className="space-y-5">
                {[
                  { icon: <GraduationCap className="w-5 h-5 text-violet-600" />, label: 'Lead Coordinator', value: 'Dr. Elizabeth Vance', bg: 'bg-violet-50' },
                  { icon: <Mail className="w-5 h-5 text-indigo-600" />, label: 'Email', value: 'e.vance@university.edu', bg: 'bg-indigo-50' },
                  { icon: <Phone className="w-5 h-5 text-emerald-600" />, label: 'Direct Line', value: '+1 (555) 012-3456', bg: 'bg-emerald-50' },
                  { icon: <Clock className="w-5 h-5 text-amber-600" />, label: 'Office Hours', value: 'Mon–Fri, 9 AM – 4 PM', bg: 'bg-amber-50' },
                  { icon: <MapPin className="w-5 h-5 text-pink-600" />, label: 'Office', value: 'Engineering Hall, Room 204', bg: 'bg-pink-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</div>
                      <div className="text-sm font-bold text-slate-700 mt-0.5">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-500 rounded-3xl p-8 shadow-xl shadow-violet-200">
              <Building2 className="w-8 h-8 text-white/80 mb-4" />
              <h4 className="text-white font-black text-lg mb-2">Need Urgent Help?</h4>
              <p className="text-violet-100 text-sm leading-relaxed mb-4">
                For immediate platform support, submission errors, or login issues, email our technical help desk.
              </p>
              <a href="mailto:support@projecthub.edu" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-sm font-black text-violet-700 hover:bg-violet-50 transition-all">
                <Mail className="w-4 h-4" />
                support@projecthub.edu
              </a>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">Send a Message</h3>
            {contactSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="font-black text-slate-900 text-lg mb-2">Message Sent!</h4>
                <p className="text-slate-500 text-sm">We'll get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@university.edu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us how we can help you..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 hover:bg-violet-700 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-20 px-6 border-t border-slate-200/80 relative z-10 bg-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-lg">P</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">Project Hub</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
              Building the next generation of engineers through seamless project management and industry collaboration.
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="px-4 py-2 border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-white hover:border-violet-300 transition-all">
                Log In
              </Link>
              <Link href="/register" className="px-4 py-2 bg-slate-900 rounded-full text-xs font-bold text-white hover:bg-violet-700 transition-all">
                Get Started
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-bold mb-6 text-sm text-slate-900">Navigation</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Home</a></li>
                <li><a href="#timeline" className="hover:text-slate-900 transition-colors">Process</a></li>
                <li><a href="#features" className="hover:text-slate-900 transition-colors">Features</a></li>
                <li><a href="#portals" className="hover:text-slate-900 transition-colors">Portals</a></li>
                <li><a href="#showcase" className="hover:text-slate-900 transition-colors">Showcase</a></li>
                <li><a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm text-slate-900">Account</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-slate-900 transition-colors">Register</Link></li>
                <li className="hover:text-slate-900 cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-slate-900 cursor-pointer transition-colors">Guides</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-sm text-slate-900">Legal</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="hover:text-slate-900 cursor-pointer transition-colors">Privacy Policy</li>
                <li className="hover:text-slate-900 cursor-pointer transition-colors">Terms of Service</li>
                <li><a href="#contact" className="hover:text-slate-900 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-xs font-semibold">
          © {new Date().getFullYear()} Project Hub. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

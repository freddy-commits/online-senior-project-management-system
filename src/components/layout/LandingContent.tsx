'use client'

import { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { 
  Check, 
  ArrowRight, 
  HelpCircle, 
  GraduationCap, 
  Users, 
  Sparkles,
  Sliders,
  X,
  BookOpen
} from 'lucide-react'

export default function LandingContent() {
  const [activeDot, setActiveDot] = useState(2)
  
  // Framer Motion scroll hooks for parallax scrolling
  const { scrollY } = useScroll()
  
  // Parallax transforms for the section images
  const yImage1 = useTransform(scrollY, [0, 800], [0, -50])
  const yImage2 = useTransform(scrollY, [200, 1400], [30, -50])

  return (
    <div className="min-h-screen bg-[url('/landing_bg.png')] bg-cover bg-center bg-no-repeat bg-fixed text-slate-100 font-sans flex flex-col justify-between relative overflow-x-hidden">
      
      {/* Deep glass overlay covering the whole background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-indigo-950/80 to-purple-950/85 z-0 pointer-events-none" />

      {/* ===== HEADER / NAVBAR ===== */}
      <header className="bg-slate-950/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 relative">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-xl font-extrabold text-white tracking-tight hover:opacity-90 transition-opacity">
              Project Station
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider uppercase text-slate-400">
              <Link 
                href="/"
                className="text-white border-b-2 border-indigo-500 pb-1 relative transition-colors cursor-pointer"
              >
                Platform
              </Link>
              <button
                onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              >
                Methodology
              </button>
              <button
                onClick={() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              >
                Partners
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/register" 
              className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Register
            </Link>
            
            <Link 
              href="/login"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 text-center cursor-pointer"
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* ===== MAIN CONTINUOUS PAGE CONTAINER ===== */}
      <main className="flex-1 w-full space-y-0 relative z-10">

        {/* ================== PREMIUM HERO SECTION ================== */}
        <section className="relative py-20 lg:py-32 px-6 overflow-hidden flex items-center justify-center min-h-[60vh] border-b border-white/5">
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-black uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Integrated Academic Workspace
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow-sm">
                Your Projects.<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-amber-200">
                  Fully Centralized.
                </span>
              </h1>
              <p className="text-xs md:text-sm text-indigo-200/80 font-bold max-w-2xl mx-auto leading-relaxed">
                Connect academic rigor with industrial relevance. Track deliverables, manage client milestones, and collaborate in one modern, premium workspace.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-4 justify-center pt-2"
            >
              <Link
                href="/login"
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-95 text-center cursor-pointer min-w-[150px]"
              >
                Access Workspaces
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all active:scale-95 text-center cursor-pointer min-w-[150px] backdrop-blur-sm"
              >
                Create Account
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ================== SECTION 1: YEARS 1-3 COMPLEX INDUSTRY CHALLENGES ================== */}
        <section className="border-b border-white/5 py-16 lg:py-24 px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
            
            {/* Left Texts with Viewport Entry Slide-Up Animation */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="md:col-span-6 space-y-6 lg:max-w-xl"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase block">
                  Years 1 — 3 | Industry Focus
                </span>
                <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Master Complex Industry Challenges.
                </h1>
              </div>
              
              <p className="text-sm text-slate-300 font-semibold leading-relaxed">
                Collaborative project-based learning where teams of students tackle real-world problems curated by our corporate partners. Develop professional rigor before graduation.
              </p>
              
              <div className="flex gap-4 pt-2">
                <Link 
                  href="/register"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 text-center"
                >
                  Browse Challenges
                </Link>
                <Link 
                  href="/register"
                  className="px-6 py-3.5 border border-white/20 text-white hover:bg-white/5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer active:scale-95 bg-transparent text-center"
                >
                  Partner Portal
                </Link>
              </div>
            </motion.div>

            {/* Right Image Display with y-Parallax scroll effect */}
            <div className="md:col-span-6 w-full h-72 md:h-[28rem] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative bg-slate-900/50">
              <motion.img 
                style={{ y: yImage1 }}
                src="/students_collaborating_warm.png" 
                alt="Students Collaborating" 
                className="w-full h-[120%] object-cover absolute top-0 left-0 opacity-90"
              />
            </div>
            
          </div>
        </section>

        {/* ================== SECTION 2: YEAR 4 ACADEMIC EXCELLENCE THESIS ================== */}
        <section className="border-b border-white/5 py-16 lg:py-24 px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
            
            {/* Left Image Display with y-Parallax scroll effect */}
            <div className="md:col-span-6 w-full h-72 md:h-[28rem] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative order-2 md:order-1 bg-slate-900/50">
              <motion.img 
                style={{ y: yImage2 }}
                src="/student_thesis_cool.png" 
                alt="Hands typing on a tablet" 
                className="w-full h-[120%] object-cover absolute top-0 left-0 opacity-90"
              />
            </div>

            {/* Right Texts with Viewport Entry Slide-Up Animation */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="md:col-span-6 space-y-6 lg:max-w-xl order-1 md:order-2"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase block">
                  Year 4 | Academic Excellence
                </span>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                  Your Independent Thesis Milestone.
                </h2>
              </div>
              
              <p className="text-sm text-slate-300 font-semibold leading-relaxed">
                The pinnacle of your academic journey. A deep-dive independent thesis that demonstrates mastery of your field and contributes original research to the global community.
              </p>
              
              <div className="flex gap-4 pt-2">
                <Link 
                  href="/register"
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 text-center"
                >
                  Explore Thesis Tracks
                </Link>
                <Link 
                  href="/register"
                  className="px-6 py-3.5 border border-white/20 text-white hover:bg-white/5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer active:scale-95 bg-transparent text-center"
                >
                  Faculty Support
                </Link>
              </div>
            </motion.div>
            
          </div>
        </section>

        {/* ================== SECTION 3: PATHWAY CHOOSE YOUR PORTAL ================== */}
        <section id="methodology" className="py-20 lg:py-28 px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Centered Headers with Viewport Fade-In */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Choose Your Pathway
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                A structured evolution from team-based solving to individual mastery.
              </p>
            </motion.div>

            {/* Side-by-side Pathway Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">
              
              {/* Pathway 1: Team-Based Industry Solve Card */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px -15px rgba(99,102,241,0.25)", borderColor: "rgba(255,255,255,0.2)" }}
                className="bg-white/5 border border-white/10 rounded-3xl p-7 shadow-sm transition-all duration-300 flex flex-col justify-between items-start space-y-6 relative overflow-hidden cursor-default backdrop-blur-md"
              >
                <div className="space-y-5 w-full">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                      <Users className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white leading-snug">Team-Based Industry Solve</h3>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 block mt-0.5">
                        Years 1, 2, & 3
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    Experience the dynamics of professional agency. Work in interdisciplinary teams of 4-6 students to solve logic, design, and engineering problems submitted by real companies.
                  </p>

                  {/* Outcome and Mentorship grid blocks */}
                  <div className="grid grid-cols-2 gap-3.5 pt-2">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-colors"
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Outcome</span>
                      <span className="text-xs font-black text-white block">Professional Portfolio</span>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/5 border border-white/5 rounded-2xl p-4 transition-colors"
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Mentorship</span>
                      <span className="text-xs font-black text-white block">Industry Experts</span>
                    </motion.div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="w-full flex justify-between items-center pt-4 border-t border-white/5">
                  <Link 
                    href="/register"
                    className="text-xs font-extrabold text-indigo-400 hover:underline flex items-center gap-1 group cursor-pointer"
                  >
                    Read Case Studies
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((dot) => (
                      <button 
                        key={dot}
                        onClick={() => setActiveDot(dot)}
                        className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                          activeDot === dot ? 'bg-indigo-500 w-6' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </motion.div>

              {/* Pathway 2: Independent Thesis Card */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px -15px rgba(99,102,241,0.25)", borderColor: "rgba(255,255,255,0.2)" }}
                className="bg-white/5 border border-white/10 rounded-3xl p-7 shadow-sm transition-all duration-300 flex flex-col justify-between items-start space-y-6 relative overflow-hidden cursor-default backdrop-blur-md"
              >
                <div className="space-y-5 w-full">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                      <GraduationCap className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-white leading-snug">Independent Thesis</h3>
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 block mt-0.5">
                        Year 4 Only
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    A rigorous, year-long investigation into a specialized topic. You define the scope, the research methodology, and the final artifact.
                  </p>

                  {/* Checkmark bullets */}
                  <div className="space-y-3 pt-2">
                    {[
                      'Peer-reviewed defense',
                      'Original contribution',
                      'Faculty chair supervision'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-xs font-bold text-slate-200">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer button */}
                <div className="w-full pt-4 border-t border-white/5">
                  <Link 
                    href="/register"
                    className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-2xl font-black text-xs tracking-wider uppercase transition-colors shadow-sm cursor-pointer text-center block"
                  >
                    View Thesis Archives
                  </Link>
                </div>

              </motion.div>

            </div>

            {/* Metric Statistics Strip */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10 max-w-6xl mx-auto backdrop-blur-md"
            >
              {[
                { value: '450+', label: 'Active Tracks' },
                { value: '92%', label: 'Industry Hire Rate' },
                { value: '12k', label: 'Hours of Research' },
                { value: '50+', label: 'Global Partners' }
              ].map((stat, i) => (
                <div key={i} className="pt-4 md:pt-0 border-white/10">
                  <span className="text-2xl lg:text-3xl font-black text-indigo-400 tracking-tight block">
                    {stat.value}
                  </span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>

          </div>
        </section>

        {/* ================== SECTION 4: INDUSTRY PARTNERS ================== */}
        <section id="partners" className="border-t border-white/5 py-20 lg:py-28 px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">

            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-3"
            >
              <span className="text-[10px] font-black text-indigo-400 tracking-widest uppercase block">
                Industry Collaboration
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Built With Real Industry Partners
              </h2>
              <p className="text-xs font-semibold text-slate-400 max-w-xl mx-auto leading-relaxed">
                Companies and institutions collaborate directly on the platform — submitting challenges, mentoring teams, and evaluating final deliverables.
              </p>
            </motion.div>

            {/* Partner Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {[
                {
                  icon: '🎯',
                  title: 'Submit Challenges',
                  desc: 'Post real-world problems for student teams to solve. Define scope, deliverables, and evaluation criteria.'
                },
                {
                  icon: '🤝',
                  title: 'Mentor Teams',
                  desc: 'Assign industry mentors to student groups. Provide guidance through milestones and check-ins.'
                },
                {
                  icon: '📋',
                  title: 'Evaluate Projects',
                  desc: 'Review final deliverables directly in the platform. Score, comment, and approve student submissions.'
                },
                {
                  icon: '🚀',
                  title: 'Source Talent',
                  desc: 'Identify top performers early. Build your talent pipeline before students even graduate.'
                }
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  whileHover={{ y: -6, boxShadow: '0 16px 32px -12px rgba(99,102,241,0.2)', borderColor: 'rgba(255,255,255,0.18)' }}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-md transition-all duration-300 cursor-default"
                >
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl">
                    {benefit.icon}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-extrabold text-white">{benefit.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">{benefit.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Partner Logo Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6"
            >
              <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Trusted by leading organizations
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { name: 'TechCorp', abbr: 'TC', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/20' },
                  { name: 'InnovateLab', abbr: 'IL', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/20' },
                  { name: 'DataSystems', abbr: 'DS', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20' },
                  { name: 'FutureBuild', abbr: 'FB', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/20' },
                  { name: 'CloudBase', abbr: 'CB', color: 'from-sky-500/20 to-cyan-500/20 border-sky-500/20' },
                  { name: 'NexGen', abbr: 'NG', color: 'from-rose-500/20 to-red-500/20 border-rose-500/20' },
                ].map((partner, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r ${partner.color} border backdrop-blur-sm transition-all duration-200 cursor-default`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <span className="text-[10px] font-black text-white">{partner.abbr}</span>
                    </div>
                    <span className="text-xs font-bold text-white/80">{partner.name}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Partner CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-3xl p-10 text-center space-y-6 max-w-3xl mx-auto backdrop-blur-md"
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-extrabold text-white">Become a Partner Organization</h3>
                <p className="text-xs font-semibold text-slate-400 max-w-md mx-auto leading-relaxed">
                  Join 50+ companies already shaping the next generation of professionals. Register your organization and start submitting challenges today.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 active:scale-95"
                >
                  Register as Partner
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all active:scale-95 backdrop-blur-sm"
                >
                  Partner Login
                </Link>
              </div>
            </motion.div>

          </div>
        </section>

      </main>

      {/* ===== PROJECT STATION FOOTER ===== */}
      <footer className="border-t border-white/10 px-6 py-16 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs space-y-4">
            <span className="text-base font-extrabold text-white tracking-tight block">Project Station</span>
            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              Connecting academic rigor with industrial relevance. A centralized workstation for the modern student professional.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                <li><Link href="/register" className="hover:text-white transition-colors">Dashboards</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Milestones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Compliance</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider mb-4">Connect</h4>
              <ul className="space-y-2.5 text-xs text-slate-400 font-bold">
                <li><span className="hover:text-white transition-colors cursor-pointer">LinkedIn</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
          © {new Date().getFullYear()} PROJECT STATION INTEGRATED SYSTEMS. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  )
}

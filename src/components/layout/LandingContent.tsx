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
    <div className="min-h-screen bg-[#fcfcfc] text-slate-800 font-sans flex flex-col justify-between relative overflow-x-hidden">
      
      {/* ===== HEADER / NAVBAR ===== */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-xl font-extrabold text-[#0e0c80] tracking-tight hover:opacity-90 transition-opacity">
              Project Station
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-xs font-black tracking-wider uppercase text-slate-400">
              <Link 
                href="/"
                className="text-slate-900 border-b-2 border-[#0e0c80] pb-1 relative transition-colors cursor-pointer"
              >
                Platform
              </Link>
              <button className="hover:text-slate-900 transition-colors cursor-pointer">
                Methodology
              </button>
              <button className="hover:text-slate-900 transition-colors cursor-pointer">
                Partners
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/register" 
              className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors px-4 py-2"
            >
              Register
            </Link>
            
            {/* Added Premium Login Button in Header */}
            <Link 
              href="/login"
              className="px-5 py-2.5 bg-[#0e0c80] hover:bg-[#1a18a0] text-white text-xs font-black tracking-wider uppercase rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 text-center cursor-pointer"
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* ===== MAIN CONTINUOUS PAGE CONTAINER ===== */}
      <main className="flex-1 w-full space-y-0">

        {/* ================== SECTION 1: YEARS 1-3 COMPLEX INDUSTRY CHALLENGES (PEACH) ================== */}
        <section className="bg-[#fee2d5] border-b border-[#fdd1bd] py-16 lg:py-24 px-6 lg:px-12 relative overflow-hidden">
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
                <span className="text-[10px] font-black text-[#a85024] tracking-widest uppercase block">
                  Years 1 — 3 | Industry Focus
                </span>
                <h1 className="text-3xl lg:text-5xl font-black text-[#32160d] tracking-tight leading-tight">
                  Master Complex Industry Challenges.
                </h1>
              </div>
              
              <p className="text-sm text-[#5d443b] font-semibold leading-relaxed">
                Collaborative project-based learning where teams of students tackle real-world problems curated by our corporate partners. Develop professional rigor before graduation.
              </p>
              
              <div className="flex gap-4 pt-2">
                <Link 
                  href="/register"
                  className="px-6 py-3.5 bg-[#2b1810] hover:bg-[#3d2419] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 text-center"
                >
                  Browse Challenges
                </Link>
                <Link 
                  href="/register"
                  className="px-6 py-3.5 border border-[#2b1810] text-[#2b1810] hover:bg-[#2b1810]/5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer active:scale-95 bg-transparent text-center"
                >
                  Partner Portal
                </Link>
              </div>
            </motion.div>

            {/* Right Image Display with y-Parallax scroll effect */}
            <div className="md:col-span-6 w-full h-72 md:h-[28rem] rounded-[2rem] overflow-hidden shadow-2xl border border-white/40 relative">
              <motion.img 
                style={{ y: yImage1 }}
                src="/students_collaborating_warm.png" 
                alt="Students Collaborating around a Warm light desk" 
                className="w-full h-[120%] object-cover absolute top-0 left-0"
              />
            </div>
            
          </div>
        </section>

        {/* ================== SECTION 2: YEAR 4 ACADEMIC EXCELLENCE THESIS (LAVENDER) ================== */}
        <section className="bg-[#e6e2fc] border-b border-[#cfc9f5] py-16 lg:py-24 px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center relative z-10">
            
            {/* Left Image Display with y-Parallax scroll effect */}
            <div className="md:col-span-6 w-full h-72 md:h-[28rem] rounded-[2rem] overflow-hidden shadow-2xl border border-white/40 relative order-2 md:order-1">
              <motion.img 
                style={{ y: yImage2 }}
                src="/student_thesis_cool.png" 
                alt="Hands typing on a tablet in library cool lighting" 
                className="w-full h-[120%] object-cover absolute top-0 left-0"
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
                <span className="text-[10px] font-black text-indigo-700 tracking-widest uppercase block">
                  Year 4 | Academic Excellence
                </span>
                <h2 className="text-3xl lg:text-5xl font-black text-[#1f1d7a] tracking-tight leading-tight">
                  Your Independent Thesis Milestone.
                </h2>
              </div>
              
              <p className="text-sm text-[#46448a] font-semibold leading-relaxed">
                The pinnacle of your academic journey. A deep-dive independent thesis that demonstrates mastery of your field and contributes original research to the global community.
              </p>
              
              <div className="flex gap-4 pt-2">
                <Link 
                  href="/register"
                  className="px-6 py-3.5 bg-[#0e0c80] hover:bg-[#1916a8] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 text-center"
                >
                  Explore Thesis Tracks
                </Link>
                <Link 
                  href="/register"
                  className="px-6 py-3.5 border border-[#0e0c80] text-[#0e0c80] hover:bg-[#0e0c80]/5 rounded-xl text-xs font-black tracking-wider uppercase transition-all cursor-pointer active:scale-95 bg-transparent text-center"
                >
                  Faculty Support
                </Link>
              </div>
            </motion.div>
            
          </div>
        </section>

        {/* ================== SECTION 3: PATHWAY CHOOSE YOUR PORTAL (WHITE) ================== */}
        <section className="bg-white py-20 lg:py-28 px-6 lg:px-12 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-16">
            
            {/* Centered Headers with Viewport Fade-In */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Choose Your Pathway
              </h2>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                A structured evolution from team-based solving to individual mastery.
              </p>
            </motion.div>

            {/* Side-by-side Pathway Cards with Hover Lift and Viewport trigger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">
              
              {/* Pathway 1: Team-Based Industry Solve Card */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px -15px rgba(227,123,45,0.08)", borderColor: "#fdba74" }}
                className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm transition-all duration-300 flex flex-col justify-between items-start space-y-6 relative overflow-hidden cursor-default"
              >
                <div className="space-y-5 w-full">
                  <div className="flex items-start gap-4">
                    {/* Rounded Peach Users Icon Frame */}
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-[#e37b2d] border border-orange-100 shrink-0">
                      <Users className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug">Team-Based Industry Solve</h3>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#e37b2d] block mt-0.5">
                        Years 1, 2, & 3
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Experience the dynamics of professional agency. Work in interdisciplinary teams of 4-6 students to solve logic, design, and engineering problems submitted by real companies.
                  </p>

                  {/* Outcome and Mentorship grid blocks */}
                  <div className="grid grid-cols-2 gap-3.5 pt-2">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 transition-colors"
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Outcome</span>
                      <span className="text-xs font-black text-slate-800 block">Professional Portfolio</span>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 transition-colors"
                    >
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Mentorship</span>
                      <span className="text-xs font-black text-slate-800 block">Industry Experts</span>
                    </motion.div>
                  </div>
                </div>

                {/* Footer buttons & pagination indicators */}
                <div className="w-full flex justify-between items-center pt-4 border-t border-slate-50">
                  <Link 
                    href="/register"
                    className="text-xs font-extrabold text-[#e37b2d] hover:underline flex items-center gap-1 group cursor-pointer"
                  >
                    Read Case Studies
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  {/* Pagination capsules */}
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((dot) => (
                      <button 
                        key={dot}
                        onClick={() => setActiveDot(dot)}
                        className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                          activeDot === dot ? 'bg-[#c25e2e] w-6' : 'bg-slate-200 hover:bg-slate-300'
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
                whileHover={{ y: -8, boxShadow: "0 20px 40px -15px rgba(14,12,128,0.06)", borderColor: "#c7d2fe" }}
                className="bg-white border border-slate-100 rounded-3xl p-7 shadow-sm transition-all duration-300 flex flex-col justify-between items-start space-y-6 relative overflow-hidden cursor-default"
              >
                <div className="space-y-5 w-full">
                  <div className="flex items-start gap-4">
                    {/* Rounded Lavender Icon Frame */}
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center text-[#0e0c80] border border-indigo-100 shrink-0">
                      <GraduationCap className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug">Independent Thesis</h3>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#0e0c80] block mt-0.5">
                        Year 4 Only
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
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
                        <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer full-width wide button */}
                <div className="w-full pt-4 border-t border-slate-50">
                  <Link 
                    href="/register"
                    className="w-full py-3 bg-white border border-[#0e0c80] hover:bg-indigo-50/40 text-[#0e0c80] rounded-2xl font-black text-xs tracking-wider uppercase transition-colors shadow-sm cursor-pointer text-center block"
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
              className="bg-[#f8fafc] border border-slate-200/50 rounded-3xl p-8 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200/80 max-w-6xl mx-auto"
            >
              {[
                { value: '450+', label: 'Active Tracks' },
                { value: '92%', label: 'Industry Hire Rate' },
                { value: '12k', label: 'Hours of Research' },
                { value: '50+', label: 'Global Partners' }
              ].map((stat, i) => (
                <div key={i} className="pt-4 md:pt-0">
                  <span className="text-2xl lg:text-3xl font-black text-[#0e0c80] tracking-tight block">
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

      </main>

      {/* ===== PROJECT STATION FOOTER ===== */}
      <footer className="bg-slate-50 border-t border-slate-200/80 px-6 py-16 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
          <div className="max-w-xs space-y-4">
            <span className="text-base font-extrabold text-[#0e0c80] tracking-tight block">Project Station</span>
            <p className="text-slate-500 text-xs leading-relaxed font-semibold">
              Connecting academic rigor with industrial relevance. A centralized workstation for the modern student professional.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8">
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
                <li><Link href="/register" className="hover:text-slate-900 transition-colors">Dashboards</Link></li>
                <li><Link href="/register" className="hover:text-slate-900 transition-colors">Milestones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer">Compliance</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-4">Connect</h4>
              <ul className="space-y-2.5 text-xs text-slate-500 font-bold">
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer">LinkedIn</span></li>
                <li><span className="hover:text-slate-900 transition-colors cursor-pointer">Contact</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200 text-center text-slate-450 text-[9px] font-black uppercase tracking-widest">
          © {new Date().getFullYear()} PROJECT STATION INTEGRATED SYSTEMS. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  )
}

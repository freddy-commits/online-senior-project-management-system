'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Lock, 
  Users, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  Loader2, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')

  const startSandbox = (role: string) => {
    document.cookie = `demo_mode=true; path=/`
    document.cookie = `demo_role=${role}; path=/`
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_mode', 'true')
      window.location.href = `/dashboard/${role}`
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Force update the profile since triggers might drop metadata or default to student
      await supabase.from('profiles').update({ 
        full_name: fullName, 
        role: selectedRole 
      }).eq('id', data.user.id)

      router.push(`/dashboard/${selectedRole}`)
    }
  }

  const roles = [
    { id: 'student', title: 'Student', icon: <GraduationCap className="w-5 h-5" />, desc: 'Submit deliverables & track milestones' },
    { id: 'supervisor', title: 'Supervisor', icon: <Users className="w-5 h-5" />, desc: 'Guide students & review progress' },
    { id: 'instructor', title: 'Instructor', icon: <ShieldCheck className="w-5 h-5" />, desc: 'Manage courses & grade milestones' },
    { id: 'partner', title: 'Industry Partner', icon: <Building2 className="w-5 h-5" />, desc: 'Sponsor & propose capstone projects' },
  ]

  return (
    <div className="min-h-screen bg-[#f8fafc] grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden font-sans">
      
      {/* LEFT COLUMN: BRAND SHOWCASE */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-b from-slate-900 via-[#0f172a] to-slate-900 relative overflow-hidden">
        {/* Background glow meshes */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-violet-600/20 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 blur-[150px] rounded-full pointer-events-none" />
        
        {/* Top brand tag */}
        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-violet-300 transition-colors">Project Hub</span>
          </Link>
          <span className="px-2.5 py-0.5 border border-white/10 rounded-full text-[10px] font-medium text-slate-400 bg-white/5 uppercase tracking-wider">v2.0</span>
        </div>

        {/* Middle content */}
        <div className="relative my-auto py-12 z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-violet-300 uppercase bg-violet-500/10 border border-violet-500/20 rounded-full">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            Join the Platform
          </span>
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-none mb-6 tracking-tight">
            Build Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 leading-tight">
              Academic Legacy
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            Create your profile, select your role, and join hundreds of students and instructors collaborating on next-generation capstone projects.
          </p>

          {/* Floating widgets */}
          <div className="relative h-64 w-full mt-10">
            <motion.div
              animate={{ y: [0, -10, 0, 10, 0], x: [0, 5, 0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-0 left-4 w-72 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Milestone Approved</h4>
                <p className="text-xs text-white font-bold truncate mt-0.5">Design Specs &amp; UI Renders</p>
                <span className="text-[10px] text-slate-500">Graded A+ by Dr. Vance</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 12, 0, -12, 0], x: [0, -4, 0, 4, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-4 right-4 w-72 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <Building2 className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">Industry Sponsor</h4>
                <p className="text-xs text-white font-bold truncate mt-0.5">Google AI Research Group</p>
                <span className="text-[10px] text-slate-500">Sponsoring $5,000 USD</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [-6, 6, -6, 6, -6], x: [4, -4, 4, -4, 4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute top-1/2 left-[40%] -translate-y-1/2 w-64 bg-white/5 border border-white/10 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/20">
                <GraduationCap className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Collaboration</h4>
                <p className="text-xs text-white font-bold mt-0.5">4 Developers Assigned</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer brand info */}
        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Project Hub. Premium Academic Workspace.
        </div>
      </div>

      {/* RIGHT COLUMN: REGISTRATION FORM PANEL */}
      <div className="flex flex-col justify-center items-center p-8 lg:p-12 relative overflow-hidden bg-[#f8fafc]">
        {/* Subtle bg orb on mobile */}
        <div className="lg:hidden absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-100 blur-[100px] rounded-full animate-pulse" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full relative z-10"
        >
          {/* Logo only visible on mobile/tablet */}
          <div className="text-center mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-white font-black text-xl">P</span>
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">Project Hub</span>
            </Link>
            <h1 className="text-3xl font-black text-slate-900">Create Account</h1>
            <p className="text-slate-500 mt-1 text-sm">Join the next generation of innovators</p>
          </div>

          {/* Desktop greetings */}
          <div className="hidden lg:block mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-6 text-slate-400 hover:text-slate-700 text-sm font-medium transition-colors">
              ← Back to Home
            </Link>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
            <p className="text-slate-500 mt-1 text-sm">Register your academic profile on Project Hub</p>
          </div>

          <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-100">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl font-medium"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection Grid */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3 ml-1">Select System Role</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-2xl border transition-all text-left group flex flex-col justify-between h-28 ${
                        selectedRole === role.id 
                        ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-900/15' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg inline-block w-fit ${selectedRole === role.id ? 'bg-white/20' : 'bg-white border border-slate-200'}`}>
                        {role.icon}
                      </div>
                      <div>
                        <div className="font-black text-xs uppercase tracking-wide leading-none">{role.title}</div>
                        <div className={`text-[9px] mt-1 leading-tight ${selectedRole === role.id ? 'text-slate-300' : 'text-slate-400 font-medium'}`}>
                          {role.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Input fields split */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="fullName"
                        required
                        placeholder="John Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="name@university.edu"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-slate-900 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-400">Or Sandbox Direct Access</span></div>
            </div>

            {/* Sandbox Direct Login triggers */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '🎓 Student', role: 'student', color: 'hover:border-violet-400 hover:bg-violet-50' },
                { label: '👨‍🏫 Supervisor', role: 'supervisor', color: 'hover:border-emerald-400 hover:bg-emerald-50' },
                { label: '📋 Instructor', role: 'instructor', color: 'hover:border-indigo-400 hover:bg-indigo-50' },
                { label: '🏢 Industry Partner', role: 'partner', color: 'hover:border-amber-400 hover:bg-amber-50' }
              ].map((b) => (
                <button
                  key={b.role}
                  type="button"
                  onClick={() => startSandbox(b.role)}
                  className={`py-3 px-2 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${b.color} active:scale-95 bg-slate-50`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm font-medium">
                Already registered?{' '}
                <Link href="/login" className="text-violet-600 font-bold hover:text-violet-700 hover:underline transition-colors ml-1">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  )
}

'use client'

import { createClient } from '@/lib/supabase/client'
import { getDbState } from '@/lib/supabase/mockDb'
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
  Loader2, 
  ArrowRight, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles,
  HelpCircle,
  Sliders
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')

  const startSandbox = (role: string) => {
    document.cookie = `demo_mode=true; path=/`
    document.cookie = `demo_role=${role}; path=/`
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_mode', 'true')
      if (role === 'student') {
        window.location.href = '/student/dashboard'
      } else if (role === 'instructor') {
        window.location.href = '/instructor/dashboard'
      } else if (role === 'industry') {
        window.location.href = '/partner/dashboard'
      } else {
        window.location.href = '/admin'
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        throw signInError
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      let role = null
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        role = profile?.role
      }

      if (role) {
        // Enforce role matching under live/real Supabase session
        if (role !== selectedRole) {
          // Log out from Supabase if role doesn't match to prevent active session in wrong role
          await supabase.auth.signOut()
          const profileRoleName = role === 'industry' ? 'an Industry Partner' : `a ${role}`
          const selectedRoleName = selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`
          setError(`This account is registered as ${profileRoleName}, but you selected ${selectedRoleName}.`)
          setLoading(false)
          return
        }

        // Clear demo mode cookie & localStorage
        document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
        if (typeof window !== 'undefined') {
          localStorage.removeItem('demo_mode')
        }

        // Set live cookies
        document.cookie = `demo_role=${role}; path=/`

        if (role === 'student') {
          router.push('/student/dashboard')
        } else if (role === 'instructor') {
          router.push('/instructor/dashboard')
        } else if (role === 'industry') {
          router.push('/partner/dashboard')
        } else {
          router.push('/admin')
        }
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.warn("Auth signin failed, falling back to mock sandbox session:", err.message || err)
      
      // Fallback role validation logic for local sandbox / mock profiles database
      let mockProfile = null
      try {
        const state = getDbState()
        mockProfile = state.profiles.find((p: any) => p.email.toLowerCase() === email.toLowerCase())
      } catch (e) {
        console.error("Error reading mock state:", e)
      }

      if (mockProfile && mockProfile.role !== selectedRole) {
        const profileRoleName = mockProfile.role === 'industry' ? 'an Industry Partner' : `a ${mockProfile.role}`
        const selectedRoleName = selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`
        setError(`This account is registered as ${profileRoleName}, but you selected ${selectedRoleName}.`)
        setLoading(false)
        return
      }

      // Also do standard checks if they entered specific default names/keywords to prevent obvious mismatches if profile doesn't exist
      const emailLower = email.toLowerCase()
      if (emailLower.includes('instructor') && selectedRole !== 'instructor') {
        setError(`This email is associated with an Instructor account, but you selected ${selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`}.`)
        setLoading(false)
        return
      }
      if (emailLower.includes('student') && selectedRole !== 'student') {
        setError(`This email is associated with a Student account, but you selected ${selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`}.`)
        setLoading(false)
        return
      }
      if (emailLower.includes('partner') && selectedRole !== 'industry') {
        setError(`This email is associated with an Industry Partner account, but you selected ${selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`}.`)
        setLoading(false)
        return
      }
      if (emailLower.includes('admin') && selectedRole !== 'admin') {
        setError(`This email is associated with an Admin account, but you selected ${selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`}.`)
        setLoading(false)
        return
      }

      // Fallback: set demo cookies & localStorage
      document.cookie = `demo_mode=true; path=/`
      document.cookie = `demo_role=${selectedRole}; path=/`
      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_mode', 'true')
        localStorage.setItem('user_name', email.split('@')[0].toUpperCase())
      }
      
      // Redirect to correct dashboard
      setTimeout(() => {
        if (selectedRole === 'student') {
          window.location.href = '/student/dashboard'
        } else if (selectedRole === 'instructor') {
          window.location.href = '/instructor/dashboard'
        } else if (selectedRole === 'industry') {
          window.location.href = '/partner/dashboard'
        } else {
          window.location.href = '/admin'
        }
      }, 300)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans overflow-hidden">
      
      {/* LEFT COLUMN: BRAND SHOWCASE (Takes 5 cols on lg) */}
      <div className="lg:col-span-5 bg-[#0b192f] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden min-h-[30rem] lg:min-h-screen select-none">
        
        {/* Background glow meshes */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Logo at the top */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="text-xl font-extrabold tracking-tight text-white">Project Station</span>
          </Link>
        </div>

        {/* Center showcase text */}
        <div className="relative z-10 my-auto max-w-md space-y-6">
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
            Bridge the gap between academia and industry.
          </h1>
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
            Manage your capstone journey or industry track with professional-grade project tools designed for the next generation of innovators.
          </p>

          {/* Features Checkbox Bullet list matching Screenshot 8 */}
          <div className="space-y-3.5 pt-4">
            {[
              'Structured Milestone Tracking',
              'Industry Partnership Portal',
              'Collaborative Document Station'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-[#e37b2d] flex items-center justify-center shrink-0 text-[#e37b2d]">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs text-slate-200 font-extrabold">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info tag */}
        <div className="relative z-10 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} Project Station. Integrated Systems.
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM PANEL (Takes 7 cols on lg) */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 lg:p-12 bg-white relative overflow-y-auto min-h-screen">
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-6"
        >
          {/* Header Greeting */}
          <div className="text-left space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-xs font-semibold text-slate-400">Sign in to your capstone workspace portal.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Interactive Role Selection Grid */}
            <div className="space-y-1.5 pb-2">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Choose role bypass target</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { role: 'student', label: 'Student', desc: 'Capstone tracks', icon: <GraduationCap className="w-5 h-5" />, color: 'border-blue-200 text-blue-600 bg-blue-50/10' },
                  { role: 'instructor', label: 'Instructor', desc: 'Jury evaluation', icon: <Users className="w-5 h-5" />, color: 'border-emerald-200 text-emerald-600 bg-emerald-50/10' },
                  { role: 'industry', label: 'Industry', desc: 'Sponsor briefs', icon: <Building2 className="w-5 h-5" />, color: 'border-indigo-200 text-indigo-600 bg-indigo-50/10' },
                  { role: 'admin', label: 'Admin', desc: 'Cohort admin', icon: <Sliders className="w-5 h-5" />, color: 'border-amber-200 text-amber-600 bg-amber-50/10' }
                ].map((r) => {
                  const isSelected = selectedRole === r.role
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedRole(r.role)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none space-y-1 ${
                        isSelected 
                          ? `${r.color} ring-2 ring-offset-2 ring-blue-500/20 scale-[1.02] border-blue-500 font-black` 
                          : 'border-slate-100 bg-slate-50/30 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-white shadow-sm' : 'text-slate-400'}`}>
                        {r.icon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider block leading-none">{r.label}</span>
                      <span className="text-[7.5px] text-slate-400 font-bold block leading-none pt-0.5">{r.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* University Email input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">University Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="alex.rivera@university.edu"
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-blue-500/10 flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Sandbox direct shortcut strip */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block text-center">
              Or direct sandbox login (No database setup)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🎓 Student', role: 'student', color: 'hover:border-blue-400 hover:bg-blue-50/50' },
                { label: '👨‍🏫 Instructor', role: 'instructor', color: 'hover:border-emerald-400 hover:bg-emerald-50/50' },
                { label: '🏢 Industry', role: 'industry', color: 'hover:border-indigo-400 hover:bg-indigo-50/50' },
                { label: '🛠️ Admin', role: 'admin', color: 'hover:border-amber-400 hover:bg-amber-50/50' }
              ].map((b) => (
                <button
                  key={b.role}
                  onClick={() => startSandbox(b.role)}
                  className={`py-2 px-1 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 bg-slate-50 transition-all cursor-pointer ${b.color}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Redirect to sign up */}
          <div className="text-center text-xs font-semibold text-slate-400 pt-2">
            New to Project Station?{' '}
            <Link href="/register" className="text-blue-600 font-extrabold hover:underline">
              Create an account
            </Link>
          </div>

        </motion.div>
      </div>

    </div>
  )
}

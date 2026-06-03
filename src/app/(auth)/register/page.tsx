'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Loader2, 
  Check, 
  Eye, 
  EyeOff, 
  Sliders,
  Briefcase
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    try {
      // Step 1: Create the user via server-side admin API (bypasses broken trigger)
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role: selectedRole }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Registration failed.')
      }

      // Step 2: Sign in with the newly created credentials to establish session
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        throw new Error('Account created but sign-in failed. Please go to login page.')
      }

      // Clear any leftover sandbox cookies
      document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_mode')
      }
      document.cookie = `demo_role=${selectedRole}; path=/`

      // Step 3: Redirect to the right dashboard
      if (selectedRole === 'student') {
        router.push('/student/dashboard')
      } else if (selectedRole === 'instructor') {
        router.push('/instructor/dashboard')
      } else if (selectedRole === 'industry') {
        router.push('/partner/dashboard')
      } else if (selectedRole === 'supervisor') {
        router.push('/supervisor/dashboard')
      } else {
        router.push('/admin')
      }

    } catch (err: any) {
      console.error('Registration error:', err.message || err)
      setError(err.message || 'Registration failed. Please try again.')
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

      {/* RIGHT COLUMN: REGISTRATION FORM PANEL (Takes 7 cols on lg) */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 lg:p-12 bg-white relative overflow-y-auto min-h-screen">
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-6"
        >
          {/* Header Greeting */}
          <div className="text-left space-y-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-xs font-semibold text-slate-400">Join your track and start your project journey today.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-2xl font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Interactive Role Selection Grid */}
            <div className="space-y-1.5 pb-2">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Select your role</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { role: 'student', label: 'Student', desc: 'Capstone tracks', icon: <GraduationCap className="w-5 h-5" />, color: 'border-blue-200 text-blue-600 bg-blue-50/10' },
                  { role: 'instructor', label: 'Instructor', desc: 'Jury evaluation', icon: <Users className="w-5 h-5" />, color: 'border-emerald-200 text-emerald-600 bg-emerald-50/10' },
                  { role: 'industry', label: 'Industry', desc: 'Sponsor briefs', icon: <Building2 className="w-5 h-5" />, color: 'border-indigo-200 text-indigo-600 bg-indigo-50/10' },
                  { role: 'supervisor', label: 'Supervisor', desc: 'Mentorship', icon: <Briefcase className="w-5 h-5" />, color: 'border-cyan-200 text-cyan-600 bg-cyan-50/10' },
                  { role: 'admin', label: 'Panel Member', desc: 'Cohort evaluation', icon: <Sliders className="w-5 h-5" />, color: 'border-amber-200 text-amber-600 bg-amber-50/10' }
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

            {/* Full Name input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Full Name</label>
              <input
                name="fullName"
                type="text"
                required
                placeholder="Alex Rivera"
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
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

            {/* Academic Year & Track dropdown (Only for Student) */}
            {selectedRole === 'student' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Academic Year & Track</label>
                <select
                  name="academicYear"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select your current year</option>
                  <option value="year-1">Year 1 - Foundational solving</option>
                  <option value="year-2">Year 2 - Technical execution</option>
                  <option value="year-3">Year 3 - Team Industry solving</option>
                  <option value="year-4">Year 4 - Independent Thesis</option>
                </select>
              </motion.div>
            )}

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

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 pt-2">
              <input 
                type="checkbox" 
                id="agree-terms"
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                required
              />
              <label htmlFor="agree-terms" className="text-[10px] text-slate-400 font-bold leading-normal">
                I agree to the <span className="text-[#0c59db] hover:underline cursor-pointer">Academic Integrity Policy</span> and <span className="text-[#0c59db] hover:underline cursor-pointer">Terms of Service</span>.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-blue-500/10 flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>
            </div>
          </form>



          {/* Redirect to sign in */}
          <div className="text-center text-xs font-semibold text-slate-400 pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-extrabold hover:underline">
              Sign In
            </Link>
          </div>

        </motion.div>
      </div>

    </div>
  )
}

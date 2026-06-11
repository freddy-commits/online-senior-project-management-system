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
  const [password, setPassword] = useState('')

  const meetsMinLength = password.length >= 8
  const meetsUppercase = /[A-Z]/.test(password)
  const meetsLowercase = /[a-z]/.test(password)
  const meetsNumber = /[0-9]/.test(password)
  const meetsSpecial = /[^A-Za-z0-9]/.test(password)
  
  const isPasswordStrong = meetsMinLength && meetsUppercase && meetsLowercase && meetsNumber && meetsSpecial


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!isPasswordStrong) {
      setError("Please make sure your password satisfies all the strong password checklist requirements.")
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Step 1: Sign up directly using client-side Supabase (no server API needed)
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
        throw new Error(signUpError.message)
      }

      if (!data.user) {
        throw new Error('Registration failed. Please try again.')
      }

      // Step 2: Create/update profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: selectedRole,
        }, { onConflict: 'id' })

      if (profileError) {
        console.warn('Profile upsert warning (non-fatal):', profileError.message)
      }

      // Step 3: If email confirmation is required, show message
      if (data.user && !data.session) {
        setError('Please check your email to confirm your account, then log in.')
        setLoading(false)
        return
      }

      // Clear any leftover sandbox cookies
      document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_mode')
      }
      document.cookie = `demo_role=${selectedRole}; path=/`

      // Step 4: Redirect to the right dashboard
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

  async function handleOAuthLogin(provider: 'google' | 'github') {
    setLoading(true)
    setError('')
    try {
      const mockEmail = 
        selectedRole === 'student' ? 'home@gmail.com' :
        selectedRole === 'supervisor' ? 'monari@gmail.com' :
        selectedRole === 'instructor' ? 'ssanch2311@ueab.ac.ke' :
        selectedRole === 'industry' ? 'ben@gmail.com' : 'feed@gmail.com'

      // Simulate a small delay for OAuth loading state
      await new Promise(resolve => setTimeout(resolve, 800))

      if (typeof window !== 'undefined') {
        localStorage.setItem('demo_mode', 'true')
        localStorage.setItem('active_user_email', mockEmail)
        document.cookie = `demo_role=${selectedRole}; path=/`
      }

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
      console.error(`${provider} oauth failed:`, err.message || err)
      setError(err.message || 'OAuth authentication failed.')
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password strength checklist */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-[10px] font-semibold text-slate-500 mt-2">
                <span className="text-[8.5px] font-black uppercase tracking-wider block text-slate-400 mb-1">Password Strength Checklist</span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${meetsMinLength ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}>✓</span>
                    <span>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${meetsUppercase ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}>✓</span>
                    <span>1 uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${meetsLowercase ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}>✓</span>
                    <span>1 lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${meetsNumber ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}>✓</span>
                    <span>1 number</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-bold ${meetsSpecial ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-300 border-slate-200'}`}>✓</span>
                    <span>1 special character</span>
                  </div>
                </div>
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Or continue with</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          {/* Social OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.5 5.5 0 0 1 8.5 13a5.5 5.5 0 0 1 5.49-5.518c2.4 0 3.86 1.026 4.78 1.905l3.224-3.224C19.925 4.113 16.89 2.5 13.99 2.5a10.5 10.5 0 0 0-10.5 10.5 10.5 10.5 0 0 0 10.5 10.5c6 0 10.5-4.28 10.5-10.5 0-.712-.085-1.222-.244-1.715H12.24z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </button>
          </div>



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

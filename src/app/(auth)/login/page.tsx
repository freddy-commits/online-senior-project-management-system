'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
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

export default function LoginPage() {
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

        // Ensure the profile row exists in the profiles database table
        if (!role) {
          role = user.user_metadata?.role || selectedRole
          const { error: upsertError } = await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            role: role
          }, { onConflict: 'id' })
          if (upsertError) {
            console.error('Failed to create user profile row in login fallback:', upsertError.message)
          }
        }
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
        } else if (role === 'supervisor') {
          router.push('/supervisor/dashboard')
        } else {
          router.push('/admin')
        }
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error("Auth signin failed:", err.message || err)
      
      const isNetworkError = err.message && (
        err.message.includes('fetch') || 
        err.message.includes('NetworkError') || 
        err.message.includes('TypeError') ||
        err.message.includes('network')
      )

      if (isNetworkError) {
        console.warn("Network issue/Supabase unreachable. Falling back to sandbox/mock auth.")
        try {
          const { createMockClient } = await import('@/lib/supabase/mockClient')
          const mockClient = createMockClient()
          
          // Enforce role matching under mock/sandbox session
          const { data: profile } = await mockClient.from('profiles').select('role').eq('email', email).single()
          if (profile && profile.role !== selectedRole) {
            const profileRoleName = profile.role === 'industry' ? 'an Industry Partner' : `a ${profile.role}`
            const selectedRoleName = selectedRole === 'industry' ? 'an Industry Partner' : `a ${selectedRole}`
            setError(`This account is registered as ${profileRoleName}, but you selected ${selectedRoleName}.`)
            setLoading(false)
            return
          }

          const { data: authData, error: mockAuthError } = await mockClient.auth.signInWithPassword({ 
            email, 
            role: selectedRole 
          })

          if (mockAuthError) {
            throw mockAuthError
          }

          // Save active user email and demo mode in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('demo_mode', 'true')
            localStorage.setItem('active_user_email', email)
            document.cookie = `demo_role=${selectedRole}; path=/`
            document.cookie = `active_user_email=${email}; path=/`
            document.cookie = `demo_mode=true; path=/`
          }

          // Redirect to appropriate dashboard based on selectedRole
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
          return
        } catch (mockErr: any) {
          console.error("Mock auth fallback failed:", mockErr)
          setError(`Network is unreachable. Sandbox fallback failed: ${mockErr.message || mockErr}`)
          setLoading(false)
          return
        }
      }

      setError(err.message || 'Authentication failed. Please check your credentials.')
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
        document.cookie = `active_user_email=${mockEmail}; path=/`
        document.cookie = `demo_mode=true; path=/`
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
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">I am signing in as</label>
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
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
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

'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resetUserPasswordByEmail, checkEmailExists } from '../actions'
import { 
  Loader2, 
  Check, 
  Eye, 
  EyeOff, 
  KeyRound,
  X,
  Mail,
  AlertCircle
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState('')

  async function handleRequestTempPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')
    try {
      // Step 1: Verify the email exists in our system
      const checkRes = await checkEmailExists(forgotEmail)
      if (!checkRes.success) {
        throw new Error(checkRes.error)
      }
      if (!checkRes.exists) {
        throw new Error('This email is not registered in the system.')
      }

      // Step 2: Request temporary password and send email
      const resetRes = await resetUserPasswordByEmail(forgotEmail)
      if (!resetRes.success) {
        throw new Error(resetRes.error)
      }

      if (resetRes.simulated) {
        setForgotSuccess(`[Simulation Mode] Temporary password is: ${resetRes.tempPassword} (No RESEND_API_KEY is defined in environment variables. In production, this will be emailed directly to the user's real inbox.)`)
      } else {
        setForgotSuccess('A temporary password has been successfully sent to your registered email address!')
      }
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send temporary password.')
    } finally {
      setForgotLoading(false)
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

      let role = 'student'
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        role = profile?.role || 'student'

        // Fallback: create profile row if missing
        if (!profile) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
            role: 'student'
          }, { onConflict: 'id' })
        }
      }

      // Clear demo mode
      document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      if (typeof window !== 'undefined') localStorage.removeItem('demo_mode')

      // Redirect based on actual database role — no client-side role selection needed
      const roleRouteMap: Record<string, string> = {
        student:          '/student/dashboard',
        instructor:       '/instructor/dashboard',
        supervisor:       '/supervisor/dashboard',
        industry_partner: '/partner/dashboard',
        examiner:         '/admin/dashboard',
        admin:            '/admin/dashboard',
      }

      // Users with pending role requests go to /hub
      if (role === 'student') {
        // Check if they have a pending role request (i.e., they are waiting for approval)
        const { data: roleReq } = await supabase
          .from('role_requests')
          .select('status')
          .eq('user_id', user!.id)
          .eq('status', 'pending')
          .maybeSingle()

        if (roleReq) {
          router.push('/hub')
          return
        }
      }

      router.push(roleRouteMap[role] ?? '/student/dashboard')

    } catch (err: any) {
      console.error("Auth signin failed:", err.message || err)
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      console.error(`${provider} oauth failed:`, err.message || err)
      setError(err.message || 'OAuth authentication failed.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white font-sans overflow-hidden">
      
      {/* LEFT COLUMN: BRAND SHOWCASE (Takes 5 cols on lg) */}
      <div className="lg:col-span-5 bg-[#111827] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden min-h-[30rem] lg:min-h-screen select-none">
        
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
                <div className="w-5 h-5 rounded-full border border-[#F59E0B] flex items-center justify-center shrink-0 text-[#F59E0B]">
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
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(true)
                    setForgotError('')
                    setForgotSuccess('')
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-black uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              </div>
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

      {/* Forgot Password Recovery Modal */}
      <AnimatePresence>
        {isForgotOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-8 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <button
                onClick={() => {
                  setIsForgotOpen(false)
                  setForgotEmail('')
                  setForgotError('')
                  setForgotSuccess('')
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2 text-left">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight leading-snug pt-2">
                  Recover Password
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Enter your registered email address. We will generate and send a new temporary password to your real email account to help you reset it.
                </p>
              </div>

              {forgotError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <form onSubmit={handleRequestTempPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="yourname@university.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-205 focus:border-blue-500 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
                >
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Temporary Password'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

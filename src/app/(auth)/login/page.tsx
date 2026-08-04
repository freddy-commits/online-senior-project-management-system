'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { resetUserPasswordByEmail, checkEmailExists } from '../actions'
import { getFriendlyAuthError } from '@/lib/error-messages'
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
        examiner:         '/admin',
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
      router.replace('/hub')
          return
        }
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dashboard_session_active', 'true')
      }
      router.replace(roleRouteMap[role] ?? '/student/dashboard')

    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth signin failed:', err.message || err)
      }
      setError(getFriendlyAuthError(err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      
      // IMPORTANT: Sign out any existing session FIRST before triggering OAuth.
      // This prevents the middleware from routing the new user to the old user's
      // dashboard while the OAuth redirect is in flight.
      await supabase.auth.signOut()

      // Set a short-lived cookie flag that tells middleware to NOT redirect 
      // during the OAuth handshake — prevents bouncing back to old dashboard.
      document.cookie = 'oauth_switch=1; path=/; max-age=120; SameSite=Lax'

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`${provider} oauth failed:`, err.message || err)
      }
      setError(getFriendlyAuthError(err.message || ''))
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

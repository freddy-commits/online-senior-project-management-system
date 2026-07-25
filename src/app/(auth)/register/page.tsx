'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Building2, 
  Loader2, 
  Check, 
  Eye, 
  EyeOff
} from 'lucide-react'
import { SCHOOL_EMAIL_DOMAIN } from '@/lib/email-validation'
import { getFriendlyAuthError } from '@/lib/error-messages'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('student')
  const [password, setPassword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [studentId, setStudentId] = useState('')
  const [staffId, setStaffId] = useState('')

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
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    if (!isPasswordStrong) {
      setError("Please make sure your password satisfies all the strong password checklist requirements.")
      setLoading(false)
      return
    }

    // SECURITY: Validate UEAB email domain for students
    if (selectedRole === 'student' && !email.toLowerCase().endsWith(`@${SCHOOL_EMAIL_DOMAIN}`)) {
      setError(`Only UEAB school emails (@${SCHOOL_EMAIL_DOMAIN}) are accepted for student registration.`)
      setLoading(false)
      return
    }

    // SECURITY: Require Student ID for students
    if (selectedRole === 'student' && !studentId.trim()) {
      setError('Student ID is required for student registration.')
      setLoading(false)
      return
    }

    // SECURITY: Require Staff ID for instructors, supervisors, and examiners
    if ((selectedRole === 'instructor' || selectedRole === 'supervisor' || selectedRole === 'examiner') && !staffId.trim()) {
      setError('Staff ID is required for staff registration.')
      setLoading(false)
      return
    }

    // Require department for roles that need it
    if ((selectedRole === 'student' || selectedRole === 'instructor' || selectedRole === 'supervisor' || selectedRole === 'examiner') && !selectedDepartment) {
      setError('Please select your department before continuing.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Call server signup API which creates user with email_confirm: true
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role: selectedRole,
          department: selectedDepartment || null,
          studentId: selectedRole === 'student' ? studentId.trim() : null,
          staffId: (selectedRole === 'instructor' || selectedRole === 'supervisor' || selectedRole === 'examiner') ? staffId.trim() : null
        })
      })

      const resData = await response.json()
      if (!response.ok || resData.error) {
        throw new Error(resData.error || 'Registration failed.')
      }

      // Log in immediately after successful signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        throw signInError
      }

      // Clear any leftover sandbox cookies
      document.cookie = 'demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      if (typeof window !== 'undefined') {
        localStorage.removeItem('demo_mode')
        sessionStorage.setItem('dashboard_session_active', 'true')
      }
      document.cookie = `demo_role=${selectedRole}; path=/`

      // Redirect to the right dashboard
      if (selectedRole === 'student') {
        router.push('/student/dashboard')
      } else {
        // Any elevated role requires approval and should go to the hub
        router.push('/hub')
      }

    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration attempt failed:', err.message || err)
      }
      setError(getFriendlyAuthError(err.message || ''))
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuthLogin(provider: 'google' | 'github') {
    // Require department for roles that need it
    const rolesRequiringDept = ['student', 'instructor', 'supervisor', 'examiner']
    if (rolesRequiringDept.includes(selectedRole) && !selectedDepartment) {
      setError(`Please select your department before continuing with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`)
      return
    }

    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      // Note: Do NOT call signOut() here — it destroys the PKCE verifier cookie
      // Session isolation is handled in the callback route

      // Store selected department in a cookie (expires in 5 minutes)
      const cookieOpts = 'path=/; max-age=300; SameSite=Lax'
      document.cookie = selectedDepartment
        ? `oauth_dept=${encodeURIComponent(selectedDepartment)}; ${cookieOpts}`
        : `oauth_dept=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`

      // Store selected role in a cookie — covers ALL five roles
      document.cookie = `oauth_role=${encodeURIComponent(selectedRole)}; ${cookieOpts}`

      const redirectTo = `${window.location.origin}/api/auth/callback?role=${encodeURIComponent(selectedRole)}${selectedDepartment ? `&department=${encodeURIComponent(selectedDepartment)}` : ''}`

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
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

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs rounded-2xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Interactive Role Selection Grid */}
            <div className="space-y-1.5 pb-2">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Select your role</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'student', label: 'Student', desc: 'Capstone tracks', icon: <GraduationCap className="w-5 h-5" />, color: 'border-blue-200 text-blue-600 bg-blue-50/10' },
                  { role: 'instructor', label: 'Instructor', desc: 'Course coordinators', icon: <GraduationCap className="w-5 h-5" />, color: 'border-emerald-200 text-emerald-600 bg-emerald-50/10' },
                  { role: 'supervisor', label: 'Supervisor', desc: 'Project guides', icon: <GraduationCap className="w-5 h-5" />, color: 'border-purple-200 text-purple-600 bg-purple-50/10' },
                  { role: 'industry_partner', label: 'Industry Partner', desc: 'Sponsor briefs', icon: <Building2 className="w-5 h-5" />, color: 'border-indigo-200 text-indigo-600 bg-indigo-50/10' },
                  { role: 'examiner', label: 'Examiner Panel', desc: 'Review & grade', icon: <Eye className="w-5 h-5" />, color: 'border-rose-200 text-rose-600 bg-rose-50/10' }
                ].map((r) => {
                  const isSelected = selectedRole === r.role
                  return (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setSelectedRole(r.role)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none space-y-1 ${
                        isSelected 
                          ? `${r.color} ring-2 ring-offset-2 ring-blue-500/20 scale-[1.02] border-current font-black` 
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
              <p className="text-[9px] text-slate-400 font-semibold ml-1 mt-1">Instructor, Supervisor, Examiner, and Industry accounts require administrator approval after registration.</p>
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

            {/* Email input — UEAB email required for students */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="firstname.lastname@example.com"
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
              />
              {selectedRole === 'student' && (
                <p className="text-[9px] text-amber-600 font-semibold ml-1">Note: Email signup requires @{SCHOOL_EMAIL_DOMAIN}. Google/GitHub OAuth accepts any email domain.</p>
              )}
            </div>

            {/* Student ID — Required for students */}
            {selectedRole === 'student' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">
                  Student ID
                </label>
                <input
                  name="studentId"
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., 2024-01-0123"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </motion.div>
            )}

            {/* Staff ID — Required for instructors, supervisors, examiners */}
            {(selectedRole === 'instructor' || selectedRole === 'supervisor' || selectedRole === 'examiner') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">
                  Staff ID
                </label>
                <input
                  name="staffId"
                  type="text"
                  required
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g., EMP-2024-5678"
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
              </motion.div>
            )}

            {/* Department dropdown (for Students, Instructors, Supervisors, Examiners) */}
            {(selectedRole === 'student' || selectedRole === 'instructor' || selectedRole === 'supervisor' || selectedRole === 'examiner') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select your department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Education">Education</option>
                  <option value="Natural Sciences">Natural Sciences</option>
                  <option value="Social Sciences">Social Sciences</option>
                  <option value="Other">Other</option>
                </select>
              </motion.div>
            )}

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

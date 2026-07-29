import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import SupervisorDashboardClient from '@/components/dashboard/SupervisorDashboardClient'

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'supervisor') {
    redirect('/login')
  }

  // Server Action to update the profile department
  async function selectDepartment(formData: FormData) {
    'use server'
    const department = formData.get('department') as string
    if (!department) return

    const client = await createClient()
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (currentUser) {
      const { error } = await client
        .from('profiles')
        .update({ department })
        .eq('id', currentUser.id)
      
      if (error) {
        console.error('Failed to update department:', error.message)
      } else {
        revalidatePath('/supervisor/dashboard')
      }
    }
  }

  let supervisorDepartment = profile.department || null

  // If department is missing on profile, auto-recover it from role_requests (saved during registration)
  if (!supervisorDepartment) {
    const { data: roleReq } = await supabase
      .from('role_requests')
      .select('department')
      .eq('user_id', user.id)
      .not('department', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (roleReq?.department) {
      supervisorDepartment = roleReq.department
      // Persist to profiles table so subsequent loads are instant
      await supabase
        .from('profiles')
        .update({ department: roleReq.department })
        .eq('id', user.id)
    }
  }

  // If department is missing, prompt the supervisor to select one
  if (!supervisorDepartment) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-slate-50/50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] p-8 md:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select Department</h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Please select your academic department to configure your supervisor dashboard and access your student teams.
            </p>
          </div>
          <form action={selectDepartment} className="space-y-4">
            <div className="relative">
              <select
                name="department"
                required
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl py-3.5 px-4 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
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
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-indigo-600/10 text-xs tracking-wider uppercase cursor-pointer"
            >
              Configure Dashboard
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Fetch projects allocated to this supervisor
  const { data: projects } = await supabase
    .from('projects')
    .select('*, student:student_id(full_name, email, id), supervisor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  const enrichedProjects = await Promise.all((projects || []).map(async (p: any) => {
    const { data: delivs } = await supabase
      .from('deliverables')
      .select('*')
      .eq('project_id', p.id)
      .order('due_date', { ascending: true })

    return {
      ...p,
      origin: p.industry_partner_id ? 'industry' : 'academic',
      deliverables: delivs || []
    }
  }))

  return (
    <div className="p-4 md:p-8 pb-20">
      {supervisorDepartment && (
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-black text-indigo-700 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          Dept: {supervisorDepartment}
        </div>
      )}
      <SupervisorDashboardClient initialProfile={profile} initialProjects={enrichedProjects} />
    </div>
  )
}


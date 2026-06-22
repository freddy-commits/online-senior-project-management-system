import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SupervisorDashboardClient from '@/components/dashboard/SupervisorDashboardClient'

export default async function SupervisorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let enrichedProjects: any[] = []

  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = prof

    if (profile && profile.role === 'supervisor') {
      const { data: projects } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email, id), supervisor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })

      enrichedProjects = await Promise.all((projects || []).map(async (p: any) => {
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
    }
  }

  return (
    <div className="p-4 md:p-8 pb-20">
      {profile?.department && (
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-black text-indigo-700 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          Dept: {profile.department}
        </div>
      )}
      <SupervisorDashboardClient initialProfile={profile} initialProjects={enrichedProjects} />
    </div>
  )
}

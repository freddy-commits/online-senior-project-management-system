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
    <div className="p-8 pb-20">
      <SupervisorDashboardClient initialProfile={profile} initialProjects={enrichedProjects} />
    </div>
  )
}

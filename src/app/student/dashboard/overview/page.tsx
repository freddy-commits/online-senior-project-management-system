import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient'

export default async function OverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: projects } = await supabase
    .from('projects')
    .select('*, supervisor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  const enrichedProjects = await Promise.all((projects || []).map(async p => {
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
    <div className="p-8 pb-20">
      <StudentDashboardClient initialProfile={profile} initialProjects={enrichedProjects} />
    </div>
  )
}

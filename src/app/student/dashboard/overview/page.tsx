import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentDashboardClient from '@/components/dashboard/StudentDashboardClient'
import { getStudentProjects, getDeliverables } from '../../milestones/actions'

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

  const projRes = await getStudentProjects()
  if (!projRes.success) {
    console.error('Failed to fetch projects for overview:', projRes.error)
  }

  const projects = projRes.data || []

  const enrichedProjects = await Promise.all((projects || []).map(async (p: any) => {
    const delivRes = await getDeliverables(p.id)
    if (!delivRes.success) {
      console.error(`Failed to fetch deliverables for project ${p.id} on overview:`, delivRes.error)
    }
    const delivs = delivRes.data || []

    return {
      ...p,
      origin: p.industry_partner_id ? 'industry' : 'academic',
      deliverables: delivs,
      supervisor: p.instructor || null,
      partner: p.partner || null
    }
  }))

  return (
    <div className="p-8 pb-20">
      <StudentDashboardClient initialProfile={profile} initialProjects={enrichedProjects} />
    </div>
  )
}

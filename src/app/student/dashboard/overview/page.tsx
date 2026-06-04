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

  // Fetch teams the student is part of
  const { data: myTeams } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)

  const myTeamIds = (myTeams || []).map(m => m.team_id)

  let query = supabase
    .from('projects')
    .select('*, supervisor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')

  if (myTeamIds.length > 0) {
    query = query.or(`student_id.eq.${user.id},team_id.in.(${myTeamIds.join(',')})`)
  } else {
    query = query.eq('student_id', user.id)
  }

  const { data: projects } = await query.order('created_at', { ascending: false })

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

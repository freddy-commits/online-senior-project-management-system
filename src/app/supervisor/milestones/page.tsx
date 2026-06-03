import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SupervisorMilestonesClient from '@/components/dashboard/SupervisorMilestonesClient'

export default async function SupervisorMilestonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let enrichedDeliverables: any[] = []

  const { data: projs } = await supabase
    .from('projects')
    .select('id, title')
    .eq('instructor_id', user.id)

  const projectsList = projs || []

  if (projectsList.length > 0) {
    const deliverablesPromises = projectsList.map(async (proj) => {
      const { data: delivs, error } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', proj.id)
        .order('due_date', { ascending: true })
      
      if (error) {
        console.error(`Error fetching deliverables for project ${proj.id}:`, error)
        return []
      }
      
      return (delivs || []).map(d => ({
        ...d,
        projectTitle: proj.title
      }))
    })

    const results = await Promise.all(deliverablesPromises)
    enrichedDeliverables = results.flat()
  }

  console.log('SERVER MILESTONES FETCH:', {
    userId: user.id,
    projectsCount: projectsList.length,
    projectsList,
    delivsCount: enrichedDeliverables.length,
  })

  return <SupervisorMilestonesClient initialDeliverables={enrichedDeliverables} />
}

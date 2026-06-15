import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import SupervisorMilestonesClient from '@/components/dashboard/SupervisorMilestonesClient'

export default async function SupervisorMilestonesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify the user is a supervisor
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'supervisor') {
    redirect('/login')
  }

  let enrichedDeliverables: any[] = []
  const adminClient = createAdminClient()

  const { data: projs } = await adminClient
    .from('projects')
    .select('id, title')
    .eq('instructor_id', user.id)

  const projectsList = projs || []

  if (projectsList.length > 0) {
    const deliverablesPromises = projectsList.map(async (proj: any) => {
      const { data: delivs, error } = await adminClient
        .from('deliverables')
        .select('*')
        .eq('project_id', proj.id)
        .order('due_date', { ascending: true })
      
      if (error) {
        console.error(`Error fetching deliverables for project ${proj.id}:`, error)
        return []
      }
      
      return (delivs || []).map((d: any) => ({
        ...d,
        projectTitle: proj.title
      }))
    })

    const results = await Promise.all(deliverablesPromises)
    enrichedDeliverables = results.flat()
  }

  console.log('SERVER MILESTONES FETCH (ADMIN CLIENT):', {
    userId: user.id,
    projectsCount: projectsList.length,
    projectsList,
    delivsCount: enrichedDeliverables.length,
  })

  return <SupervisorMilestonesClient initialDeliverables={enrichedDeliverables} />
}


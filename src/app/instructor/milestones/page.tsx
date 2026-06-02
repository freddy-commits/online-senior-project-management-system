import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InstructorMilestonesClient from '@/components/dashboard/InstructorMilestonesClient'

export default async function InstructorMilestonesPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Verify the user is an instructor
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'instructor') {
    redirect('/login')
  }

  // Fetch all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name)')
    .order('created_at', { ascending: false })

  const enrichedProjects = projects?.map(p => ({
    ...p,
    origin: p.industry_partner_id ? 'industry' : 'academic'
  })) || []

  // Fetch supervisors
  const { data: supervisors } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'supervisor')

  return (
    <div className="p-8 pb-20">
      <InstructorMilestonesClient 
        initialProjects={enrichedProjects} 
        supervisors={supervisors || []} 
      />
    </div>
  )
}

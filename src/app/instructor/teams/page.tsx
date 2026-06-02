import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InstructorTeamsClient from '@/components/dashboard/InstructorTeamsClient'

export default async function InstructorTeamsPage() {
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

  // Fetch all students (profiles where role = 'student')
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  // Fetch all industry partners / mentors
  const { data: mentors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'industry')
    .order('full_name', { ascending: true })

  // Fetch all projects (including supervisor and partner details)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name, email)')
    .order('created_at', { ascending: false })

  // Fetch all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*, profiles:user_id(id, full_name, email, avatar_url)')

  return (
    <div className="p-8 pb-20">
      <InstructorTeamsClient 
        initialStudents={students || []}
        initialMentors={mentors || []}
        initialProjects={projects || []}
        initialTeams={teams || []}
        initialTeamMembers={teamMembers || []}
      />
    </div>
  )
}

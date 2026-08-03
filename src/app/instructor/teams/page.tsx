import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InstructorTeamsClient from '@/components/dashboard/InstructorTeamsClient'

export default async function InstructorTeamsPage() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Verify the user is an instructor and get their department
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'instructor') {
    redirect('/login')
  }

  const instructorDepartment = profile.department || null

  // Fetch students — filtered by department if the instructor has one set
  let studentsQuery = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  if (instructorDepartment) {
    studentsQuery = studentsQuery.eq('department', instructorDepartment)
  }

  const { data: students } = await studentsQuery

  // Fetch all industry partners / mentors
  const { data: mentors } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'industry')
    .order('full_name', { ascending: true })

  // Fetch projects — filtered to same-department students or department-matched industry problem statements
  let projectsQuery = supabase
    .from('projects')
    .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name, email)')
    .order('created_at', { ascending: false })

  if (instructorDepartment) {
    const studentIds = (students || []).map((s: any) => s.id)
    if (studentIds.length > 0) {
      projectsQuery = projectsQuery.or(`industry_partner_id.not.is.null,student_id.in.(${studentIds.join(',')})`)
    } else {
      projectsQuery = projectsQuery.not('industry_partner_id', 'is', null)
    }
  }

  const { data: projects } = await projectsQuery

  const enrichedProjects = (projects || [])
    .map((p: any) => {
      let targetDept = 'General'
      if (p.description?.includes('Target Department:')) {
        const match = p.description.match(/Target Department:\s*([^|\n]+)/)
        if (match && match[1]) targetDept = match[1].trim()
      }
      return {
        ...p,
        origin: p.industry_partner_id ? 'industry' : 'academic',
        target_department: targetDept
      }
    })
    .filter((p: any) => {
      if (!instructorDepartment) return true
      if (p.origin === 'industry') {
        return p.target_department === instructorDepartment || p.target_department === 'General' || !p.description?.includes('Target Department:')
      }
      return true
    })

  // Fetch all teams
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all team members
  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('*, profiles:user_id(id, full_name, email, avatar_url, department)')

  // Filter teams by the instructor's department
  let filteredTeams = teams || []
  if (instructorDepartment) {
    filteredTeams = (teams || []).filter((team: any) => {
      const members = (teamMembers || []).filter((m: any) => m.team_id === team.id)
      return members.some((m: any) => m.profiles?.department === instructorDepartment)
    })
  }

  return (
    <div className="p-8 pb-20">
      {/* Department badge for the instructor */}
      {instructorDepartment && (
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-black text-indigo-700 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          Showing: {instructorDepartment} Department Only
        </div>
      )}
      <InstructorTeamsClient 
        initialStudents={students || []}
        initialMentors={mentors || []}
        initialProjects={enrichedProjects}
        initialTeams={filteredTeams}
        initialTeamMembers={teamMembers || []}
        instructorDepartment={instructorDepartment || ''}
      />
    </div>
  )
}

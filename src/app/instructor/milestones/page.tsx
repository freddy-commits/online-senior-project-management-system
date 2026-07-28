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

  const instructorDepartment = profile.department || null

  // Fetch students in the same department first (to filter projects)
  let studentIds: string[] = []
  if (instructorDepartment) {
    const { data: deptStudents } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .eq('department', instructorDepartment)
    studentIds = (deptStudents || []).map((s: any) => s.id)
  }

  // Fetch projects — filtered to same-department students if department is set
  let projectsQuery = supabase
    .from('projects')
    .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name)')
    .order('created_at', { ascending: false })

  if (instructorDepartment) {
    if (studentIds.length > 0) {
      projectsQuery = projectsQuery.in('student_id', studentIds)
    } else {
      // No students in this department yet — show empty
      projectsQuery = projectsQuery.eq('student_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  const { data: projects } = await projectsQuery

  const enrichedProjects = projects?.map((p: any) => ({
    ...p,
    origin: p.industry_partner_id ? 'industry' : 'academic'
  })) || []

  // Fetch deliverables for these department projects
  const projectIds = enrichedProjects.map((p: any) => p.id)
  let deliverables: any[] = []
  if (projectIds.length > 0) {
    const { data: delivs } = await supabase
      .from('deliverables')
      .select('*, project:project_id(title)')
      .in('project_id', projectIds)
      .order('due_date', { ascending: true })
    deliverables = delivs || []
  }

  return (
    <div className="p-8 pb-20">
      {/* Department filter notice */}
      {instructorDepartment && (
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-black text-indigo-700 uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
          Dept: {instructorDepartment} — showing department projects only
        </div>
      )}
      <InstructorMilestonesClient 
        initialProjects={enrichedProjects} 
        initialDeliverables={deliverables} 
      />
    </div>
  )
}

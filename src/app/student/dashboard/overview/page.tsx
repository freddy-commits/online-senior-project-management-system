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
    .select('*, supervisor:supervisor_id(full_name, email), partner:partner_id(full_name, email)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 pb-20">
      <StudentDashboardClient initialProfile={profile} initialProjects={projects} />
    </div>
  )
}

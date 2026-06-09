import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InstructorDocumentsClient from '@/components/dashboard/InstructorDocumentsClient'
import { fetchInstructorDocumentsData } from './actions'

export default async function InstructorDocumentsPage() {
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

  // Fetch all projects, deliverables and team members via server-side action bypassing RLS
  const res = await fetchInstructorDocumentsData()

  if (!res.success) {
    console.error("Failed to load instructor documents data:", res.error)
  }

  return (
    <div className="p-8 pb-20">
      <InstructorDocumentsClient 
        initialProjects={res.projects || []}
        initialDeliverables={res.deliverables || []}
        initialTeamMembers={res.teamMembers || []}
      />
    </div>
  )
}

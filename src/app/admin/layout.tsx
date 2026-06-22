import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MasterSidebar from '@/components/layout/MasterSidebar'
import MasterHeader from '@/components/layout/MasterHeader'
import { TrackProvider } from '@/components/providers/TrackProvider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  let hasAccess = false
  if (profile?.role === 'examiner_panel') {
    hasAccess = true
  } else if (profile?.role === 'supervisor' || profile?.role === 'instructor') {
    // Allow access if they are assigned as a panel examiner on any project
    const { data: examinerProjs } = await supabase
      .from('projects')
      .select('id')
      .contains('examiner_panel', [user.id])
      .limit(1)
    if (examinerProjs && examinerProjs.length > 0) {
      hasAccess = true
    }
  }

  if (!hasAccess) {
    redirect(`/${profile?.role === 'industry' ? 'partner' : profile?.role || 'student'}/dashboard`)
  }

  return (
    <TrackProvider>
      <div className="h-screen max-h-screen bg-[#f8fafc] dark:bg-slate-950 flex overflow-hidden font-sans text-slate-900 dark:text-slate-100">
        <MasterSidebar role="examiner_panel" />
        <main className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden relative bg-[#f8fafc] dark:bg-slate-950">
          <MasterHeader role="examiner_panel" />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </TrackProvider>
  )
}

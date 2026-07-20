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

  const adminRoles = ['admin', 'examiner']
  if (!adminRoles.includes(profile?.role ?? '')) {
    const roleRouteMap: Record<string, string> = {
      student: '/student/dashboard',
      instructor: '/instructor/dashboard',
      supervisor: '/supervisor/dashboard',
      industry_partner: '/partner/dashboard',
    }
    redirect(roleRouteMap[profile?.role ?? ''] ?? '/student/dashboard')
  }

  return (
    <TrackProvider>
      <div className="h-screen max-h-screen bg-[#f8fafc] dark:bg-slate-950 flex overflow-hidden font-sans text-slate-900 dark:text-slate-100">
        <MasterSidebar role={profile?.role === 'admin' ? 'admin' : 'examiner'} />
        <main className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden relative bg-[#f8fafc] dark:bg-slate-950">
          <MasterHeader role={profile?.role === 'admin' ? 'admin' : 'examiner'} />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </TrackProvider>
  )
}

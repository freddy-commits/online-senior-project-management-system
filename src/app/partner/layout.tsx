import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnerLayoutClient from '@/components/layout/PartnerLayoutClient'

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'industry_partner') {
    const roleRouteMap: Record<string, string> = {
      student: '/student/dashboard',
      instructor: '/instructor/dashboard',
      supervisor: '/supervisor/dashboard',
      examiner: '/admin/dashboard',
      admin: '/admin/dashboard',
    }
    redirect(roleRouteMap[profile?.role ?? ''] ?? '/student/dashboard')
  }

  return (
    <PartnerLayoutClient initialUserName={profile?.full_name || 'Partner'}>
      {children}
    </PartnerLayoutClient>
  )
}

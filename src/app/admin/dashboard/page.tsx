import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ClipboardCheck, FolderOpen, Settings, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'examiner'].includes(profile.role)) {
    redirect('/student/dashboard')
  }

  // Fetch stats
  const [{ count: pendingCount }, { count: totalUsers }, { count: totalProjects }] = await Promise.all([
    supabase.from('role_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      label: 'Pending Approvals',
      value: pendingCount ?? 0,
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      href: '/admin/approvals',
      urgent: (pendingCount ?? 0) > 0,
    },
    {
      label: 'Total Users',
      value: totalUsers ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      href: null,
    },
    {
      label: 'Total Projects',
      value: totalProjects ?? 0,
      icon: <FolderOpen className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      href: '/admin/projects',
    },
  ]

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4" />
          <span>{profile.role === 'admin' ? 'System Administrator' : 'Examiner Panel'}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Welcome back, {profile.full_name?.split(' ')[0] || 'Admin'} 👋
        </h1>
        <p className="text-sm text-slate-500">{profile.email}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative rounded-2xl border p-5 flex flex-col gap-3 ${stat.color} ${stat.urgent ? 'ring-2 ring-amber-400/40' : ''}`}
          >
            {stat.urgent && (
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shadow-sm">
              {stat.icon}
            </div>
            <div>
              <p className="text-3xl font-black">{stat.value}</p>
              <p className="text-xs font-bold opacity-70 mt-0.5">{stat.label}</p>
            </div>
            {stat.href && (
              <Link
                href={stat.href}
                className="text-[10px] font-extrabold uppercase tracking-wider underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
              >
                View →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/admin/approvals"
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Role Approvals</p>
              <p className="text-xs text-slate-400 font-semibold">
                {(pendingCount ?? 0) > 0
                  ? `${pendingCount} request${(pendingCount ?? 0) > 1 ? 's' : ''} waiting for review`
                  : 'No pending requests'}
              </p>
            </div>
          </Link>

          <Link
            href="/admin/projects"
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">All Projects</p>
              <p className="text-xs text-slate-400 font-semibold">View and manage submitted projects</p>
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Settings</p>
              <p className="text-xs text-slate-400 font-semibold">Manage system configuration</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

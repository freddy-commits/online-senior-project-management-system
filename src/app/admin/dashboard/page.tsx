import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  ClipboardCheck, 
  FolderOpen, 
  Settings, 
  ShieldCheck, 
  Calendar, 
  Mail, 
  Search,
  CheckCircle2,
  ChevronRight
} from 'lucide-react'

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

  // Fetch stats & pending requests
  const [
    { count: pendingCount }, 
    { count: totalUsers }, 
    { count: totalProjects },
    { data: pendingRequests }
  ] = await Promise.all([
    supabase.from('role_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('role_requests').select('*').eq('status', 'pending').limit(3)
  ])

  // Get profile details for pending requests to avoid join issues
  let enrichedRequests: any[] = []
  if (pendingRequests && pendingRequests.length > 0) {
    const userIds = pendingRequests.map(r => r.user_id)
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
      
    enrichedRequests = pendingRequests.map(r => ({
      ...r,
      profile: userProfiles?.find(p => p.id === r.user_id) || null
    }))
  }

  const stats = [
    {
      label: 'Pending Approvals',
      value: pendingCount ?? 0,
      icon: <ClipboardCheck className="w-5 h-5" />,
      color: 'bg-white border-slate-200',
      textVal: 'text-amber-500',
      href: '/admin/approvals',
      urgent: (pendingCount ?? 0) > 0,
    },
    {
      label: 'Total Users',
      value: totalUsers ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-white border-slate-200',
      textVal: 'text-blue-600',
      href: '/admin/users',
    },
    {
      label: 'Total Projects',
      value: totalProjects ?? 0,
      icon: <FolderOpen className="w-5 h-5" />,
      color: 'bg-white border-slate-200',
      textVal: 'text-emerald-600',
      href: '/admin/projects',
    },
  ]

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1)
  const currentDay = 23

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Search & Greeting Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>{profile.role === 'admin' ? 'System Administrator' : 'Examiner Panel'}</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
            Welcome back, {profile.full_name?.split(' ')[0] || 'Admin'}
          </h1>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search resources..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================== LEFT COLUMN (Takes 8 cols) ================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Stats cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`relative rounded-3xl border p-5 flex flex-col gap-3 ${stat.color} hover:shadow-sm transition-all`}
              >
                {stat.urgent && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                )}
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                  {stat.icon}
                </div>
                <div>
                  <p className={`text-3xl font-black ${stat.textVal}`}>{stat.value}</p>
                  <p className="text-xs font-bold text-slate-450 mt-0.5">{stat.label}</p>
                </div>
                {stat.href && (
                  <Link
                    href={stat.href}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    View details <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Performance Graph Section */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">System Project Stages</span>
              <div className="flex gap-4 text-[9px] font-black uppercase">
                <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Academic</span>
                <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Industry</span>
              </div>
            </div>
            <div className="pt-2">
              {/* Custom SVG Bar Chart */}
              <svg className="w-full h-48" viewBox="0 0 400 200" preserveAspectRatio="none">
                <line x1="20" y1="20" x2="380" y2="20" stroke="#f8fafc" strokeWidth="1" />
                <line x1="20" y1="70" x2="380" y2="70" stroke="#f8fafc" strokeWidth="1" />
                <line x1="20" y1="120" x2="380" y2="120" stroke="#f8fafc" strokeWidth="1" />
                <line x1="20" y1="170" x2="380" y2="170" stroke="#e2e8f0" strokeWidth="1.5" />
                
                {/* Propose */}
                <rect x="50" y="60" width="20" height="110" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="50" y="100" width="20" height="70" rx="3" fill="#F59E0B" />
                
                {/* Approve */}
                <rect x="120" y="40" width="20" height="130" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="120" y="80" width="20" height="90" rx="3" fill="#F59E0B" />
                
                {/* Build */}
                <rect x="190" y="80" width="20" height="90" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="190" y="120" width="20" height="50" rx="3" fill="#F59E0B" />
                
                {/* Review */}
                <rect x="260" y="90" width="20" height="80" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="260" y="130" width="20" height="40" rx="3" fill="#F59E0B" />
                
                {/* Defend */}
                <rect x="330" y="110" width="20" height="60" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="330" y="140" width="20" height="30" rx="3" fill="#F59E0B" />

                <text x="60" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Propose</text>
                <text x="130" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Approve</text>
                <text x="200" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Build</text>
                <text x="270" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Review</text>
                <text x="340" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Defend</text>
              </svg>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Quick Actions</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/admin/approvals"
                className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/50 border border-slate-100 hover:border-blue-200 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">Role Approvals</h4>
                  <p className="text-[10px] text-slate-450 font-semibold mt-1">Review pending coordinators and sponsors</p>
                </div>
              </Link>
              <Link
                href="/admin/projects"
                className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/50 border border-slate-100 hover:border-blue-200 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">All Projects</h4>
                  <p className="text-[10px] text-slate-450 font-semibold mt-1">Audit active tracks and final deliverables</p>
                </div>
              </Link>
              <Link
                href="/admin/settings"
                className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/50 border border-slate-100 hover:border-blue-200 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 leading-tight">System Settings</h4>
                  <p className="text-[10px] text-slate-450 font-semibold mt-1">Configure global track schedules and criteria</p>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* ================== RIGHT COLUMN (Takes 4 cols) ================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-[#111827] text-white border border-white/5 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden select-none">
            <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-blue-600/20 blur-2xl rounded-full" />
            
            <div className="relative z-10 text-center space-y-4">
              <div className="w-16 h-16 bg-[#F59E0B] text-[#111827] rounded-2xl flex items-center justify-center mx-auto shadow-md font-black text-xl">
                {profile?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'AD'}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white leading-tight tracking-tight">{profile?.full_name || 'Administrator'}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/10 text-slate-350 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                  {profile?.role === 'admin' ? 'System Administrator' : 'Examiner Panel'}
                </span>
              </div>
            </div>

            <div className="relative z-10 border-t border-white/10 pt-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{profile?.email || 'admin@ueab.ac.ke'}</span>
              </div>
            </div>
          </div>

          {/* CALENDAR CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">July 2026</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
              <span></span><span></span><span></span>
              {daysInMonth.map((day) => {
                const isToday = day === currentDay
                return (
                  <span 
                    key={day} 
                    className={`h-6 w-6 flex items-center justify-center rounded-lg mx-auto ${
                      isToday 
                        ? 'bg-blue-600 text-white font-black shadow-sm' 
                        : 'hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    {day}
                  </span>
                )
              })}
            </div>
          </div>

          {/* PENDING APPROVALS LIST CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-2">
              <span className="text-[10px] font-black text-slate-450 tracking-wider uppercase">Approvals Queue</span>
              <Link href="/admin/approvals" className="text-[10px] font-black text-blue-600 hover:underline uppercase">View All</Link>
            </div>
            
            <div className="space-y-3">
              {enrichedRequests.length > 0 ? (
                enrichedRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                    <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block">
                      {req.requested_role?.replace('_', ' ')}
                    </span>
                    <span className="font-extrabold text-slate-900 text-xs block truncate mt-1">
                      {req.profile?.full_name || 'Anonymous'}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {req.profile?.email || 'No email info'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[10px] font-bold text-slate-400 uppercase">
                  No pending role approvals
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

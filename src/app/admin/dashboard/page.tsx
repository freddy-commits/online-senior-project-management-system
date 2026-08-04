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

  // Redirect Panel Examiners to /admin (which renders the Panel Examiner Evaluation Panel)
  if (profile.role === 'examiner' || profile.role === 'examiner_panel') {
    redirect('/admin')
  }

  // Fetch stats & pending requests
  const [
    { count: pendingCount }, 
    { count: totalUsers }, 
    { count: totalProjects },
    { data: pendingRequests },
    { data: projectsData }
  ] = await Promise.all([
    supabase.from('role_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('role_requests').select('*').eq('status', 'pending').limit(3),
    supabase.from('projects').select('status, industry_partner_id')
  ])

  // Get profile details for pending requests to avoid join issues
  let enrichedRequests: any[] = []
  if (pendingRequests && pendingRequests.length > 0) {
    const userIds = pendingRequests.map(r => r.user_id)
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, department, university_id')
      .in('id', userIds)
      
    enrichedRequests = pendingRequests.map(r => ({
      ...r,
      profile: userProfiles?.find(p => p.id === r.user_id) || null
    }))
  }

  // Calculate project stage counts for Academic vs Industry
  const academicCounts = { pending: 0, approved: 0, build: 0, review: 0, defend: 0 }
  const industryCounts = { pending: 0, approved: 0, build: 0, review: 0, defend: 0 }

  projectsData?.forEach(proj => {
    const isIndustry = !!proj.industry_partner_id
    const target = isIndustry ? industryCounts : academicCounts
    if (proj.status === 'pending') {
      target.pending++
    } else if (proj.status === 'approved') {
      target.approved++
    } else if (proj.status === 'in_progress' || proj.status === 'build') {
      target.build++
    } else if (proj.status === 'review') {
      target.review++
    } else if (proj.status === 'completed' || proj.status === 'defend') {
      target.defend++
    } else {
      target.pending++
    }
  })

  // Find max value to scale heights dynamically
  const maxVal = Math.max(
    ...Object.values(academicCounts),
    ...Object.values(industryCounts),
    1
  )
  const heightScale = 140 / maxVal

  const stages = [
    { label: 'Propose', academic: academicCounts.pending, industry: industryCounts.pending },
    { label: 'Approve', academic: academicCounts.approved, industry: industryCounts.approved },
    { label: 'Build', academic: academicCounts.build, industry: industryCounts.build },
    { label: 'Review', academic: academicCounts.review, industry: industryCounts.review },
    { label: 'Defend', academic: academicCounts.defend, industry: industryCounts.defend },
  ]

  const activeCount = projectsData?.filter(p => p.status !== 'pending' && p.status !== 'rejected').length ?? 0

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
      label: 'Active Projects',
      value: activeCount,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-white border-slate-200',
      textVal: 'text-indigo-650',
      href: '/admin/projects',
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

  // Calculate real Calendar Month & Current Day values
  const today = new Date()
  const monthName = today.toLocaleString('default', { month: 'long' })
  const yearName = today.getFullYear()
  const currentDay = today.getDate()
  const daysCount = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysInMonth = Array.from({ length: daysCount }, (_, i) => i + 1)

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                
                {stages.map((s, idx) => {
                  const xBase = 50 + idx * 70
                  const acadHeight = s.academic * heightScale
                  const indHeight = s.industry * heightScale
                  const acadY = 170 - acadHeight
                  const indY = 170 - indHeight

                  return (
                    <g key={s.label}>
                      {/* Academic Bar (Blue) */}
                      <rect
                        x={xBase}
                        y={acadY}
                        width="14"
                        height={acadHeight}
                        rx="3"
                        fill="#2563eb"
                        opacity="0.85"
                      />
                      {/* Industry Bar (Amber) */}
                      <rect
                        x={xBase + 18}
                        y={indY}
                        width="14"
                        height={indHeight}
                        rx="3"
                        fill="#F59E0B"
                      />
                      <text
                        x={xBase + 16}
                        y="190"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#94a3b8"
                        textAnchor="middle"
                      >
                        {s.label}
                      </text>
                      {/* Show value indicator above bars if any projects exist */}
                      {(s.academic > 0 || s.industry > 0) && (
                        <text
                          x={xBase + 16}
                          y={Math.min(acadY, indY) - 6}
                          fontSize="8"
                          fontWeight="extrabold"
                          fill="#475569"
                          textAnchor="middle"
                        >
                          {s.academic + s.industry}
                        </text>
                      )}
                    </g>
                  )
                })}
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
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden select-none">
            <div className="relative z-10 text-center space-y-3">
              <div className="w-16 h-16 bg-[#F59E0B] text-[#111827] rounded-2xl flex items-center justify-center mx-auto shadow-sm font-black text-xl">
                {profile?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'AD'}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 leading-tight tracking-tight">{profile?.full_name || 'Administrator'}</h3>
                <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                  {profile?.role === 'admin' ? 'System Administrator' : 'Examiner Panel'}
                </span>
              </div>
            </div>

            <div className="relative z-10 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{profile?.email || 'admin@ueab.ac.ke'}</span>
              </div>
            </div>
          </div>

          {/* CALENDAR CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">{monthName} {yearName}</span>
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
                  <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-extrabold text-slate-900 text-xs block truncate max-w-[150px]">
                        {req.profile?.full_name || 'Name not provided'}
                      </span>
                      <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shrink-0">
                        {req.requested_role?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-550 font-semibold space-y-0.5 leading-tight">
                      <span className="block truncate">Email: {req.profile?.email || 'No email info'}</span>
                      {req.profile?.university_id && <span className="block truncate">ID: {req.profile.university_id}</span>}
                      {(req.department || req.profile?.department) && <span className="block truncate">Dept: {req.department || req.profile?.department}</span>}
                    </div>
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

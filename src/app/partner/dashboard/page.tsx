'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Lightbulb, 
  MessageSquare, 
  Target,
  Briefcase,
  Star,
  ChevronRight,
  Plus,
  Users,
  Loader2,
  Megaphone
} from 'lucide-react'

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [totalDeliverables, setTotalDeliverables] = useState(0)
  const [completedDeliverables, setCompletedDeliverables] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (profile?.role !== 'industry') return router.push(`/${profile?.role || ''}`)

      // Fetch projects sponsored/partnered by this industry partner
      const { data: projs } = await supabase
        .from('projects')
        .select('*')
        .eq('industry_partner_id', user.id)
      
      let projsWithProgress = projs || []

      if (projs && projs.length > 0) {
        const projIds = projs.map(p => p.id)
        const { data: delivs } = await supabase
          .from('deliverables')
          .select('id, status, project_id')
          .in('project_id', projIds)
        
        if (delivs) {
          setTotalDeliverables(delivs.length)
          setCompletedDeliverables(delivs.filter(d => d.status === 'graded').length)
          
          projsWithProgress = projs.map(p => {
             const pDelivs = delivs.filter(d => d.project_id === p.id)
             const pCompleted = pDelivs.filter(d => d.status === 'graded').length
             return {
                ...p,
                progress: pDelivs.length > 0 ? Math.round((pCompleted / pDelivs.length) * 100) : 0
             }
          })
        }
      }
      setProjects(projsWithProgress)

      // Fetch unread notifications
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      
      setUnreadNotifs(count || 0)

      // Fetch announcements targeted to industry partners
      const { data: anns } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      setAnnouncements((anns || []).filter((a: any) => a.target_role === 'all' || a.target_role === 'industry'))
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>

  const stats = [
    { label: 'Sponsored Projects', value: projects.length, icon: <Briefcase className="w-5 h-5 text-indigo-600" />, bg: 'bg-indigo-50' },
    { label: 'Total Deliverables', value: totalDeliverables, icon: <Target className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
    { label: 'Completed Milestones', value: completedDeliverables, icon: <Lightbulb className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
    { label: 'Unread Alerts', value: unreadNotifs, icon: <MessageSquare className="w-5 h-5 text-violet-600" />, bg: 'bg-violet-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Industry Hub</h1>
          <p className="text-slate-500">Collaborate with student teams and mentor the next generation of engineers.</p>
        </div>
        <button onClick={() => router.push('/partner/pitch')} className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer text-white">
          <Plus className="w-5 h-5" />
          Submit Problem Statement
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md transition-all shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div className="text-xs font-bold text-emerald-600">+12%</div>
            </div>
            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Partnered Projects */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Star className="w-5 h-5 text-amber-500" />
            Your Partnered Projects
          </h2>
          
          {projects.length > 0 ? projects.map((project: any) => (
            <Link 
              key={project.id} 
              href={`/partner/projects/${project.id}`}
              className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-md transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {project.title[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-2">
                    {project.origin === 'industry' ? '🏢 Industry-Pitched' : '🎓 Student-Initiated'}
                    {project.team_members?.length > 1 ? ` · ${project.team_members.length} team members` : ' · Solo'}
                  </p>
                  {project.progress !== undefined && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                  )}
                </div>
              </div>
              <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            </Link>
          )) : (
            <div className="p-10 border border-dashed border-slate-300 rounded-[2rem] text-center text-slate-500 text-sm bg-white">
              No active project partnerships.
            </div>
          )}
        </div>

        {/* Right Column: Meetings + Announcements */}
        <div className="space-y-6">
          {/* University Announcements */}
          {announcements.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                <Megaphone className="w-5 h-5 text-violet-500" />
                University Announcements
              </h2>
              {announcements.slice(0, 3).map((ann: any) => (
                <div key={ann.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    {ann.is_pinned && <span className="text-[9px] uppercase font-black bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">Pinned</span>}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{ann.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Meetings */}
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Users className="w-5 h-5 text-blue-500" />
            Upcoming Meetings
          </h2>
          <div className="space-y-4">
            {[
              { team: 'Solar Car Team', time: 'Tomorrow at 2:00 PM', topic: 'Battery Design Review' },
              { team: 'AI Health App', time: 'Fri, 15 May at 10:00 AM', topic: 'Data Privacy Consultation' },
            ].map((meeting, i) => (
              <div key={i} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest mb-1">{meeting.time}</div>
                    <h4 className="font-bold text-slate-900">{meeting.team}</h4>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
                </div>
                <p className="text-xs text-slate-500 mb-4">{meeting.topic}</p>
                <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all border border-slate-200 text-slate-700 cursor-pointer">
                  Join Call
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

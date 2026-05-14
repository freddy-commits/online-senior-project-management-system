import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  Building2, 
  Lightbulb, 
  MessageSquare, 
  Target,
  Briefcase,
  Star,
  ChevronRight,
  Plus,
  Users
} from 'lucide-react'

export default async function IndustryDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'industry') return redirect(`/${profile?.role || ''}`)

  // Fetch projects sponsored/partnered by this industry partner
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('industry_partner_id', user.id)

  const stats = [
    { label: 'Sponsored Projects', value: projects?.length || 0, icon: <Briefcase className="w-5 h-5 text-blue-400" /> },
    { label: 'Mentorship Hours', value: '42', icon: <Target className="w-5 h-5 text-indigo-400" /> },
    { label: 'Student Proposals', value: '5', icon: <Lightbulb className="w-5 h-5 text-yellow-400" /> },
    { label: 'New Messages', value: '12', icon: <MessageSquare className="w-5 h-5 text-purple-400" /> },
  ]

  return (
    <DashboardLayout role="industry" userName={profile.full_name || 'Industry Partner'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Industry Hub</h1>
            <p className="text-slate-400">Collaborate with student teams and mentor the next generation of engineers.</p>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all">
            <Plus className="w-5 h-5" />
            Submit Problem Statement
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="text-xs font-bold text-slate-500">+12%</div>
              </div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Partnered Projects */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Your Partnered Projects
            </h2>
            
            {projects && projects.length > 0 ? projects.map((project) => (
              <Link 
                key={project.id} 
                href={`/industry/projects/${project.id}`}
                className="bg-white/5 border border-white/10 rounded-[2rem] p-6 hover:bg-white/[0.07] transition-all flex items-center justify-between group"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                    {project.title[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{project.title}</h3>
                    <p className="text-xs text-slate-500">Student Team: Team Alpha</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </Link>
            )) : (
              <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center text-slate-500 text-sm">
                No active project partnerships.
              </div>
            )}
          </div>

          {/* Mentorship Requests */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Upcoming Meetings
            </h2>
            <div className="space-y-4">
              {[
                { team: 'Solar Car Team', time: 'Tomorrow at 2:00 PM', topic: 'Battery Design Review' },
                { team: 'AI Health App', time: 'Fri, 15 May at 10:00 AM', topic: 'Data Privacy Consultation' },
              ].map((meeting, i) => (
                <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-[2rem]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1">{meeting.time}</div>
                      <h4 className="font-bold text-white">{meeting.team}</h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5" />
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{meeting.topic}</p>
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10">
                    Join Call
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

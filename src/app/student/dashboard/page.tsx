import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnnouncementFeed from '@/components/dashboard/AnnouncementFeed'
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  MessageSquare,
  TrendingUp,
  FolderKanban,
  ChevronRight,
  Sparkles
} from 'lucide-react'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'student') return redirect(`/${profile?.role || ''}`)

  // Fetch student's projects (using the new schema)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, instructor:instructor_id(full_name)')
    .eq('student_id', user.id)

  const stats = [
    { label: 'Active Projects', value: projects?.length || 0, icon: <TrendingUp className="w-5 h-5" />, color: 'blue' },
    { label: 'Milestones Done', value: '12/15', icon: <CheckCircle2 className="w-5 h-5" />, color: 'green' },
    { label: 'Upcoming Deadlines', value: '2', icon: <Clock className="w-5 h-5" />, color: 'yellow' },
    { label: 'Feedback', value: '4 New', icon: <MessageSquare className="w-5 h-5" />, color: 'purple' },
  ]

  // Color tailwind dynamic resolver helpers to avoid static class purges
  const colorMap: any = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative">
        <div className="glow-spot-indigo top-[-100px] left-[-50px] opacity-70" />
        <div>
          <h1 className="text-4xl font-extrabold text-gradient-dark mb-2">Student Workspace</h1>
          <p className="text-slate-500 font-medium text-sm">Welcome back! Let's build something exceptional today.</p>
        </div>
        <Link href="/student/projects/new" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-5 h-5" />
          New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => {
          const colors = colorMap[stat.color] || colorMap.blue
          return (
            <div key={i} className="premium-card rounded-3xl p-6 hover:shadow-xl transition-all">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                <div className={colors.text}>{stat.icon}</div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Project Card */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            Active Projects
          </h2>
          
          {projects && projects.length > 0 ? (
            projects.map((project: any) => (
              <Link 
                key={project.id} 
                href={`/student/projects/${project.id}`}
                className="block premium-card rounded-[2.5rem] p-8 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-100/20 blur-[50px] rounded-full pointer-events-none" />
                <div className="flex items-start justify-between mb-6 relative">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest mb-3">
                      {project.status}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <button className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-2">
                  {project.description || 'No description provided for this project.'}
                </p>
                
                <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-8">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Team</div>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                          U{i}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Instructor</div>
                    <div className="text-sm font-bold text-slate-900 truncate max-w-[120px]" title={project.instructor?.full_name || 'Awaiting Admin Assignment'}>
                      {project.instructor?.full_name || 'Awaiting Admin'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Progress</div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-blue-600 h-full w-[65%]" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-[2rem] p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Projects Found</h3>
              <p className="text-slate-500 text-sm mb-8">You haven't started or joined any senior projects yet.</p>
              <Link href="/student/projects/new" className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl font-bold transition-all inline-block">
                Create First Project
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 shadow-2xl shadow-blue-900/20">
            <h3 className="text-xl font-bold mb-4 text-white">Final Submission</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Your final project report is due in 14 days. Make sure all documentation is ready.
            </p>
            <button className="w-full py-3 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors">
              View Checklist
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <AnnouncementFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

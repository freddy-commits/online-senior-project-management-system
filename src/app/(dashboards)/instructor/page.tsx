'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import Link from 'next/link'
import { 
  Users, 
  BookOpen, 
  CheckSquare, 
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'

export default function InstructorDashboard() {
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

      if (profile?.role !== 'instructor') return router.push(`/${profile?.role || ''}`)

      // Fetch projects assigned to this instructor
      const { data: projs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name)')
        .eq('instructor_id', user.id)
      
      setProjects(projs || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  const pendingApprovals = projects.filter(p => p.status === 'pending')
  const activeProjects = projects.filter(p => p.status === 'approved')

  const stats = [
    { label: 'Assigned Teams', value: projects.length, icon: <Users className="w-5 h-5 text-blue-400" /> },
    { label: 'Awaiting Approval', value: pendingApprovals.length, icon: <Clock className="w-5 h-5 text-yellow-400" /> },
    { label: 'Active Mentorships', value: activeProjects.length, icon: <CheckCircle2 className="w-5 h-5 text-green-400" /> },
    { label: 'Pending Grades', value: '12', icon: <CheckSquare className="w-5 h-5 text-purple-400" /> },
  ]

  return (
    <DashboardLayout role="instructor" userName={userProfile?.full_name}>
      <div className="max-w-7xl mx-auto pb-20">
        
        {/* Urgent Action Banner */}
        {pendingApprovals.length > 0 && (
          <div className="mb-10 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-white">Action Required: {pendingApprovals.length} Project Proposals</h3>
                <p className="text-sm text-slate-400">Review and approve these projects to unlock their milestone submissions.</p>
              </div>
            </div>
            <button className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-xl text-sm hover:bg-yellow-400 transition-all">
              Review Now
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-all">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4">{stat.icon}</div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          {/* Main Table */}
          <section className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Assigned Projects</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input placeholder="Search..." className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-8 py-4">Project / Team</th>
                    <th className="px-8 py-4">Student Lead</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.length > 0 ? projects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <Link href={`/instructor/projects/${project.id}`} className="block group">
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{project.title}</div>
                          <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">ID: {project.id.slice(0,8)}</div>
                        </Link>
                      </td>
                      <td className="px-8 py-6 text-sm text-slate-300 font-medium">{project.student?.full_name}</td>
                      <td className="px-8 py-6">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                          project.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                          project.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <Link 
                          href={`/instructor/projects/${project.id}`}
                          className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-bold transition-all border border-blue-500/20"
                        >
                          {project.status === 'pending' ? 'Review & Approve' : 'Assign Grades'}
                        </Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center text-slate-500 italic">
                        No projects have been assigned to you by the admin yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}

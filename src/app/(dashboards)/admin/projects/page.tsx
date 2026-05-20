'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
import { 
  FolderKanban, 
  Users, 
  UserPlus, 
  Star, 
  Search, 
  CheckCircle, 
  MoreVertical,
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

export default function AdminProjectManagement() {
  const [projects, setProjects] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

      // Fetch all projects with student and instructor names
      const { data: projs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name), instructor:instructor_id(full_name)')
        .order('created_at', { ascending: false })
      
      setProjects(projs || [])

      // Fetch all instructors for the assignment dropdown
      const { data: inst } = await supabase.from('profiles').select('id, full_name').eq('role', 'instructor')
      setInstructors(inst || [])
      
      setLoading(false)
    }
    fetchData()
  }, [])

  async function assignInstructor(projectId: string, instructorId: string) {
    setProcessing(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ instructor_id: instructorId })
      .eq('id', projectId)

    if (error) {
      alert(error.message)
    } else {
      // Refresh list
      const { data } = await supabase.from('projects').select('*, student:student_id(full_name), instructor:instructor_id(full_name)')
      setProjects(data || [])
    }
    setProcessing(null)
  }

  async function toggleRecommendation(projectId: string, currentState: boolean) {
    setProcessing(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ is_recommended: !currentState })
      .eq('id', projectId)

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, is_recommended: !currentState } : p))
    }
    setProcessing(null)
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  return (
    <DashboardLayout role="admin" userName={userProfile.full_name}>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Global Project Control</h1>
            <p className="text-slate-400">Oversee all student projects, assign faculty advisors, and manage industry links.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input placeholder="Search projects or students..." className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm w-80 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                  <th className="px-8 py-5">Project Title</th>
                  <th className="px-8 py-4">Student Lead</th>
                  <th className="px-8 py-4">Assigned Instructor</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {project.is_recommended && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">
                          {project.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-slate-300">{project.student?.full_name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <select 
                          disabled={processing === project.id}
                          value={project.instructor_id || ''}
                          onChange={(e) => assignInstructor(project.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Assign Instructor...</option>
                          {instructors.map(i => (
                            <option key={i.id} value={i.id} className="bg-slate-900">{i.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        project.status === 'approved' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => toggleRecommendation(project.id, project.is_recommended)}
                          className={`p-2 rounded-lg border transition-all ${
                            project.is_recommended 
                            ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400' 
                            : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                          }`}
                          title="Recommend to Industry"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-transparent">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

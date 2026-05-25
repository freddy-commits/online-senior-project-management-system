'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Plus
} from 'lucide-react'

export default function InstructorAllocationPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch projects with student and instructor details
    const { data: projs } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name)')
      .order('created_at', { ascending: false })
    
    setProjects(projs || [])

    // Fetch all instructors
    const { data: inst } = await supabase.from('profiles').select('id, full_name').eq('role', 'instructor')
    setInstructors(inst || [])

    // Fetch students
    const { data: studs } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'student')
    setStudents(studs || [])
    
    setLoading(false)
  }

  async function assignInstructor(projectId: string, instructorId: string) {
    setProcessing(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ instructor_id: instructorId || null })
      .eq('id', projectId)

    if (!error) {
      // Refresh local projects list
      const { data } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name)')
        .order('created_at', { ascending: false })
      setProjects(data || [])
    } else {
      alert(error.message)
    }
    setProcessing(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  const unassignedCount = projects.filter(p => !p.instructor_id).length

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Cohort Roster Allocation</h1>
          <p className="text-slate-400">Match student project proposals with supervisor expertise. Reallocate when workload imbalances occur.</p>
        </div>
        
        <div className="flex gap-4 items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-3 shrink-0">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-white block">{unassignedCount} Projects Unassigned</span>
            <span className="text-slate-500">Awaiting supervisor matching</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Roster list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-base">Project Teams & Mentors</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input placeholder="Search roster..." className="bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-48 text-white" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                    <th className="px-6 py-4">Project Title</th>
                    <th className="px-6 py-4">Lead Student</th>
                    <th className="px-6 py-4">Assigned Supervisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-white text-sm">{p.title}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Status: {p.status}</div>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-300 font-medium">{p.student?.full_name}</td>
                      <td className="px-6 py-5">
                        <select
                          disabled={processing === p.id}
                          value={p.instructor_id || ''}
                          onChange={(e) => assignInstructor(p.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {instructors.map(inst => (
                            <option key={inst.id} value={inst.id} className="bg-slate-900 text-white font-bold">{inst.full_name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Student Roster side column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-xl">
            <h3 className="font-bold text-base mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Student Directory
            </h3>

            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {students.map((student) => {
                const project = projects.find(p => p.student_id === student.id)
                return (
                  <div key={student.id} className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-white truncate">{student.full_name}</div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">{student.email}</div>
                    </div>
                    {project ? (
                      <span className="text-[9px] font-black uppercase text-green-400 bg-green-500/10 px-2 py-0.5 rounded shrink-0">Assigned</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-white/5 px-2 py-0.5 rounded shrink-0">No Project</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

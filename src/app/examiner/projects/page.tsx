'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FolderKanban, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  FileText,
  Users,
  ExternalLink
} from 'lucide-react'

export default function ExaminerProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchAssignedProjects() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: projs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name, email)')
        .order('created_at', { ascending: false })

      const assigned = (projs || []).filter((p: any) => {
        const isAssignedInPanel = p.examiner_panel && Array.isArray(p.examiner_panel) && p.examiner_panel.includes(user.id)
        const isAssignedAsExaminer = p.examiner_id === user.id
        return isAssignedInPanel || isAssignedAsExaminer
      })

      setProjects(assigned)
      setLoading(false)
    }

    fetchAssignedProjects()
  }, [])

  const filtered = projects.filter(p => {
    return !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.student?.department?.toLowerCase().includes(search.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-black text-indigo-700 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            Panel Examiner Access
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assigned Examination Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Projects explicitly allocated to your evaluation panel by the System Administrator.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project title, student, or department..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
        </div>
      </div>

      {/* Projects Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(proj => (
            <div key={proj.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-wider rounded-lg">
                    {proj.student?.department || 'Capstone'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    proj.review_completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {proj.review_completed ? 'Reviewed' : 'Pending Review'}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">{proj.title}</h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3">{proj.description || 'No project abstract available.'}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Student Lead:</span>
                  <span className="font-bold text-slate-900">{proj.student?.full_name || 'Student'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Faculty Advisor:</span>
                  <span className="font-bold text-slate-900">{proj.instructor?.full_name || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-wider space-y-2">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto" />
          <p>No projects assigned to your examination panel yet.</p>
          <p className="text-[10px] text-slate-400 normal-case">The System Administrator allocates projects to panel examiners.</p>
        </div>
      )}
    </div>
  )
}

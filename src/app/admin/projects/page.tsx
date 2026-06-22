'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  ShieldCheck,
  Eye,
  Mail,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminProjectManagement() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [activeMenuProjectId, setActiveMenuProjectId] = useState<string | null>(null)
  const [selectedProjectForView, setSelectedProjectForView] = useState<any | null>(null)
  
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
        .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
        .order('created_at', { ascending: false })
      
      // Filter to keep ONLY projects where this panel member is assigned in examiner_panel
      const filtered = (projs || []).filter((p: any) => 
        p.examiner_panel && Array.isArray(p.examiner_panel) && p.examiner_panel.includes(user.id)
      )
      
      setProjects(filtered)
      setLoading(false)
    }
    fetchData()
  }, [])

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

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Project Allocations</h1>
          <p className="text-slate-600">Oversee student projects and assigned faculty advisors.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input placeholder="Search projects or students..." className="bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm w-80 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-900 placeholder:text-slate-500 shadow-sm" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200">
                <th className="px-8 py-5">Project Title</th>
                <th className="px-8 py-4">Student Lead</th>
                <th className="px-8 py-4">Assigned Instructor</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {projects.map((project: any) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      {project.is_recommended && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-medium text-slate-700">{project.student?.full_name}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-semibold text-slate-700">
                      {project.instructor?.full_name || (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                      project.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => toggleRecommendation(project.id, project.is_recommended)}
                        className={`p-2 rounded-lg border transition-all ${
                          project.is_recommended 
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:shadow-sm'
                        }`}
                        title="Recommend to Industry"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuProjectId(activeMenuProjectId === project.id ? null : project.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>
                        {activeMenuProjectId === project.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenuProjectId(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1.5 overflow-hidden">
                              <button 
                                onClick={() => {
                                  setSelectedProjectForView(project)
                                  setActiveMenuProjectId(null)
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-2 cursor-pointer transition-colors"
                              >
                                <Eye className="w-4 h-4 text-slate-400" />
                                View Details
                              </button>
                              {project.student?.email && (
                                <a 
                                  href={`mailto:${project.student.email}?subject=Project Allocation: ${encodeURIComponent(project.title)}`}
                                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-2 cursor-pointer transition-colors"
                                  onClick={() => setActiveMenuProjectId(null)}
                                >
                                  <Mail className="w-4 h-4 text-slate-400" />
                                  Email Student Lead
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Details Modal */}
      <AnimatePresence>
        {selectedProjectForView && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-start gap-4">
                <div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border mb-2.5 inline-block ${
                    selectedProjectForView.status === 'approved' 
                      ? 'bg-green-50 border-green-100 text-green-700' 
                      : 'bg-yellow-50 border-yellow-100 text-yellow-700'
                  }`}>
                    {selectedProjectForView.status}
                  </span>
                  <h2 className="text-xl font-black text-slate-950 leading-snug">{selectedProjectForView.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedProjectForView(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Description</h4>
                  <p className="text-sm font-semibold text-slate-650 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {selectedProjectForView.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Lead</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-extrabold text-sm">
                        {selectedProjectForView.student?.full_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{selectedProjectForView.student?.full_name || 'N/A'}</div>
                        <div className="text-[10px] font-semibold text-slate-500">{selectedProjectForView.student?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Advisor / Supervisor</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-extrabold text-sm">
                        {selectedProjectForView.instructor?.full_name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{selectedProjectForView.instructor?.full_name || 'Not Assigned'}</div>
                        <div className="text-[10px] font-semibold text-slate-500">{selectedProjectForView.instructor?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  {selectedProjectForView.is_recommended && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-100 text-yellow-700 rounded-xl text-xs font-black uppercase tracking-wider">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Recommended to Industry
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedProjectForView(null)}
                  className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

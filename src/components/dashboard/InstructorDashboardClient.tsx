'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  Check, 
  X, 
  Loader2, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Briefcase,
  AlertCircle
} from 'lucide-react'

type ProjectType = any // we'll use 'any' for now or proper type if defined

export default function InstructorDashboardClient({ 
  initialProjects, 
  supervisors 
}: { 
  initialProjects: ProjectType[], 
  supervisors: any[] 
}) {
  const [activeTab, setActiveTab] = useState<'industry' | 'solo'>('industry')
  const [projects, setProjects] = useState(initialProjects)
  
  // Approval Modal State
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<any>(null)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const supabase = createClient()

  // Filter projects by origin
  const industryProjects = projects.filter(p => p.origin === 'industry')
  const soloProjects = projects.filter(p => p.origin === 'academic')

  // Calculate stats
  const totalTeams = industryProjects.length
  const queueSize = soloProjects.filter(p => p.status === 'pending').length
  const approvals = soloProjects.filter(p => p.status === 'approved').length
  // Dummy milestone data for now
  const milestones = 42

  async function refreshProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:supervisor_id(full_name), partner:partner_id(full_name)')
      .order('created_at', { ascending: false })
    if (data) setProjects(data)
  }

  async function handleApproveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProjectForApproval || !selectedSupervisorId) return
    setProcessing(selectedProjectForApproval.id)

    const { error } = await supabase
      .from('projects')
      .update({
        status: 'approved',
        supervisor_id: selectedSupervisorId
      })
      .eq('id', selectedProjectForApproval.id)

    if (!error) {
      setSuccessMessage(`Project "${selectedProjectForApproval.title}" approved and supervisor assigned!`)
      setTimeout(() => setSuccessMessage(''), 5000)
      await refreshProjects()
      setSelectedProjectForApproval(null)
    } else {
      console.error(error)
    }
    setProcessing(null)
  }

  async function handleRejectProject() {
    if (!selectedProjectForApproval) return
    setProcessing(selectedProjectForApproval.id)

    const { error } = await supabase
      .from('projects')
      .update({
        status: 'rejected'
      })
      .eq('id', selectedProjectForApproval.id)

    if (!error) {
      setSuccessMessage(`Project "${selectedProjectForApproval.title}" was rejected.`)
      setTimeout(() => setSuccessMessage(''), 5000)
      await refreshProjects()
      setSelectedProjectForApproval(null)
    } else {
      console.error(error)
    }
    setProcessing(null)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans">
      
      {successMessage && (
        <div className="fixed top-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center gap-3 z-50 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="space-y-1">
        <span className="text-[10px] font-black text-[#5c3e1c] uppercase tracking-widest block">
          ADVISOR OVERVIEW
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Capstone Management</h1>
      </div>

      {/* Segmented Control */}
      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('industry')}
          className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'industry'
              ? 'bg-[#5c3e1c] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Industry Teams
        </button>
        <button
          onClick={() => setActiveTab('solo')}
          className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === 'solo'
              ? 'bg-[#5c3e1c] text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          Solo Capstones
        </button>
      </div>

      {/* Project Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {activeTab === 'industry' && industryProjects.map((project, idx) => (
            <div key={project.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    TEAM ALPHA-{idx + 1}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                    project.status === 'approved' || project.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {project.status === 'approved' || project.status === 'active' ? 'ACTIVE' : 'PENDING'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{project.title}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Sponsor: {project.partner?.full_name || 'Pending Partner'}
                  </p>
                </div>
              </div>

              <div className="p-5 border-t border-slate-50 bg-slate-50/50 space-y-3">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-slate-500">Liaison Feedback</span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> RECEIVED
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-900 h-full w-[65%]" />
                  </div>
                  <span className="text-[10px] font-black text-slate-900">65%</span>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'solo' && soloProjects.map((project) => (
            <div key={project.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {project.student?.full_name || 'Unknown Student'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                    project.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    project.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2" title={project.title}>
                    {project.title}
                  </h3>
                  {project.status === 'approved' && project.supervisor && (
                    <p className="text-xs font-semibold text-emerald-700 mt-2 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      {project.supervisor.full_name}
                    </p>
                  )}
                </div>
              </div>

              {project.status === 'pending' && (
                <div className="p-4 border-t border-slate-50 bg-indigo-50/30">
                  <button
                    onClick={() => {
                      setSelectedProjectForApproval(project)
                      setSelectedSupervisorId('')
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm"
                  >
                    Review Proposal
                  </button>
                </div>
              )}
            </div>
          ))}

          {((activeTab === 'industry' && industryProjects.length === 0) || (activeTab === 'solo' && soloProjects.length === 0)) && (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-dashed border-slate-200">
              No projects found for this track.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Teams</span>
          <span className="text-3xl font-black text-slate-900">{totalTeams}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Queue Size</span>
          <span className="text-3xl font-black text-red-600">{queueSize < 10 ? `0${queueSize}` : queueSize}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Milestones</span>
          <span className="text-3xl font-black text-slate-900">{milestones}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Approvals</span>
          <span className="text-3xl font-black text-slate-900">{approvals}</span>
        </div>
      </div>

      {/* Slide-over Approval Modal */}
      <AnimatePresence>
        {selectedProjectForApproval && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProjectForApproval(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Review Capstone</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1">
                    {selectedProjectForApproval.student?.full_name || 'Student Proposal'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedProjectForApproval(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-300"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-900 mb-2">Project Description</h4>
                  <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap">
                    {selectedProjectForApproval.description}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
                    Assign Supervisor
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed font-semibold">
                    Select a faculty supervisor to mentor this student's Capstone project.
                  </p>
                  
                  <select
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">Choose Supervisor...</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id} className="text-slate-800 font-bold bg-white">
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedProjectForApproval(null)}
                  className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectProject}
                  disabled={processing === selectedProjectForApproval.id}
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={handleApproveProject}
                  disabled={processing === selectedProjectForApproval.id || !selectedSupervisorId}
                  className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing === selectedProjectForApproval.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve & Assign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

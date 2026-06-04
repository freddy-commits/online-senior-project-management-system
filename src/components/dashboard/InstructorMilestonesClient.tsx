'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useTrack } from '@/components/providers/TrackProvider'
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
  AlertCircle,
  UserCheck
} from 'lucide-react'

type ProjectType = any

export default function InstructorMilestonesClient({ 
  initialProjects, 
  supervisors 
}: { 
  initialProjects: ProjectType[], 
  supervisors: any[] 
}) {
  const { trackMode } = useTrack()
  const isCapstone = trackMode === 'thesis' || trackMode === 'advisor' || trackMode === 'supervisor' || trackMode === 'panel'
  const activeTab = isCapstone ? 'solo' : 'industry'

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

  async function refreshProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name)')
      .order('created_at', { ascending: false })
    if (data) {
      const enriched = data.map((p: any) => ({
        ...p,
        origin: p.industry_partner_id ? 'industry' : 'academic'
      }))
      setProjects(enriched)
    }
  }

  async function handleApproveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProjectForApproval || !selectedSupervisorId) return
    setProcessing(selectedProjectForApproval.id)

    try {
      const res = await fetch('/api/projects/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectForApproval.id,
          supervisorId: selectedSupervisorId,
          action: 'approve'
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to approve project.')
      }

      setSuccessMessage(`Project "${selectedProjectForApproval.title}" approved and supervisor assigned!`)
      setTimeout(() => setSuccessMessage(''), 5000)
      await refreshProjects()
      setSelectedProjectForApproval(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'An error occurred during project approval.')
    } finally {
      setProcessing(null)
    }
  }

  async function handleRejectProject() {
    if (!selectedProjectForApproval) return
    setProcessing(selectedProjectForApproval.id)

    try {
      const res = await fetch('/api/projects/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectForApproval.id,
          action: 'reject'
        })
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to reject project.')
      }

      setSuccessMessage(`Project "${selectedProjectForApproval.title}" was rejected.`)
      setTimeout(() => setSuccessMessage(''), 5000)
      await refreshProjects()
      setSelectedProjectForApproval(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'An error occurred during project rejection.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans">
      
      {successMessage && (
        <div className="fixed top-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center gap-3 z-50 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Top Academic Management Navigation bar (Simplified) */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 pb-4 gap-4 mt-2">
        <div className="flex items-center gap-8 text-xs font-extrabold uppercase tracking-widest">
          <span className="text-[#3b2b1a] border-b-2 border-[#d97706] pb-4 -mb-4 cursor-default">Academic Management System</span>
        </div>
      </div>

      {/* Workspace Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-200/80 rounded-[2rem] p-8 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 leading-tight">Workspace Overview</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
            Managing {industryProjects.length} active undergraduate teams and {soloProjects.length} senior solo projects.
          </p>
        </div>
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
          {activeTab === 'industry' && industryProjects.map((project, idx) => {
            const progress = idx === 0 ? 65 : idx === 1 ? 32 : 89
            
            return (
              <div key={project.id} className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col p-6 space-y-5 justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-0.5">
                      Team Alpha-{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100/50 shrink-0">
                      INDUSTRY TRACK
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#d97706] shrink-0" />
                      {project.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1.5 pl-6">
                      Sponsor: {project.partner?.full_name || 'Pending Partner'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Overall Progress</span>
                      <span className="text-emerald-600 font-extrabold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Dynamic notification badge */}
                  {progress < 40 ? (
                    <div className="bg-orange-50 border border-orange-100 text-orange-700 rounded-xl px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Review Meeting Scheduled
                    </div>
                  ) : progress < 80 ? (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Liaison Feedback
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-2.5 text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Final Milestone Approved
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {project.instructor_id ? (
                    <button className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                      View Report
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setSelectedProjectForApproval(project)
                        setSelectedSupervisorId('')
                      }}
                      className="w-full py-3 bg-[#451a03] hover:bg-[#321201] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Assign Advisor
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {activeTab === 'solo' && soloProjects.map((project) => (
            <div key={project.id} className="bg-white border border-slate-200/80 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col p-6 space-y-5 justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-0.5 truncate max-w-[150px]" title={project.student?.full_name || 'Solo Student'}>
                    {project.student?.full_name || 'Solo Student'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100/50 shrink-0">
                    CAPSTONE TRACK
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2" title={project.title}>
                    {project.title}
                  </h3>
                  {project.status === 'approved' && project.supervisor && (
                    <p className="text-xs font-semibold text-emerald-700 mt-3 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Supervisor: {project.supervisor.full_name}
                    </p>
                  )}
                  {project.status === 'pending' && (
                    <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg w-fit mt-3 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting Allocation
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                {project.status === 'pending' ? (
                  <button
                    onClick={() => {
                      setSelectedProjectForApproval(project)
                      setSelectedSupervisorId('')
                    }}
                    className="w-full py-3 bg-[#451a03] hover:bg-[#321201] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Assign Supervisor
                  </button>
                ) : (
                  <button className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}

          {((activeTab === 'industry' && industryProjects.length === 0) || (activeTab === 'solo' && soloProjects.length === 0)) && (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm font-bold bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-inner">
              No projects found for this track.
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Academic Cycle Milestones section */}
      <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Academic Cycle Milestones</h3>
        <div className="relative pl-8 border-l border-slate-200 space-y-8 ml-3 py-2">
          
          {/* Milestone 1: Proposal Submission Phase */}
          <div className="relative">
            <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-800">Proposal Submission Phase</h4>
              <p className="text-[10px] text-slate-500 font-semibold">Closed September 15th</p>
            </div>
          </div>

          {/* Milestone 2: Initial Faculty Review */}
          <div className="relative">
            <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-emerald-500 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-emerald-800">Initial Faculty Review</h4>
              <p className="text-[10px] text-emerald-600/80 font-bold">In Progress (Ends Oct 30th)</p>
            </div>
          </div>

          {/* Milestone 3: Mid-Term Presentations */}
          <div className="relative">
            <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-white border-4 border-slate-200 shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-400">Mid-Term Presentations</h4>
              <p className="text-[10px] text-slate-400 font-semibold">Upcoming (Dec 12th - 15th)</p>
            </div>
          </div>

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
                  <h3 className="text-lg font-black text-slate-900">Review Proposal</h3>
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
                  className="flex-[2] py-3 bg-[#451a03] hover:bg-[#321201] disabled:opacity-50 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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

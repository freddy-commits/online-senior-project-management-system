'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Send, 
  Search, 
  ChevronRight, 
  FileText, 
  MessageSquare,
  Building,
  GraduationCap
} from 'lucide-react'

export default function SupervisorDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadSupervisorData()
  }, [])

  async function loadSupervisorData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || 'demo-supervisor-id'

      // Fetch projects assigned to this supervisor
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('supervisor_id', userId)

      setProjects(projectsData || [])

      if (projectsData && projectsData.length > 0) {
        // Default to select first project if none selected yet
        const initialProj = selectedProject 
          ? projectsData.find((p: any) => p.id === selectedProject.id) || projectsData[0]
          : projectsData[0]
        
        handleSelectProject(initialProj)
      } else {
        setSelectedProject(null)
        setDeliverables([])
      }
    } catch (e) {
      console.error('Error loading supervisor data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectProject(proj: any) {
    setSelectedProject(proj)
    setReviewFeedback('')
    try {
      const { data: deliverablesData } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', proj.id)
        .order('due_date', { ascending: true })
      
      setDeliverables(deliverablesData || [])
    } catch (e) {
      console.error('Error fetching deliverables for supervisor:', e)
    }
  }

  const handleReviewAction = async (deliverableId: string, action: 'send_to_partner' | 'complete_academic' | 'complete_sponsored') => {
    try {
      setActionLoading(true)

      let nextStatus = 'completed'
      if (action === 'send_to_partner') {
        nextStatus = 'awaiting_partner'
      }

      // Update deliverable status and feedback
      await supabase
        .from('deliverables')
        .update({
          status: nextStatus,
          feedback_supervisor: reviewFeedback.trim() ? reviewFeedback : 'Approved by Academic Supervisor.'
        })
        .eq('id', deliverableId)

      // Sync and reload
      setReviewFeedback('')
      await loadSupervisorData()
    } catch (e) {
      console.error('Error executing supervisor review action:', e)
    } finally {
      setActionLoading(false)
    }
  }

  // Filter projects by search term
  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Metrics
  const activeStudentsCount = projects.length
  const pendingReviewsCount = deliverables.filter(d => d.status === 'submitted' || d.status === 'partner_approved').length
  const completedMilestonesCount = deliverables.filter(d => d.status === 'completed').length

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading supervision console...</p>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    todo: { label: 'To Do', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-800' },
    submitted: { label: 'Pending Review', bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/20' },
    awaiting_partner: { label: 'Awaiting Sponsor Sign-off', bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/20' },
    partner_approved: { label: 'Sponsor Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    completed: { label: 'Completed', bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/20' }
  }

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      
      {/* 1. HEADER SECTION */}
      <div>
        <span className="text-amber-500 text-xs font-black uppercase tracking-widest block mb-1">
          Faculty Mentorship Console
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
          Supervision Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">
          Manage your assigned graduating students, review deliverable timeline completions, and authorize dual-track milestone sign-offs.
        </p>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 text-violet-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Assigned Students
          </div>
          <div className="text-3xl font-black text-white mt-2">{activeStudentsCount}</div>
          <div className="text-xs text-slate-400 mt-2">Active graduation tracks</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16 text-blue-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Pending Actions
          </div>
          <div className="text-3xl font-black text-white mt-2">{pendingReviewsCount}</div>
          <div className="text-xs text-slate-400 mt-2">Milestones awaiting review</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Completed Milestones
          </div>
          <div className="text-3xl font-black text-white mt-2">{completedMilestonesCount}</div>
          <div className="text-xs text-slate-400 mt-2">Authorized closures</div>
        </div>
      </div>

      {/* 3. CORE PANEL GRID */}
      {projects.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-12 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-extrabold text-white">No Assigned Students</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
            You do not have any final-year students mapped to your mentorship account at this time. Please contact the course coordinator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* STUDENT SEARCH & LIST SELECTOR (1 Column) */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students..."
                className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-all font-semibold"
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {filteredProjects.map((p) => {
                const isSelected = selectedProject?.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProject(p)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-md ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-700/80' 
                        : 'bg-slate-900/20 border-slate-800/60 hover:bg-slate-900/40 hover:border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                        {p.partner_id ? '🏢 Sponsored Capstone' : '🎓 Academic Capstone'}
                      </div>
                      <div className="font-extrabold text-white text-sm mt-0.5 truncate">
                        {p.student?.full_name || 'Alex Carter'}
                      </div>
                      <div className="text-xs text-slate-400 truncate mt-1 leading-tight">
                        {p.title}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-violet-400 translate-x-1' : 'text-slate-600'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* ACTIVE STUDENT MILESTONES ACTIONS (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProject ? (
              <div className="space-y-6">
                
                {/* Selected Student Meta Panel */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                      Active Mentored Capstone
                    </span>
                    <h2 className="text-xl font-black text-white mt-1 leading-tight">
                      {selectedProject.title}
                    </h2>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Student: <span className="text-slate-200 font-bold">{selectedProject.student?.full_name || 'Alex Carter'}</span> ({selectedProject.student?.email || 'student@university.edu'})
                    </p>
                  </div>
                  {selectedProject.final_grade && (
                    <div className="px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-center self-start sm:self-center shrink-0">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Final Course Grade</div>
                      <div className="text-lg font-black text-violet-400 mt-0.5">{selectedProject.final_grade}</div>
                    </div>
                  )}
                </div>

                {/* Deliverables List for this student */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Graduation Compliance Checklist
                  </h3>

                  {deliverables.map((deliv) => {
                    const status = statusConfig[deliv.status] || statusConfig.todo
                    
                    // Flags for active review buttons
                    // 1. Internal Academic project: student submits -> supervisor reviews & completes directly
                    const isAcademicReviewable = !selectedProject.partner_id && deliv.status === 'submitted'
                    // 2. Sponsored project stage 1: student submits -> supervisor reviews & sends to partner
                    const isSponsoredReviewable = selectedProject.partner_id && deliv.status === 'submitted'
                    // 3. Sponsored project stage 2: partner approves -> supervisor confirms & closes
                    const isSponsoredCloseable = selectedProject.partner_id && deliv.status === 'partner_approved'

                    return (
                      <div 
                        key={deliv.id}
                        className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 hover:border-slate-850 transition-all shadow-xl backdrop-blur-sm"
                      >
                        {/* Header details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/40 pb-4 mb-4">
                          <div>
                            <h4 className="font-extrabold text-white text-base leading-snug">
                              {deliv.title}
                            </h4>
                            <p className="text-slate-400 text-xs mt-1">
                              {deliv.description}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider ${status.bg} ${status.text} border ${status.border} rounded-full self-start sm:self-center shrink-0`}>
                            {status.label}
                          </span>
                        </div>

                        {/* Submission Link */}
                        {deliv.submission_url ? (
                          <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/50 mb-4 text-xs">
                            <span className="text-slate-400 font-bold truncate max-w-[250px]">
                              Submission: <a href={deliv.submission_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">{deliv.submission_url}</a>
                            </span>
                            <a 
                              href={deliv.submission_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold rounded-lg border border-slate-800 hover:border-slate-700/60 transition-all flex items-center gap-1.5"
                            >
                              Open Link
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs italic mb-4 leading-relaxed">
                            No upload submitted by student yet.
                          </div>
                        )}

                        {/* Existing Feedbacks */}
                        {(deliv.feedback_supervisor || deliv.feedback_partner) && (
                          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850/50 space-y-3 mb-4 text-xs font-semibold">
                            {deliv.feedback_supervisor && (
                              <div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                  Your Supervision Feedback
                                </div>
                                <p className="text-slate-300 text-xs italic mt-1 leading-relaxed">
                                  &ldquo;{deliv.feedback_supervisor}&rdquo;
                                </p>
                              </div>
                            )}
                            {deliv.feedback_partner && (
                              <div className="pt-2 border-t border-slate-900">
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                  Industry Partner Feedback
                                </div>
                                <p className="text-slate-300 text-xs italic mt-1 leading-relaxed">
                                  &ldquo;{deliv.feedback_partner}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Interactive Review Drawer */}
                        {(isAcademicReviewable || isSponsoredReviewable || isSponsoredCloseable) && (
                          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 mt-4 space-y-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                                Supervision Assessment Comments
                              </label>
                              <textarea
                                rows={2}
                                value={reviewFeedback}
                                onChange={(e) => setReviewFeedback(e.target.value)}
                                placeholder="Enter structural vetting notes, codebase assessments, or revision specifications..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 text-xs focus:outline-none focus:border-violet-500 transition-all font-semibold"
                              />
                            </div>

                            <div className="flex justify-end gap-3">
                              {isAcademicReviewable && (
                                <button
                                  onClick={() => handleReviewAction(deliv.id, 'complete_academic')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 cursor-pointer transition-all"
                                >
                                  Approve &amp; Mark Completed
                                </button>
                              )}

                              {isSponsoredReviewable && (
                                <button
                                  onClick={() => handleReviewAction(deliv.id, 'send_to_partner')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 cursor-pointer transition-all"
                                >
                                  Approve &amp; Route to Partner
                                </button>
                              )}

                              {isSponsoredCloseable && (
                                <button
                                  onClick={() => handleReviewAction(deliv.id, 'complete_sponsored')}
                                  disabled={actionLoading}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 cursor-pointer transition-all"
                                >
                                  Confirm Partner Sign-off &amp; Close Milestone
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>
            ) : (
              <div className="py-20 text-center bg-slate-900/20 border border-slate-800/60 rounded-[2.5rem] shadow-xl">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">Select a mentored student to begin review compliance checks.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

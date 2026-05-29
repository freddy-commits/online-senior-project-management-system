'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  Plus, 
  Users,
  Briefcase,
  ChevronRight,
  User,
  Sparkles
} from 'lucide-react'

export default function PartnerDashboard() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerFeedback, setPartnerFeedback] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [pitchTitle, setPitchTitle] = useState('')
  const [pitchDesc, setPitchDesc] = useState('')
  const [pitchLoading, setPitchLoading] = useState(false)
  const [showPitchForm, setShowPitchForm] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadPartnerData()
  }, [])

  async function loadPartnerData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || 'demo-partner-id'

      // Fetch projects sponsored by this industry partner
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('partner_id', userId)

      setProjects(projectsData || [])

      if (projectsData && projectsData.length > 0) {
        const initialProj = selectedProject
          ? projectsData.find((p: any) => p.id === selectedProject.id) || projectsData[0]
          : projectsData[0]
        
        handleSelectProject(initialProj)
      } else {
        setSelectedProject(null)
        setDeliverables([])
      }
    } catch (e) {
      console.error('Error loading partner data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectProject(proj: any) {
    setSelectedProject(proj)
    setPartnerFeedback('')
    try {
      const { data: deliverablesData } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', proj.id)
        .order('due_date', { ascending: true })
      
      setDeliverables(deliverablesData || [])
    } catch (e) {
      console.error('Error fetching deliverables for partner:', e)
    }
  }

  const handlePartnerSignOff = async (deliverableId: string) => {
    try {
      setActionLoading(true)
      
      // Update deliverable status to partner_approved and write partner feedback
      await supabase
        .from('deliverables')
        .update({
          status: 'partner_approved',
          feedback_partner: partnerFeedback.trim() ? partnerFeedback : 'Milestone signed off by Industry Partner.'
        })
        .eq('id', deliverableId)

      setPartnerFeedback('')
      await loadPartnerData()
      alert('Milestone sign-off committed successfully!')
    } catch (e) {
      console.error('Error executing partner sign-off:', e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleProposeProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pitchTitle.trim() || !pitchDesc.trim()) return

    try {
      setPitchLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || 'demo-partner-id'

      const newProj = {
        title: pitchTitle,
        description: pitchDesc,
        student_id: 'demo-student-id', // auto map default student Alex Carter for sandbox testing
        supervisor_id: 'demo-supervisor-id', // auto map default supervisor
        partner_id: userId,
        status: 'pending',
        origin: 'industry',
        final_grade: null
      }

      await supabase.from('projects').insert(newProj)

      // Seed default deliverables for the new industry project
      const projectsRes = await supabase.from('projects').select('*').eq('partner_id', userId)
      const freshProj = projectsRes.data?.[projectsRes.data.length - 1]

      if (freshProj) {
        const defaultDelivs = [
          {
            project_id: freshProj.id,
            title: 'Project Proposal',
            description: 'Initial project scope, requirements, and tech stack options.',
            status: 'todo',
            due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            project_id: freshProj.id,
            title: 'System Architecture & Design',
            description: 'Detailed data model diagrams, API specifications, and infrastructure layouts.',
            status: 'todo',
            due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            project_id: freshProj.id,
            title: 'Final Report & Code Submission',
            description: 'Production-ready codebase repository URL, developer guidelines, and final slide decks.',
            status: 'todo',
            due_date: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
        await supabase.from('deliverables').insert(defaultDelivs)
      }

      setPitchTitle('')
      setPitchDesc('')
      setShowPitchForm(false)
      await loadPartnerData()
      alert('Industry project proposal pitched successfully!')
    } catch (e) {
      console.error('Error proposing industry project:', e)
    } finally {
      setPitchLoading(false)
    }
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading industry portal...</p>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    todo: { label: 'To Do', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-800' },
    submitted: { label: 'Supervisor Vetting', bg: 'bg-blue-500/10', text: 'text-blue-300', border: 'border-blue-500/20' },
    awaiting_partner: { label: 'Action Required: Partner Sign-off', bg: 'bg-indigo-500/20 text-white animate-pulse', text: 'text-indigo-300', border: 'border-indigo-500/40' },
    partner_approved: { label: 'Partner Approved', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    completed: { label: 'Completed', bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/20' }
  }

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-indigo-400 text-xs font-black uppercase tracking-widest block mb-1">
            Industry Collaboration Office
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Sponsor Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">
            Submit new industry-sponsored capstone topics, review the deliverables timeline of sponsored students, and authorize level-1 sponsor approvals.
          </p>
        </div>

        {!showPitchForm ? (
          <button 
            onClick={() => setShowPitchForm(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-xl shadow-violet-500/10 transition-all active:scale-[0.98] uppercase tracking-wider text-xs inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Propose Sponsored Topic
          </button>
        ) : (
          <button 
            onClick={() => setShowPitchForm(false)}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 border border-slate-800"
          >
            Show Dashboard
          </button>
        )}
      </div>

      {/* 2. PROPOSAL PITCH FORM OVERLAY / VIEW */}
      {showPitchForm ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[100px] rounded-full" />
          
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
            <Building className="w-7 h-7 text-indigo-400" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Propose Sponsored Capstone Topic
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed mb-8">
            Define requirements, objectives, and technology stack outlines. Once vetting is complete, the course coordinator will assign a graduating senior to this project.
          </p>

          <form onSubmit={handleProposeProject} className="space-y-5 text-left bg-slate-950/60 p-6 rounded-3xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Capstone Project Title</label>
              <input 
                value={pitchTitle}
                onChange={(e) => setPitchTitle(e.target.value)}
                placeholder="e.g. Real-Time Distributed Data Sync Engine"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2 ml-1">Project Outline &amp; Industry Requirements</label>
              <textarea 
                rows={4}
                value={pitchDesc}
                onChange={(e) => setPitchDesc(e.target.value)}
                placeholder="Outline project constraints, cloud service options, and milestones expectations..."
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button 
                type="button" 
                onClick={() => setShowPitchForm(false)}
                className="w-1/2 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={pitchLoading}
                className="w-1/2 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/15 transition-all"
              >
                {pitchLoading ? 'Submitting...' : 'Pitch Sponsored Topic'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SPONSORED STUDENTS LIST COLUMN */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Sponsored Student Projects
            </h2>

            {projects.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 text-center text-xs text-slate-500">
                You do not have any active sponsored projects assigned to graduating students yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {projects.map((p) => {
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
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-violet-400" />
                          Student Assigned
                        </div>
                        <div className="font-extrabold text-white text-sm mt-0.5 truncate">
                          {p.student?.full_name || 'Alex Carter'}
                        </div>
                        <div className="text-xs text-slate-400 truncate mt-1 leading-tight">
                          {p.title}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-600'}`} />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* SPONSORED WORKSPACE ACTIONS (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProject ? (
              <div className="space-y-6">
                
                {/* Active sponsored details */}
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                    Active Sponsored Milestone Review
                  </span>
                  <h2 className="text-xl font-black text-white mt-1 leading-tight">
                    {selectedProject.title}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Student dev: <span className="text-slate-200 font-bold">{selectedProject.student?.full_name || 'Alex Carter'}</span> | Supervisor: {selectedProject.profiles?.full_name || 'Dr. Robert Miller'}
                  </p>
                </div>

                {/* Milestone submissions status timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Sponsorship Milestone Review Queue
                  </h3>

                  {deliverables.map((deliv) => {
                    const status = statusConfig[deliv.status] || statusConfig.todo
                    const isSignOffRequired = deliv.status === 'awaiting_partner'

                    return (
                      <div 
                        key={deliv.id}
                        className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 shadow-xl backdrop-blur-sm hover:border-slate-850 transition-all"
                      >
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

                        {/* Submission Link Info */}
                        {deliv.submission_url ? (
                          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 mb-4 text-xs">
                            <span className="text-slate-400 font-bold truncate max-w-[250px]">
                              Repo/Docs: <a href={deliv.submission_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{deliv.submission_url}</a>
                            </span>
                            <a 
                              href={deliv.submission_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold rounded-lg border border-slate-800 hover:border-slate-700/60 transition-all flex items-center gap-1.5"
                            >
                              Inspect Source
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            </a>
                          </div>
                        ) : (
                          <div className="text-slate-500 text-xs italic mb-4 leading-relaxed">
                            No student upload available yet.
                          </div>
                        )}

                        {/* Feedbacks */}
                        {(deliv.feedback_supervisor || deliv.feedback_partner) && (
                          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850/50 space-y-3 mb-4 text-xs font-semibold">
                            {deliv.feedback_supervisor && (
                              <div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                  Academic Supervisor Remarks
                                </div>
                                <p className="text-slate-300 text-xs italic mt-1 leading-relaxed">
                                  &ldquo;{deliv.feedback_supervisor}&rdquo;
                                </p>
                              </div>
                            )}
                            {deliv.feedback_partner && (
                              <div className="pt-2 border-t border-slate-900">
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                                  Your Partner Assessment Comments
                                </div>
                                <p className="text-slate-300 text-xs italic mt-1 leading-relaxed">
                                  &ldquo;{deliv.feedback_partner}&rdquo;
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action sign-off panel */}
                        {isSignOffRequired && (
                          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mt-4 space-y-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                                Optional Partner Vetting Assessment
                              </label>
                              <textarea
                                rows={2}
                                value={partnerFeedback}
                                onChange={(e) => setPartnerFeedback(e.target.value)}
                                placeholder="Enter structural notes, sponsor sign-off reviews, or mentorship comments..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-all font-semibold"
                              />
                            </div>

                            <div className="flex justify-end">
                              <button
                                onClick={() => handlePartnerSignOff(deliv.id)}
                                disabled={actionLoading}
                                className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/15 cursor-pointer transition-all active:scale-95"
                              >
                                Sign-off Sponsored Milestone
                              </button>
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
                <p className="text-xs text-slate-500 font-bold">Select a sponsored student project to begin milestones evaluations.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

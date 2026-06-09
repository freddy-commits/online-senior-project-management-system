'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useTrack } from '@/components/providers/TrackProvider'
import { seedDeliverables, addCustomMilestone, submitDeliverable, getDeliverables, getStudentProjects } from './actions'
import { 
  Calendar, 
  Check, 
  Clock, 
  AlertCircle, 
  Upload, 
  ChevronRight,
  ExternalLink,
  Lock,
  Download,
  Plus,
  RefreshCw,
  FileText,
  Sparkles,
  GitBranch,
  CloudUpload,
  CheckCircle2,
  Trash2,
  X
} from 'lucide-react'

const getMilestoneDescription = (title: string): string => {
  const descMap: Record<string, string> = {
    'Project Proposal': 'Detailed research scope, timeline, risk mitigation plans, and software architecture diagrams.',
    'Initial Architecture & Schema': 'Define the application database modeling, entity relationship diagram, and API interface specifications.',
    'Mid-Term Presentation': 'Status report on baseline execution, initial results telemetry, and frontend/backend integration status.',
    'Final Execution & Thesis': 'Final code repository release, user evaluation validation reports, and the printed thesis defense draft.',
    'Project Pitch & Scoping': 'Aligning with the industry mentor on team expectations, technical stack requirements, and MVP objectives.',
    'System Architecture Diagram': 'Documenting application infrastructure, cloud service endpoints, data schemas, and API routes.',
    'Beta Demo & Testing': 'Deploying the interactive application build, executing end-to-end integration tests, and collecting partner telemetry.',
    'Final Client Deliverables': 'Handing over administrative control settings, final production build artifacts, and client handover presentations.'
  }
  return descMap[title] || 'No description provided.'
}

export default function StudentMilestonesPage() {
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Upload Portal Simulator State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('')
  const [repoUrl, setRepoUrl] = useState('https://github.com/alexcarter/ai-healthcare-dashboard')
  const [isSyncingRepo, setIsSyncingRepo] = useState(false)
  const [successToast, setSuccessToast] = useState<string>('')

  // Add Milestone Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [hasLocalDraft, setHasLocalDraft] = useState(false)

  useEffect(() => {
    if (isAddModalOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('seniorproj_milestone_draft')
      setHasLocalDraft(!!saved)
    }
  }, [isAddModalOpen])

  const loadLocalDraft = () => {
    const saved = localStorage.getItem('seniorproj_milestone_draft')
    if (saved) {
      try {
        const { title, description, dueDate } = JSON.parse(saved)
        setNewTitle(title || '')
        setNewDescription(description || '')
        setNewDueDate(dueDate || '')
        showToast('Draft milestone loaded from local storage!')
      } catch (e) {
        console.error(e)
      }
    }
  }

  const saveLocalDraft = () => {
    localStorage.setItem('seniorproj_milestone_draft', JSON.stringify({
      title: newTitle,
      description: newDescription,
      dueDate: newDueDate
    }))
    setHasLocalDraft(true)
    showToast('Milestone draft saved locally!')
  }

  // Proposal Submission inline state
  const [newProjTitle, setNewProjTitle] = useState('')
  const [newProjDesc, setNewProjDesc] = useState('')
  const [submittingProposal, setSubmittingProposal] = useState(false)
  const [proposalError, setProposalError] = useState<string | null>(null)

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjTitle.trim() || !newProjDesc.trim()) return

    setSubmittingProposal(true)
    setProposalError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in.')

      const { error: insertError } = await supabase.from('projects').insert({
        title: newProjTitle.trim(),
        description: newProjDesc.trim(),
        status: 'pending',
        student_id: user.id
      })

      if (insertError) throw insertError

      showToast('Proposal submitted successfully! Initializing default deliverables...')
      setNewProjTitle('')
      setNewProjDesc('')
      
      // Reload projects & deliverables
      await fetchDeliverables()
    } catch (err: any) {
      console.error(err)
      setProposalError(err.message || 'Failed to submit proposal.')
    } finally {
      setSubmittingProposal(false)
    }
  }

  const handleResubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjTitle.trim() || !newProjDesc.trim() || !project) return

    setSubmittingProposal(true)
    setProposalError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in.')

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          title: newProjTitle.trim(),
          description: newProjDesc.trim(),
          status: 'pending'
        })
        .eq('id', project.id)

      if (updateError) throw updateError

      showToast('Proposal resubmitted successfully!')
      
      // Reload projects & deliverables
      await fetchDeliverables()
    } catch (err: any) {
      console.error(err)
      setProposalError(err.message || 'Failed to resubmit proposal.')
    } finally {
      setSubmittingProposal(false)
    }
  }

  // Track Label from TrackProvider
  const { trackMode } = useTrack()
  const trackLabel = trackMode === 'thesis' ? 'CAPSTONE THESIS TRACK' : 'INDUSTRY TRACK'
  const isThesis = trackMode === 'thesis'
  const isFullyActive = !!project && (!isThesis || (project.status === 'approved' && project.instructor_id !== null))

  const supabase = createClient()

  useEffect(() => {
    fetchDeliverables()
    // Load repo URL if configured in local storage settings
    if (typeof window !== 'undefined') {
      const storedRepo = localStorage.getItem('seniorproj_github_url')
      if (storedRepo) {
        setRepoUrl(storedRepo)
      }
    }
  }, [trackMode]) // Re-run fetch whenever the user switches track modes in the header!

  useEffect(() => {
    setUploadedFile(null)
    setUploadedFileName('')
    setUploadedFileSize('')
  }, [selectedMilestone?.id])

  async function fetchDeliverables() {
    setLoading(true)
    try {
      const projRes = await getStudentProjects()
      if (!projRes.success) throw new Error(projRes.error)

      const expectedOrigin = trackMode === 'thesis' ? 'student' : 'industry'
      const projects = (projRes.data || []).map(p => ({
        ...p,
        origin: p.origin || (p.industry_partner_id ? 'industry' : 'student')
      }))

      // Match track, fall back to first project if no exact origin match
      const activeProj =
        projects.find(p => p.origin === expectedOrigin || (expectedOrigin === 'student' && p.origin === 'academic'))
        || projects[0]
        || null

      if (activeProj) {
        setProject(activeProj)
        if (activeProj.status === 'rejected') {
          setNewProjTitle(activeProj.title)
          setNewProjDesc(activeProj.description)
        } else {
          setNewProjTitle('')
          setNewProjDesc('')
        }

        const delivRes = await getDeliverables(activeProj.id)
        if (!delivRes.success) throw new Error(delivRes.error)

        const formattedDelivs = (delivRes.data || []).map((d: any) => ({
          ...d,
          description: d.description || getMilestoneDescription(d.title)
        }))

        setDeliverables(formattedDelivs)
        if (formattedDelivs.length > 0) {
          const active = formattedDelivs.find(d => d.status === 'todo' || d.status === 'submitted') || formattedDelivs[0]
          setSelectedMilestone(active)
        } else {
          setSelectedMilestone(null)
        }
      } else {
        setProject(null)
        setDeliverables([])
        setSelectedMilestone(null)
      }
    } catch (e: any) {
      console.error('Milestones fetch failed:', e)
      showToast('Failed to load milestones. Check your connection.')
    }
    setLoading(false)
  }

  async function handleSubmissionDirect() {
    if (!selectedMilestone) return
    if (!uploadedFileName) {
      showToast('Please upload a report or document in the Submission Portal sidebar first.')
      return
    }

    setSubmitting(true)
    const staticUrl = uploadedFileName

    try {
      const res = await submitDeliverable(selectedMilestone.id, staticUrl)
      if (!res.success) throw new Error(res.error)

      // Sync submission with local sandbox database
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const dbData = localStorage.getItem(storageKey)
        if (dbData) {
          try {
            const parsed = JSON.parse(dbData)
            parsed.deliverables = (parsed.deliverables || []).map((d: any) =>
              d.id === selectedMilestone.id ? { ...d, submission_url: staticUrl, status: 'submitted', updated_at: new Date().toISOString() } : d
            )
            localStorage.setItem(storageKey, JSON.stringify(parsed))
            // Sync to backend endpoint
            await fetch('/api/sandbox/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed)
            }).catch(() => {})
          } catch (e) {
            console.error('Failed to sync milestone submission to local storage:', e)
          }
        }
      }

      setDeliverables(deliverables.map(d => d.id === selectedMilestone.id ? { ...d, submission_url: staticUrl, status: 'submitted' } : d))
      setSelectedMilestone({ ...selectedMilestone, submission_url: staticUrl, status: 'submitted' })
      showToast('Milestone submitted successfully!')
      setUploadedFile(null)
      setUploadedFileName('')
      setUploadedFileSize('')

      try {
        if (project) {
          const instructorEmail = project.instructor?.email
          const instructorName = project.instructor?.full_name
          const studentName = project.student?.full_name || 'A student'
          if (instructorEmail) {
            const { notifyInstructorMilestoneSubmission } = await import('@/lib/email/emailService')
            await notifyInstructorMilestoneSubmission(
              studentName, instructorEmail, instructorName || 'Advisor',
              project.title, selectedMilestone.title
            )
          }
        }
      } catch (err) {
        console.error('Email notify error:', err)
      }
    } catch (dbErr: any) {
      console.error('Submission failed:', dbErr.message)
      showToast(`Submission failed: ${dbErr.message || 'Database error. Check your Supabase RLS policies.'}`)
    }
    setSubmitting(false)
  }

  const handleExportSchedule = () => {
    if (deliverables.length === 0) return
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + "Milestone Title,Description,Due Date,Status,Grade/Score\n"
      + deliverables.map(d => {
          const grade = d.grade || (d.status === 'graded' ? '92/100' : 'N/A')
          return `"${d.title.replace(/"/g, '""')}","${d.description.replace(/"/g, '""')}","${new Date(d.due_date).toLocaleDateString()}","${d.status}","${grade}"`
        }).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `milestones_schedule_${project?.title?.slice(0, 15).replace(/\s+/g, '_') || 'capstone'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Schedule exported as CSV!')
  }

  const handleSyncRepository = () => {
    setIsSyncingRepo(true)
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('seniorproj_github_url', repoUrl)
      }
      setIsSyncingRepo(false)
      showToast('GitHub repository synced successfully!')
    }, 1200)
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newDueDate || !project) return

    try {
      const res = await addCustomMilestone(project.id, newTitle, newDueDate)
      if (!res.success) throw new Error(res.error)

      const savedMilestone = {
        ...res.data,
        description: newDescription || 'No description provided.',
      }

      const updatedList = [...deliverables, savedMilestone].sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )
      setDeliverables(updatedList)
      setSelectedMilestone(savedMilestone)
      setIsAddModalOpen(false)
      setNewTitle('')
      setNewDescription('')
      setNewDueDate('')
      showToast('New milestone added successfully!')
    } catch (err: any) {
      console.error('Add milestone failed:', err.message)
      showToast(`Failed to add milestone: ${err.message || 'Check your Supabase RLS policies.'}`)
    }
  }

  const showToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(''), 4000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setUploadedFile(file)
      setUploadedFileName(file.name)
      setUploadedFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 bg-slate-50 min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-10 h-10 text-[#a75d24] animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Track Workspace...</span>
        </div>
      </div>
    )
  }

  const getDaysRemainingText = (dueDateStr: string) => {
    const due = new Date(dueDateStr)
    const diffTime = due.getTime() - Date.now()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays > 0) {
      return { text: `DUE IN ${diffDays} DAYS`, isOverdue: false }
    } else if (diffDays === 0) {
      return { text: `DUE TODAY`, isOverdue: false }
    } else {
      return { text: `OVERDUE BY ${Math.abs(diffDays)} DAYS`, isOverdue: true }
    }
  }

  const activeMilestoneIndex = deliverables.findIndex(d => d.status === 'todo' || d.status === 'submitted')
  const getMilestoneState = (index: number, deliv: any) => {
    if (deliv.status === 'graded') {
      return 'completed'
    }
    if (index === (activeMilestoneIndex !== -1 ? activeMilestoneIndex : 0)) {
      return 'active'
    }
    if (index < activeMilestoneIndex && activeMilestoneIndex !== -1) {
      return 'completed'
    }
    return 'locked'
  }

  // supervisor profile data dynamically fetched from project
  const supervisorName = project?.instructor?.full_name || 'Dr. Sarah Johnson'
  const supervisorRole = trackMode === 'thesis' ? 'Senior Capstone Supervisor' : 'Industry Mentor Liaison'
  const supervisorAvatarInitials = supervisorName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')

  // feedback content dynamically generated from selection details
  const getFeedbackQuote = () => {
    if (!selectedMilestone) return ''
    if (selectedMilestone.feedback) {
      return selectedMilestone.feedback
    }
    if (selectedMilestone.status === 'todo' || selectedMilestone.status === 'submitted') {
      return `Your supervisor, ${supervisorName}, will provide detailed review and evaluation comments here once this phase deliverable has been uploaded and graded.`
    }
    return 'No advisor comments are registered for this deliverable phase.'
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8 font-sans relative">
      
      {/* Toast notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-8 z-50 bg-[#0b192f] text-white py-3.5 px-6 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 text-xs font-bold"
          >
            <Sparkles className="w-4.5 h-4.5 text-[#e37b2d]" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* SUBHEADER AND MAIN HEADER STRIP */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#a75d24] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a75d24] animate-pulse" />
              {trackLabel} &bull; PHASE 3
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Project Milestones</h1>
          </div>

          <div className="flex items-center gap-2.5">
            {isFullyActive && (
              <button 
                onClick={handleExportSchedule}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer select-none active:scale-[0.98]"
              >
                <Download className="w-3.5 h-3.5" />
                Export Schedule
              </button>
            )}
            {isFullyActive && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-[#a75d24] hover:bg-[#8f4f1d] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-[#a75d24]/10 cursor-pointer select-none active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Milestone
              </button>
            )}
          </div>
        </div>

        {/* TRACK EMPTY STATE WARNING DISPLAY */}
        {!project ? (
          trackMode === 'thesis' ? (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm max-w-2xl mx-auto space-y-6 my-12">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Start Capstone Project Proposal</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Submit your academic thesis proposal directly here to initialize your milestone timeline.</p>
              </div>

              <form onSubmit={handleCreateProposal} className="space-y-5">
                {proposalError && (
                  <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                    {proposalError}
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Project Title</label>
                  <input
                    required
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g. Advanced Machine Learning for Dialect Datasets"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a75d24]/20 focus:border-[#a75d24]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Abstract & Description</label>
                  <textarea
                    required
                    rows={5}
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    placeholder="Describe your methodology, goals, and intended research outcome..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a75d24]/20 focus:border-[#a75d24] resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingProposal || !newProjTitle.trim() || !newProjDesc.trim()}
                    className="px-6 py-3 bg-[#a75d24] hover:bg-[#8f4f1d] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md animate-in fade-in zoom-in duration-300"
                  >
                    {submittingProposal ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Submit Proposal & Seed Milestones
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm max-w-2xl mx-auto space-y-6 my-12">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Waiting for Industry Allocation</h2>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-md mx-auto">
                  Your supervisor will assign you to an Industry Partner project shortly. Once allocated, your milestones timeline and deliverable uploads will activate here.
                </p>
              </div>
            </div>
          )
        ) : (
          (() => {
            const isRejected = isThesis && project.status === 'rejected'

            if (isRejected) {
              return (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm max-w-2xl mx-auto space-y-6 my-12">
                  <div className="flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-8 h-8 shrink-0" />
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Proposal Rejected</h2>
                  </div>
                  
                  <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 font-semibold space-y-2">
                    <span className="font-black uppercase tracking-wider block text-[10px] text-red-700">FEEDBACK FROM COORDINATOR:</span>
                    <p className="italic text-slate-700">"{project.recommendation || 'Please refine the scope and technical architecture details to align with capstone standards.'}"</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 block">Edit & Resubmit Proposal</h3>
                    <form onSubmit={handleResubmitProposal} className="space-y-5">
                      {proposalError && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
                          {proposalError}
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Project Title</label>
                        <input
                          required
                          type="text"
                          value={newProjTitle}
                          onChange={(e) => setNewProjTitle(e.target.value)}
                          placeholder="e.g. Advanced Machine Learning for Dialect Datasets"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a75d24]/20 focus:border-[#a75d24]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Abstract & Description</label>
                        <textarea
                          required
                          rows={5}
                          value={newProjDesc}
                          onChange={(e) => setNewProjDesc(e.target.value)}
                          placeholder="Describe your methodology, goals, and intended research outcome..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#a75d24]/20 focus:border-[#a75d24] resize-none"
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingProposal || !newProjTitle.trim() || !newProjDesc.trim()}
                          className="px-6 py-3 bg-[#a75d24] hover:bg-[#8f4f1d] disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          {submittingProposal ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          Resubmit Proposal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )
            }

            if (!isFullyActive) {
              const isPendingVetting = project.status === 'pending'
              const currentStep = isPendingVetting ? 1 : 2

              return (
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-12 shadow-sm max-w-3xl mx-auto space-y-8 my-12">
                  <div className="border-b border-slate-100 pb-5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#a75d24] bg-[#fdf5f0] px-3 py-1 rounded-full">
                      LIFECYCLE STATUS
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">Proposal Review & Setup</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Your Capstone Project proposal has been received. Track its vetting and supervisor matching progress below.</p>
                  </div>

                  {/* Visual Tracker */}
                  <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 py-4">
                    {/* Background connector line */}
                    <div className="absolute left-12 top-1/2 -translate-y-1/2 right-12 h-0.5 bg-slate-150 hidden md:block z-0" />
                    
                    {/* Step 1: Submitted */}
                    <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 md:text-center flex-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md shrink-0">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Step 1</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">Proposal Submitted</span>
                        <span className="text-[9px] text-slate-450 font-bold block mt-0.5">{new Date(project.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Step 2: Vetting */}
                    <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 md:text-center flex-1">
                      {currentStep > 1 ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md shrink-0">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#fdf5f0] border-2 border-[#a75d24] flex items-center justify-center text-[#a75d24] shadow-md relative shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#a75d24] animate-ping absolute" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a75d24]" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Step 2</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">Department Vetting</span>
                        <span className="text-[9px] text-[#a75d24] font-bold block mt-0.5">
                          {currentStep > 1 ? 'Approved by Board' : 'Pending Board Review'}
                        </span>
                      </div>
                    </div>

                    {/* Step 3: Allocation */}
                    <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 md:text-center flex-1">
                      {currentStep === 2 ? (
                        <div className="w-10 h-10 rounded-full bg-[#fdf5f0] border-2 border-[#a75d24] flex items-center justify-center text-[#a75d24] shadow-md relative shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#a75d24] animate-ping absolute" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#a75d24]" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Step 3</span>
                        <span className="text-xs font-bold text-slate-900 block mt-0.5">Supervisor Matching</span>
                        <span className="text-[9px] text-slate-455 font-bold block mt-0.5">
                          {currentStep === 2 ? 'Matching in progress' : 'Locked — Pending Vetting'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Project Details Panel */}
                  <div className="mt-8 p-6 bg-slate-50 border border-slate-150 rounded-[2rem] space-y-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">PROPOSAL TITLE</span>
                      <h4 className="text-base font-black text-slate-800 leading-snug mt-1">{project.title}</h4>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ABSTRACT & METHODOLOGY</span>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed mt-1.5">{project.description}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-amber-800">
                    <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs font-semibold leading-relaxed">
                      <p className="font-bold">Next Steps for Verification</p>
                      <p className="mt-1">Once the department approves this proposal and assigns your academic supervisor, your deliverables milestone timeline (with report uploads and repository sync actions) will activate here.</p>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div className="space-y-6">
                {/* Approved Project Banner */}
                {project && project.status === 'approved' && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-[2.25rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block">Approved Capstone Project Topic</span>
                      <h2 className="text-lg font-black text-slate-900">{project.title}</h2>
                      <p className="text-xs font-semibold text-slate-500 max-w-3xl mt-1.5 leading-relaxed">{project.description}</p>
                    </div>
                  </div>
                )}

                {/* TWO-COLUMN GRID WORKSPACE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: TIMELINE (Takes 8 cols) */}
            <div className="lg:col-span-8 relative space-y-6">
              
              {/* Timeline connector bar */}
              <div className="absolute left-[34px] top-6 bottom-6 w-0.5 bg-slate-200 z-0 hidden sm:block" />

              {deliverables.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-bold text-sm shadow-sm">
                  No deliverables found. Click "+ New Milestone" to initialize one!
                </div>
              ) : (
                deliverables.map((deliv, index) => {
                  const milestoneState = getMilestoneState(index, deliv)
                  const isSelected = selectedMilestone?.id === deliv.id
                  const score = deliv.grade || null
                  const dueInfo = getDaysRemainingText(deliv.due_date)

                  // calculate completion progress percentage dynamically
                  const completionProgress = deliv.status === 'graded' || deliv.status === 'submitted' 
                    ? 100 
                    : (uploadedFile && isSelected ? 50 : 0)

                  return (
                    <div 
                      key={deliv.id}
                      onClick={() => setSelectedMilestone(deliv)}
                      className="relative z-10 flex items-start gap-4 sm:gap-6 group cursor-pointer select-none"
                    >
                      
                      {/* Circle Node Icon */}
                      <div className="hidden sm:flex shrink-0 w-[70px] justify-center pt-2">
                        {milestoneState === 'completed' && (
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md group-hover:scale-105 transition-transform">
                            <Check className="w-5 h-5 stroke-[3]" />
                          </div>
                        )}
                        
                        {milestoneState === 'active' && (
                          <div className="w-9 h-9 rounded-full bg-[#fdf5f0] border-2 border-[#a75d24] flex items-center justify-center text-[#a75d24] shadow-md group-hover:scale-105 transition-transform relative">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#a75d24] animate-ping absolute" />
                            <span className="w-2 h-2 rounded-full bg-[#a75d24]" />
                          </div>
                        )}

                        {milestoneState === 'locked' && (
                          <div className="w-9 h-9 rounded-full bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-105 transition-transform">
                            <Lock className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Milestone Card Body */}
                      <div className="flex-1">
                        {milestoneState === 'active' ? (
                          /* ACTIVE MILESTONE CARD: Beautiful terracotta/brown highlighted block */
                          <div className={`p-6 sm:p-8 bg-white border-2 rounded-[2.5rem] transition-all shadow-md ${
                            isSelected 
                              ? 'border-[#a75d24] shadow-[#a75d24]/5 shadow-xl scale-[1.01]' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#a75d24] bg-[#fdf5f0] px-3 py-1 rounded-full">
                                {deliv.status === 'submitted' ? 'UNDER EVALUATION' : 'IN PROGRESS'}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-wider ${dueInfo.isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                                {dueInfo.text} &bull; {new Date(deliv.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>

                            <h3 className="text-xl font-extrabold text-slate-900 mb-2 leading-snug">{deliv.title}</h3>
                            
                            {/* Completion Progress Bar */}
                            <div className="space-y-1.5 my-4">
                              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                <span>Completion Progress</span>
                                <span>{completionProgress}%</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#a75d24] rounded-full transition-all duration-500" 
                                  style={{ width: `${completionProgress}%` }}
                                />
                              </div>
                            </div>

                            <p className="text-slate-600 text-xs leading-relaxed font-medium mb-5">{deliv.description}</p>

                            {/* Quick Actions inside active box */}
                            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                              {deliv.status === 'todo' ? (
                                <>
                                  <button 
                                    onClick={() => {
                                      if (!uploadedFileName) {
                                        showToast('Please upload a report or document in the Submission Portal sidebar first.')
                                        return
                                      }
                                      handleSubmissionDirect()
                                    }}
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-[#a75d24] hover:bg-[#8f4f1d] text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-sm cursor-pointer select-none active:scale-[0.98] flex items-center gap-1.5"
                                  >
                                    {submitting ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                                    Submit Deliverables
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setUploadedFileName('draft_notes.pdf')
                                      setUploadedFileSize('1.2 MB')
                                      showToast('Draft edited successfully!')
                                    }}
                                    className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer select-none"
                                  >
                                    Edit Draft
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Milestone submitted successfully. Awaiting supervisor grading.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : milestoneState === 'completed' ? (
                          /* COMPLETED MILESTONE CARD: Clean design with green checkbox and score badge */
                          <div className={`p-6 bg-white border rounded-[2rem] transition-all shadow-sm ${
                            isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h3 className="text-md font-bold text-slate-800 leading-snug">{deliv.title}</h3>
                              {score && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                  SCORE: {score}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-3">{deliv.description}</p>
                            
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {new Date(deliv.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="flex items-center gap-1 text-[#a75d24]">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                Graded Document
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* LOCKED TIMELINE CARD: Greyed out locked milestone */
                          <div className="p-6 bg-slate-50/50 border border-slate-200/60 rounded-[2rem] opacity-60">
                            <h3 className="text-md font-bold text-slate-400 mb-2 leading-snug">{deliv.title}</h3>
                            <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-3">{deliv.description}</p>
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                              <Lock className="w-3 h-3 shrink-0" />
                              Expected: {new Date(deliv.due_date).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* RIGHT COLUMN: SIDEBAR PORTALS (Takes 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* SUBMISSION PORTAL CARD */}
              <div className="bg-white border border-slate-200 rounded-[2.25rem] p-6 shadow-sm space-y-5">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Submission Portal</h2>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Manage file uploads and repository linkings for <strong className="text-slate-800 font-bold">{selectedMilestone?.title || 'selected milestone'}</strong>.
                  </p>
                </div>

                {/* Upload drag and drop box */}
                {selectedMilestone?.status === 'todo' ? (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#a75d24] rounded-2xl p-5 text-center transition-all bg-slate-50/30 group">
                    <input 
                      type="file" 
                      id="milestone-file"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#fdf5f0] group-hover:text-[#a75d24] transition-all">
                        <CloudUpload className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 block">Upload Phase Reports</span>
                        <span className="text-[9.5px] text-slate-400 font-bold block pt-0.5">Drag and drop or click to browse files</span>
                      </div>
                    </div>
                  </div>
                ) : selectedMilestone?.status === 'submitted' ? (
                  <div className="p-4 bg-yellow-50/50 border border-yellow-200/80 rounded-2xl flex items-center gap-3">
                    <Clock className="w-8 h-8 text-yellow-600 bg-yellow-100/50 rounded-xl flex items-center justify-center p-1.5 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-yellow-800 font-black uppercase block tracking-wider leading-none mb-1">Evaluation Pending</span>
                      <span className="text-[11px] text-slate-600 font-bold block truncate">{selectedMilestone.submission_url || 'Submitted Report'}</span>
                    </div>
                  </div>
                ) : selectedMilestone?.status === 'graded' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 bg-emerald-100 rounded-xl flex items-center justify-center p-1.5 shrink-0" />
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-emerald-800 font-black uppercase block tracking-wider leading-none mb-1">Milestone Evaluated</span>
                      <span className="text-[11px] text-slate-600 font-bold block truncate">Grade: {selectedMilestone.grade || 'A'}</span>
                    </div>
                  </div>
                ) : null}

                {/* Show selected file */}
                {uploadedFile && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-5 h-5 text-[#a75d24] shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-700 block truncate">{uploadedFileName}</span>
                        <span className="text-[9px] text-slate-400 font-bold block">{uploadedFileSize}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setUploadedFile(null)
                        setUploadedFileName('')
                        setUploadedFileSize('')
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Submit trigger button if file loaded */}
                {uploadedFile && selectedMilestone?.status === 'todo' && (
                  <button
                    onClick={handleSubmissionDirect}
                    disabled={submitting}
                    className="w-full py-3 bg-[#a75d24] hover:bg-[#8f4f1d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#a75d24]/10 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    {submitting ? <Clock className="w-4.5 h-4.5 animate-spin" /> : <Upload className="w-4.5 h-4.5" />}
                    Submit Report Now
                  </button>
                )}

              </div>

              {/* DYNAMIC PARTNER / ADVISOR FEEDBACK CARD (Only show if actual feedback exists) */}
              {selectedMilestone && selectedMilestone.feedback && (
                <div className="bg-[#a75d24] text-white rounded-[2.25rem] p-6 shadow-lg shadow-[#a75d24]/10 relative overflow-hidden select-none">
                  
                  {/* Opacity large quote mark */}
                  <span className="absolute right-4 top-2 text-[130px] font-serif font-black leading-none text-white/10 pointer-events-none select-none">
                    ”
                  </span>

                  <div className="relative z-10 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-200">
                      {trackMode === 'thesis' ? 'Advisor Review' : 'Partner Feedback'}
                    </h3>
                    
                    <p className="text-xs text-orange-50/90 leading-relaxed font-semibold italic">
                      &ldquo;{selectedMilestone.feedback}&rdquo;
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                      <div className="w-9 h-9 bg-white/10 rounded-full border border-white/20 flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0">
                        {supervisorAvatarInitials}
                      </div>
                      <div>
                        <span className="text-xs font-black block leading-none">{supervisorName}</span>
                        <span className="text-[9px] text-orange-200 font-bold block mt-1">{supervisorRole}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
          </div>
            )
          })()
        )}

      </div>

      {/* NEW MILESTONE MODAL POPUP */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#a75d24]" />
                  Create Workspace Milestone
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleAddMilestone} className="p-8 space-y-5">
                {hasLocalDraft && (
                  <div className="p-4 bg-[#fdf5f0] border border-[#a75d24]/20 rounded-2xl flex items-center justify-between text-xs text-[#a75d24] font-bold">
                    <span>You have a locally saved milestone draft.</span>
                    <button
                      type="button"
                      onClick={loadLocalDraft}
                      className="px-3 py-1.5 bg-[#a75d24] text-white rounded-xl font-bold hover:bg-[#8f4f1d] transition-all cursor-pointer text-[10px] uppercase tracking-wider"
                    >
                      Load Draft
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1">Milestone Title</label>
                  <input 
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Beta Software Integration"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#a75d24] rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#a75d24]/10 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1">Description / Deliverable Specs</label>
                  <textarea 
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Briefly describe what must be submitted for this milestone..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#a75d24] rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#a75d24]/10 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-wider block ml-1">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#a75d24] rounded-2xl py-3 px-4 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#a75d24]/10 transition-all appearance-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 justify-end pt-3 border-t border-slate-100 mt-6 flex-wrap">
                  <button 
                    type="button"
                    onClick={saveLocalDraft}
                    className="px-4 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer select-none"
                  >
                    Save Local Draft
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-3 bg-[#a75d24] hover:bg-[#8f4f1d] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#a75d24]/10 cursor-pointer select-none active:scale-[0.98]"
                  >
                    Add Milestone
                  </button>
                </div>
              </form>
            </motion.div>
            
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

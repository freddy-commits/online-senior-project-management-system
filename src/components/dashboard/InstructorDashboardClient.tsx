'use client'

import { useState, useEffect } from 'react'
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
  UserCheck,
  Award,
  BarChart3,
  Calendar,
  Layers,
  GraduationCap,
  Download,
  Plus,
  UserPlus,
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

type ProjectType = any

export default function InstructorDashboardClient({ 
  initialProjects, 
  supervisors,
  examiners = [],
  industryPartners,
  initialDeliverables,
  teams = [],
  students = []
}: { 
  initialProjects: ProjectType[], 
  supervisors: any[],
  examiners?: any[],
  industryPartners: any[],
  initialDeliverables: any[],
  teams?: any[],
  students?: any[]
}) {
  const { trackMode } = useTrack()
  const isCapstone = trackMode === 'thesis' || trackMode === 'advisor' || trackMode === 'supervisor' || trackMode === 'panel'
  
  // Tab Management
  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'grading' | 'reports'>('proposals')

  const [projects, setProjects] = useState(initialProjects)
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [partners, setPartners] = useState(industryPartners)
  
  // Approval Modal State
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<any>(null)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')

  const [processing, setProcessing] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // New Milestone Form State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('')
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('')

  // Grading State
  const [editingGradeProject, setEditingGradeProject] = useState<any>(null)
  const [selectedGrade, setSelectedGrade] = useState('A')

  function canGradeProject(proj: any) {
    const projDeliverables = deliverables.filter((d: any) => d.project_id === proj.id)
    if (projDeliverables.length === 0) return false
    return projDeliverables.every((d: any) => d.status === 'submitted' || d.status === 'graded')
  }

  function getSupervisorMarksSummary(projId: string) {
    const projDelivs = deliverables.filter((d: any) => d.project_id === projId)
    if (projDelivs.length === 0) return 'No milestones'
    
    const gradedDelivs = projDelivs.filter((d: any) => d.status === 'graded' && d.grade)
    if (gradedDelivs.length === 0) return `0/${projDelivs.length} marked`
    
    let totalScore = 0
    gradedDelivs.forEach((d: any) => {
      const raw = String(d.grade).replace('/20', '').trim()
      const val = parseFloat(raw)
      if (!isNaN(val)) totalScore += val
    })
    const avg = (totalScore / gradedDelivs.length).toFixed(1)
    return `${avg}/20 avg (${gradedDelivs.length}/${projDelivs.length} graded)`
  }

  const supabase = createClient()

  // Sync state helpers
  async function refreshData() {
    // Refresh Projects
    const { data: newProjects } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name)')
      .order('created_at', { ascending: false })
    if (newProjects) {
      const enriched = newProjects.map((p: any) => ({
        ...p,
        origin: p.industry_partner_id ? 'industry' : 'academic'
      }))
      setProjects(enriched)
    }

    // Refresh Deliverables
    const pIds = (newProjects || projects).map((p: any) => p.id)
    if (pIds.length > 0) {
      const { fetchDepartmentDeliverables } = await import('@/app/instructor/milestones/actions')
      const delivRes = await fetchDepartmentDeliverables(pIds)
      if (delivRes.success && delivRes.data) {
        setDeliverables(delivRes.data)
      }
    }

    // Refresh Partners
    const { data: newPartners } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'industry')
    if (newPartners) setPartners(newPartners)
  }

  // Task: Review & Approve Proposal + Optional Supervisor Allocation + Team Squad Allocation + Examiner Panel Assignment
  async function handleApproveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProjectForApproval) return
    setProcessing(selectedProjectForApproval.id)

    try {
      const updatePayload: Record<string, any> = { status: 'approved' }
      if (selectedSupervisorId) {
        updatePayload.instructor_id = selectedSupervisorId
      }
      if (selectedTeamId) {
        updatePayload.team_id = selectedTeamId
      }



      const { error } = await supabase
        .from('projects')
        .update(updatePayload)
        .eq('id', selectedProjectForApproval.id)
      if (error) throw error
      setSuccessMessage(`Project "${selectedProjectForApproval.title}" approved and allocated successfully!`)
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to approve project: " + (err.message || err))
    }

    setTimeout(() => setSuccessMessage(''), 5000)
    await refreshData()
    setSelectedProjectForApproval(null)
    setSelectedSupervisorId('')
    setSelectedTeamId('')

    setProcessing(null)
  }

  async function handleRejectProject() {
    if (!selectedProjectForApproval) return
    setProcessing(selectedProjectForApproval.id)

    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'rejected' })
        .eq('id', selectedProjectForApproval.id)
      if (error) throw error
      setSuccessMessage(`Project "${selectedProjectForApproval.title}" rejected.`)
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to reject project: " + (err.message || err))
    }

    setTimeout(() => setSuccessMessage(''), 5000)
    await refreshData()
    setSelectedProjectForApproval(null)
    setProcessing(null)
  }

  // Task: Configure Milestones
  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault()
    if (!newMilestoneTitle || !newMilestoneDueDate) return
    setProcessing('milestone')

    const newMilestone = {
      id: `deliv-${Math.random().toString(36).substring(2, 9)}`,
      title: newMilestoneTitle,
      description: newMilestoneDesc || 'Cohort deliverable milestone.',
      due_date: newMilestoneDueDate,
      status: 'todo',
      created_at: new Date().toISOString()
    }

    try {
      const { error } = await supabase
        .from('deliverables')
        .insert(newMilestone)
      if (error) throw error
      setSuccessMessage(`Milestone "${newMilestoneTitle}" configured successfully!`)
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to create milestone: " + (err.message || err))
    }

    setTimeout(() => setSuccessMessage(''), 5000)
    await refreshData()
    setNewMilestoneTitle('')
    setNewMilestoneDesc('')
    setNewMilestoneDueDate('')
    setShowMilestoneModal(false)
    setProcessing(null)
  }

  async function handleDeleteMilestone(id: string) {
    if (!confirm("Are you sure you want to delete this milestone?")) return

    try {
      const { error } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', id)
      if (error) throw error
      setSuccessMessage("Milestone removed successfully.")
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to delete milestone: " + (err.message || err))
    }

    setTimeout(() => setSuccessMessage(''), 4000)
    await refreshData()
  }



  // Task: Publish Final Grades
  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGradeProject) return
    setProcessing(editingGradeProject.id)

    try {
      const { updateProjectGradeAdmin } = await import('@/app/instructor/documents/actions')
      const actionRes = await updateProjectGradeAdmin(editingGradeProject.id, selectedGrade)
      
      if (!actionRes.success) {
        // Fallback to client client write if action had issue
        const { error } = await supabase
          .from('projects')
          .update({ 
            grade: selectedGrade,
            grade_published: true
          })
          .eq('id', editingGradeProject.id)
        if (error) throw error
      }

      setProjects(prev => prev.map(p => p.id === editingGradeProject.id ? { ...p, grade: selectedGrade, grade_published: true } : p))
      setSuccessMessage(`Grade ${selectedGrade} published for "${editingGradeProject.title}"`)
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to publish grade: " + (err.message || err))
    }

    setTimeout(() => setSuccessMessage(''), 5000)
    await refreshData()
    setEditingGradeProject(null)
    setProcessing(null)
  }

  // Task: Approve Industry Partners
  async function handleTogglePartnerApproval(partnerId: string, currentApprovedState: boolean) {
    setProcessing(partnerId)
    const targetState = !currentApprovedState

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: targetState })
        .eq('id', partnerId)
      if (error) throw error
      setSuccessMessage(`Industry Partner status updated to ${targetState ? 'Approved' : 'Pending'}`)
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to update industry partner: " + (err.message || err))
    }

    setTimeout(() => setSuccessMessage(''), 4000)
    await refreshData()
    setProcessing(null)
  }

  // Task: Generate Cohort Reports (Multi-format exporter)
  function handleDownloadReport(format: 'excel' | 'document' | 'json') {
    const reportData = projects.map(p => ({
      title: p.title,
      studentName: p.student?.full_name || 'Solo Student',
      studentEmail: p.student?.email || 'N/A',
      supervisorName: p.supervisor?.full_name || 'Unassigned',
      status: p.status,
      grade: p.grade || 'Not Graded',
      origin: p.origin === 'industry' ? 'Industry Sponsored' : 'Academic Solo'
    }))

    const columns = [
      { header: 'Project Title', key: 'title' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Student Email', key: 'studentEmail' },
      { header: 'Advisor / Supervisor', key: 'supervisorName' },
      { header: 'Status', key: 'status' },
      { header: 'Course Grade', key: 'grade' },
      { header: 'Track Type', key: 'origin' }
    ]

    import('@/lib/utils/reportExporter').then(({ downloadReportFile }) => {
      downloadReportFile({
        title: 'Senior Project and Industry Cohort Report',
        data: reportData,
        columns,
        format,
        fileNamePrefix: 'cohort_performance_report'
      })
      setSuccessMessage(`Cohort report downloaded successfully as ${format.toUpperCase()}!`)
      setTimeout(() => setSuccessMessage(''), 4500)
    })
  }

  // Filters projects based on active switcher track
  const isIndustryMode = trackMode === 'industry'
  const filteredProjects = projects.filter(p => {
    const isProjIndustry = p.industry_partner_id !== null || p.origin === 'industry'
    return isIndustryMode ? isProjIndustry : !isProjIndustry
  })

  const industryProjects = projects.filter(p => p.industry_partner_id !== null || p.origin === 'industry')
  const soloProjects = projects.filter(p => !p.industry_partner_id && p.origin !== 'academic')

  const totalTeams = industryProjects.length
  const queueSize = filteredProjects.filter(p => p.status === 'pending').length
  const approvals = filteredProjects.filter(p => p.status === 'approved').length
  const activeProjectIds = new Set(filteredProjects.map(p => p.id))
  const milestoneCount = deliverables.filter((d: any) => activeProjectIds.has(d.project_id)).length

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans">
      
      {successMessage && (
        <div className="fixed top-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center gap-3 z-50 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 animate-bounce" />
          {successMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Lead Coordinator Center
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Academic Panel Station</h1>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Pitches</span>
          <span className="text-3xl font-black text-slate-900">{totalTeams}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pending Proposals</span>
          <span className="text-3xl font-black text-amber-500">{queueSize < 10 ? `0${queueSize}` : queueSize}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Milestones</span>
          <span className="text-3xl font-black text-slate-900">{milestoneCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Approved Projects</span>
          <span className="text-3xl font-black text-emerald-600">{approvals}</span>
        </div>
      </div>

      {/* Tab Menu - Unified tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-6 no-scrollbar">
        {[
          { id: 'proposals', label: 'Proposals', icon: <FileText className="w-4 h-4" /> },
          { id: 'grading', label: 'Grading Hub', icon: <Award className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`pb-4 px-2 font-bold text-sm tracking-wide transition-all flex items-center gap-2 border-b-2 outline-none shrink-0 cursor-pointer ${
              activeSubTab === tab.id
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Rendering */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* TAB 1: PROPOSALS (Vetting list / assignment) */}
          {activeSubTab === 'proposals' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Academic Proposals & Allocation</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Review student research ideas and pitches. Approve proposal files and allocate active faculty supervisors.</p>
                </div>
                <a
                  href="/instructor/vetting"
                  className="px-4 py-2.5 bg-[#a75d24] hover:bg-[#8f4f1d] text-white font-extrabold rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm shrink-0 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" /> Open Full Vetting Portal
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, idx) => (
                  <div key={project.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-52">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block truncate max-w-[150px]">
                          {project.student?.full_name || 'Individual Student'}
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
                        {project.status === 'approved' ? (
                          <a 
                            href={`/instructor/projects/${project.id}`}
                            className="text-base font-black text-slate-900 leading-snug line-clamp-2 hover:text-indigo-600 transition-colors block"
                            title="View Project Milestones & Supervisor Marks"
                          >
                            {project.title}
                          </a>
                        ) : (
                          <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">{project.title}</h3>
                        )}
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide mt-1.5">
                          Track: {project.origin === 'industry' ? 'Industry brief' : 'Academic solo'}
                        </p>
                        {project.status === 'approved' && project.supervisor && (
                          <p className="text-xs font-semibold text-emerald-700 mt-2.5 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            {project.supervisor.full_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4">
                      {project.status === 'pending' ? (
                        <button
                          onClick={() => {
                            setSelectedProjectForApproval(project)
                            setSelectedSupervisorId('')
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[11px] uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98]"
                        >
                          Review & Allocate
                        </button>
                      ) : (
                        <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider py-1 bg-slate-50 rounded-lg border border-slate-150">
                          Review Complete
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* TAB 3: PUBLISH GRADES */}
          {activeSubTab === 'grading' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Grading Console & Publication</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Review finalized supervisor assessments and record letter grades. Toggle publication status for student view.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-4 px-6">Project</th>
                      <th className="py-4 px-6">Assigned Advisor</th>
                      <th className="py-4 px-6">Supervisor Marks (/20)</th>
                      <th className="py-4 px-6">Panel Vetting Status</th>
                      <th className="py-4 px-6">Final Course Grade</th>
                      <th className="py-4 px-6">Publication Status</th>
                      <th className="py-4 px-6 text-right">Grade Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {filteredProjects.filter(p => p.status === 'approved').map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <a 
                            href={`/instructor/projects/${p.id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                            title="View Project Milestones & Supervisor Marks"
                          >
                            {p.title}
                          </a>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.student?.full_name}</span>
                        </td>
                        <td className="py-4 px-6">{p.supervisor?.full_name || 'Unassigned'}</td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                            {getSupervisorMarksSummary(p.id)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {p.review_completed ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reviewed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Vetting
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {p.grade ? (
                            <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full font-black text-xs">
                              {p.grade}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold italic">Not Graded</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {p.grade_published ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              PUBLISHED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              UNPUBLISHED
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {canGradeProject(p) ? (
                            <button
                              onClick={() => {
                                setEditingGradeProject(p)
                                setSelectedGrade(p.grade || 'A')
                              }}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                            >
                              Enter Grade
                            </button>
                          ) : (
                            <span 
                              title="Student must submit all required milestones before final cohort grade can be recorded."
                              className="px-3.5 py-1.5 bg-slate-100 text-slate-400 font-extrabold rounded-lg text-[9px] uppercase tracking-wider cursor-not-allowed border border-slate-200 inline-block"
                            >
                              Awaiting Submissions
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}





        </motion.div>
      </AnimatePresence>

      {/* Slide-over Review & Allocate Modal */}
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
                  <h3 className="text-lg font-black text-slate-900">Review & Allocate</h3>
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

                {/* Uploaded Proposal Document Download Card */}
                {selectedProjectForApproval.proposal_url ? (
                  <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <FileText className="w-4.5 h-4.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700 mb-0.5">Uploaded Proposal Document</h4>
                      <p className="text-[11px] text-emerald-600 font-semibold mb-2.5 truncate" title={selectedProjectForApproval.proposal_url}>
                        Full proposal document attached by student
                      </p>
                      <a
                        href={selectedProjectForApproval.proposal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download / View Document
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-2xl text-[11px] text-amber-800 font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    No document file uploaded. Student provided title and abstract only.
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
                    Faculty Supervisor (Optional)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed font-semibold">
                    Select the faculty supervisor who will mentor and grade this project.
                  </p>
                  
                  <select
                    value={selectedSupervisorId}
                    onChange={(e) => setSelectedSupervisorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all cursor-pointer font-bold"
                  >
                    <option value="">Do not assign supervisor now</option>
                    {supervisors.map(s => (
                      <option key={s.id} value={s.id} className="text-slate-800 font-bold bg-white">
                        {s.full_name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                      Assign Student Squad / Team
                    </label>
                    <a 
                      href="/instructor/teams" 
                      target="_blank"
                      className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-wider flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" /> Create New Squad
                    </a>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed font-semibold">
                    Form a student team to execute this industry challenge or research project.
                  </p>
                  
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all cursor-pointer font-bold"
                  >
                    <option value="">Do not assign squad now (Assign later in Team Station)</option>
                    {teams.map((t: any) => (
                      <option key={t.id} value={t.id} className="text-slate-800 font-bold bg-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2.5 text-xs text-amber-800">
                  <span className="shrink-0 font-black text-amber-600 mt-0.5">i</span>
                  <p className="font-semibold leading-relaxed">
                    Panel Examiner assignment is handled by the <strong>System Administrator</strong> after proposal approval. Approve this proposal first, then the admin will assign the examiner committee.
                  </p>
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
                  disabled={processing === selectedProjectForApproval.id}
                  className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processing === selectedProjectForApproval.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve Proposal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Grade Entry Dialog Modal */}
      <AnimatePresence>
        {editingGradeProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingGradeProject(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-black text-slate-900">Record Cohort Grade</h3>
                <button 
                  onClick={() => setEditingGradeProject(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg border border-slate-350"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveGrade} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Project Title</span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">{editingGradeProject.title}</p>
                </div>

                {/* Supervisor Marks Summary */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Supervisor Evaluation Summary</span>
                  <p className="text-xs font-black text-indigo-700">{getSupervisorMarksSummary(editingGradeProject.id)}</p>
                </div>

                {/* Panel Examiner Vetting Audit */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Panel Examiner Vetting Status</span>
                  {editingGradeProject.review_completed ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[10px] uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Committee Vetting Completed
                      </div>
                      {editingGradeProject.review_notes && (
                        <p className="text-[11px] text-slate-700 font-semibold italic">"{editingGradeProject.review_notes}"</p>
                      )}
                      {editingGradeProject.review_questions && (
                        <div className="text-[10px] text-slate-600 font-medium">
                          <strong className="text-slate-800">Defense Questions:</strong> {editingGradeProject.review_questions}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-800 font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      Pending Panel Examiner Vetting — Panel examiners have been notified to review this submission.
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Select Final Published Grade Mark</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl py-3 px-4 text-slate-800 text-sm font-black cursor-pointer focus:ring-2 focus:ring-indigo-400/30"
                  >
                    {['A', 'B', 'C', 'D', 'F'].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingGradeProject(null)}
                    className="px-4 py-2.5 border border-slate-250 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing === editingGradeProject.id}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {processing === editingGradeProject.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Save & Publish Grade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configure Milestone Modal Dialog */}
      <AnimatePresence>
        {showMilestoneModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMilestoneModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-base font-black text-slate-900">Configure Milestone</h3>
                <button 
                  onClick={() => setShowMilestoneModal(false)}
                  className="p-1 hover:bg-slate-200 rounded-lg border border-slate-350"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateMilestone} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Deliverable Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. System Design Document"
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 px-4 text-slate-850 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Scope / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide deliverables guidelines..."
                    value={newMilestoneDesc}
                    onChange={(e) => setNewMilestoneDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-255 rounded-xl py-2.5 px-4 text-slate-850 text-xs font-semibold focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Cohort Due Date</label>
                  <input
                    required
                    type="date"
                    value={newMilestoneDueDate}
                    onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl py-2.5 px-4 text-slate-850 text-xs font-semibold cursor-pointer"
                  />
                </div>

                <div className="flex gap-3 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneModal(false)}
                    className="px-4 py-2.5 border border-slate-250 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing === 'milestone'}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    {processing === 'milestone' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Configure
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

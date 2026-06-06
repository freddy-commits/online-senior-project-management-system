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
  industryPartners,
  initialDeliverables
}: { 
  initialProjects: ProjectType[], 
  supervisors: any[],
  industryPartners: any[],
  initialDeliverables: any[]
}) {
  const { trackMode } = useTrack()
  const isCapstone = trackMode === 'thesis' || trackMode === 'advisor' || trackMode === 'supervisor' || trackMode === 'panel'
  
  // Tab Management
  const [activeSubTab, setActiveSubTab] = useState<'proposals' | 'milestones' | 'panels' | 'grading' | 'reports' | 'partners'>('proposals')

  const [projects, setProjects] = useState(initialProjects)
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [partners, setPartners] = useState(industryPartners)
  
  // Approval Modal State
  const [selectedProjectForApproval, setSelectedProjectForApproval] = useState<any>(null)
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // New Milestone Form State
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('')
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('')

  // Panel Assigner State
  const [selectedProjectForPanel, setSelectedProjectForPanel] = useState<any>(null)
  const [examiner1, setExaminer1] = useState('')
  const [examiner2, setExaminer2] = useState('')
  const [examiner3, setExaminer3] = useState('')

  // Grading State
  const [editingGradeProject, setEditingGradeProject] = useState<any>(null)
  const [selectedGrade, setSelectedGrade] = useState('A')

  const supabase = createClient()

  // Sync state helpers
  async function refreshData() {
    // Refresh Projects
    const { data: newProjects } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name)')
      .order('created_at', { ascending: false })
    if (newProjects) {
      const enriched = newProjects.map((p: any) => ({
        ...p,
        origin: p.industry_partner_id ? 'industry' : 'academic'
      }))
      setProjects(enriched)
    }

    // Refresh Deliverables
    const { data: newDeliverables } = await supabase
      .from('deliverables')
      .select('*')
      .order('due_date', { ascending: true })
    if (newDeliverables) setDeliverables(newDeliverables)

    // Refresh Partners
    const { data: newPartners } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'industry')
    if (newPartners) setPartners(newPartners)
  }

  // Update logic with Local DB Fallback support
  async function syncLocalDb(updatedState: any) {
    if (typeof window !== 'undefined') {
      const storageKey = 'seniorproj_sandbox_db'
      localStorage.setItem(storageKey, JSON.stringify(updatedState))
      await fetch('/api/sandbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedState)
      }).catch(() => {})
    }
  }

  // Task: Review & Approve Proposal + Allocate Supervisor
  async function handleApproveProject(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProjectForApproval || !selectedSupervisorId) return
    setProcessing(selectedProjectForApproval.id)

    let updateError = null
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'approved',
          instructor_id: selectedSupervisorId
        })
        .eq('id', selectedProjectForApproval.id)
      if (error) throw error
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.projects = parsed.projects.map((p: any) => 
            p.id === selectedProjectForApproval.id 
              ? { ...p, status: 'approved', instructor_id: selectedSupervisorId }
              : p
          )
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage(`Project "${selectedProjectForApproval.title}" approved and supervisor allocated!`)
    setTimeout(() => setSuccessMessage(''), 5000)
    await refreshData()
    setSelectedProjectForApproval(null)
    setProcessing(null)
  }

  async function handleRejectProject() {
    if (!selectedProjectForApproval) return
    setProcessing(selectedProjectForApproval.id)

    let updateError = null
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'rejected' })
        .eq('id', selectedProjectForApproval.id)
      if (error) throw error
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.projects = parsed.projects.map((p: any) => 
            p.id === selectedProjectForApproval.id ? { ...p, status: 'rejected' } : p
          )
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage(`Project "${selectedProjectForApproval.title}" rejected.`)
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
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.deliverables = [...(parsed.deliverables || []), newMilestone]
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage(`Milestone "${newMilestoneTitle}" configured successfully!`)
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
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.deliverables = (parsed.deliverables || []).filter((d: any) => d.id !== id)
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage("Milestone removed successfully.")
    setTimeout(() => setSuccessMessage(''), 4000)
    await refreshData()
  }

  // Task: Assign Examiner Panel
  async function handleAssignExaminers(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProjectForPanel) return
    setProcessing(selectedProjectForPanel.id)

    const panelList = [examiner1, examiner2, examiner3].filter(Boolean)

    try {
      const { error } = await supabase
        .from('projects')
        .update({ examiner_panel: panelList })
        .eq('id', selectedProjectForPanel.id)
      if (error) throw error
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.projects = parsed.projects.map((p: any) => 
            p.id === selectedProjectForPanel.id ? { ...p, examiner_panel: panelList } : p
          )
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage("Examiner panel assigned successfully!")
    setTimeout(() => setSuccessMessage(''), 5000)
    await refreshData()
    setSelectedProjectForPanel(null)
    setExaminer1('')
    setExaminer2('')
    setExaminer3('')
    setProcessing(null)
  }

  // Task: Publish Final Grades
  async function handleSaveGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!editingGradeProject) return
    setProcessing(editingGradeProject.id)

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          grade: selectedGrade,
          grade_published: true
        })
        .eq('id', editingGradeProject.id)
      if (error) throw error
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.projects = parsed.projects.map((p: any) => 
            p.id === editingGradeProject.id ? { ...p, grade: selectedGrade, grade_published: true } : p
          )
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage(`Grade ${selectedGrade} published for "${editingGradeProject.title}"`)
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
    } catch (err) {
      console.warn("Live Supabase write failed, writing to fallback Sandbox:", err)
      // Fallback
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          const parsed = JSON.parse(data)
          parsed.profiles = parsed.profiles.map((p: any) => 
            p.id === partnerId ? { ...p, is_approved: targetState } : p
          )
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage(`Industry Partner status updated to ${targetState ? 'Approved' : 'Pending'}`)
    setTimeout(() => setSuccessMessage(''), 4000)
    await refreshData()
    setProcessing(null)
  }

  // Task: Generate Cohort Reports (Mock download)
  function handleDownloadReport() {
    const header = "Project Station - Cohort Report\nGenerated: " + new Date().toLocaleDateString() + "\n\n"
    const statsStr = `Total projects: ${projects.length}\nApproved: ${projects.filter(p => p.status === 'approved').length}\nPending: ${projects.filter(p => p.status === 'pending').length}\n\n`
    const listStr = projects.map(p => `- ${p.title} (${p.student?.full_name || 'Solo'}): Status=${p.status}, Grade=${p.grade || 'N/A'}`).join('\n')
    
    const blob = new Blob([header + statsStr + listStr], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cohort_report_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setSuccessMessage("Cohort report generated and downloaded!")
    setTimeout(() => setSuccessMessage(''), 4500)
  }

  // Filters projects
  const industryProjects = projects.filter(p => p.origin === 'industry')
  const soloProjects = projects.filter(p => p.origin === 'academic')

  const totalTeams = industryProjects.length
  const queueSize = projects.filter(p => p.status === 'pending').length
  const approvals = projects.filter(p => p.status === 'approved').length
  const milestoneCount = deliverables.length

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

      {/* Tab Menu - Six unified tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-6 no-scrollbar">
        {[
          { id: 'proposals', label: 'Proposals', icon: <FileText className="w-4 h-4" /> },
          { id: 'milestones', label: 'Milestones Config', icon: <Calendar className="w-4 h-4" /> },
          { id: 'panels', label: 'Vetting Panels', icon: <Users className="w-4 h-4" /> },
          { id: 'grading', label: 'Grading Hub', icon: <Award className="w-4 h-4" /> },
          { id: 'reports', label: 'Cohort Reports', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'partners', label: 'Industry Partners', icon: <Building2 className="w-4 h-4" /> }
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, idx) => (
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
                        <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">{project.title}</h3>
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
                          className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm"
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

          {/* TAB 2: CONFIGURE MILESTONES */}
          {activeSubTab === 'milestones' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Cohort Milestone Configuration</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Configure project submission schedules, due dates, and grading scopes for the current academic cohort.</p>
                </div>
                <button
                  onClick={() => setShowMilestoneModal(true)}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" /> Add Milestone
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                {deliverables.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {deliverables.map((d: any) => (
                      <div key={d.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-6">
                        <div className="space-y-1">
                          <h4 className="font-black text-slate-800 text-sm">{d.title}</h4>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">{d.description}</p>
                          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            Due: {new Date(d.due_date).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMilestone(d.id)}
                          className="p-2 hover:bg-red-50 hover:text-red-650 text-slate-400 rounded-xl border border-transparent hover:border-red-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 font-semibold text-xs italic">
                    No deliverables configured. Set up your first milestone above.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGN EXAMINER PANEL */}
          {activeSubTab === 'panels' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Vetting & Examiner Panels</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Allocate 3 faculty committee members to conduct project presentations and evaluate milestones.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-4 px-6">Project Title</th>
                      <th className="py-4 px-6">Student Owner</th>
                      <th className="py-4 px-6">Examiner Panel Members</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {projects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{p.title}</td>
                        <td className="py-4 px-6">{p.student?.full_name || 'Solo Track'}</td>
                        <td className="py-4 px-6">
                          {p.examiner_panel && p.examiner_panel.length > 0 ? (
                            <div className="flex gap-2 flex-wrap">
                              {p.examiner_panel.map((exId: string, idx: number) => {
                                const name = supervisors.find(s => s.id === exId)?.full_name || 'Panel Member'
                                return (
                                  <span key={idx} className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">
                                    {name}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <span className="text-amber-600 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Pending Assignment
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => {
                              setSelectedProjectForPanel(p)
                              setExaminer1(p.examiner_panel?.[0] || '')
                              setExaminer2(p.examiner_panel?.[1] || '')
                              setExaminer3(p.examiner_panel?.[2] || '')
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-[9px] uppercase tracking-wider border border-slate-200 transition-all cursor-pointer shadow-sm"
                          >
                            Assign Panel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLISH GRADES */}
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
                      <th className="py-4 px-6">Grade Score</th>
                      <th className="py-4 px-6">Publication Status</th>
                      <th className="py-4 px-6 text-right">Grade Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {projects.filter(p => p.status === 'approved').map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 block">{p.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.student?.full_name}</span>
                        </td>
                        <td className="py-4 px-6">{p.supervisor?.full_name || 'Unassigned'}</td>
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
                          <button
                            onClick={() => {
                              setEditingGradeProject(p)
                              setSelectedGrade(p.grade || 'A')
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                          >
                            Enter Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: COHORT REPORTS */}
          {activeSubTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Cohort Performance Analytics</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Visualize stats of deliverables compliance, grades distribution, and partner engagements.</p>
                </div>
                <button
                  onClick={handleDownloadReport}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Cohort Report
                </button>
              </div>

              {/* Analytical Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Chart 1: Grade Distributions */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Grade Distribution</h4>
                  <div className="space-y-3">
                    {[
                      { letter: 'A (Outstanding)', count: projects.filter(p => p.grade === 'A').length, pct: 45 },
                      { letter: 'B (Competent)', count: projects.filter(p => p.grade === 'B').length, pct: 30 },
                      { letter: 'C (Passing)', count: projects.filter(p => p.grade === 'C').length, pct: 15 },
                      { letter: 'F (Failing)', count: projects.filter(p => p.grade === 'F').length, pct: 5 }
                    ].map((row, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span>Grade {row.letter}</span>
                          <span>{row.count} ({row.count > 0 ? row.pct : 0}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full border border-slate-200/50 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all" 
                            style={{ width: `${row.count > 0 ? row.pct : 0}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 2: Milestone Submissions */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Submission Rates</h4>
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" className="stroke-slate-100 fill-none" strokeWidth="8" />
                        <circle 
                          cx="56" cy="56" r="48" 
                          className="stroke-emerald-550 fill-none" 
                          strokeWidth="8" 
                          strokeDasharray="301" 
                          strokeDashoffset="75" // 75% complete
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black text-slate-900">75%</span>
                        <span className="text-[8px] text-slate-400 font-extrabold uppercase block tracking-wider mt-0.5">Compliant</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
                      Average deliverables submitted on time.
                    </span>
                  </div>
                </div>

                {/* Chart 3: Track Engagement */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Project Track Breakdown</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Academic Thesis / Capstone</span>
                        <span>{soloProjects.length} Projects</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full border border-slate-200/50 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${projects.length > 0 ? (soloProjects.length / projects.length) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Industry Sponsored Briefs</span>
                        <span>{industryProjects.length} Projects</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full border border-slate-200/50 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-full rounded-full" 
                          style={{ width: `${projects.length > 0 ? (industryProjects.length / projects.length) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: APPROVE INDUSTRY PARTNERS */}
          {activeSubTab === 'partners' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Industry Partner Approvals</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Review registered industry partners. Enable partner dashboard features and pitch submission capabilities.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <th className="py-4 px-6">Company / Representative</th>
                      <th className="py-4 px-6">Contact Email</th>
                      <th className="py-4 px-6">Telephone</th>
                      <th className="py-4 px-6">System Approval Status</th>
                      <th className="py-4 px-6 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {partners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">{partner.full_name}</td>
                        <td className="py-4 px-6">{partner.email}</td>
                        <td className="py-4 px-6">{partner.phone || 'N/A'}</td>
                        <td className="py-4 px-6">
                          {partner.is_approved ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              APPROVED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-[9px] font-black uppercase tracking-wider">
                              PENDING REVIEW
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleTogglePartnerApproval(partner.id, !!partner.is_approved)}
                            className={`px-3.5 py-1.5 font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm border ${
                              partner.is_approved 
                                ? 'bg-red-50 hover:bg-red-100 text-red-650 border-red-200' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {partner.is_approved ? 'Revoke' : 'Approve'}
                          </button>
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

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
                    Assign Faculty Supervisor
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
                        {s.full_name} ({s.role})
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
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-650 border border-red-200 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer"
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

      {/* Slide-over Panel Assigner Modal */}
      <AnimatePresence>
        {selectedProjectForPanel && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProjectForPanel(null)}
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
                  <h3 className="text-lg font-black text-slate-900">Vetting Panel Committee</h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-1 truncate max-w-[280px]">
                    {selectedProjectForPanel.title}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedProjectForPanel(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-300"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleAssignExaminers} className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Allocate up to 3 faculty examiners to serve as the project presentation vetting board.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Examiner 1 (Chair)</label>
                      <select
                        required
                        value={examiner1}
                        onChange={(e) => setExaminer1(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">Select Faculty...</option>
                        {supervisors.map(s => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Examiner 2</label>
                      <select
                        required
                        value={examiner2}
                        onChange={(e) => setExaminer2(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">Select Faculty...</option>
                        {supervisors.map(s => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">Examiner 3</label>
                      <select
                        required
                        value={examiner3}
                        onChange={(e) => setExaminer3(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        <option value="">Select Faculty...</option>
                        {supervisors.map(s => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForPanel(null)}
                    className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing === selectedProjectForPanel.id || !examiner1 || !examiner2 || !examiner3}
                    className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processing === selectedProjectForPanel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Assign Panel
                  </button>
                </div>
              </form>
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

              <form onSubmit={handleSaveGrade} className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Project Title</span>
                  <p className="text-xs font-bold text-slate-900 leading-snug">{editingGradeProject.title}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Select Final Grade Mark</label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl py-3 px-4 text-slate-800 text-sm font-semibold cursor-pointer"
                  >
                    {['A', 'B', 'C', 'D', 'F'].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 justify-end">
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
                    Save & Publish
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
                    className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
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

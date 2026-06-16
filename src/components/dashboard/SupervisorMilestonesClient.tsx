'use client'

import { useState, useEffect } from 'react'
import { FileText, Target, Calendar, Plus, Trash2, Edit2, Loader2, Check, X, AlertTriangle, Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { addSupervisorMilestone, updateSupervisorMilestone, deleteSupervisorMilestone } from '@/app/supervisor/milestones/actions'

// Use dynamic import or direct import for framer-motion since it's used elsewhere
import { motion, AnimatePresence } from 'framer-motion'

interface Deliverable {
  id: string
  project_id: string
  title: string
  description: string
  due_date: string
  status: string
  grade?: string
  projectTitle: string
}

interface ProjectItem {
  id: string
  title: string
}

export default function SupervisorMilestonesClient({ 
  initialDeliverables,
  projectsList
}: { 
  initialDeliverables: Deliverable[]
  projectsList: ProjectItem[]
}) {
  const t = useTranslations('SupervisorMilestones')

  const [projects, setProjects] = useState<ProjectItem[]>(projectsList || [])
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialDeliverables || [])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  // Form State
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDueDate, setNewDueDate] = useState('')

  // Actions Loading State
  const [actionProcessing, setActionProcessing] = useState(false)
  const [toast, setToast] = useState('')

  // Modals State
  const [rescheduleMilestone, setRescheduleMilestone] = useState<Deliverable | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [deleteMilestone, setDeleteMilestone] = useState<Deliverable | null>(null)

  // Load sandbox data on mount if demo mode is enabled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      const isDemoMode = localStorage.getItem('demo_mode') === 'true'
      
      if (isDemoMode && data) {
        try {
          const parsed = JSON.parse(data)
          // Find active supervisor profile
          const activeEmail = localStorage.getItem('active_user_email')
          const supervisorProfile = (activeEmail ? parsed.profiles.find((p: any) => p.email.toLowerCase() === activeEmail.toLowerCase()) : null) || 
                                    parsed.profiles.find((p: any) => p.role === 'supervisor') || { id: 'demo-supervisor-id' }
          
          // Filter projects assigned to this supervisor
          const supervisorProjects = parsed.projects.filter((p: any) => p.instructor_id === supervisorProfile.id)
          const supervisorProjectIds = supervisorProjects.map((p: any) => p.id)
          
          const supervisorDeliverables = parsed.deliverables ? parsed.deliverables.filter((d: any) => supervisorProjectIds.includes(d.project_id)) : []
          
          // Enrich deliverables with project title
          const enrichedDeliverables = supervisorDeliverables.map((d: any) => {
            const proj = supervisorProjects.find((p: any) => p.id === d.project_id)
            return {
              ...d,
              projectTitle: proj ? proj.title : 'Unknown Project'
            }
          })
          
          setProjects(supervisorProjects)
          setDeliverables(enrichedDeliverables)
          if (supervisorProjects.length > 0) {
            setSelectedProjectId(supervisorProjects[0].id)
          }
        } catch (e) {
          console.error("Failed to parse localStorage sandbox db:", e)
        }
      } else {
        if (projectsList && projectsList.length > 0) {
          setSelectedProjectId(projectsList[0].id)
        }
      }
    }
  }, [projectsList, initialDeliverables])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  // Filter deliverables for the selected project
  const projectDeliverables = deliverables.filter(d => d.project_id === selectedProjectId)

  // Calculate statistics
  const totalCount = projectDeliverables.length
  const pendingCount = projectDeliverables.filter(d => d.status === 'submitted').length
  const gradedCount = projectDeliverables.filter(d => d.status === 'graded').length

  const syncSandboxDb = async (action: 'add' | 'update' | 'delete', payload: any) => {
    if (typeof window === 'undefined') return
    const storageKey = 'seniorproj_sandbox_db'
    const data = localStorage.getItem(storageKey)
    if (!data) return
    try {
      const parsed = JSON.parse(data)
      if (!parsed.deliverables) {
        parsed.deliverables = []
      }
      
      if (action === 'add') {
        parsed.deliverables.push(payload)
      } else if (action === 'update') {
        parsed.deliverables = parsed.deliverables.map((d: any) =>
          d.id === payload.id ? { ...d, ...payload } : d
        )
      } else if (action === 'delete') {
        parsed.deliverables = parsed.deliverables.filter((d: any) => d.id !== payload.id)
      }

      localStorage.setItem(storageKey, JSON.stringify(parsed))

      await fetch('/api/sandbox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      }).catch(() => {})
    } catch (e) {
      console.error("Failed to sync sandbox database:", e)
    }
  }

  // Action handlers
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProjectId) return
    if (!newTitle.trim() || !newDueDate) {
      alert("Title and Due Date are required.")
      return
    }

    setActionProcessing(true)

    // Call server action to write to live db
    const res = await addSupervisorMilestone(selectedProjectId, newTitle, newDescription, newDueDate)

    // Build the payload representing the new deliverable
    const newId = res.success && res.data?.id ? res.data.id : `deliv-${Date.now()}`
    const project = projects.find(p => p.id === selectedProjectId)
    const newDeliverable: Deliverable = {
      id: newId,
      project_id: selectedProjectId,
      title: newTitle,
      description: newDescription || 'No description provided.',
      due_date: new Date(newDueDate).toISOString(),
      status: 'todo',
      projectTitle: project ? project.title : 'Unknown Project'
    }

    // Sync sandbox fallback
    await syncSandboxDb('add', {
      id: newDeliverable.id,
      project_id: newDeliverable.project_id,
      title: newDeliverable.title,
      description: newDeliverable.description,
      due_date: newDeliverable.due_date,
      status: newDeliverable.status,
      created_at: new Date().toISOString()
    })

    // Update local React state
    setDeliverables(prev => [...prev, newDeliverable])
    showToast(t('toast_added'))

    // Reset Form
    setNewTitle('')
    setNewDescription('')
    setNewDueDate('')
    setActionProcessing(false)
  }

  const handleReschedule = async () => {
    if (!rescheduleMilestone || !rescheduleDate) return
    setActionProcessing(true)

    // Call server action to update live db
    const res = await updateSupervisorMilestone(rescheduleMilestone.id, rescheduleMilestone.title, rescheduleMilestone.description, rescheduleDate)

    const updatedDateIso = new Date(rescheduleDate).toISOString()

    // Sync sandbox fallback
    await syncSandboxDb('update', {
      id: rescheduleMilestone.id,
      due_date: updatedDateIso,
      updated_at: new Date().toISOString()
    })

    // Update local React state
    setDeliverables(prev => prev.map(d => 
      d.id === rescheduleMilestone.id ? { ...d, due_date: updatedDateIso } : d
    ))

    showToast(t('toast_updated'))
    setRescheduleMilestone(null)
    setRescheduleDate('')
    setActionProcessing(false)
  }

  const handleDelete = async () => {
    if (!deleteMilestone) return
    setActionProcessing(true)

    // Call server action to delete from live db
    const res = await deleteSupervisorMilestone(deleteMilestone.id)

    // Sync sandbox fallback
    await syncSandboxDb('delete', { id: deleteMilestone.id })

    // Update local React state
    setDeliverables(prev => prev.filter(d => d.id !== deleteMilestone.id))

    showToast(t('toast_deleted'))
    setDeleteMilestone(null)
    setActionProcessing(false)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-20 text-slate-800 dark:text-slate-200 font-sans relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 right-8 z-50 bg-slate-900 text-white py-4 px-6 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-3 text-xs font-bold font-sans"
          >
            <Shield className="w-4.5 h-4.5 text-indigo-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            {t('academic_supervisor')}
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('milestone_management')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('subtitle')}
          </p>
        </div>

        {/* Project Selector dropdown */}
        <div className="flex flex-col gap-1 shrink-0 w-full sm:w-64">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('select_project')}
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none shadow-sm"
          >
            {projects.length === 0 ? (
              <option value="">No active projects</option>
            ) : (
              projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
            {t('total_milestones')}
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
            {t('pending_review')}
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-500">{pendingCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
            {t('graded_milestones')}
          </span>
          <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{gradedCount}</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Milestones Log (Timeline) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-[2rem] p-6 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {t('milestone_planner')}
          </h2>

          {!selectedProjectId ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold text-xs">
              Please select a project to manage milestones.
            </div>
          ) : projectDeliverables.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 font-bold text-xs">
              {t('empty_milestones')}
            </div>
          ) : (
            <div className="space-y-4">
              {projectDeliverables.map((item) => (
                <div 
                  key={item.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl gap-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-450 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                        {item.title}
                      </div>
                      {item.description && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {t('due_date_label')}: {new Date(item.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status and Action Buttons */}
                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                        item.status === 'graded' 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400'
                          : item.status === 'submitted'
                            ? 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400'
                            : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                      {item.grade && (
                        <span className="text-[9px] font-black text-indigo-800 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-1.5 py-0.5 rounded">
                          Grade: {item.grade}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'todo' ? (
                        <>
                          <button
                            onClick={() => {
                              setRescheduleMilestone(item)
                              setRescheduleDate(new Date(item.due_date).toISOString().split('T')[0])
                            }}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                          >
                            {t('reschedule')}
                          </button>
                          <button
                            onClick={() => setDeleteMilestone(item)}
                            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs"
                          >
                            {t('delete')}
                          </button>
                        </>
                      ) : item.status === 'submitted' ? (
                        <a 
                          href={`/supervisor/projects/${item.project_id}`}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                        >
                          {t('review')}
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add Milestone Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-[2rem] p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {t('create_milestone')}
            </h3>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                  {t('title_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('title_placeholder')}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  disabled={!selectedProjectId || actionProcessing}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                  {t('description_label')}
                </label>
                <textarea
                  placeholder={t('desc_placeholder')}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={!selectedProjectId || actionProcessing}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all font-semibold resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                  {t('due_date_label')}
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  disabled={!selectedProjectId || actionProcessing}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedProjectId || actionProcessing || !newTitle.trim() || !newDueDate}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:text-slate-400 dark:disabled:text-slate-655 disabled:cursor-not-allowed mt-2"
              >
                {actionProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {t('add_button')}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* MODAL: RESCHEDULE */}
      <AnimatePresence>
        {rescheduleMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-250 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => {
                  setRescheduleMilestone(null)
                  setRescheduleDate('')
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer text-slate-400 dark:text-slate-550"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-2 mt-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {t('reschedule_milestone')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  Adjust due date for <strong>{rescheduleMilestone.title}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl p-4 flex flex-col gap-3 mt-4">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest block">
                  {t('due_date_label')}
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleMilestone(null)
                    setRescheduleDate('')
                  }}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleReschedule}
                  disabled={actionProcessing || !rescheduleDate}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {actionProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {t('save_changes')}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-250 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => setDeleteMilestone(null)}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer text-slate-400 dark:text-slate-550"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="text-center space-y-4 pt-4">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-black text-slate-900 dark:text-white leading-snug">
                    {t('delete')} "{deleteMilestone.title}"?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    {t('confirm_delete')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteMilestone(null)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionProcessing}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {actionProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {t('delete')}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

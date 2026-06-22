'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Users, 
  HelpCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Search, 
  Bell, 
  X, 
  Briefcase, 
  Building2, 
  GitBranch, 
  Eye, 
  ArrowRight, 
  Code, 
  Leaf, 
  Megaphone, 
  Copy, 
  Check, 
  FileDown,
  ChevronRight,
  TrendingUp,
  Network,
  Users2,
  FileSignature,
  Sliders,
  AlertTriangle
} from 'lucide-react'


import { useTrack } from '@/components/providers/TrackProvider'
import ProjectDescription from '@/components/project/ProjectDescription'

interface StudentDashboardClientProps {
  initialProfile: {
    full_name: string | null
    role: string | null
  } | null
  initialProjects: any[] | null
}

interface SoloTask {
  id: string
  text: string
  desc: string
  completed: boolean
}

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

export default function StudentDashboardClient({ 
  initialProfile, 
  initialProjects 
}: StudentDashboardClientProps) {
  const { trackMode } = useTrack()
  const [projectList, setProjectList] = useState<any[]>(initialProjects || [])
  const [profile, setProfile] = useState<any>(initialProfile)

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile)
    if (initialProjects) setProjectList(initialProjects)
  }, [initialProjects, initialProfile])

  // Differentiate projects by track: capstone vs industry
  const activeProject = trackMode === 'thesis' 
    ? (projectList.find(p => p.origin === 'student' || p.origin === 'academic') || null)
    : (projectList.find(p => p.origin === 'industry') || null)



  const hasActiveProject = activeProject !== null && activeProject.status !== 'rejected'

  // Dynamic metrics calculations based on activeProject.deliverables
  const deliverables = activeProject?.deliverables || []
  const totalCount = deliverables.length
  const completedCount = deliverables.filter((d: any) => d.status === 'graded' || d.status === 'completed').length
  const submittedCount = deliverables.filter((d: any) => d.status === 'submitted').length
  
  const progressPercent = totalCount > 0 
    ? Math.round(((completedCount + submittedCount) / totalCount) * 105) > 100 
      ? 100 
      : Math.round(((completedCount + submittedCount) / totalCount) * 100) 
    : 0

  const overdueCount = deliverables.filter((d: any) => {
    return d.status === 'todo' && d.due_date && new Date(d.due_date).getTime() < Date.now()
  }).length
  
  const healthPercent = Math.max(0, 100 - overdueCount * 25)

  let healthLabel = 'Excellent'
  let healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-100'
  let healthStroke = '#10b981'

  if (healthPercent < 50) {
    healthLabel = 'Critical'
    healthColor = 'text-rose-600 bg-rose-50 border-rose-100'
    healthStroke = '#ef4444'
  } else if (healthPercent < 75) {
    healthLabel = 'At Risk'
    healthColor = 'text-amber-600 bg-amber-50 border-amber-100'
    healthStroke = '#f59e0b'
  } else if (healthPercent < 90) {
    healthLabel = 'Good'
    healthColor = 'text-blue-600 bg-blue-50 border-blue-100'
    healthStroke = '#3b82f6'
  }
  
  
  // Interactive features states
  const [nudgeAlert, setNudgeAlert] = useState(false)
  const [meetingAlert, setMeetingAlert] = useState(false)
  const [pairingMtgId, setPairingMtgId] = useState<string | null>(null)
  const [pairingSuccess, setPairingSuccess] = useState(false)

  // Solo Task Checklist (localStorage persisted)
  const [soloTasks, setSoloTasks] = useState<SoloTask[]>([
    { id: '1', text: 'Scrape Dialect-A Dataset', desc: 'Gathering 10k sentences from verified archives.', completed: true },
    { id: '2', text: 'Baseline Model Config', desc: 'Initial training run with vanilla BERT.', completed: true },
    { id: '3', text: 'Optimize Hyperparameters', desc: 'Iterate on learning rate and dropout ratios.', completed: false },
    { id: '4', text: 'Write Ch. 3: Methodology', desc: 'Document architectural changes to Transformer layers.', completed: false },
    { id: '5', text: 'Final Evaluation Metrics', desc: 'Calculate F1 scores across three linguistic subsets.', completed: false }
  ])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectstation_solo_tasks')
      if (saved) {
        try {
          setSoloTasks(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to parse saved solo tasks', e)
        }
      }
    }
  }, [])

  const saveSoloTasks = (newTasks: SoloTask[]) => {
    setSoloTasks(newTasks)
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectstation_solo_tasks', JSON.stringify(newTasks))
    }
  }

  const handleToggleTask = (id: string) => {
    const updated = soloTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    saveSoloTasks(updated)
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return

    const newItem: SoloTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      desc: newTaskDesc.trim() || 'Custom added task.',
      completed: false
    }

    const updated = [...soloTasks, newItem]
    saveSoloTasks(updated)
    setNewTaskText('')
    setNewTaskDesc('')
    setIsAddingTask(false)
  }

    // Hook global search bridge triggers to switch dashboard displays dynamically
    // removed setTrackMode usage inside handleGlobalSearch as trackMode is controlled by TrackContext now.
    // To wire it up fully we would need to get setTrackMode from useTrack().
    const { setTrackMode: contextSetTrackMode } = useTrack()
    useEffect(() => {
      const handleGlobalSearch = (e: Event) => {
        const customEvent = e as CustomEvent
        const query = (customEvent.detail || '').toLowerCase()
        if (query.includes('thesis') || query.includes('solo')) {
          contextSetTrackMode('thesis')
        } else if (query.includes('ind') || query.includes('client')) {
          contextSetTrackMode('industry')
        } else if (query.includes('admin') || query.includes('risk')) {
          contextSetTrackMode('examiner_panel')
        } else if (query.includes('coord') || query.includes('pairing')) {
          contextSetTrackMode('coordinator')
        }
      }
      window.addEventListener('global-search', handleGlobalSearch)
      return () => {
        window.removeEventListener('global-search', handleGlobalSearch)
      }
    }, [contextSetTrackMode])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 text-slate-800 font-sans relative">
      {/* ===== PORTAL VIEWS SWITCH ENGINE ===== */}
      <AnimatePresence mode="wait">
        
        {/* ================== MODE 1: STUDENT INDUSTRY TRACK (Screenshot 4) ================== */}
        {trackMode === 'industry' && (
          <motion.div
            key="industry"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {!hasActiveProject ? (
              <div className="space-y-6">
                {/* Placeholder Health Dashboards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 pointer-events-none select-none">
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Health</span>
                      <span className="text-2xl font-black text-slate-900 mt-2 block">--%</span>
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-3">Task Velocity</span>
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-1">Progress Trend</span>
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                </div>

                <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm mt-8 space-y-5">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Waiting for Allocation</h2>
                    <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                      Your Instructor will assign you to an Industry Project shortly. Project health index and progress graphs will become active once your team allocation is finalized.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#0c59db] uppercase tracking-widest block">
                      YEAR 3 • INDUSTRY TRACK
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{activeProject.title}</h1>
                    <ProjectDescription description={activeProject.description} className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl" />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 shrink-0 text-center">
                    <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Status</span>
                    <span className="text-xs font-black text-emerald-600 uppercase">{activeProject.status}</span>
                  </div>
                </div>

                {/* Project Health Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Health index gauge */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Health</span>
                      <span className="text-2xl font-black text-slate-900 mt-2 block">{healthPercent}%</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border mt-1 ${healthColor}`}>
                        {healthLabel}
                      </span>
                    </div>
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                        <circle cx="40" cy="40" r="32" stroke={healthStroke} strokeWidth="6" fill="transparent" strokeDasharray="201" strokeDashoffset={201 - (201 * healthPercent) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850">{healthPercent}%</div>
                    </div>
                  </div>

                  {/* Card 2: Total Progress */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Total Progress</span>
                      <span className="text-2xl font-black text-slate-900 mt-2 block">{progressPercent}%</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100 mt-1">
                        In Motion
                      </span>
                    </div>
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                        <circle cx="40" cy="40" r="32" stroke="#0c59db" strokeWidth="6" fill="transparent" strokeDasharray="201" strokeDashoffset={201 - (201 * progressPercent) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850">{progressPercent}%</div>
                    </div>
                  </div>

                  {/* Card 3: Project Roles Metadata */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Allocation</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                        <span className="text-slate-400 font-semibold">Supervisor</span>
                        <span className="text-slate-800 font-bold truncate max-w-[150px]" title={activeProject.supervisor?.full_name || 'Pending Matching...'}>
                          {activeProject.supervisor?.full_name || 'Pending Matching...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Industry Partner</span>
                        <span className="text-slate-800 font-bold truncate max-w-[150px]" title={activeProject.partner?.full_name || 'Pending Matching...'}>
                          {activeProject.partner?.full_name || 'Pending Matching...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ================== MODE 2: STUDENT ACADEMIC THESIS TRACK (Screenshot 5) ================== */}
        {trackMode === 'thesis' && (
          <motion.div
            key="thesis"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {!hasActiveProject ? (
              <div className="space-y-6">
                {/* Placeholder Health Dashboards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 pointer-events-none select-none">
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Health</span>
                      <span className="text-2xl font-black text-slate-900 mt-2 block">--%</span>
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-3">Task Velocity</span>
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-1">Progress Trend</span>
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                </div>

                <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm mt-8 space-y-5">
                  <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-[#a75d24] rounded-3xl flex items-center justify-center mx-auto shadow-md">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {activeProject?.status === 'rejected' ? 'Proposal Rejected' : 'Health Telemetry Unavailable'}
                    </h2>
                    <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                      {activeProject?.status === 'rejected' 
                        ? 'Your previous Capstone Proposal was rejected by the instructor. Please visit the Milestones page to submit a new proposal.'
                        : "You haven't submitted a Capstone Proposal yet. Project health index and progress graphs will become active once you start your project."}
                    </p>
                  </div>
                  <Link href="/student/milestones" className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all">
                    <Plus className="w-4 h-4" />
                    Start Capstone Project in Milestones
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#a75d24] uppercase tracking-widest block">
                      YEAR 4 • CAPSTONE TRACK
                    </span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{activeProject.title}</h1>
                    <ProjectDescription description={activeProject.description} className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fdf5f0] text-[#a75d24] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#a75d24]/20">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Solo Track
                    </span>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Status</span>
                      <span className="text-xs font-black text-[#a75d24] uppercase">{activeProject.status}</span>
                    </div>
                  </div>
                </div>

                {/* Project Health Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Health index gauge */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Health</span>
                      <span className="text-2xl font-black text-slate-900 mt-2 block">{healthPercent}%</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border mt-1 ${healthColor}`}>
                        {healthLabel}
                      </span>
                    </div>
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                        <circle cx="40" cy="40" r="32" stroke={healthStroke} strokeWidth="6" fill="transparent" strokeDasharray="201" strokeDashoffset={201 - (201 * healthPercent) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850">{healthPercent}%</div>
                    </div>
                  </div>

                  {/* Card 2: Total Progress */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Total Progress</span>
                      <span className="text-2xl font-black text-slate-900 mt-2 block">{progressPercent}%</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#fdf5f0] text-[#a75d24] border border-[#a75d24]/10 mt-1">
                        In Progress
                      </span>
                    </div>
                    <div className="relative w-20 h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="32" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                        <circle cx="40" cy="40" r="32" stroke="#a75d24" strokeWidth="6" fill="transparent" strokeDasharray="201" strokeDashoffset={201 - (201 * progressPercent) / 100} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850">{progressPercent}%</div>
                    </div>
                  </div>

                  {/* Card 3: Project Roles Metadata */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
                    <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Thesis Allocation</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                        <span className="text-slate-400 font-semibold">Supervisor</span>
                        <span className="text-slate-800 font-bold truncate max-w-[150px]" title={activeProject.supervisor?.full_name || 'Pending Matching...'}>
                          {activeProject.supervisor?.full_name || 'Pending Matching...'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-semibold">Credits</span>
                        <span className="text-slate-800 font-bold">12 Units (Solo)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel Member Evaluation Comments & Defense Questions Section */}
                {activeProject.review_completed && (
                  <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-100/80 rounded-[2.5rem] p-8 shadow-sm space-y-6 mt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-650 flex items-center justify-center font-bold shadow-sm shrink-0">
                        🛡️
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Examiner Panel Vetting Feedback</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Academic Proposal Review</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6 pt-2">
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-3 shadow-inner">
                        <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Review Notes</span>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed whitespace-pre-line">
                          {activeProject.review_notes || 'No review comments left.'}
                        </p>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-3 shadow-inner">
                        <span className="text-[10px] font-black text-indigo-650 uppercase tracking-widest block">Defense Questions to Address</span>
                        <p className="text-sm font-semibold text-slate-750 leading-relaxed whitespace-pre-line">
                          {activeProject.review_questions || 'No defense questions raised.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ================== MODE 3: PANEL EXAMINER COHORT DASHBOARD ================== */}
        {trackMode === 'examiner_panel' && (
          <motion.div
            key="examiner_panel"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Panel Examiner Dashboard</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">Capstone Program Overview &amp; cohort metrics.</p>
            </div>

            {/* Panel Stats row widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Partner Count</span>
                <span className="text-2xl font-black text-slate-950 block">24</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Active Industry Liaisons</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Active Teams</span>
                <span className="text-2xl font-black text-slate-950 block">112</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Under supervision</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Graduating Seniors</span>
                <span className="text-2xl font-black text-slate-950 block">87</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Final Semester Phase</span>
              </div>
            </div>

            {/* Content grid columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column Areas (Progress overview & Activities) */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Team Progress Overview radial ring list */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Team Progress Overview</h3>
                    <button className="text-xs font-bold text-blue-600 hover:underline">View All Teams</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    
                    {/* Ring 1 */}
                    <div className="bg-[#f5f8fc] border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                      {/* Small radial ring SVG */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="18" stroke="#0c59db" strokeWidth="4.5" fill="transparent" strokeDasharray="113" strokeDashoffset="22" strokeLinecap="round" />
                        </svg>
                        <span className="text-[10px] font-black text-slate-900">80%</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Architecture Dept</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Design Phase Complete</p>
                      </div>
                    </div>

                    {/* Ring 2 */}
                    <div className="bg-[#f5f8fc] border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                      {/* Small radial ring SVG */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="18" stroke="#0c59db" strokeWidth="4.5" fill="transparent" strokeDasharray="113" strokeDashoffset="79" strokeLinecap="round" />
                        </svg>
                        <span className="text-[10px] font-black text-slate-900">30%</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Data Science Unit</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Awaiting Documentation</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Recent Activities list */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Recent Activity</h3>
                  
                  <div className="space-y-4 text-xs font-semibold text-slate-700">
                    
                    {/* Item 1 */}
                    <div className="flex gap-4 items-start border-b border-slate-50 pb-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-slate-800 leading-snug">
                          Team Alpha submitted <span className="font-bold">"Midterm Report V2"</span>
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">2 hours ago • Industry Track</span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f8b5a] flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-slate-800 leading-snug">
                          Sarah Jenkins marked <span className="font-bold">"User Interviews"</span> as complete
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">5 hours ago • Capstone Track</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Right Column Areas (At-risk alerts & Deadlines) */}
              <div className="space-y-6">
                
                {/* At risk alerts panel card */}
                <div className="bg-[#fee8e6] border border-[#fdd1cd] rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#ffd9d6] pb-3">
                    <AlertTriangle className="w-4.5 h-4.5 text-[#ea382a]" />
                    <h3 className="text-[10px] font-black text-[#ea382a] tracking-wider uppercase block">At-Risk Alerts</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Alert 1 */}
                    <div className="bg-white border border-red-100 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-slate-900">Team Echo-4</h4>
                        <span className="px-1.5 py-0.5 bg-red-100 text-[#ea382a] rounded text-[8px] font-black uppercase tracking-wider">
                          Stagnant
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        No activity recorded for 14 consecutive days. Milestone "Technical Spec" overdue.
                      </p>
                      <button 
                        onClick={() => {
                          setNudgeAlert(true)
                          setTimeout(() => setNudgeAlert(false), 2000)
                        }}
                        className="w-full py-2 bg-white border border-red-200 hover:bg-red-50 text-[#ea382a] rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer text-center"
                      >
                        {nudgeAlert ? 'Nudged!' : 'Nudge Team'}
                      </button>
                    </div>

                    {/* Alert 2 */}
                    <div className="bg-white border border-red-100 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-slate-900">David Chen (Solo)</h4>
                        <span className="px-1.5 py-0.5 bg-red-100 text-[#ea382a] rounded text-[8px] font-black uppercase tracking-wider">
                          Grad Risk
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Missing core documentation for final review. Predicted graduation completion &lt; 40%.
                      </p>
                      <button 
                        onClick={() => {
                          setMeetingAlert(true)
                          setTimeout(() => setMeetingAlert(false), 2000)
                        }}
                        className="w-full py-2 bg-white border border-red-200 hover:bg-red-50 text-[#ea382a] rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer text-center"
                      >
                        {meetingAlert ? 'Meeting Slotted!' : 'Schedule Meeting'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Deadlines timelines card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Milestone Deadlines</h3>
                  
                  <div className="space-y-4 relative pl-5 border-l-2 border-slate-100">
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-white" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Phase 1 Submissions</h4>
                        <span className="text-[8px] text-emerald-600 font-black uppercase block mt-0.5">COMPLETED OCT 12</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-white" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Interim Peer Review</h4>
                        <span className="text-[8px] text-blue-600 font-black uppercase block mt-0.5">DUE IN 3 DAYS</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ================== MODE 4: PARTNER COORDINATOR DASHBOARD (Screenshot 7) ================== */}
        {trackMode === 'coordinator' && (
          <motion.div
            key="coordinator"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coordinator Dashboard</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">Manage dual-track academic and industry projects.</p>
            </div>

            {/* Coordinator Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Pending Pairings</span>
                <span className="text-2xl font-black text-slate-950 block">14</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Sponsor Capacity</span>
                <span className="text-2xl font-black text-slate-950 block">82%</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Match Accuracy</span>
                <span className="text-2xl font-black text-slate-950 block">94%</span>
              </div>
            </div>

            {/* Coordinator pairing queue slot list */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Sponsor Pairing Queue</h3>
                <button className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px]">Filter</button>
              </div>

              <div className="space-y-4">
                {/* Pairing Item 1 */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 font-black">
                      CA
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">CloudScale AI</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Sponsor: Sarah Jenkins • Project: Distributed Graph Neural Networks
                      </p>
                      <div className="flex gap-1 mt-2">
                        {['AI/ML', 'PYTHON'].map(t => (
                          <span key={t} className="text-[8px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-150">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 self-end sm:self-auto w-full sm:w-auto">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">3 Student Teams Matching</span>
                    <button 
                      onClick={() => {
                        setPairingMtgId('CloudScale AI')
                        setPairingSuccess(true)
                        setTimeout(() => {
                          setPairingSuccess(false)
                          setPairingMtgId(null)
                        }, 1500)
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase transition-colors cursor-pointer w-full sm:w-auto text-center"
                    >
                      {pairingSuccess && pairingMtgId === 'CloudScale AI' ? 'Assigned!' : 'Assign Team'}
                    </button>
                  </div>
                </div>

                {/* Pairing Item 2 */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-black">
                      VS
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">VitaHealth Systems</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Sponsor: Marcus Thorne • Project: HIPAA Compliant Patient Portal
                      </p>
                      <div className="flex gap-1 mt-2">
                        {['SECURE', 'REACT'].map(t => (
                          <span key={t} className="text-[8px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-150">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 self-end sm:self-auto w-full sm:w-auto">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">1 Student Team Matching</span>
                    <button 
                      onClick={() => {
                        setPairingMtgId('VitaHealth Systems')
                        setPairingSuccess(true)
                        setTimeout(() => {
                          setPairingSuccess(false)
                          setPairingMtgId(null)
                        }, 1500)
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase transition-colors cursor-pointer w-full sm:w-auto text-center"
                    >
                      {pairingSuccess && pairingMtgId === 'VitaHealth Systems' ? 'Assigned!' : 'Assign Team'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
}

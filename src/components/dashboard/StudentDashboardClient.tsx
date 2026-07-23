'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Users, 
  Plus, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  X, 
  Briefcase, 
  Check, 
  ChevronRight, 
  AlertTriangle,
  Search,
  BookOpen,
  Mail,
  User,
  Sliders,
  TrendingUp,
  FileSignature
} from 'lucide-react'

import { useTrack } from '@/components/providers/TrackProvider'
import ProjectDescription from '@/components/project/ProjectDescription'

interface StudentDashboardClientProps {
  initialProfile: {
    full_name: string | null
    role: string | null
    email?: string | null
    department?: string | null
  } | null
  initialProjects: any[] | null
}

interface SoloTask {
  id: string
  text: string
  desc: string
  completed: boolean
}

export default function StudentDashboardClient({ 
  initialProfile, 
  initialProjects 
}: StudentDashboardClientProps) {
  const { trackMode, setTrackMode } = useTrack()
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
    ? Math.min(100, Math.round(((completedCount + submittedCount) / totalCount) * 100))
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
    healthStroke = '#2563eb'
  }
  
  const [nudgeAlert, setNudgeAlert] = useState(false)
  const [meetingAlert, setMeetingAlert] = useState(false)
  const [pairingMtgId, setPairingMtgId] = useState<string | null>(null)
  const [pairingSuccess, setPairingSuccess] = useState(false)

  // Collapsible and Closeable Sidebar Widget States
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false)
  const [isProfileClosed, setIsProfileClosed] = useState(false)

  // Solo Task Checklist (localStorage persisted)
  const [soloTasks, setSoloTasks] = useState<SoloTask[]>([
    { id: '1', text: 'Scrape Dialect-A Dataset', desc: 'Gathering 10k sentences from verified archives.', completed: true },
    { id: '2', text: 'Baseline Model Config', desc: 'Initial training run with vanilla BERT.', completed: true },
    { id: '3', text: 'Optimize Hyperparameters', desc: 'Iterate on learning rate and dropout ratios.', completed: false },
    { id: '4', text: 'Write Ch. 3: Methodology', desc: 'Document architectural changes to Transformer layers.', completed: false },
    { id: '5', text: 'Final Evaluation Metrics', desc: 'Calculate F1 scores across three linguistic subsets.', completed: false }
  ])

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

  // Hook global search bridge triggers to switch dashboard displays dynamically
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent
      const query = (customEvent.detail || '').toLowerCase()
      if (query.includes('thesis') || query.includes('solo')) {
        setTrackMode('thesis')
      } else if (query.includes('ind') || query.includes('client')) {
        setTrackMode('industry')
      } else if (query.includes('admin') || query.includes('risk')) {
        setTrackMode('examiner_panel')
      } else if (query.includes('coord') || query.includes('pairing')) {
        setTrackMode('coordinator')
      }
    }
    window.addEventListener('global-search', handleGlobalSearch)
    return () => {
      window.removeEventListener('global-search', handleGlobalSearch)
    }
  }, [setTrackMode])

  // Mini Calendar Calculations
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1)
  const currentDay = 23 // July 23, 2026

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 text-slate-800 font-sans relative">
      
      {/* Search & Greeting Row (LMS Dashboard Concept) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Hello, {profile?.full_name || 'Student'}
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Let's make progress on your project today.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search from courses..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================== LEFT COLUMN: METRICS & GRAPHS (Takes 8 cols) ================== */}
        <div className="lg:col-span-8 space-y-6">
          
          <AnimatePresence mode="wait">
            
            {/* ================== MODE 1: STUDENT INDUSTRY TRACK ================== */}
            {trackMode === 'industry' && (
              <motion.div
                key="industry"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {!hasActiveProject ? (
                  <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
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
                ) : (
                  <>
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                        YEAR 3 • INDUSTRY TRACK
                      </span>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">{activeProject.title}</h2>
                      <ProjectDescription description={activeProject.description} className="text-xs text-slate-500 font-medium leading-relaxed mt-2" />
                    </div>

                    {/* Stats cards row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Health</span>
                        <span className="text-3xl font-black text-slate-900 mt-2 block">{healthPercent}%</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border mt-2 ${healthColor}`}>
                          {healthLabel}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Total Progress</span>
                        <span className="text-3xl font-black text-[#F59E0B] mt-2 block">{progressPercent}%</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100 mt-2">
                          In Motion
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Deliverables</span>
                        <span className="text-3xl font-black text-slate-900 mt-2 block">{completedCount} <span className="text-sm text-slate-400 font-semibold">/ {totalCount}</span></span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-650 border border-slate-100 mt-2">
                          Completed
                        </span>
                      </div>
                    </div>

                    {/* Performance Graph Section */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Hours Spent &amp; Velocity</span>
                        <div className="flex gap-4 text-[9px] font-black uppercase">
                          <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Study</span>
                          <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Exams</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        {/* Custom SVG Bar Chart */}
                        <svg className="w-full h-48" viewBox="0 0 400 200" preserveAspectRatio="none">
                          <line x1="20" y1="20" x2="380" y2="20" stroke="#f8fafc" strokeWidth="1" />
                          <line x1="20" y1="70" x2="380" y2="70" stroke="#f8fafc" strokeWidth="1" />
                          <line x1="20" y1="120" x2="380" y2="120" stroke="#f8fafc" strokeWidth="1" />
                          <line x1="20" y1="170" x2="380" y2="170" stroke="#e2e8f0" strokeWidth="1.5" />
                          
                          <rect x="50" y="80" width="20" height="90" rx="3" fill="#2563eb" opacity="0.85" />
                          <rect x="50" y="120" width="20" height="50" rx="3" fill="#F59E0B" />
                          
                          <rect x="120" y="50" width="20" height="120" rx="3" fill="#2563eb" opacity="0.85" />
                          <rect x="120" y="90" width="20" height="80" rx="3" fill="#F59E0B" />
                          
                          <rect x="190" y="30" width="20" height="140" rx="3" fill="#2563eb" opacity="0.85" />
                          <rect x="190" y="60" width="20" height="110" rx="3" fill="#F59E0B" />
                          
                          <rect x="260" y="70" width="20" height="100" rx="3" fill="#2563eb" opacity="0.85" />
                          <rect x="260" y="110" width="20" height="60" rx="3" fill="#F59E0B" />
                          
                          <rect x="330" y="90" width="20" height="80" rx="3" fill="#2563eb" opacity="0.85" />
                          <rect x="330" y="130" width="20" height="40" rx="3" fill="#F59E0B" />

                          <text x="60" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Jan</text>
                          <text x="130" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Feb</text>
                          <text x="200" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Mar</text>
                          <text x="270" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Apr</text>
                          <text x="340" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">May</text>
                        </svg>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ================== MODE 2: STUDENT ACADEMIC THESIS TRACK ================== */}
            {trackMode === 'thesis' && (
              <motion.div
                key="thesis"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                {!hasActiveProject ? (
                  <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm space-y-5">
                    <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-[#a75d24] rounded-3xl flex items-center justify-center mx-auto shadow-md">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {activeProject?.status === 'rejected' ? 'Proposal Rejected' : 'Proposal Required'}
                      </h2>
                      <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
                        {activeProject?.status === 'rejected' 
                          ? 'Your previous Capstone Proposal was rejected by the instructor. Please visit the Milestones page to submit a new proposal.'
                          : "You haven't submitted a Capstone Proposal yet. Project health index and progress graphs will become active once you start your project."}
                      </p>
                    </div>
                    <Link href="/student/milestones" className="inline-flex items-center gap-2 px-8 py-3 bg-blue-650 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all">
                      <Plus className="w-4 h-4" />
                      Submit Capstone Proposal
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="border-b border-slate-100 pb-4">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
                        YEAR 4 • CAPSTONE TRACK
                      </span>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">{activeProject.title}</h2>
                      <ProjectDescription description={activeProject.description} className="text-xs text-slate-500 font-medium leading-relaxed mt-2" />
                    </div>

                    {/* Stats cards row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Health</span>
                        <span className="text-3xl font-black text-slate-900 mt-2 block">{healthPercent}%</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border mt-2 ${healthColor}`}>
                          {healthLabel}
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Total Progress</span>
                        <span className="text-3xl font-black text-[#F59E0B] mt-2 block">{progressPercent}%</span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#fdf5f0] text-[#a75d24] border border-[#a75d24]/10 mt-2">
                          In Progress
                        </span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Milestones</span>
                        <span className="text-3xl font-black text-slate-900 mt-2 block">{completedCount} <span className="text-sm text-slate-400 font-semibold">/ {totalCount}</span></span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-650 border border-slate-100 mt-2">
                          Graded
                        </span>
                      </div>
                    </div>

                    {/* Performance Graph Section */}
                    <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Milestone Completion Curve</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-[9.5px] font-black text-slate-500 uppercase">Monthly</span>
                      </div>
                      <div className="pt-2">
                        {/* Custom SVG Performance Area Chart */}
                        <svg className="w-full h-48" viewBox="0 0 400 200" preserveAspectRatio="none">
                          <path d="M 20 170 Q 100 130, 200 90 T 380 40" fill="none" stroke="#2563eb" strokeWidth="3" />
                          <path d="M 20 170 Q 100 130, 200 90 T 380 40 L 380 170 L 20 170 Z" fill="url(#grad)" opacity="0.1" />
                          
                          <circle cx="20" cy="170" r="5" fill="#F59E0B" stroke="#white" strokeWidth="2" />
                          <circle cx="110" cy="125" r="5" fill="#F59E0B" stroke="#white" strokeWidth="2" />
                          <circle cx="200" cy="90" r="5" fill="#F59E0B" stroke="#white" strokeWidth="2" />
                          <circle cx="290" cy="65" r="5" fill="#F59E0B" stroke="#white" strokeWidth="2" />
                          <circle cx="380" cy="40" r="5" fill="#F59E0B" stroke="#white" strokeWidth="2" />

                          <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#2563eb" />
                              <stop offset="100%" stopColor="#ffffff" />
                            </linearGradient>
                          </defs>

                          <text x="20" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Oct</text>
                          <text x="110" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Dec</text>
                          <text x="200" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Feb</text>
                          <text x="290" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Apr</text>
                          <text x="380" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Jun</text>
                        </svg>
                      </div>
                    </div>
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
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Panel Examiner Dashboard</h1>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Capstone Program Overview &amp; cohort metrics.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Partner Count</span>
                    <span className="text-3xl font-black text-[#F59E0B] block">24</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">Active Industry Liaisons</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Active Teams</span>
                    <span className="text-3xl font-black text-slate-900 block">112</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">Under supervision</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Graduating Seniors</span>
                    <span className="text-3xl font-black text-slate-900 block">87</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-1">Final Semester Phase</span>
                  </div>
                </div>

                {/* Team Progress Overview radial rings */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Team Progress Overview</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="18" stroke="#2563eb" strokeWidth="4.5" fill="transparent" strokeDasharray="113" strokeDashoffset="22" strokeLinecap="round" />
                        </svg>
                        <span className="text-[10px] font-black text-slate-900">80%</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Architecture Dept</h4>
                        <p className="text-[9px] text-slate-450 font-semibold mt-0.5">Design Phase Complete</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="18" stroke="#2563eb" strokeWidth="4.5" fill="transparent" strokeDasharray="113" strokeDashoffset="79" strokeLinecap="round" />
                        </svg>
                        <span className="text-[10px] font-black text-slate-900">30%</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Data Science Unit</h4>
                        <p className="text-[9px] text-slate-450 font-semibold mt-0.5">Awaiting Documentation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================== MODE 4: PARTNER COORDINATOR DASHBOARD ================== */}
            {trackMode === 'coordinator' && (
              <motion.div
                key="coordinator"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Coordinator Dashboard</h1>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Manage dual-track academic and industry projects.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Pending Pairings</span>
                    <span className="text-3xl font-black text-[#F59E0B] block">14</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Sponsor Capacity</span>
                    <span className="text-3xl font-black text-slate-900 block">82%</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Match Accuracy</span>
                    <span className="text-3xl font-black text-slate-900 block">94%</span>
                  </div>
                </div>

                {/* Coordinator pairing queue slot list */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-[10px] font-black text-slate-450 tracking-wider uppercase block">Sponsor Pairing Queue</h3>
                    <button className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px]">Filter</button>
                  </div>

                  <div className="space-y-3">
                    {/* Pairing Item 1 */}
                    <div className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-650 flex items-center justify-center shrink-0 border border-orange-100 font-black text-xs">
                          CA
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-snug">CloudScale AI</h4>
                          <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                            Sponsor: Sarah Jenkins • Project: Distributed Graph Neural Networks
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setPairingMtgId('CloudScale AI')
                          setPairingSuccess(true)
                          setTimeout(() => {
                            setPairingSuccess(false)
                            setPairingMtgId(null)
                          }, 1500)
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer w-full sm:w-auto text-center"
                      >
                        {pairingSuccess && pairingMtgId === 'CloudScale AI' ? 'Assigned!' : 'Assign Team'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Project Details Meta Block (For Active Projects) */}
          {hasActiveProject && (trackMode === 'thesis' || trackMode === 'industry') && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Project Overview Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Supervisor Assignment</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">
                      {activeProject.supervisor?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'SP'}
                    </div>
                    <div>
                      <span className="text-slate-900 font-extrabold block leading-tight">{activeProject.supervisor?.full_name || 'Academic supervisor'}</span>
                      <span className="text-[10px] text-slate-400 leading-none">Supervisor matching confirmed</span>
                    </div>
                  </div>
                </div>

                {trackMode === 'industry' ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Industry Sponsor</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">
                        {activeProject.partner?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'IP'}
                      </div>
                      <div>
                        <span className="text-slate-900 font-extrabold block leading-tight">{activeProject.partner?.full_name || 'Industry partner'}</span>
                        <span className="text-[10px] text-slate-400 leading-none">Partner allocation confirmed</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Thesis Scope</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-black">
                        12
                      </div>
                      <div>
                        <span className="text-slate-900 font-extrabold block leading-tight">12 Credits (Solo Track)</span>
                        <span className="text-[10px] text-slate-400 leading-none">Full Academic Year</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ================== RIGHT COLUMN: PROFILE & TO-DO & CALENDAR (Takes 4 cols) ================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PROFILE CARD */}
          {!isProfileClosed && (
            <div className="bg-[#111827] text-white border border-white/5 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-blue-600/20 blur-2xl rounded-full" />
              <div className="absolute bottom-[-20%] left-[-20%] w-24 h-24 bg-amber-500/10 blur-xl rounded-full" />
              
              {/* Close Button */}
              <button
                onClick={() => setIsProfileClosed(true)}
                className="absolute top-4 right-4 z-20 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close profile card"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="relative z-10 text-center space-y-4">
                <div className="w-16 h-16 bg-[#F59E0B] text-[#111827] rounded-2xl flex items-center justify-center mx-auto shadow-md font-black text-xl">
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'S'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white leading-tight tracking-tight">{profile?.full_name || 'Student'}</h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/10 text-slate-350 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                    Student Lead
                  </span>
                </div>
              </div>

              <div className="relative z-10 border-t border-white/10 pt-4 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.email || 'student@ueab.ac.ke'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.department || 'Computer Science'}</span>
                </div>
              </div>
            </div>
          )}
          {isProfileClosed && (
            <button
              onClick={() => setIsProfileClosed(false)}
              className="w-full py-3 bg-[#111827] border border-white/10 text-white rounded-[2rem] text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Show Profile
            </button>
          )}

          {/* CALENDAR CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <button
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">July 2026</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCalendarCollapsed ? '' : 'rotate-90'}`} />
              </div>
            </button>
            {!isCalendarCollapsed && (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
                  <span></span><span></span><span></span>
                  {daysInMonth.map((day) => {
                    const isToday = day === currentDay
                    return (
                      <span 
                        key={day} 
                        className={`h-6 w-6 flex items-center justify-center rounded-lg mx-auto ${
                          isToday 
                            ? 'bg-blue-600 text-white font-black shadow-sm' 
                            : 'hover:bg-slate-100 cursor-pointer'
                        }`}
                      >
                        {day}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TO-DO CHECKLIST CARD - Tasks assigned by Supervisor */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">Assigned Tasks</span>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider">Supervisor Assigned</span>
            </div>

            <div className="space-y-3">
              {soloTasks.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => handleToggleTask(t.id)}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    t.completed 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 group-hover:border-blue-500 bg-white'
                  }`}>
                    {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <span className={`text-xs font-extrabold block leading-tight ${
                      t.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}>
                      {t.text}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold leading-none">{t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

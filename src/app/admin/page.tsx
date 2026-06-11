'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Clock, 
  Check, 
  Eye, 
  Award, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  X,
  ExternalLink,
  LayoutDashboard
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'evaluations' | 'presentations'>('overview')

  // Evaluation details dialog
  const [evaluatingProject, setEvaluatingProject] = useState<any>(null)
  const [evalNotes, setEvalNotes] = useState('')
  const [questions, setQuestions] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function initPanelDashboard() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Fetch user profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'admin') {
        window.location.href = `/${prof?.role || ''}`
        return
      }
      setProfile(prof)

      await fetchDashboardData(prof.id)
      setLoading(false)
    }

    initPanelDashboard()
  }, [])

  async function fetchDashboardData(userId?: string) {
    const activeUserId = userId || profile?.id
    let projs: any[] = []
    let allDeliverables: any[] = []
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
        .order('created_at', { ascending: false })
      if (error) throw error
      projs = data || []
      
      const { data: delivs, error: delivError } = await supabase
        .from('deliverables')
        .select('*')
      if (!delivError) {
        allDeliverables = delivs || []
      }
    } catch (err) {
      console.warn("Live Supabase fetch failed, reading from Sandbox db:", err)
    }

    // Always fallback/merge if we are in sandbox environment or Supabase is empty
    if (typeof window !== 'undefined') {
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          if ((projs.length === 0 || !projs.some(p => p.student)) && parsed.projects) {
            projs = parsed.projects.map((p: any) => {
              const student = parsed.profiles.find((pr: any) => pr.id === p.student_id)
              const instructor = parsed.profiles.find((pr: any) => pr.id === p.instructor_id)
              return {
                ...p,
                student: student ? { full_name: student.full_name, email: student.email } : null,
                instructor: instructor ? { full_name: instructor.full_name, email: instructor.email } : null
              }
            })
          }
          if (allDeliverables.length === 0 && parsed.deliverables) {
            allDeliverables = parsed.deliverables
          }
        } catch (e) {
          console.error("Error parsing sandbox db:", e)
        }
      }
    }

    // Filter out industry projects: keep only academic/capstone projects
    const capstoneOnly = projs.filter((p: any) => !p.industry_partner_id)
    
    // Filter to keep ONLY projects where this panel member is assigned in examiner_panel
    const assignedProjects = capstoneOnly.filter((p: any) => 
      p.examiner_panel && Array.isArray(p.examiner_panel) && p.examiner_panel.includes(activeUserId)
    )
    
    // Attach deliverables to projects
    const enriched = assignedProjects.map((p: any) => {
      return {
        ...p,
        deliverables: allDeliverables.filter((d: any) => d.project_id === p.id)
      }
    })
    
    setProjects(enriched)
  }

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

  // Handle final review and questions submission
  async function handleSubmitEvaluation(e: React.FormEvent) {
    e.preventDefault()
    if (!evaluatingProject) return
    setProcessing(evaluatingProject.id)

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          review_notes: evalNotes,
          review_questions: questions,
          review_completed: true
        })
        .eq('id', evaluatingProject.id)
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
            p.id === evaluatingProject.id 
              ? { ...p, review_notes: evalNotes, review_questions: questions, review_completed: true }
              : p
          )
          await syncLocalDb(parsed)
        }
      }
    }

    setSuccessMessage(`Committee review and questions submitted for "${evaluatingProject.title}"!`)
    setTimeout(() => setSuccessMessage(''), 5000)
    await fetchDashboardData(profile?.id)
    setEvaluatingProject(null)
    setEvalNotes('')
    setQuestions('')
    setProcessing(null)
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  // Core Statistics Calculation
  const pendingReviews = projects.filter(p => p.status === 'approved' && !p.review_completed).length
  const underReview = projects.filter(p => p.status === 'pending').length
  const reviewedCount = projects.filter(p => p.review_completed).length

  // Calculate Average Grade from instructor-assigned grades if they exist
  const scoresMap: Record<string, number> = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50 }
  const gradedProjects = projects.filter(p => p.grade)
  const averageScore = gradedProjects.length > 0 
    ? (gradedProjects.reduce((sum, p) => sum + (scoresMap[p.grade] || 85), 0) / gradedProjects.length).toFixed(1)
    : '89.5'

  return (
    <div className="p-8 pb-20 max-w-6xl mx-auto space-y-8 text-slate-800 font-sans">
      
      {successMessage && (
        <div className="fixed top-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center gap-3 z-50 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      <div className="space-y-8">
        
        {/* Mockup Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Capstone Evaluation Panel
              </h1>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {profile.full_name || 'Dr. Sarah Johnson'} - Senior Capstone Evaluator
              </p>
            </div>
          </div>
        </div>

        {/* Tab Sub-menu Menu */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-6 no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'projects', label: 'Senior Projects', icon: <Clock className="w-4 h-4" /> },
            { id: 'evaluations', label: 'My Evaluations', icon: <Award className="w-4 h-4" /> },
            { id: 'presentations', label: 'Presentations', icon: <Calendar className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 font-bold text-sm tracking-wide transition-all flex items-center gap-2 border-b-2 outline-none shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700 font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-650'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <>
                {/* Stats Cards Grid matching screenshot */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  
                  {/* Card 1: Pending Reviews */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending Reviews</span>
                      <span className="text-3xl font-black text-slate-900">{pendingReviews}</span>
                      <span className="text-[9px] font-extrabold text-amber-600 uppercase flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> Final submissions
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 2: Under Review */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Under Review</span>
                      <span className="text-3xl font-black text-slate-900">{underReview}</span>
                      <span className="text-[9px] font-extrabold text-purple-600 uppercase flex items-center gap-1 mt-1">
                        <Eye className="w-3.5 h-3.5" /> Currently evaluating
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0 shadow-inner">
                      <Eye className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 3: Reviewed */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reviewed</span>
                      <span className="text-3xl font-black text-slate-900">{reviewedCount}</span>
                      <span className="text-[9px] font-extrabold text-emerald-600 uppercase flex items-center gap-1 mt-1">
                        <Check className="w-3.5 h-3.5" /> Approved Vettings
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card 4: Avg Project Grade */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Avg Project Grade</span>
                      <span className="text-3xl font-black text-slate-900">{averageScore}</span>
                      <span className="text-[9px] font-extrabold text-blue-600 uppercase flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Gradings by Instructor
                      </span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-inner">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>

                </div>

                {/* Colored Shortcut Cards matching layout exactly */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Card 1: Review Capstone Projects (Blue Gradient) */}
                  <div 
                    onClick={() => setActiveTab('evaluations')}
                    className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white rounded-[2rem] p-6 shadow-lg shadow-blue-500/25 flex flex-col justify-between h-44 cursor-pointer select-none transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/30 border border-blue-500/35"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight leading-tight">Review Capstone Projects</h3>
                      <p className="text-[11px] text-blue-100 mt-1.5 font-bold uppercase tracking-wider">{pendingReviews} awaiting evaluation</p>
                    </div>
                  </div>

                  {/* Card 2: Final Presentations (Purple Gradient) */}
                  <div 
                    onClick={() => setActiveTab('presentations')}
                    className="bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-800 text-white rounded-[2rem] p-6 shadow-lg shadow-purple-500/25 flex flex-col justify-between h-44 cursor-pointer select-none transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-500/30 border border-purple-500/35"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight leading-tight">Final Presentations</h3>
                      <p className="text-[11px] text-purple-100 mt-1.5 font-bold uppercase tracking-wider">Upcoming defenses</p>
                    </div>
                  </div>

                  {/* Card 3: Outstanding Projects (Green Gradient) */}
                  <div 
                    onClick={() => setActiveTab('projects')}
                    className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-850 text-white rounded-[2rem] p-6 shadow-lg shadow-emerald-500/25 flex flex-col justify-between h-44 cursor-pointer select-none transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-emerald-500/30 border border-emerald-500/35"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight leading-tight">Outstanding Projects</h3>
                      <p className="text-[11px] text-emerald-100 mt-1.5 font-bold uppercase tracking-wider">Top capstone teams</p>
                    </div>
                  </div>

                </div>

                {/* Submissions Section */}
                <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Senior Capstone Submissions</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          <th className="pb-3 px-2">Student</th>
                          <th className="pb-3 px-2">Project Title</th>
                          <th className="pb-3 px-2">Review Status</th>
                          <th className="pb-3 px-2 text-right">Evaluation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {projects.map((proj) => (
                          <tr key={proj.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-4 px-2">{proj.student?.full_name || 'Individual Student'}</td>
                            <td className="py-4 px-2 max-w-xs truncate font-bold text-slate-900">{proj.title}</td>
                            <td className="py-4 px-2">
                              {proj.review_completed ? (
                                <span className="px-2 py-0.5 bg-emerald-500 border border-emerald-600/20 text-white rounded text-[10px] font-extrabold uppercase">
                                  Reviewed
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 rounded text-[10px] font-extrabold uppercase tracking-wide">
                                  Pending Review
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-2 text-right">
                              <button
                                onClick={() => {
                                  setEvaluatingProject(proj)
                                  setEvalNotes(proj.review_notes || '')
                                  setQuestions(proj.review_questions || '')
                                }}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                              >
                                {proj.review_completed ? 'Revise Review' : 'Review'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SENIOR PROJECTS */}
            {activeTab === 'projects' && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Senior Capstone Directory</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Audit current cohort research papers, source configurations, and advisor alignments.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map((p) => (
                    <div key={p.id} className="border border-slate-200 p-5 rounded-2xl flex flex-col justify-between min-h-40">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                            {p.student?.full_name || 'Solo Student'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700">
                            CAPSTONE
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-850 mt-2 leading-snug line-clamp-2">{p.title}</h4>
                      </div>
                      <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-[10px] font-bold text-slate-500">
                        <span>Advisor: {p.instructor?.full_name || 'Pending assignment'}</span>
                        <span className="uppercase font-black text-slate-700">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MY EVALUATIONS */}
            {activeTab === 'evaluations' && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Committee Vetting & Reviews</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Submit presentation review feedback, raise vetting questions, and track capstone deliveries. Instructors record final grades.</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {projects.map((p) => (
                    <div key={p.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-sm font-black text-slate-850">{p.title}</h4>
                        <p className="text-xs text-slate-450 mt-0.5 font-bold uppercase">Student: {p.student?.full_name}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEvaluatingProject(p)
                          setEvalNotes(p.review_notes || '')
                          setQuestions(p.review_questions || '')
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        {p.review_completed ? `Revise Review` : 'Submit Review'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PRESENTATIONS */}
            {activeTab === 'presentations' && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Upcoming Capstone Defenses</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Calendar schedule of thesis presentations, final prototype demonstrations, and examiner reviews.</p>
                </div>
                <div className="relative border-l border-slate-200 pl-8 space-y-6 ml-3 py-1">
                  {projects.slice(0, 3).map((p, idx) => (
                    <div key={p.id} className="relative">
                      <div className="absolute -left-[41px] top-0.5 w-6 h-6 rounded-full bg-white border-4 border-indigo-650 shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-650" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-850">{p.title}</h4>
                        <p className="text-xs text-slate-500 font-semibold">Presentation defence by {p.student?.full_name || 'Cohort candidate'}</p>
                        <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 inline-block mt-2 tracking-wide">
                          Scheduled: June {12 + idx * 3}th, 2026 at {9 + idx}:00 AM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Scoring Modal Dialog */}
        <AnimatePresence>
          {evaluatingProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEvaluatingProject(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
              />
              
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col z-10"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="text-base font-black text-slate-900">Capstone Review & Vetting</h3>
                  <button 
                    onClick={() => setEvaluatingProject(null)}
                    className="p-1 hover:bg-slate-200 rounded-lg border border-slate-350"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmitEvaluation} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Project Selected</span>
                    <p className="text-xs font-bold text-slate-900 leading-snug">{evaluatingProject.title}</p>
                  </div>

                  {/* Student final submissions / deliverables review */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Student Deliverable Submissions</span>
                    {evaluatingProject.deliverables && evaluatingProject.deliverables.length > 0 ? (
                      <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                        {evaluatingProject.deliverables.map((d: any) => (
                          <div key={d.id} className="bg-white border border-slate-100 p-2.5 rounded-xl flex items-center justify-between gap-3 shadow-sm text-xs">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 truncate">{d.title}</p>
                              <span className="text-[9px] text-slate-450 uppercase font-black">Status: {d.status}</span>
                            </div>
                            {d.submission_url ? (
                              <a
                                href={d.submission_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-lg text-[10px] transition-colors shrink-0"
                              >
                                <span>View URL</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">Not Uploaded</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-center text-xs text-slate-450 font-bold italic">
                        No submissions uploaded yet by the student team.
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl flex items-start gap-2.5 text-blue-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Committee Advisory Role</p>
                      <p className="text-[11px] text-blue-750 font-medium mt-0.5">
                        Panel members formulate vetting reviews and ask questions. The final letter grade will be assigned by the instructor.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Vetting Review Comments / Notes</label>
                    <textarea
                      rows={3}
                      value={evalNotes}
                      onChange={(e) => setEvalNotes(e.target.value)}
                      placeholder="Enter review committee feedback notes here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-xs font-semibold focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase text-slate-450 tracking-wider">Questions for Students</label>
                    <textarea
                      rows={3}
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      placeholder="Enter review questions for the candidate to address..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-xs font-semibold focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 justify-end">
                    <button
                      type="button"
                      onClick={() => setEvaluatingProject(null)}
                      className="px-4 py-2.5 border border-slate-250 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processing === evaluatingProject.id}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {processing === evaluatingProject.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Submit Review
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

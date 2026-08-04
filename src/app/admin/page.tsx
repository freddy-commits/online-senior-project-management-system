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
  LayoutDashboard,
  UserPlus,
  ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'evaluations' | 'presentations' | 'assign_panel'>('overview')

  // Evaluation details dialog
  const [evaluatingProject, setEvaluatingProject] = useState<any>(null)
  const [evalNotes, setEvalNotes] = useState('')
  const [questions, setQuestions] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Panel assignment state
  const [examiners, setExaminers] = useState<any[]>([])
  const [assigningProject, setAssigningProject] = useState<any>(null)
  const [panelEx1, setPanelEx1] = useState('')
  const [panelEx2, setPanelEx2] = useState('')
  const [panelEx3, setPanelEx3] = useState('')

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

      let hasAccess = false
      if (prof.role === 'examiner' || prof.role === 'examiner_panel' || prof.role === 'admin') {
        hasAccess = true
      } else if (prof.role === 'supervisor' || prof.role === 'instructor') {
        const { data: examinerProjs } = await supabase
          .from('projects')
          .select('id')
          .contains('examiner_panel', [user.id])
          .limit(1)
        if (examinerProjs && examinerProjs.length > 0) {
          hasAccess = true
        }
      }

      if (!hasAccess) {
        window.location.href = '/student/dashboard'
        return
      }
      setProfile(prof)

      await fetchDashboardData(prof.id, prof)
      setLoading(false)
    }

    initPanelDashboard()
  }, [])

  // Fetch examiners list for admin panel assignment
  useEffect(() => {
    async function loadExaminers() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, department')
        .in('role', ['examiner', 'examiner_panel', 'instructor', 'supervisor'])
      if (data) setExaminers(data)
    }
    loadExaminers()
  }, [])

  async function fetchDashboardData(userId?: string, userProf?: any) {
    const activeProfile = userProf || profile
    const activeUserId = userId || activeProfile?.id
    let projs: any[] = []
    let allDeliverables: any[] = []
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name, email)')
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

    // Filter to keep ONLY projects where this panel member is explicitly assigned by admin
    const isExaminerRole = activeProfile?.role === 'examiner' || activeProfile?.role === 'examiner_panel'
    const assignedProjects = isExaminerRole
      ? projs.filter((p: any) => {
          const isAssignedInPanel = p.examiner_panel && Array.isArray(p.examiner_panel) && p.examiner_panel.includes(activeUserId)
          const isAssignedAsExaminer = p.examiner_id === activeUserId
          return isAssignedInPanel || isAssignedAsExaminer
        })
      : projs
    
    // Attach deliverables to projects
    const enriched = assignedProjects.map((p: any) => {
      return {
        ...p,
        deliverables: allDeliverables.filter((d: any) => d.project_id === p.id)
      }
    })
    
    setProjects(enriched)
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

      // 1. Insert notification in Supabase
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: evaluatingProject.student_id,
          title: 'New Examiner Panel Feedback',
          message: `The examiner panel has completed their review of your project "${evaluatingProject.title}".`,
          type: 'system',
          created_at: new Date().toISOString()
        })
      if (notifError) console.warn("Live notification write failed:", notifError)

      // 2. Insert message in Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            sender_id: user.id,
            receiver_id: evaluatingProject.student_id,
            content: `[Examiner Panel Feedback]\nNotes: ${evalNotes}\nQuestions:\n${questions}`
          })
        if (msgError) console.warn("Live message write failed:", msgError)
      }
    } catch (err: any) {
      console.error("Supabase write failed:", err)
      alert("Failed to submit evaluation: " + (err.message || err))
    }

    // Notify via email and SMS
    try {
      const { sendNotificationEmail } = await import('@/lib/email/emailService')
      const { sendSMS } = await import('@/lib/sms/smsService')

      const studentEmail = evaluatingProject.student?.email
      const studentName = evaluatingProject.student?.full_name || 'Student'
      const loginUrl = typeof window !== 'undefined' ? window.location.origin : ''

      if (studentEmail) {
        await sendNotificationEmail({
          toEmail: studentEmail,
          toName: studentName,
          subject: 'Examiner Panel Vetting & Feedback Posted',
          bodyText: `Hi ${studentName},\n\nThe examiner panel has completed the evaluation of your project proposal: "${evaluatingProject.title}".\n\nReview Notes: ${evalNotes}\n\nDefense Questions to Address:\n${questions}\n\nPlease log in to your Student Dashboard to review this feedback: ${loginUrl}/login\n\nBest regards,\nProject Hub Administration`,
          bodyHtml: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;">
              <h2 style="color: #4f46e5; margin-bottom: 20px;">Examiner Panel Feedback Posted</h2>
              <p>Hi <strong>${studentName}</strong>,</p>
              <p>The examiner panel has evaluated your project proposal for <strong>"${evaluatingProject.title}"</strong> and submitted the following feedback:</p>
              <blockquote style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; margin: 16px 0;">
                <strong>Review Notes:</strong><br/>
                ${evalNotes.replace(/\n/g, '<br/>')}<br/><br/>
                <strong>Defense Questions:</strong><br/>
                ${questions.replace(/\n/g, '<br/>')}
              </blockquote>
              <p>Please log in to your Student Dashboard to review these notes and prepare your defense responses.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${loginUrl}/login" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Feedback</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;" />
              <p style="font-size: 11px; color: #a0aec0; text-align: center;">This is an automated notification from Project Station.</p>
            </div>
          `
        })
      }

      await sendSMS({
        recipientId: evaluatingProject.student_id,
        message: `Panel Vetting: Vetting feedback & defense questions have been posted for your capstone project: "${evaluatingProject.title}". Please log in to review.`
      })
    } catch (notifyErr) {
      console.error("Notification dispatch failed:", notifyErr)
    }

    setSuccessMessage(`Committee review and questions submitted for "${evaluatingProject.title}"!`)
    setTimeout(() => setSuccessMessage(''), 5000)
    await fetchDashboardData(profile?.id, profile)
    setEvaluatingProject(null)
    setEvalNotes('')
    setQuestions('')
    setProcessing(null)
  }

  // Admin: Assign Examiner Panel to a project
  async function handleAssignPanel(e: React.FormEvent) {
    e.preventDefault()
    if (!assigningProject) return
    setProcessing(assigningProject.id)
    const panelList = [panelEx1, panelEx2, panelEx3].filter(Boolean)
    if (panelList.length === 0) {
      alert('Please select at least one panel examiner.')
      setProcessing(null)
      return
    }
    try {
      const { error } = await supabase
        .from('projects')
        .update({ examiner_panel: panelList })
        .eq('id', assigningProject.id)
      if (error) throw error
      // Notify student
      await supabase.from('notifications').insert({
        user_id: assigningProject.student_id,
        title: 'Panel Examiners Assigned',
        message: `The System Administrator has assigned an examiner panel to your project "${assigningProject.title}".`,
        type: 'system',
        created_at: new Date().toISOString()
      })
      setSuccessMessage(`Panel examiners assigned to "${assigningProject.title}"!`)
      setTimeout(() => setSuccessMessage(''), 5000)
      setProjects(prev => prev.map(p => p.id === assigningProject.id ? { ...p, examiner_panel: panelList } : p))
    } catch (err: any) {
      alert('Failed to assign panel: ' + (err.message || err))
    }
    setAssigningProject(null)
    setPanelEx1('')
    setPanelEx2('')
    setPanelEx3('')
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
  const pendingReviews = projects.filter(p => !p.review_completed).length
  const underReview = projects.filter(p => (p.review_notes || p.review_questions) && !p.review_completed).length
  const reviewedCount = projects.filter(p => p.review_completed).length

  // Calculate Average Grade from instructor-assigned grades if they exist
  const scoresMap: Record<string, number> = { 'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50 }
  const gradedProjects = projects.filter(p => p.grade)
  const averageScore = gradedProjects.length > 0 
    ? (gradedProjects.reduce((sum, p) => sum + (scoresMap[p.grade] || 85), 0) / gradedProjects.length).toFixed(1)
    : 'N/A'

  return (
    <div className="p-4 md:p-8 pb-20 max-w-6xl mx-auto space-y-8 text-slate-800 font-sans">
      
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
            { id: 'assign_panel', label: 'Assign Examiners', icon: <UserPlus className="w-4 h-4" /> },
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
                        {projects.length > 0 ? (
                          projects.map((proj) => (
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
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                              No capstone projects assigned to your panel yet. The System Administrator will allocate projects to your panel for evaluation.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* TAB: ASSIGN EXAMINERS (Admin only) */}
            {activeTab === 'assign_panel' && (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Assign Panel Examiners</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">Select up to 3 faculty examiners for each approved capstone project. Assigned examiners will appear in their dedicated Examiner Dashboard.</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Admin Exclusive</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                        <th className="py-4 px-6">Project</th>
                        <th className="py-4 px-6">Student</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Assigned Panel</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {projects.filter(p => p.status === 'approved').length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-slate-400 font-bold text-xs uppercase tracking-wider">
                            No approved projects yet. Projects must be approved by the Instructor first.
                          </td>
                        </tr>
                      ) : (
                        projects.filter(p => p.status === 'approved').map((p) => {
                          const panelCount = Array.isArray(p.examiner_panel) ? p.examiner_panel.filter(Boolean).length : 0
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="py-4 px-6">
                                <span className="font-bold text-slate-900 block">{p.title}</span>
                              </td>
                              <td className="py-4 px-6">{p.student?.full_name || 'N/A'}</td>
                              <td className="py-4 px-6">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider">Approved</span>
                              </td>
                              <td className="py-4 px-6">
                                {panelCount > 0 ? (
                                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> {panelCount} Examiner{panelCount > 1 ? 's' : ''} Assigned
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-wider">Not Assigned</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-right">
                                <button
                                  onClick={() => {
                                    setAssigningProject(p)
                                    const existing = Array.isArray(p.examiner_panel) ? p.examiner_panel : []
                                    setPanelEx1(existing[0] || '')
                                    setPanelEx2(existing[1] || '')
                                    setPanelEx3(existing[2] || '')
                                  }}
                                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                                >
                                  {panelCount > 0 ? 'Reassign' : 'Assign Panel'}
                                </button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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

        {/* Assign Panel Modal */}
        <AnimatePresence>
          {assigningProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAssigningProject(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col z-10"
              >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Assign Panel Examiners</h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5 truncate max-w-xs">{assigningProject.title}</p>
                  </div>
                  <button onClick={() => setAssigningProject(null)} className="p-1 hover:bg-slate-200 rounded-lg border border-slate-300">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleAssignPanel} className="p-6 space-y-4">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Select up to 3 faculty examiners who will evaluate this project in their Examiner Dashboard.
                  </p>

                  <div className="space-y-3">
                    {[{ val: panelEx1, set: setPanelEx1, label: 'Panel Examiner 1' },
                      { val: panelEx2, set: setPanelEx2, label: 'Panel Examiner 2 (Optional)' },
                      { val: panelEx3, set: setPanelEx3, label: 'Panel Examiner 3 (Optional)' }
                    ].map(({ val, set, label }) => (
                      <div key={label}>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">{label}</label>
                        <select
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400/30 cursor-pointer"
                        >
                          <option value="">— Not selected —</option>
                          {examiners.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.full_name} ({ex.department || ex.role})</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2 justify-end border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAssigningProject(null)}
                      className="px-4 py-2.5 border border-slate-250 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processing === assigningProject.id}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {processing === assigningProject.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Save Panel Assignment
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

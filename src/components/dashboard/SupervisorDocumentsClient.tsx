'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Search, 
  ArrowUpRight, 
  Check, 
  X, 
  Shield,
  Activity,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'
import { supervisorUpdateDeliverableStatus, fetchSupervisorDocumentsData } from '@/app/supervisor/documents/actions'

interface SubmissionItem {
  id: string
  project_id: string
  project_title: string
  student_name: string
  student_email: string
  student_initials: string
  student_color: string
  document_title: string
  submitted_date: string
  instructor_status: 'Pending' | 'Reviewed' | 'Rejected'
  supervisor_status: 'Pending' | 'Approved' | 'Flagged'
  submission_url: string
  recommendation?: string
  grade?: string
}

interface ActivityLogItem {
  id: string
  document_title: string
  student_name: string
  action: 'Approved' | 'Flagged'
  timestamp: string
  details?: string
}

export default function SupervisorDocumentsClient({
  supervisorId,
  initialProjects,
  initialDeliverables,
  initialTeamMembers
}: {
  supervisorId: string
  initialProjects: any[]
  initialDeliverables: any[]
  initialTeamMembers: any[]
}) {
  const [projects, setProjects] = useState<any[]>(initialProjects)
  const [deliverables, setDeliverables] = useState<any[]>(initialDeliverables)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Flagged'>('all')
  
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  // Modals state
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isFlagOpen, setIsFlagOpen] = useState(false)
  const [isViewNoteOpen, setIsViewNoteOpen] = useState(false)

  // Form entries
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [actionProcessing, setActionProcessing] = useState(false)

  // Supervisor activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([])

  // Load sandbox fallback data & activity logs on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load activity logs
      const savedLogs = localStorage.getItem('seniorproj_supervisor_activity_log')
      if (savedLogs) {
        try {
          setActivityLogs(JSON.parse(savedLogs))
        } catch (e) {
          console.error("Failed to parse activity logs", e)
        }
      }

      // Check if sandbox local storage has active state and demo mode is true
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      const isDemoMode = localStorage.getItem('demo_mode') === 'true'
      if (isDemoMode && data) {
        try {
          const parsed = JSON.parse(data)
          // Find active supervisor profile
          const activeEmail = localStorage.getItem('active_user_email')
          const supervisorProfile = (activeEmail ? parsed.profiles.find((p: any) => p.email.toLowerCase() === activeEmail.toLowerCase()) : null) || 
                                    parsed.profiles.find((p: any) => p.role === 'supervisor') || { id: supervisorId }
          
          // Filter projects assigned to this supervisor (instructor_id = supervisorProfile.id)
          const supervisorProjects = parsed.projects.filter((p: any) => p.instructor_id === supervisorProfile.id)
          const supervisorProjectIds = supervisorProjects.map((p: any) => p.id)
          
          const supervisorDeliverables = parsed.deliverables ? parsed.deliverables.filter((d: any) => supervisorProjectIds.includes(d.project_id)) : []
          
          // Enrich projects with student profiles from mock DB
          const enrichedProjects = supervisorProjects.map((p: any) => {
            const studentProfile = parsed.profiles?.find((prof: any) => prof.id === p.student_id)
            return {
              ...p,
              student: studentProfile ? { full_name: studentProfile.full_name, email: studentProfile.email } : null
            }
          })
          
          setProjects(enrichedProjects)
          setDeliverables(supervisorDeliverables)
        } catch (e) {
          console.error("Failed to parse localStorage sandbox db:", e)
        }
      }
    }
  }, [supervisorId])

  // Sync to submissions whenever projects or deliverables change
  useEffect(() => {
    buildSubmissionList()
  }, [projects, deliverables])

  function getInitials(name: string) {
    return name
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .map(n => n.split(' ').map(part => part[0]).join(''))
      .join(' / ')
      .slice(0, 3)
      .toUpperCase() || 'U'
  }

  function getAvatarColor(name: string) {
    const colors = [
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-teal-100 text-teal-700 border-teal-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  function buildSubmissionList() {
    const items = deliverables
      .filter((d: any) => d.submission_url && d.submission_url.trim() !== '')
      .map((d: any) => {
        const project = projects.find((p: any) => p.id === d.project_id)
        
        let studentName = 'Unknown Student'
        let studentEmail = 'student@university.edu'

        if (project) {
          if (project.student) {
            studentName = project.student.full_name || 'Unknown Student'
            studentEmail = project.student.email || 'student@university.edu'
          } else if (project.team_id) {
            const teamMems = initialTeamMembers.filter((tm: any) => tm.team_id === project.team_id)
            if (teamMems.length > 0) {
              studentName = teamMems.map((tm: any) => tm.profiles?.full_name || 'Student').join(', ')
              studentEmail = teamMems.map((tm: any) => tm.profiles?.email || '').join(', ')
            }
          }
        }

        const docTitle = d.title || 'Untitled Document'
        const dateStr = d.created_at || d.updated_at || new Date().toISOString()
        const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })

        // Instructor Status mapping
        let instStatus: 'Pending' | 'Reviewed' | 'Rejected' = 'Pending'
        if (d.status === 'graded') {
          instStatus = 'Reviewed'
        } else if (d.status === 'rejected') {
          instStatus = 'Rejected'
        }

        // Supervisor Status mapping
        let supStatus: 'Pending' | 'Approved' | 'Flagged' = 'Pending'
        if (d.recommendation === 'APPROVED') {
          supStatus = 'Approved'
        } else if (d.recommendation?.startsWith('FLAGGED') || d.status === 'rejected') {
          supStatus = 'Flagged'
        }

        return {
          id: d.id,
          project_id: d.project_id,
          project_title: project?.title || 'Unknown Project',
          student_name: studentName,
          student_email: studentEmail,
          student_initials: getInitials(studentName),
          student_color: getAvatarColor(studentName),
          document_title: docTitle,
          submitted_date: formattedDate,
          instructor_status: instStatus,
          supervisor_status: supStatus,
          submission_url: d.submission_url,
          recommendation: d.recommendation || '',
          grade: d.grade || ''
        } as SubmissionItem
      })

    // Sort submissions: newest submissions first
    items.sort((a, b) => {
      const dateA = deliverables.find(d => d.id === a.id)?.created_at || ''
      const dateB = deliverables.find(d => d.id === b.id)?.created_at || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })

    setSubmissions(items)
  }

  const handleRefreshData = async () => {
    setLoading(true)
    const res = await fetchSupervisorDocumentsData(supervisorId)
    if (res.success) {
      setProjects(res.projects || [])
      setDeliverables(res.deliverables || [])
      showToast("Data synchronized with live database successfully!")
    } else {
      showToast("Sync failed: " + res.error)
    }
    setLoading(false)
  }

  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== 'all' && sub.supervisor_status !== statusFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = sub.student_name.toLowerCase().includes(q)
      const docMatch = sub.document_title.toLowerCase().includes(q)
      const projMatch = sub.project_title.toLowerCase().includes(q)
      if (!nameMatch && !docMatch && !projMatch) return false
    }

    return true
  })

  // Metrics
  const totalSupervised = projects.length
  const awaitingApproval = submissions.filter(s => s.instructor_status === 'Reviewed' && s.supervisor_status === 'Pending').length
  const approvedCount = submissions.filter(s => s.supervisor_status === 'Approved').length
  const flaggedCount = submissions.filter(s => s.supervisor_status === 'Flagged').length

  // Action handlers
  async function handleUpdateDeliverable(status: 'graded' | 'rejected', recText: string, gradeText: string | null) {
    if (!selectedSub) return
    setActionProcessing(true)

    // Call server action to update Supabase
    const res = await supervisorUpdateDeliverableStatus(selectedSub.id, status, gradeText, recText)

    // Sync sandbox fallback
    if (typeof window !== 'undefined') {
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          parsed.deliverables = parsed.deliverables.map((d: any) => {
            if (d.id === selectedSub.id) {
              return {
                ...d,
                status: status,
                grade: status === 'graded' ? gradeText : null,
                recommendation: recText,
                updated_at: new Date().toISOString()
              }
            }
            return d
          })
          localStorage.setItem(storageKey, JSON.stringify(parsed))
          
          await fetch('/api/sandbox/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }).catch(() => {})
        } catch (e) {
          console.error("Failed to write mock data:", e)
        }
      }
    }

    if (res.success) {
      const logStatus = status === 'graded' ? 'Approved' : 'Flagged'
      showToast(status === 'graded' 
        ? `Successfully approved "${selectedSub.document_title}"!` 
        : `Flagged "${selectedSub.document_title}" for revisions.`
      )

      // Add to activity logs
      const newLog: ActivityLogItem = {
        id: `log-${Date.now()}`,
        document_title: selectedSub.document_title,
        student_name: selectedSub.student_name,
        action: logStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString(),
        details: recText
      }
      const updatedLogs = [newLog, ...activityLogs].slice(0, 15) // Limit to 15 items
      setActivityLogs(updatedLogs)
      if (typeof window !== 'undefined') {
        localStorage.setItem('seniorproj_supervisor_activity_log', JSON.stringify(updatedLogs))
      }
      
      // Update local react states directly
      setDeliverables(prev => prev.map((d: any) => {
        if (d.id === selectedSub.id) {
          return {
            ...d,
            status: status,
            grade: status === 'graded' ? gradeText : null,
            recommendation: recText
          }
        }
        return d
      }))

      // Close all modals
      setIsApproveOpen(false)
      setIsFlagOpen(false)
      setSelectedSub(null)
      setGradeInput('')
      setFeedbackInput('')
    } else {
      showToast("Live save error (synced to sandbox fallback instead).")
      
      // Still update local react states for sandbox testing
      setDeliverables(prev => prev.map((d: any) => {
        if (d.id === selectedSub.id) {
          return {
            ...d,
            status: status,
            grade: status === 'graded' ? gradeText : null,
            recommendation: recText
          }
        }
        return d
      }))

      setIsApproveOpen(false)
      setIsFlagOpen(false)
      setSelectedSub(null)
      setGradeInput('')
      setFeedbackInput('')
    }
    setActionProcessing(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans relative">
      
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Academic Supervisor
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Document Oversight</h1>
          <p className="text-sm text-slate-500 font-medium font-sans">Review, approve, and flag milestones submitted by your project teams</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={handleRefreshData}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Sync Database
          </button>
          <div className="flex items-center gap-1.5 bg-[#EEF2FF] text-[#4F46E5] px-3.5 py-1.5 rounded-full border border-indigo-100 shadow-sm font-black text-xs uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            Supervisor
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Under supervision', value: totalSupervised, bg: 'bg-[#F7F7F5]', border: 'border-[#E7E5E4]/60', text: 'text-slate-950' },
          { label: 'Awaiting approval', value: awaitingApproval, bg: 'bg-[#FDFBF7]', border: 'border-[#F5EBE0]/60', text: 'text-[#D97706]' },
          { label: 'Approved', value: approvedCount, bg: 'bg-[#F7FBF9]', border: 'border-[#E6F3EC]/60', text: 'text-[#059669]' },
          { label: 'Flagged', value: flaggedCount, bg: 'bg-[#FDF8F8]', border: 'border-[#F9EBEB]/60', text: 'text-[#DC2626]' }
        ].map((card, i) => (
          <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[110px]`}>
            <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">{card.label}</span>
            <span className={`text-4xl font-black ${card.text} tracking-tight mt-3`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Two Column Layout for Table and Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Table - 8 Cols */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <h2 className="font-bold text-lg text-slate-900 font-sans">Supervised Submissions</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-250 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All statuses</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Flagged">Flagged</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, project or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-5">Student</th>
                    <th className="py-3.5 px-5">Document</th>
                    <th className="py-3.5 px-5">Advisor Review</th>
                    <th className="py-3.5 px-5">Supervisor Review</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredSubmissions.map((sub) => {
                    const isAdvisorPending = sub.instructor_status === 'Pending'

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/20 transition-colors">
                        {/* Student Details */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8.5 h-8.5 rounded-full ${sub.student_color} border flex items-center justify-center font-bold text-[10px] shadow-sm select-none shrink-0`}>
                              {sub.student_initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-extrabold text-slate-900 block truncate leading-tight">{sub.student_name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold truncate block mt-0.5 leading-tight">{sub.project_title}</span>
                            </div>
                          </div>
                        </td>

                        {/* Document Title */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 block truncate max-w-[200px]" title={sub.document_title}>
                              {sub.document_title}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Submitted: {sub.submitted_date}</span>
                          </div>
                        </td>

                        {/* Advisor/Instructor Review Status */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                            sub.instructor_status === 'Reviewed' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : sub.instructor_status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {sub.instructor_status}
                          </span>
                        </td>

                        {/* Supervisor Status */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                            sub.supervisor_status === 'Approved' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : sub.supervisor_status === 'Flagged'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {sub.supervisor_status}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <a 
                              href={
                                sub.submission_url?.startsWith('http')
                                  ? sub.submission_url
                                  : `/preview/document?file=${encodeURIComponent(sub.submission_url)}&title=${encodeURIComponent(sub.document_title)}`
                              } 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-sm"
                              title="Open Document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            {sub.supervisor_status === 'Approved' ? (
                              <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest px-2">Approved</span>
                            ) : sub.supervisor_status === 'Flagged' ? (
                              <button
                                onClick={() => {
                                  setSelectedSub(sub)
                                  setIsViewNoteOpen(true)
                                }}
                                className="px-3 py-1.5 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1"
                              >
                                View Note
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedSub(sub)
                                    setIsApproveOpen(true)
                                  }}
                                  disabled={isAdvisorPending}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 ${
                                    isAdvisorPending
                                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                  }`}
                                  title={isAdvisorPending ? "Advisor review is pending" : "Approve deliverable"}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedSub(sub)
                                    setIsFlagOpen(true)
                                  }}
                                  disabled={isAdvisorPending}
                                  className={`px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                                    isAdvisorPending ? 'text-slate-300 cursor-not-allowed border-slate-100' : 'text-rose-600 hover:text-rose-800 cursor-pointer'
                                  }`}
                                  title={isAdvisorPending ? "Advisor review is pending" : "Flag deliverable with recommendations"}
                                >
                                  Flag
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-20 text-slate-400 font-bold text-xs">
                No submissions found matching the criteria.
              </div>
            )}
          </div>
        </div>

        {/* Activity Log - 4 Cols */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-3xl p-6 shadow-sm border border-slate-800 flex flex-col min-h-[350px]">
          <h3 className="text-sm font-black text-white flex items-center gap-2 mb-6">
            <Activity className="w-4.5 h-4.5 text-indigo-400" />
            Supervisor Activity Log
          </h3>

          {activityLogs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Clock className="w-8 h-8 text-slate-700" />
              <p className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">No recent actions recorded</p>
              <p className="text-[9.5px] text-slate-500 font-semibold leading-relaxed">Approving or flagging deliverables will log entries here.</p>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1 scrollbar-thin">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-800/40 border border-slate-800/60 rounded-2xl flex flex-col gap-1.5 hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-extrabold text-slate-300 truncate max-w-[120px]">{log.student_name}</span>
                    <span className={`text-[8px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-md ${
                      log.action === 'Approved' 
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30' 
                        : 'bg-rose-950/40 text-rose-400 border-rose-800/30'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="text-[10.5px] font-bold text-white leading-snug">{log.document_title}</div>
                  <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold mt-1">
                    <span>{log.timestamp}</span>
                    {log.details && (
                      <span className="italic truncate max-w-[100px] text-slate-400">"{log.details}"</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: APPROVE CONFIRMATION / GRADE */}
      <AnimatePresence>
        {isApproveOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-6 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => {
                  setIsApproveOpen(false)
                  setSelectedSub(null)
                  setGradeInput('')
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-450"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">Approve Submission</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Reviewing <strong>{selectedSub.document_title}</strong> by <strong>{selectedSub.student_name}</strong>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Award Milestone Grade (Optional)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g. A, B+, Pass"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    maxLength={10}
                    className="flex-1 bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsApproveOpen(false)
                    setSelectedSub(null)
                    setGradeInput('')
                  }}
                  className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateDeliverable('graded', 'APPROVED', gradeInput || 'PASSED')}
                  disabled={actionProcessing}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm Approval
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: FLAG / REVISIONS REQUIRED */}
      <AnimatePresence>
        {isFlagOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-6 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => {
                  setIsFlagOpen(false)
                  setSelectedSub(null)
                  setFeedbackInput('')
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-450"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Flag Deliverable
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Request revisions on <strong>{selectedSub.document_title}</strong> from <strong>{selectedSub.student_name}</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Revision Feedback / Note</label>
                <textarea
                  placeholder="Explain what changes are required..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-xl p-4 text-xs font-semibold resize-none text-slate-800"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsFlagOpen(false)
                    setSelectedSub(null)
                    setFeedbackInput('')
                  }}
                  className="flex-1 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateDeliverable('rejected', 'FLAGGED: ' + feedbackInput, null)}
                  disabled={actionProcessing || !feedbackInput.trim()}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-350 disabled:cursor-not-allowed"
                >
                  {actionProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Send Flag
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VIEW NOTE */}
      <AnimatePresence>
        {isViewNoteOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-6 max-w-md w-full shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => {
                  setIsViewNoteOpen(false)
                  setSelectedSub(null)
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer text-slate-450"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-500" />
                  Supervisor Note
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Comments logged on <strong>{selectedSub.document_title}</strong>:
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-xs font-semibold text-slate-700 leading-relaxed italic">
                "{selectedSub.recommendation?.replace(/^FLAGGED:\s*/i, '') || 'No additional notes logged.'}"
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsViewNoteOpen(false)
                    setSelectedSub(null)
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

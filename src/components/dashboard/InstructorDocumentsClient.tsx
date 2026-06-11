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
  History, 
  FolderOpen, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  ArrowUpRight, 
  UploadCloud, 
  Check, 
  Trash2, 
  X, 
  Info,
  Shield,
  FileUp,
  Download,
  AlertTriangle,
  Award
} from 'lucide-react'
import { updateDeliverableStatusAdmin, updateProjectGradeAdmin, fetchInstructorDocumentsData } from '@/app/instructor/documents/actions'

// Submissions structure
interface SubmissionItem {
  id: string
  project_id: string
  student_name: string
  student_email: string
  student_initials: string
  student_color: string
  document_title: string
  type: 'Proposal' | 'Progress report' | 'Final document'
  submitted_date: string
  status: 'submitted' | 'graded' | 'rejected' // submitted = Pending, graded = Reviewed, rejected = Rejected
  submission_url: string
  grade?: string
  feedback?: string
}

interface ResourceFile {
  id: string
  name: string
  size: string
  uploadedAt: string
}

export default function InstructorDocumentsClient({
  initialProjects,
  initialDeliverables,
  initialTeamMembers
}: {
  initialProjects: any[]
  initialDeliverables: any[]
  initialTeamMembers: any[]
}) {
  // State
  const [projects, setProjects] = useState<any[]>(initialProjects)
  const [deliverables, setDeliverables] = useState<any[]>(initialDeliverables)
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded' | 'rejected'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Proposal' | 'Progress report' | 'Final document'>('all')
  
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  // Modals state
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  // Form entries
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')
  const [actionProcessing, setActionProcessing] = useState(false)

  // Resource upload state
  const [dragActive, setDragActive] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedResources, setUploadedResources] = useState<ResourceFile[]>([])

  // Load persisted resources and sandbox data fallback on mount
  useEffect(() => {
    // Load persisted uploaded resource documents
    if (typeof window !== 'undefined') {
      const savedResources = localStorage.getItem('seniorproj_uploaded_resources')
      if (savedResources) {
        try {
          setUploadedResources(JSON.parse(savedResources))
        } catch (e) {
          console.error("Failed to parse resource files", e)
        }
      }

      // Check if sandbox local storage has active state
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      const isDemoMode = localStorage.getItem('demo_mode') === 'true'
      if (isDemoMode && data) {
        try {
          const parsed = JSON.parse(data)
          
          // Seed the 5 mockup submissions if database state has no deliverables with submissions
          const hasSubmissions = parsed.deliverables?.some((d: any) => d.submission_url)
          if (!hasSubmissions) {
            console.log("Seeding mockup submissions into local sandbox database...")
            const seededState = seedMockupSubmissions(parsed)
            localStorage.setItem(storageKey, JSON.stringify(seededState))
            
            // Sync to backend global state
            fetch('/api/sandbox/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(seededState)
            }).catch(() => {})

            // Update react states
            const enrichedProjects = (seededState.projects || []).map((p: any) => {
              const studentProfile = seededState.profiles?.find((prof: any) => prof.id === p.student_id)
              return {
                ...p,
                student: studentProfile ? { full_name: studentProfile.full_name, email: studentProfile.email } : null
              }
            })
            setProjects(enrichedProjects)
            setDeliverables(seededState.deliverables || [])
          } else {
            // Override with local sandbox data to stay 100% in sync
            const enrichedProjects = (parsed.projects || []).map((p: any) => {
              const studentProfile = parsed.profiles?.find((prof: any) => prof.id === p.student_id)
              return {
                ...p,
                student: studentProfile ? { full_name: studentProfile.full_name, email: studentProfile.email } : null
              }
            })
            setProjects(enrichedProjects)
            setDeliverables(parsed.deliverables || [])
          }
        } catch (e) {
          console.error("Failed to parse localStorage sandbox db:", e)
        }
      }
    }
  }, [])

  // Sync to submissions whenever projects or deliverables change
  useEffect(() => {
    buildSubmissionList()
  }, [projects, deliverables])

  // Pre-populates the sandbox database with the 5 deliverables shown in the mockup
  function seedMockupSubmissions(dbState: any) {
    const profiles = dbState.profiles || []
    const projectsList = dbState.projects || []
    const deliverablesList = dbState.deliverables || []

    const mockStudents = [
      { id: 'student-amina', name: 'Amina Kariuki', email: 'amina@university.edu' },
      { id: 'student-brian', name: 'Brian Njoroge', email: 'brian@university.edu' },
      { id: 'student-sandra', name: 'Sandra Mwende', email: 'sandra@university.edu' },
      { id: 'student-james', name: 'James Otieno', email: 'james@university.edu' },
      { id: 'student-faith', name: 'Faith Wanjiku', email: 'faith@university.edu' }
    ]

    mockStudents.forEach(st => {
      if (!profiles.some((p: any) => p.id === st.id)) {
        profiles.push({
          id: st.id,
          full_name: st.name,
          role: 'student',
          email: st.email
        })
      }
    })

    const mockProjects = [
      { id: 'proj-amina', student_id: 'student-amina', title: 'Project proposal v2', desc: 'A senior project submission for health monitoring system.' },
      { id: 'proj-brian', student_id: 'student-brian', title: 'Progress report — Q1', desc: 'Progress report representing the first quarter deliverables.' },
      { id: 'proj-sandra', student_id: 'student-sandra', title: 'Final dissertation draft', desc: 'Complete final research dissertation draft.' },
      { id: 'proj-james', student_id: 'student-james', title: 'Literature review', desc: 'Literature review and research question definitions.' },
      { id: 'proj-faith', student_id: 'student-faith', title: 'Methodology chapter', desc: 'Detailed explanation of methodology, tools and datasets.' }
    ]

    mockProjects.forEach(proj => {
      if (!projectsList.some((p: any) => p.id === proj.id)) {
        projectsList.push({
          id: proj.id,
          title: proj.title,
          description: proj.desc,
          student_id: proj.student_id,
          instructor_id: 'demo-instructor-id',
          industry_partner_id: null,
          status: 'approved',
          origin: 'academic',
          team_members: [proj.student_id],
          created_at: new Date().toISOString()
        })
      }
    })

    const mockDeliverables = [
      {
        id: 'deliv-amina',
        project_id: 'proj-amina',
        title: 'Project proposal v2',
        submission_url: 'https://example.com/amina_proposal.pdf',
        status: 'submitted',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date('2026-06-07T10:00:00Z').toISOString()
      },
      {
        id: 'deliv-brian',
        project_id: 'proj-brian',
        title: 'Progress report — Q1',
        submission_url: 'https://example.com/brian_progress.pdf',
        status: 'graded',
        grade: 'A',
        feedback: 'Excellent progress on the backend architecture and database schema design. Keep it up!',
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date('2026-06-05T14:30:00Z').toISOString()
      },
      {
        id: 'deliv-sandra',
        project_id: 'proj-sandra',
        title: 'Final dissertation draft',
        submission_url: 'https://example.com/sandra_final_draft.pdf',
        status: 'rejected',
        feedback: 'The methodology section is missing detailed variable explanations. Please revise and resubmit.',
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date('2026-06-03T09:15:00Z').toISOString()
      },
      {
        id: 'deliv-james',
        project_id: 'proj-james',
        title: 'Literature review',
        submission_url: 'https://example.com/james_literature_review.pdf',
        status: 'submitted',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date('2026-06-02T16:45:00Z').toISOString()
      },
      {
        id: 'deliv-faith',
        project_id: 'proj-faith',
        title: 'Methodology chapter',
        submission_url: 'https://example.com/faith_methodology.pdf',
        status: 'graded',
        grade: 'B+',
        feedback: 'Good research design. Need more focus on control groups.',
        due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date('2026-05-30T11:20:00Z').toISOString()
      }
    ]

    mockDeliverables.forEach(deliv => {
      if (!deliverablesList.some((d: any) => d.id === deliv.id)) {
        deliverablesList.push(deliv)
      }
    })

    return {
      ...dbState,
      profiles,
      projects: projectsList,
      deliverables: deliverablesList
    }
  }

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
      'bg-purple-100 text-purple-700',
      'bg-emerald-100 text-emerald-700',
      'bg-rose-100 text-rose-700',
      'bg-amber-100 text-amber-700',
      'bg-teal-100 text-teal-700',
      'bg-sky-100 text-sky-700',
      'bg-indigo-100 text-indigo-700',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  function getDocType(title: string): 'Proposal' | 'Progress report' | 'Final document' {
    const t = title.toLowerCase()
    if (t.includes('proposal')) return 'Proposal'
    if (t.includes('report') || t.includes('progress') || t.includes('chapter') || t.includes('literature') || t.includes('architecture')) return 'Progress report'
    return 'Final document'
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
            // Fetch team members profiles
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

        let mappedStatus: 'submitted' | 'graded' | 'rejected' = 'submitted'
        if (d.status === 'graded' || d.status === 'completed') {
          mappedStatus = 'graded'
        } else if (d.status === 'rejected') {
          mappedStatus = 'rejected'
        } else {
          mappedStatus = 'submitted'
        }

        return {
          id: d.id,
          project_id: d.project_id,
          student_name: studentName,
          student_email: studentEmail,
          student_initials: getInitials(studentName),
          student_color: getAvatarColor(studentName),
          document_title: docTitle,
          type: getDocType(docTitle),
          submitted_date: formattedDate,
          status: mappedStatus,
          submission_url: d.submission_url,
          grade: d.grade || '',
          feedback: d.recommendation || d.feedback || ''
        } as SubmissionItem
      })

    // Sort submissions: newest submissions first
    items.sort((a, b) => new Date(b.id === 'deliv-amina' ? '2026-06-07T10:00:00Z' : deliverables.find((d: any) => d.id === b.id)?.created_at || '').getTime() - 
                         new Date(a.id === 'deliv-amina' ? '2026-06-07T10:00:00Z' : deliverables.find((d: any) => d.id === a.id)?.created_at || '').getTime())

    setSubmissions(items)
  }

  const handleRefreshData = async () => {
    setLoading(true)
    const res = await fetchInstructorDocumentsData()
    if (res.success) {
      setProjects(res.projects || [])
      setDeliverables(res.deliverables || [])
      showToast("Data synchronized with live database successfully!")
    } else {
      showToast("Sync failed: " + res.error)
    }
    setLoading(false)
  }

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false
    if (typeFilter !== 'all' && sub.type !== typeFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const nameMatch = sub.student_name.toLowerCase().includes(q)
      const docMatch = sub.document_title.toLowerCase().includes(q)
      if (!nameMatch && !docMatch) return false
    }

    return true
  })

  // Metric cards calculations
  const totalSubmissions = submissions.length
  const pendingReview = submissions.filter(s => s.status === 'submitted').length
  const reviewed = submissions.filter(s => s.status === 'graded').length
  const rejected = submissions.filter(s => s.status === 'rejected').length

  // Action handlers: updating status, grade & feedback
  async function handleUpdateDeliverable(status: 'graded' | 'rejected') {
    if (!selectedSub) return
    setActionProcessing(true)

    // Call server action to update Supabase
    const res = await updateDeliverableStatusAdmin(selectedSub.id, status, gradeInput, feedbackInput)

    // If this is a final document (Final submission) and approved, write this grade to the projects table too
    if (selectedSub.type === 'Final document' && status === 'graded' && gradeInput) {
      await updateProjectGradeAdmin(selectedSub.project_id, gradeInput)
    }

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
                grade: status === 'graded' ? gradeInput : '',
                feedback: feedbackInput,
                updated_at: new Date().toISOString()
              }
            }
            return d
          })
          if (selectedSub.type === 'Final document' && status === 'graded' && gradeInput) {
            parsed.projects = parsed.projects.map((p: any) => 
              p.id === selectedSub.project_id ? { ...p, grade: gradeInput, grade_published: true } : p
            )
          }
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
      showToast(status === 'graded' 
        ? `Successfully reviewed & graded "${selectedSub.document_title}"!` 
        : `Requested revisions on "${selectedSub.document_title}".`
      )
      
      // Update local react states directly
      setDeliverables(prev => prev.map((d: any) => {
        if (d.id === selectedSub.id) {
          return {
            ...d,
            status: status,
            grade: status === 'graded' ? gradeInput : '',
            feedback: feedbackInput
          }
        }
        return d
      }))

      // Close all modals
      setIsReviewOpen(false)
      setIsViewOpen(false)
      setIsFeedbackOpen(false)
      setSelectedSub(null)
    } else {
      showToast("Live save error (synced to sandbox fallback instead).")
      
      // Still update local react states for sandbox testing
      setDeliverables(prev => prev.map((d: any) => {
        if (d.id === selectedSub.id) {
          return {
            ...d,
            status: status,
            grade: status === 'graded' ? gradeInput : '',
            feedback: feedbackInput
          }
        }
        return d
      }))

      setIsReviewOpen(false)
      setIsViewOpen(false)
      setIsFeedbackOpen(false)
      setSelectedSub(null)
    }
    setActionProcessing(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  // File drop/upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0])
    }
  }

  const handleFiles = (file: File) => {
    const maxSize = 20 * 1024 * 1024 // 20MB
    if (file.size > maxSize) {
      showToast("File exceeds the maximum 20MB limit.")
      return
    }

    const validExtensions = ['.pdf', '.docx', '.doc']
    const fileNameLower = file.name.toLowerCase()
    const isValidType = validExtensions.some(ext => fileNameLower.endsWith(ext))
    if (!isValidType) {
      showToast("Invalid file type. Only PDF and DOCX documents are allowed.")
      return
    }

    setUploadingFile(true)
    setUploadProgress(0)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            const formattedSize = (file.size / (1024 * 1024)).toFixed(2) + " MB"
            const newResFile: ResourceFile = {
              id: `res-${Math.random().toString(36).substring(2, 9)}`,
              name: file.name,
              size: formattedSize,
              uploadedAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            }

            const updatedResources = [newResFile, ...uploadedResources]
            setUploadedResources(updatedResources)
            if (typeof window !== 'undefined') {
              localStorage.setItem('seniorproj_uploaded_resources', JSON.stringify(updatedResources))
            }

            setUploadingFile(false)
            showToast(`Syllabus template "${file.name}" uploaded successfully!`)
          }, 400)
          return 100
        }
        return prev + 10
      })
    }, 150)
  }

  const handleDeleteResource = (id: string, name: string) => {
    const updated = uploadedResources.filter(res => res.id !== id)
    setUploadedResources(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('seniorproj_uploaded_resources', JSON.stringify(updated))
    }
    showToast(`Resource document "${name}" removed.`)
  }

  // Get other deliverables/milestones for a project (useful for grading Final document)
  const getProjectMilestonesHistory = (projectId: string) => {
    return deliverables
      .filter(d => d.project_id === projectId && d.title?.toLowerCase() !== 'final report & code submission' && d.title?.toLowerCase() !== 'final client deliverables')
      .map(d => ({
        title: d.title,
        grade: d.grade || 'Not graded',
        status: d.status === 'graded' ? 'Approved' : d.status === 'rejected' ? 'Flagged' : 'Pending',
        feedback: d.recommendation || d.feedback || 'No comments'
      }))
  }

  const projectHistory = selectedSub ? getProjectMilestonesHistory(selectedSub.project_id) : []

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
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Document Review</h1>
          <p className="text-sm text-slate-500 font-medium">Review and approve student project submissions</p>
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
            Instructor
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total submissions', value: totalSubmissions, bg: 'bg-[#F7F7F5]', border: 'border-[#E7E5E4]/60', text: 'text-slate-950' },
          { label: 'Pending review', value: pendingReview, bg: 'bg-[#FDFBF7]', border: 'border-[#F5EBE0]/60', text: 'text-[#D97706]' },
          { label: 'Reviewed', value: reviewed, bg: 'bg-[#F7FBF9]', border: 'border-[#E6F3EC]/60', text: 'text-[#059669]' },
          { label: 'Rejected', value: rejected, bg: 'bg-[#FDF8F8]', border: 'border-[#F9EBEB]/60', text: 'text-[#DC2626]' }
        ].map((card, i) => (
          <div key={i} className={`${card.bg} border ${card.border} rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between min-h-[110px]`}>
            <span className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">{card.label}</span>
            <span className={`text-4xl font-black ${card.text} tracking-tight mt-3`}>{card.value}</span>
          </div>
        ))}
      </div>

      {/* Student Submissions Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Card Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-bold text-lg text-slate-900 font-sans">Student submissions</h2>
          </div>
          <button 
            onClick={() => setStatusFilter('submitted')}
            className="self-start md:self-auto text-xs font-black text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 hover:shadow-sm"
          >
            View pending <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="bg-[#FAF9F6] border border-slate-200/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all font-semibold"
            />
          </div>

          <div className="flex flex-wrap gap-4 w-full sm:w-auto items-center justify-end">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All statuses</option>
                <option value="submitted">Pending</option>
                <option value="graded">Reviewed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All types</option>
                <option value="Proposal">Proposal</option>
                <option value="Progress report">Progress report</option>
                <option value="Final document">Final document</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading submissions...</span>
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-5">Student</th>
                  <th className="py-3.5 px-5">Document</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Submitted</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/20 transition-colors">
                    {/* Student details */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8.5 h-8.5 rounded-full ${sub.student_color} flex items-center justify-center font-bold text-[10px] shadow-sm select-none shrink-0`}>
                          {sub.student_initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate leading-tight">{sub.student_name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold truncate block mt-0.5 leading-tight">{sub.student_email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Document details */}
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-slate-900 block truncate max-w-[200px]" title={sub.document_title}>
                        {sub.document_title}
                      </span>
                    </td>

                    {/* Type with page icon */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{sub.type}</span>
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-4 px-5 text-slate-500 font-semibold">{sub.submitted_date}</td>

                    {/* Status Badge */}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                        sub.status === 'graded' 
                          ? 'bg-[#E6F3EC] text-[#065F46] border-[#BCE1CD]' 
                          : sub.status === 'rejected'
                            ? 'bg-[#F9EBEB] text-[#991B1B] border-[#F2C5C5]'
                            : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                      }`}>
                        {sub.status === 'graded' ? 'Reviewed' : sub.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        {sub.status === 'submitted' && (
                          <button
                            onClick={() => {
                              setSelectedSub(sub)
                              setGradeInput('')
                              setFeedbackInput('')
                              setIsReviewOpen(true)
                            }}
                            className="px-4 py-1.5 border-2 border-slate-800 bg-white hover:bg-slate-50 text-slate-900 font-extrabold rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                          >
                            Review
                          </button>
                        )}
                        {sub.status === 'graded' && (
                          <button
                            onClick={() => {
                              setSelectedSub(sub)
                              setGradeInput(sub.grade || '')
                              setFeedbackInput(sub.feedback || '')
                              setIsViewOpen(true)
                            }}
                            className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-extrabold rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                          >
                            View
                          </button>
                        )}
                        {sub.status === 'rejected' && (
                          <button
                            onClick={() => {
                              setSelectedSub(sub)
                              setGradeInput('')
                              setFeedbackInput(sub.feedback || '')
                              setIsFeedbackOpen(true)
                            }}
                            className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 font-extrabold rounded-lg text-[10px] uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                          >
                            Feedback
                          </button>
                        )}

                        <a
                          href={(() => {
                            const raw = sub.submission_url || ''
                            const norm = (raw.startsWith('http') || raw.startsWith('/')) ? raw : `/uploads/${raw.replace(/\s+/g, '_')}`
                            return `/preview/document?file=${encodeURIComponent(norm)}&title=${encodeURIComponent(sub.document_title || 'Submission')}`
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Document URL"
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all shadow-sm shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-slate-400 font-semibold text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FolderOpen className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              No submissions found matching the selected filters.
            </div>
          )}
        </div>
      </div>

      {/* Upload Resource Document Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <UploadCloud className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 font-sans">Upload resource document</h2>
            <p className="text-[11px] text-slate-500 font-semibold">Upload guidelines, templates, or rubric sheets for students to access.</p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all relative overflow-hidden ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50/20' 
              : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50/40'
          }`}
        >
          <input 
            type="file" 
            id="resource-file-input"
            multiple={false}
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc"
            className="hidden"
          />
          <label htmlFor="resource-file-input" className="cursor-pointer flex flex-col items-center justify-center">
            {uploadingFile ? (
              <div className="space-y-4 w-60">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <FileUp className="w-8 h-8 text-slate-400 mb-3" />
                <span className="text-xs font-bold text-slate-700">
                  Drag & drop files here, or <span className="text-[#4F46E5] hover:underline">browse to upload</span>
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-1.5 block">
                  PDF, DOCX, up to 20MB
                </span>
              </>
            )}
          </label>
        </div>

        {/* Render uploaded resources table if there are any */}
        {uploadedResources.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-150 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Uploaded Resources ({uploadedResources.length})</h3>
            <div className="divide-y divide-slate-100 bg-[#FAF9F6] border border-slate-200/60 rounded-2xl overflow-hidden">
              {uploadedResources.map((res) => (
                <div key={res.id} className="p-3 px-4 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-slate-900 truncate block max-w-[300px]" title={res.name}>{res.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5 uppercase">{res.size} · Uploaded {res.uploadedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => showToast(`Downloading "${res.name}" (simulated)`)}
                      className="p-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                      title="Download Resource"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteResource(res.id, res.name)}
                      className="p-1.5 hover:bg-red-50 hover:text-red-650 text-slate-400 rounded-lg transition-colors cursor-pointer"
                      title="Delete Resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── REVIEW MODAL (Pending Status) ── */}
      <AnimatePresence>
        {isReviewOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-2xl p-6 sm:p-8 max-w-lg w-full z-10 flex flex-col gap-6 relative font-sans text-slate-800 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Review Submission</span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedSub.document_title}</h3>
                </div>
                <button 
                  onClick={() => setIsReviewOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-450 hover:text-slate-700 transition-colors border border-slate-100 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Student Metadata Card */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${selectedSub.student_color} flex items-center justify-center font-bold text-sm shadow-sm select-none`}>
                  {selectedSub.student_initials}
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wide block">Student Submittee</span>
                  <span className="text-sm font-black text-slate-900 block leading-tight">{selectedSub.student_name}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">{selectedSub.student_email}</span>
                </div>
              </div>

              {/* Milestone history if reviewing final document */}
              {selectedSub.type === 'Final document' && projectHistory.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FDE68A] uppercase tracking-wider inline-block">
                    Milestone Grading History
                  </span>
                  <div className="divide-y divide-slate-150 border border-slate-200 rounded-xl overflow-hidden text-[11px] bg-slate-50">
                    {projectHistory.map((h, index) => (
                      <div key={index} className="p-3 space-y-1">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>{h.title}</span>
                          <span className="text-indigo-600">Grade: {h.grade}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-450 font-semibold">
                          <span>Status: {h.status}</span>
                          <span className="italic">"{h.feedback}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Submission Attachment</span>
                  </div>
                  <a 
                    href={(() => {
                      const raw = selectedSub.submission_url || ''
                      const norm = (raw.startsWith('http') || raw.startsWith('/')) ? raw : `/uploads/${raw.replace(/\s+/g, '_')}`
                      return `/preview/document?file=${encodeURIComponent(norm)}&title=${encodeURIComponent(selectedSub.document_title || 'Submission')}`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-[#4F46E5] hover:underline flex items-center gap-1.5"
                  >
                    Open Document <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>

                {/* Score Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    {selectedSub.type === 'Final document' ? 'Assign Course Grade (Final)' : 'Grade Score / Marks'}
                  </label>
                  <input
                    type="text"
                    placeholder={selectedSub.type === 'Final document' ? "e.g. A, B+, A-" : "e.g. 85/100, A, B+"}
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Feedback Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Feedback / Revision Notes
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Provide constructive review comments for the student team..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Review Submissions Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  disabled={actionProcessing}
                  onClick={() => handleUpdateDeliverable('graded')}
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-indigo-750 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  {selectedSub.type === 'Final document' ? 'Grade & Publish' : 'Approve (Reviewed)'}
                </button>

                <button
                  disabled={actionProcessing}
                  onClick={() => handleUpdateDeliverable('rejected')}
                  className="py-3 px-6 bg-red-50 hover:bg-red-100 text-[#991B1B] border border-red-200 font-bold rounded-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Request Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW MODAL (Reviewed Status) ── */}
      <AnimatePresence>
        {isViewOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-2xl p-6 sm:p-8 max-w-lg w-full z-10 flex flex-col gap-6 relative font-sans text-slate-800"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider inline-block">Reviewed Submission</span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mt-1">{selectedSub.document_title}</h3>
                </div>
                <button 
                  onClick={() => setIsViewOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-450 hover:text-slate-700 transition-colors border border-slate-100 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Student Metadata Card */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${selectedSub.student_color} flex items-center justify-center font-bold text-sm shadow-sm select-none`}>
                  {selectedSub.student_initials}
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wide block">Student Submittee</span>
                  <span className="text-sm font-black text-slate-900 block leading-tight">{selectedSub.student_name}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">{selectedSub.student_email}</span>
                </div>
              </div>

              {/* Assessment Details */}
              <div className="space-y-4">
                {/* Score display/input */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Grade Score</span>
                    <span className="text-2xl font-black text-[#065F46]">{selectedSub.grade || 'N/A'}</span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-250/50 rounded-2xl flex flex-col justify-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Submitted Date</span>
                    <span className="text-xs font-bold text-slate-700">{selectedSub.submitted_date}</span>
                  </div>
                </div>

                {/* Grade editing form if needed */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Edit Grade / Score
                  </label>
                  <input
                    type="text"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Feedback notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Evaluation Feedback
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Student File Attachment</span>
                  </div>
                  <a 
                    href={(() => {
                      const raw = selectedSub.submission_url || ''
                      const norm = (raw.startsWith('http') || raw.startsWith('/')) ? raw : `/uploads/${raw.replace(/\s+/g, '_')}`
                      return `/preview/document?file=${encodeURIComponent(norm)}&title=${encodeURIComponent(selectedSub.document_title || 'Submission')}`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-[#4F46E5] hover:underline flex items-center gap-1.5"
                  >
                    Open Document <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>
              </div>

              {/* View/Edit Assessment Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  disabled={actionProcessing}
                  onClick={() => handleUpdateDeliverable('graded')}
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-indigo-750 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  Save Changes
                </button>

                <button
                  disabled={actionProcessing}
                  onClick={() => handleUpdateDeliverable('rejected')}
                  className="py-3 px-6 bg-red-50 hover:bg-red-100 text-[#991B1B] border border-red-200 font-bold rounded-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Change to Rejected
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FEEDBACK MODAL (Rejected Status) ── */}
      <AnimatePresence>
        {isFeedbackOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-2xl p-6 sm:p-8 max-w-lg w-full z-10 flex flex-col gap-6 relative font-sans text-slate-800"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-150 uppercase tracking-wider inline-block">Revision Requested</span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight mt-1">{selectedSub.document_title}</h3>
                </div>
                <button 
                  onClick={() => setIsFeedbackOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-450 hover:text-slate-700 transition-colors border border-slate-100 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Student Metadata Card */}
              <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${selectedSub.student_color} flex items-center justify-center font-bold text-sm shadow-sm select-none`}>
                  {selectedSub.student_initials}
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wide block">Student Submittee</span>
                  <span className="text-sm font-black text-slate-900 block leading-tight">{selectedSub.student_name}</span>
                  <span className="text-[11px] text-slate-500 font-semibold">{selectedSub.student_email}</span>
                </div>
              </div>

              {/* Rejection Details */}
              <div className="space-y-4">
                <div className="p-4 bg-red-50/40 border border-red-100 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-extrabold text-slate-900 block mb-0.5">Reason for Requesting Changes</span>
                    The student has been notified to modify their submission. Review your rejection comments below.
                  </div>
                </div>

                {/* Edit feedback textarea */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Update Rejection Feedback
                  </label>
                  <textarea
                    rows={4}
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 border border-indigo-100/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">Submitted File Link</span>
                  </div>
                  <a 
                    href={(() => {
                      const raw = selectedSub.submission_url || ''
                      const norm = (raw.startsWith('http') || raw.startsWith('/')) ? raw : `/uploads/${raw.replace(/\s+/g, '_')}`
                      return `/preview/document?file=${encodeURIComponent(norm)}&title=${encodeURIComponent(selectedSub.document_title || 'Submission')}`
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-[#4F46E5] hover:underline flex items-center gap-1.5"
                  >
                    Open Document <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>
              </div>

              {/* Rejection Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  disabled={actionProcessing}
                  onClick={() => handleUpdateDeliverable('rejected')}
                  className="flex-1 py-3 bg-[#4F46E5] hover:bg-indigo-750 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {actionProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  Update Feedback
                </button>

                <button
                  disabled={actionProcessing}
                  onClick={() => {
                    setGradeInput('')
                    handleUpdateDeliverable('graded')
                  }}
                  className="py-3 px-6 bg-emerald-50 hover:bg-emerald-100 text-[#065F46] border border-emerald-200 font-bold rounded-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Approve Submission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

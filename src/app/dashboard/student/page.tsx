'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import PartnerDiscussion from '../../../components/dashboard/PartnerDiscussion'
import {
  BookOpen,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Lock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Upload
} from 'lucide-react'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

type ModuleId = 'home' | 'workspace' | 'interaction' | 'milestones' | 'grades'

interface ProjectType {
  id: string
  title: string
  description: string
  student_id: string
  supervisor_id: string | null
  partner_id: string | null
  status: string
  origin: string
  final_grade: string | null
  supervisor?: { full_name: string; email: string }
  partner?: { full_name: string; email: string }
}

interface DeliverableType {
  id: string
  project_id: string
  title: string
  description: string
  status: 'todo' | 'submitted' | 'completed'
  due_date: string
  submission_url?: string | null
  feedback_supervisor?: string
  feedback_partner?: string
}

interface MessageType {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface MeetingLogType {
  id: string
  topic: string
  requested_on: string
  status: 'pending' | 'confirmed' | 'completed'
  notes: string
}

// ============================================================================
// Main Component
// ============================================================================

export default function StudentDashboard() {
  const [activeModule, setActiveModule] = useState<ModuleId>('home')
  const [project, setProject] = useState<ProjectType | null>(null)
  const [deliverables, setDeliverables] = useState<DeliverableType[]>([])
  const [messages, setMessages] = useState<MessageType[]>([])
  const [meetingLogs, setMeetingLogs] = useState<MeetingLogType[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [messageSending, setMessageSending] = useState(false)
  const [draftFile, setDraftFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<'idle' | 'uploaded'>('idle')
  const [submissionUrls, setSubmissionUrls] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')

  const supabase = createClient()

  const navModules = [
    { id: 'home' as ModuleId, label: 'Dashboard Home', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'workspace' as ModuleId, label: 'Project Workspace', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'interaction' as ModuleId, label: 'Interaction Hub', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'milestones' as ModuleId, label: 'Milestone Engine', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'grades' as ModuleId, label: 'Grades & Reviews', icon: <BookOpen className="w-4 h-4" /> }
  ]

  // Compute next urgent deadline
  const nextDeadline = useMemo(() => {
    const pending = deliverables
      .filter((d) => d.status === 'todo' && d.due_date)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    return pending[0] || null
  }, [deliverables])

  // Compute deadline countdown
  const deadlineCountdown = useMemo(() => {
    if (!nextDeadline) return 'No active deadline'
    const diff = Math.max(new Date(nextDeadline.due_date).getTime() - Date.now(), 0)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    return `${days}d ${hours}h ${minutes}m`
  }, [nextDeadline])

  // Compute progress metrics
  const completedCount = deliverables.filter((d) => d.status === 'completed').length
  const totalCount = deliverables.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const submittedCount = deliverables.filter((d) => d.status !== 'todo').length

  // Load dashboard data on mount
  useEffect(() => {
    void loadDashboardData()
  }, [])

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!project || !userId) return

    const channel = supabase
      .channel(`chat-${project.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          const msg = payload.new as MessageType
          const supervisorId = project.supervisor_id
          if (!supervisorId) return
          if (
            (msg.sender_id === userId && msg.receiver_id === supervisorId) ||
            (msg.sender_id === supervisorId && msg.receiver_id === userId)
          ) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [project, userId])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const currentUserId = user?.id || 'demo-student-id'
      setUserId(currentUserId)

      // Fetch student's project
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('student_id', currentUserId)
        .limit(1)

      const activeProject = projectsData?.[0] || null
      setProject(activeProject)

      if (activeProject) {
        // Fetch deliverables
        const { data: deliverablesData } = await supabase
          .from('deliverables')
          .select('*')
          .eq('project_id', activeProject.id)
          .order('due_date', { ascending: true })

        // Fetch messages with supervisor
        const { data: messagesData } = activeProject.supervisor_id
          ? await supabase
              .from('messages')
              .select('*')
              .or(
                `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeProject.supervisor_id}),and(sender_id.eq.${activeProject.supervisor_id},receiver_id.eq.${currentUserId})`
              )
              .order('created_at', { ascending: true })
          : { data: [] }

        setDeliverables(deliverablesData || [])
        setMessages(messagesData || [])
      }

      // Mock meeting logs
      setMeetingLogs([
        {
          id: 'mtg-1',
          topic: 'Supervisor Kickoff Review',
          requested_on: '2026-06-02',
          status: 'confirmed',
          notes: 'Confirmed via email; remote review scheduled.'
        },
        {
          id: 'mtg-2',
          topic: 'Architecture Feedback',
          requested_on: '2026-06-10',
          status: 'pending',
          notes: 'Awaiting supervisor availability for the next session.'
        },
        {
          id: 'mtg-3',
          topic: 'Pre-release Check',
          requested_on: '2026-06-18',
          status: 'completed',
          notes: 'Session completed successfully; action items documented.'
        }
      ])
    } catch (error) {
      console.error('Unable to load student dashboard data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = messageInput.trim()
    if (!content || !project?.supervisor_id) return

    setMessageSending(true)
    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: project.supervisor_id,
        content
      })

      if (error) throw error
      if (data?.[0]) {
        setMessages((prev) => [...prev, data[0] as MessageType])
        setMessageInput('')
      }
    } catch (error) {
      console.error('Unable to send message', error)
    } finally {
      setMessageSending(false)
    }
  }

  const handleSubmitDeliverable = async (deliverableId: string) => {
    const url = submissionUrls[deliverableId]
    if (!url?.trim()) return

    setSubmitting(deliverableId)
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({
          submission_url: url,
          status: 'submitted'
        })
        .eq('id', deliverableId)

      if (error) throw error
      await loadDashboardData()
      setSubmissionUrls((prev) => ({ ...prev, [deliverableId]: '' }))
    } catch (error) {
      console.error('Unable to submit deliverable', error)
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600">Loading student dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 space-y-8 font-sans text-slate-900 bg-slate-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">Student Dashboard</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Capstone Control Center</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                Manage individual milestones, collaborate with your supervisor, submit draft work, and track your academic capstone progress.
              </p>
            </div>
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Track</p>
              <p className="mt-2 text-2xl font-black text-emerald-800">{project?.origin === 'industry' ? 'Industry' : 'Academic'}</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Project State</p>
              <p className="mt-3 text-xl font-black text-slate-900">{project?.status?.toUpperCase() || 'PENDING'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Milestones</p>
              <p className="mt-3 text-xl font-black text-slate-900">{deliverables.length}</p>
              <p className="mt-1 text-[11px] text-slate-600 uppercase tracking-[0.25em]">{completedCount} completed</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Progress</p>
              <p className="mt-3 text-xl font-black text-slate-900">{progressPercent}%</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Countdown</p>
              <p className="mt-3 text-lg font-black text-emerald-700">{deadlineCountdown}</p>
            </div>
          </div>
        </div>

        {/* Module Navigation */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-lg">
          <div className="grid gap-3 md:grid-cols-5">
            {navModules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-left text-xs font-black uppercase tracking-[0.3em] transition ${
                  activeModule === module.id
                    ? 'border-emerald-600 bg-emerald-600/10 text-slate-900'
                    : 'border-slate-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {module.icon}
                <span>{module.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module Content */}
        <AnimatePresence mode="wait">
          {/* ============================================================
              MODULE 1: DASHBOARD HOME
              ============================================================ */}
          {activeModule === 'home' && (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Dashboard Home</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">High-visibility project state</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                      Mission-critical counts, deadline urgency, and every active milestone in one responsive panel.
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-emerald-700">
                    {project?.partner_id ? 'Industry Co-Sponsored' : 'Internal Academic'}
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                  {/* Left column: Detailed metrics */}
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Current Track</p>
                        <p className="mt-3 text-lg font-black text-slate-900">{project?.origin === 'industry' ? 'Industry Sponsored' : 'Academic'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Supervisor</p>
                        <p className="mt-3 text-lg font-black text-slate-900">{project?.supervisor?.full_name?.split(' ')[0] || 'Dr. Miller'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Total Milestones</p>
                        <p className="mt-3 text-lg font-black text-slate-900">{deliverables.length}</p>
                        <p className="mt-1 text-[11px] text-slate-600 uppercase tracking-[0.25em]">{completedCount} done</p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Countdown</p>
                        <p className="mt-3 text-lg font-black text-emerald-700">{deadlineCountdown}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right column: Next urgent */}
                  <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-700 font-black">Next Urgent Milestone</p>
                    {nextDeadline ? (
                      <div className="mt-6 space-y-3">
                        <p className="text-xl font-black text-slate-900">{nextDeadline.title}</p>
                        <p className="text-sm leading-relaxed text-slate-700">Due {new Date(nextDeadline.due_date).toLocaleDateString()}</p>
                        <div className="rounded-3xl border border-emerald-300 bg-white p-4 text-sm font-black uppercase tracking-[0.25em] text-emerald-700">
                          ⏱ {deadlineCountdown} remaining
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-sm text-slate-700">No active pending milestone deadlines. Maintain momentum.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ============================================================
              MODULE 2: PROJECT WORKSPACE
              ============================================================ */}
          {activeModule === 'workspace' && (
            <motion.section
              key="workspace"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Project Workspace</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">Core metadata and sponsor details</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                      Complete project information, supervisor contact, and industry partner visibility.
                    </p>
                  </div>
                  {/* Conditional badge: Internal Academic (gray) vs Industry Co-Sponsored (blue) */}
                  <div className={`rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.35em] border ${
                    project?.partner_id
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-slate-100 text-slate-700'
                  }`}>
                    {project?.partner_id ? 'Industry Co-Sponsored' : 'Internal Academic Track'}
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  {/* Project details */}
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Project Title</p>
                    <h3 className="mt-3 text-2xl font-black text-slate-900">{project?.title}</h3>
                    <p className="mt-4 text-slate-700 leading-relaxed">{project?.description}</p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Status</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{project?.status || 'PENDING'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Grade State</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{project?.final_grade || 'Pending'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-4">
                    {/* Supervisor card */}
                    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Supervisor</p>
                      <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                        <p className="font-black text-slate-900">{project?.supervisor?.full_name || 'Dr. Robert Miller'}</p>
                        <p className="mt-2 text-sm text-slate-600">{project?.supervisor?.email || 'supervisor@university.edu'}</p>
                      </div>
                    </div>

                    {/* Industry partner card (conditional) */}
                    {project?.partner_id && (
                      <div className="rounded-[2rem] border border-blue-300 bg-blue-50 p-6 shadow">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-blue-700 font-black">Industry Partner</p>
                        <div className="mt-5 rounded-[1.75rem] border border-blue-200 bg-white p-5">
                          <p className="font-black text-slate-900">{project.partner?.full_name || 'TechCorp Inc.'}</p>
                          <p className="mt-2 text-sm text-slate-700">{project.partner?.email || 'partner@techcorp.com'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          {/* ============================================================
              MODULE 3: INTERACTION HUB
              ============================================================ */}
          {activeModule === 'interaction' && (
            <motion.section
              key="interaction"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Interaction Hub</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">Messaging, uploads, and consultation log</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                      Two-column collaboration space: messaging thread with supervisor + draft uploads on the left, partner discussion thread on the right.
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black uppercase tracking-[0.35em] text-emerald-700">
                    {messages.length} messages
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                  {/* Left: Supervisor messaging + uploads */}
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    {/* Message thread */}
                    <div className="mb-6 flex items-center justify-between gap-4 pb-6 border-b border-slate-200">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Message Thread</p>
                        <p className="mt-2 text-sm text-slate-700">Live interaction with your supervisor.</p>
                      </div>
                      <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] uppercase tracking-[0.35em] text-emerald-700 font-black">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
                      </div>
                    </div>

                    {/* Message list */}
                    <div className="max-h-[32rem] space-y-4 overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-4 mb-6">
                      {messages.length > 0 ? (
                        messages.map((msg) => {
                          const isAuthor = msg.sender_id === userId
                          return (
                            <div
                              key={msg.id}
                              className={`rounded-3xl p-4 ${
                                isAuthor
                                  ? 'ml-12 bg-emerald-600/10 text-slate-900 border border-emerald-200'
                                  : 'mr-12 bg-slate-100 text-slate-800 border border-slate-200'
                              }`}
                            >
                              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black mb-2">
                                {isAuthor ? 'You' : project?.supervisor?.full_name || 'Supervisor'}
                              </p>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <p className="mt-3 text-[10px] text-slate-500 uppercase tracking-[0.35em]">
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          )
                        })
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
                          No conversation history yet. Send your first update.
                        </div>
                      )}
                    </div>

                    {/* Send message form */}
                    <form onSubmit={handleSendMessage} className="space-y-4 mb-8 pb-8 border-b border-slate-200">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">New Message</label>
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        rows={3}
                        placeholder="Write a brief update for your supervisor..."
                        className="w-full rounded-[1.75rem] border border-slate-300 bg-white px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || messageSending}
                        className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {messageSending ? 'Sending...' : 'Send Message'}
                      </button>
                    </form>

                    {/* Draft upload */}
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Rough Draft Upload</label>
                      <p className="text-sm text-slate-700">Share draft documents or assets for supervisor review.</p>
                      <div className="flex items-center gap-3 rounded-[1.75rem] border-2 border-dashed border-slate-300 bg-white p-4">
                        <Upload className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <input
                          type="file"
                          accept=".pdf,.docx,.pptx,.zip,.png,.jpg"
                          disabled={uploadState === 'uploaded'}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setDraftFile(file)
                              setUploadState('uploaded')
                            }
                          }}
                          className="flex-1 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                        />
                      </div>
                      {draftFile && (
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="font-black text-slate-900">{draftFile.name}</p>
                          <p className="mt-2 text-[11px] text-slate-600">Draft ready to share.</p>
                        </div>
                      )}
                    </div>

                    {/* Meeting log */}
                    <div className="mt-8 space-y-4 pt-8 border-t border-slate-200">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Consultation Log</p>
                          <p className="mt-2 text-sm text-slate-700">Track office-hour requests and approval status.</p>
                        </div>
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="space-y-3">
                        {meetingLogs.map((meeting) => (
                          <div key={meeting.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-black text-slate-900">{meeting.topic}</p>
                              <span
                                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${
                                  meeting.status === 'confirmed'
                                    ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                                    : meeting.status === 'completed'
                                    ? 'border border-slate-300 bg-slate-100 text-slate-600'
                                    : 'border border-amber-300 bg-amber-50 text-amber-700'
                                }`}
                              >
                                {meeting.status}
                              </span>
                            </div>
                            <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-600">Requested {meeting.requested_on}</p>
                            <p className="mt-3 text-sm leading-relaxed text-slate-700">{meeting.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Partner discussion */}
                  <div>
                    <PartnerDiscussion projectId={project?.id ?? ''} userId={userId} />
                  </div>
                </div>
              </div>
            </motion.section>
          )}
          {/* ============================================================
              MODULE 4: MILESTONE SUBMISSION ENGINE
              ============================================================ */}
          {activeModule === 'milestones' && (
            <motion.section
              key="milestones"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Milestone Submission Engine</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">Step-by-step submission & lock state</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                      Each milestone becomes immutable once submitted and enters review state with full tracking.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black uppercase tracking-[0.35em] text-slate-700">
                    {submittedCount} submitted
                  </div>
                </div>

                {/* Milestone cards */}
                <div className="mt-8 space-y-6">
                  {deliverables.map((deliverable, index) => {
                    const locked = deliverable.status !== 'todo'
                    return (
                      <div key={deliverable.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                        {/* Header */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Step {index + 1}</p>
                            <h3 className="mt-2 text-xl font-black text-slate-900">{deliverable.title}</h3>
                          </div>
                          <span className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] border flex items-center gap-2 ${
                            locked
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-slate-300 bg-white text-slate-700'
                          }`}>
                            {locked ? (
                              <>
                                <Lock className="w-3 h-3" /> Awaiting Review
                              </>
                            ) : (
                              'Ready to Submit'
                            )}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-700 leading-relaxed mb-6">{deliverable.description}</p>

                        {/* Input fields */}
                        <div className="grid gap-4 lg:grid-cols-2 mb-6">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Repository or Docs URL</p>
                            <input
                              type="url"
                              value={submissionUrls[deliverable.id] ?? deliverable.submission_url ?? ''}
                              onChange={(e) =>
                                setSubmissionUrls((prev) => ({ ...prev, [deliverable.id]: e.target.value }))
                              }
                              disabled={locked}
                              placeholder="https://github.com/your-repo"
                              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
                            />
                          </div>
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Due Date</p>
                            <p className="mt-3 text-sm font-black text-slate-900">{new Date(deliverable.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm leading-relaxed text-slate-700">
                            {locked ? 'This submission is now frozen and awaits supervisor review.' : 'Lock this milestone by submitting a link for review.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSubmitDeliverable(deliverable.id)}
                            disabled={locked || !submissionUrls[deliverable.id]?.trim()}
                            className="rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-emerald-500 disabled:opacity-60"
                          >
                            {locked ? 'Locked' : submitting === deliverable.id ? 'Submitting...' : 'Submit Milestone'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.section>
          )}

          {/* ============================================================
              MODULE 5: GRADES & REVIEWS
              ============================================================ */}
          {activeModule === 'grades' && (
            <motion.section
              key="grades"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Grades & Reviews</p>
                    <h2 className="mt-3 text-3xl font-black text-slate-900">Supervisor and partner feedback</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                      Detailed review panels with supervisor grading, optional partner remarks, and locked instructor grade.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black uppercase tracking-[0.35em] text-slate-700">
                    Review Ready
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  {/* Supervisor Grading */}
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Supervisor Grading</p>
                    <div className="mt-6 space-y-4">
                      {deliverables.filter((d) => d.feedback_supervisor).length > 0 ? (
                        deliverables
                          .filter((d) => d.feedback_supervisor)
                          .map((deliverable) => (
                            <div key={deliverable.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <p className="font-black text-slate-900">{deliverable.title}</p>
                              <p className="mt-3 text-sm text-slate-700">{deliverable.feedback_supervisor}</p>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-100 p-6 text-sm text-slate-600">
                          No supervisor grading comments available yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Industry Partner Remarks (conditional) */}
                  <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Industry Partner Remarks</p>
                    <div className="mt-6 space-y-4">
                      {project?.partner_id ? (
                        deliverables.filter((d) => d.feedback_partner).length > 0 ? (
                          deliverables
                            .filter((d) => d.feedback_partner)
                            .map((deliverable) => (
                              <div key={deliverable.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                <p className="font-black text-slate-900">{deliverable.title}</p>
                                <p className="mt-3 text-sm text-slate-700">{deliverable.feedback_partner}</p>
                              </div>
                            ))
                        ) : (
                          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-100 p-6 text-sm text-slate-600">
                            No partner remarks added yet.
                          </div>
                        )
                      ) : (
                        <div className="rounded-3xl border border-slate-300 bg-slate-100 p-6 text-sm text-slate-600">
                          This project is internal academic only; partner remarks are not applicable.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instructor Final Grade (Locked Container) */}
                <div className="mt-8 rounded-[2rem] border border-slate-300 bg-slate-100 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Instructor Final Grade</p>
                      <p className="mt-2 text-sm text-slate-700">Secure grade container reserved for final course approval by instructor only.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-400 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-slate-700">
                      <Lock className="w-4 h-4" /> Locked
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-300 bg-white p-4">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Final Grade</label>
                      <input
                        type="text"
                        readOnly
                        value={project?.final_grade || 'LOCKED'}
                        className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-black text-slate-600"
                      />
                    </div>
                    <div className="rounded-3xl border border-slate-300 bg-white p-4">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-600 font-black">Approval Status</p>
                      <p className="mt-3 text-sm font-black text-slate-900">Instructor Locked</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">Once released, only instructor accounts can update this final score.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

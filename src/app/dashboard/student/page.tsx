'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import PartnerDiscussion from '@/components/dashboard/PartnerDiscussion'
import {
  BookOpen,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Check,
  Sparkles,
  Upload,
  Briefcase,
  ShieldCheck
} from 'lucide-react'

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
  status: string
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
    { id: 'home', label: 'Dashboard Home', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'workspace', label: 'Project Workspace', icon: <FolderOpen className="w-4 h-4" /> },
    { id: 'interaction', label: 'Interaction Hub', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'milestones', label: 'Milestone Engine', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'grades', label: 'Grades & Reviews', icon: <BookOpen className="w-4 h-4" /> }
  ]

  const nextDeadline = useMemo(() => {
    const pending = deliverables
      .filter((deliverable) => deliverable.status === 'todo' && deliverable.due_date)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    return pending[0] || null
  }, [deliverables])

  const deadlineCountdown = useMemo(() => {
    if (!nextDeadline) return 'No active deadline'
    const diff = Math.max(new Date(nextDeadline.due_date).getTime() - Date.now(), 0)
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    return `${days}d ${hours}h ${minutes}m`
  }, [nextDeadline])

  useEffect(() => {
    void loadDashboardData()
  }, [])

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
            setMessages((previous) => [...previous, msg])
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

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('student_id', currentUserId)
        .limit(1)

      const activeProject = projectsData?.[0] || null
      setProject(activeProject)

      if (activeProject) {
        const deliverablesPromise = supabase
          .from('deliverables')
          .select('*')
          .eq('project_id', activeProject.id)
          .order('due_date', { ascending: true })

        const messagesPromise = activeProject.supervisor_id
          ? supabase
              .from('messages')
              .select('*')
              .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${activeProject.supervisor_id}),and(sender_id.eq.${activeProject.supervisor_id},receiver_id.eq.${currentUserId})`)
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] })

        const [{ data: deliverablesData }, { data: messagesData }] = await Promise.all([
          deliverablesPromise,
          messagesPromise
        ])

        setDeliverables(deliverablesData || [])
        setMessages(messagesData || [])
      }

      setMeetingLogs([
        {
          id: 'meeting-1',
          topic: 'Supervisor Kickoff Review',
          requested_on: '2026-06-02',
          status: 'confirmed',
          notes: 'Confirmed via email; remote review scheduled.'
        },
        {
          id: 'meeting-2',
          topic: 'Architecture Feedback',
          requested_on: '2026-06-10',
          status: 'pending',
          notes: 'Awaiting supervisor availability for the next session.'
        },
        {
          id: 'meeting-3',
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
      setSubmissionUrls((previous) => ({ ...previous, [deliverableId]: '' }))
    } catch (error) {
      console.error('Unable to submit deliverable', error)
    } finally {
      setSubmitting(null)
    }
  }

  const completedCount = deliverables.filter((d) => d.status === 'completed').length
  const totalCount = deliverables.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070a13] text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600">Loading student dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 space-y-8 font-sans text-slate-100">
      <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">Student Dashboard</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">Your capstone control center</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
                Manage individual milestones, collaborate with your supervisor, upload draft work, and follow the exact academic path for your senior capstone.
              </p>
            </div>
            <div className="rounded-[2rem] border border-emerald-200 bg-white px-5 py-4 text-sm text-emerald-700">
              <p className="font-black uppercase tracking-[0.25em] text-emerald-700">Track</p>
              <p className="mt-2 text-2xl text-emerald-800">{project?.origin === 'industry' ? 'Industry Co-Sponsored' : 'Internal Academic'}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/80 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Project state</p>
              <p className="mt-3 text-xl font-black text-white">{project?.status?.toUpperCase() || 'PENDING'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/80 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Milestones total</p>
              <p className="mt-3 text-xl font-black text-white">{deliverables.length}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/80 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Next deadline</p>
              <p className="mt-3 text-xl font-black text-white">{nextDeadline ? new Date(nextDeadline.due_date).toLocaleDateString() : 'None'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800/80 bg-slate-900/80 p-5">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Countdown</p>
              <p className="mt-3 text-xl font-black text-white">{deadlineCountdown}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-xl">
          <div className="grid gap-3 md:grid-cols-5">
            {navModules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={`flex items-center gap-3 rounded-3xl border px-4 py-3 text-left text-xs font-black uppercase tracking-[0.3em] transition ${activeModule === module.id ? 'border-emerald-600 bg-emerald-600/10 text-slate-900' : 'border-slate-200 bg-white text-emerald-700 hover:border-slate-300 hover:bg-emerald-50 hover:text-emerald-800'}`}
              >
                {module.icon}
                <span className="text-emerald-800">{module.label}</span>
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || messageLoading}
                        className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {messageLoading ? 'Sending...' : 'Send message'}
                      </button>
        <AnimatePresence mode="wait">
          {activeModule === 'home' ? (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-8 shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Dashboard Home</p>
                    <h2 className="mt-3 text-3xl font-black text-white">High-visibility project state</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                      See mission-critical counts, deadline urgency, and the status of every active milestone in one responsive control panel.
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-600/20 bg-emerald-600/10 px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-emerald-700">
                    {project?.partner_id ? 'Industry Co-Sponsored' : 'Internal Academic Track'}
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                  <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/80 p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Current track</p>
                        <p className="mt-3 text-xl font-black text-white">{project?.origin === 'industry' ? 'Industry Sponsored' : 'Academic Only'}</p>
                      </div>
                      <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/80 p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Supervisor</p>
                        <p className="mt-3 text-xl font-black text-white">{project?.supervisor?.full_name || 'Dr. Robert Miller'}</p>
                      </div>
                      <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/80 p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Milestones</p>
                        <p className="mt-3 text-xl font-black text-white">{deliverables.length}</p>
                        <p className="mt-1 text-[11px] text-slate-500 uppercase tracking-[0.25em]">{completedCount} completed</p>
                      </div>
                      <div className="rounded-[1.75rem] border border-slate-800/70 bg-slate-950/80 p-5">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Countdown</p>
                        <p className="mt-3 text-xl font-black text-white">{deadlineCountdown}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Next urgent milestone</p>
                    {nextDeadline ? (
                      <div className="mt-6 space-y-3">
                        <p className="text-xl font-black text-white">{nextDeadline.title}</p>
                        <p className="text-sm leading-relaxed text-slate-400">Due {new Date(nextDeadline.due_date).toLocaleDateString()}</p>
                        <div className="rounded-3xl bg-emerald-600/10 p-4 text-sm font-black uppercase tracking-[0.25em] text-emerald-700">
                          {deadlineCountdown} remaining
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-sm text-slate-400">No active pending milestone deadlines. Keep your project momentum strong.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : activeModule === 'workspace' ? (
            <motion.section
              key="workspace"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-8 shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Project Workspace</p>
                    <h2 className="mt-3 text-3xl font-black text-white">Core metadata and sponsor details</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                      Everything about your active senior project is displayed here, including supervisor contact and track-specific visibility.
                    </p>
                  </div>
                  <div className={`rounded-full px-4 py-3 text-sm font-black uppercase tracking-[0.35em] ${project?.partner_id ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-slate-700/20 bg-slate-900/80 text-slate-300'}`}>
                    {project?.partner_id ? 'Industry Co-Sponsored' : 'Internal Academic Track'}
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Project title</p>
                    <h3 className="mt-3 text-2xl font-black text-white">{project?.title}</h3>
                    <p className="mt-4 text-slate-400 leading-relaxed">{project?.description}</p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Status</p>
                        <p className="mt-2 text-lg font-black text-white">{project?.status || 'PENDING'}</p>
                      </div>
                      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Grade state</p>
                        <p className="mt-2 text-lg font-black text-white">{project?.final_grade || 'Pending'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Supervisor</p>
                      <div className="mt-5 rounded-[1.75rem] border border-slate-800/70 bg-slate-950/80 p-5">
                        <p className="font-black text-white">{project?.supervisor?.full_name || 'Dr. Robert Miller'}</p>
                        <p className="mt-2 text-sm text-slate-400">{project?.supervisor?.email || 'supervisor@university.edu'}</p>
                      </div>
                    </div>
                    {project?.partner_id && (
                      <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-emerald-700 font-black">Industry partner</p>
                        <div className="mt-5 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
                          <p className="font-black text-white">{project.partner?.full_name || 'TechCorp Mentorship'}</p>
                          <p className="mt-2 text-sm text-emerald-700">{project.partner?.email || 'partner@techcorp.com'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : activeModule === 'interaction' ? (
            <motion.section
              key="interaction"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-8 shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Interaction Hub</p>
                    <h2 className="mt-3 text-3xl font-black text-white">Supervisor messaging, draft uploads, and meeting log</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                      Use the two-column collaboration space to keep all communication with your academic mentor centralized.
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.35em] text-emerald-300">
                    {messages.length} messages
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                    <div className="mb-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Message thread</p>
                        <p className="mt-2 text-sm text-slate-400">Live interaction with your supervisor and real-time updates.</p>
                      </div>
                      <div className="inline-flex items-center gap-3 rounded-full bg-emerald-600/10 px-3 py-2 text-[10px] uppercase tracking-[0.35em] text-emerald-700 font-black">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
                      </div>
                    </div>

                    <div className="max-h-[42rem] space-y-4 overflow-y-auto rounded-[2rem] border border-slate-800/80 bg-slate-950/80 p-4">
                      {messages.length > 0 ? messages.map((msg) => {
                        const isAuthor = msg.sender_id === userId
                        return (
                          <div key={msg.id} className={`rounded-3xl p-4 ${isAuthor ? 'bg-emerald-600/15 text-white self-end' : 'bg-white/5 text-slate-800'}`}>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black mb-2">{isAuthor ? 'You' : project?.supervisor?.full_name || 'Supervisor'}</p>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className="mt-3 text-[10px] text-slate-500 uppercase tracking-[0.35em]">{new Date(msg.created_at).toLocaleString()}</p>
                          </div>
                        )
                      }) : (
                        <div className="rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/80 p-10 text-center text-slate-500">
                          No conversation history found yet. Send your first update.
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="mt-6 grid gap-4">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">New message</label>
                      <textarea
                        value={messageInput}
                        onChange={(event) => setMessageInput(event.target.value)}
                        rows={4}
                        placeholder="Write a brief update for your supervisor..."
                        className="min-h-[110px] rounded-[1.75rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                      />

                      <div className="flex items-center justify-between gap-4">
                        <button
                          type="submit"
                          disabled={!messageInput.trim() || messageSending}
                          className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-4 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {messageSending ? 'Sending...' : 'Send message'}
                        </button>

                        <div className="flex-1" />
                      </div>

                      <div className="mt-6 space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-4">
                        <label className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Rough draft upload</label>
                        <p className="mt-2 text-sm text-slate-400">Upload a draft document or asset for supervisor review.</p>
                        <div className="mt-2 flex items-center gap-3">
                          <Upload className="w-5 h-5 text-emerald-600" />
                          <input
                            type="file"
                            accept=".pdf,.docx,.pptx,.zip,.png,.jpg"
                            disabled={uploadState === 'uploaded'}
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (file) {
                                setDraftFile(file)
                                setUploadState('uploaded')
                              }
                            }}
                            className="w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                          />
                        </div>
                        {draftFile ? (
                          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4 text-slate-300">
                            <p className="font-black text-white">{draftFile.name}</p>
                            <p className="mt-2 text-[11px] text-slate-500">Draft is ready to share with your supervisor.</p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No file selected yet.</p>
                        )}
                      </div>

                      <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6 mt-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Consultation log</p>
                            <p className="mt-2 text-sm text-slate-400">Track office-hour requests and approval status.</p>
                          </div>
                          <Sparkles className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div className="mt-6 space-y-4">
                          {meetingLogs.map((meeting) => (
                            <div key={meeting.id} className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-black text-white">{meeting.topic}</p>
                                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] ${meeting.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-300' : meeting.status === 'completed' ? 'bg-slate-700/10 text-slate-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                  {meeting.status}
                                </span>
                              </div>
                              <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">Requested on {meeting.requested_on}</p>
                              <p className="mt-3 text-sm leading-relaxed text-slate-400">{meeting.notes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </form>
                  </div>

                  <div>
                    <PartnerDiscussion projectId={project?.id ?? ''} userId={userId} />
                  </div>
                </div>
              </div>
            </motion.section>
          ) : activeModule === 'milestones' ? (
            <motion.section
              key="milestones"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-8 shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Milestone Submission Engine</p>
                    <h2 className="mt-3 text-3xl font-black text-white">Step-by-step submission and lock state</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                      Each milestone becomes immutable once you submit, and the system moves it into review state with detailed tracking.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-sm font-black uppercase tracking-[0.35em] text-slate-300">
                    {deliverables.filter((d) => d.status !== 'todo').length} locked
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  {deliverables.map((deliverable, index) => {
                    const locked = deliverable.status !== 'todo'
                    return (
                      <div key={deliverable.id} className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Step {index + 1}</p>
                            <h3 className="mt-2 text-xl font-black text-white">{deliverable.title}</h3>
                          </div>
                          <span className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] ${locked ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-200' : 'bg-slate-800/90 text-slate-300 border border-slate-700/60'}`}>
                            {locked ? 'Awaiting review' : 'Ready to submit'}
                          </span>
                        </div>

                        <p className="mt-4 text-slate-400 leading-relaxed">{deliverable.description}</p>
                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Repository or documentation URL</p>
                            <input
                              type="url"
                              value={submissionUrls[deliverable.id] ?? deliverable.submission_url ?? ''}
                              onChange={(event) => setSubmissionUrls((previous) => ({ ...previous, [deliverable.id]: event.target.value }))}
                              disabled={locked}
                              placeholder="https://github.com/your-repo"
                              className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
                            />
                          </div>
                          <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-4">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Due date</p>
                            <p className="mt-3 text-sm font-black text-white">{new Date(deliverable.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm leading-relaxed text-slate-400">
                            {locked ? 'This submission is frozen and now waits for supervisor review.' : 'Lock this milestone by submitting a link for review.'}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleSubmitDeliverable(deliverable.id)}
                            disabled={locked || !submissionUrls[deliverable.id]?.trim()}
                            className="inline-flex items-center justify-center rounded-3xl bg-emerald-600 px-6 py-3 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {locked ? 'Locked' : submitting === deliverable.id ? 'Submitting...' : 'Submit milestone'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.section>
          ) : activeModule === 'grades' ? (
            <motion.section
              key="grades"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.24 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/70 p-8 shadow-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-700 font-black">Grades & Reviews</p>
                    <h2 className="mt-3 text-3xl font-black text-white">Supervisor and partner feedback</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
                      Detailed review panels show supervisor grading notes, optional industry partner remarks, and the locked instructor grade placeholder.
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-sm font-black uppercase tracking-[0.35em] text-slate-300">
                    Review ready
                  </div>
                </div>

                <div className="mt-8 grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Supervisor grading</p>
                    <div className="mt-6 space-y-4">
                      {deliverables.filter((d) => d.feedback_supervisor).length > 0 ? (
                        deliverables
                          .filter((deliverable) => deliverable.feedback_supervisor)
                          .map((deliverable) => (
                            <div key={deliverable.id} className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
                              <p className="font-black text-white">{deliverable.title}</p>
                              <p className="mt-3 text-sm text-slate-400">{deliverable.feedback_supervisor}</p>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/90 p-6 text-sm text-slate-500">
                          No supervisor grading comments are available yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Industry partner remarks</p>
                    <div className="mt-6 space-y-4">
                      {project?.partner_id ? (
                        deliverables.filter((d) => d.feedback_partner).length > 0 ? (
                          deliverables
                            .filter((deliverable) => deliverable.feedback_partner)
                            .map((deliverable) => (
                              <div key={deliverable.id} className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
                                <p className="font-black text-white">{deliverable.title}</p>
                                <p className="mt-3 text-sm text-slate-400">{deliverable.feedback_partner}</p>
                              </div>
                            ))
                        ) : (
                          <div className="rounded-3xl border border-dashed border-slate-700/60 bg-slate-950/90 p-6 text-sm text-slate-500">
                            No partner remarks have been added yet.
                          </div>
                        )
                      ) : (
                        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-6 text-sm text-slate-500">
                          This project is currently internal academic only, so partner remarks are not applicable.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-[2rem] border border-slate-800/80 bg-slate-900/80 p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Instructor final grade</p>
                      <p className="mt-2 text-sm text-slate-400">Secure grade container reserved for final course approval.</p>
                    </div>
                    <div className="rounded-full border border-slate-800/80 bg-slate-900/80 px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-slate-400">
                      Locked container
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
                      <label className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Final grade</label>
                      <input
                        readOnly
                        value={project?.final_grade || 'LOCKED'}
                        className="mt-3 w-full rounded-3xl border border-slate-800/70 bg-slate-900/80 px-4 py-3 text-sm text-slate-200"
                      />
                    </div>
                    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500 font-black">Approval status</p>
                      <p className="mt-3 text-sm font-black text-white">Instructor locked</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">Once released, only instructor accounts can update this final score.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

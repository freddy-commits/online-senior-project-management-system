'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  FolderKanban, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Send, 
  MessageSquare,
  AlertCircle,
  FileText,
  Loader2,
  ChevronRight,
  ListTodo,
  Plus,
  Lock,
  Users
} from 'lucide-react'

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: proj } = await supabase
        .from('projects')
        .select('*, profiles:instructor_id(full_name)')
        .eq('id', id)
        .single()
      
      setProject(proj)

      const { data: deliv } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })
      
      setDeliverables(deliv || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleSubmission(deliverableId: string, url: string) {
    if (!url) return
    setSubmitting(deliverableId)

    const { error } = await supabase
      .from('deliverables')
      .update({ 
        submission_url: url,
        status: 'submitted'
      })
      .eq('id', deliverableId)

    if (!error) {
      setDeliverables(deliverables.map(d => d.id === deliverableId ? { ...d, submission_url: url, status: 'submitted' } : d))
    }
    setSubmitting(null)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  if (!project) return <div className="text-center py-20 text-slate-500 font-bold">Project not found</div>

  const isApproved = project.status === 'approved'

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-8 text-sm font-bold text-slate-400">
        <button onClick={() => router.push('/student/dashboard')} className="hover:text-slate-900 transition-colors">Dashboard</button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-slate-900">Project Interaction</span>
      </div>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 mb-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/60 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${
              isApproved ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}>
              {project.status === 'pending' ? 'Waiting for Supervisor Approval' : project.status}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm font-semibold">
              <div className="flex items-center gap-2 text-slate-500">
                <Users className="w-4 h-4 text-blue-600" />
                Advisor: {project.profiles?.full_name || 'Unassigned'}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => router.push('/messages')} className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-lg transition-all">
              Team Chat
            </button>
          </div>
        </div>
      </div>

      {!isApproved && (
        <div className="mb-10 p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-slate-600 font-medium">
            Your project proposal is currently under review. <span className="text-slate-900 font-bold">Milestone submissions will unlock</span> as soon as your supervisor approves the project.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Deliverables List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-3 mb-2 text-slate-900">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Project Deliverables
          </h2>

          <div className="space-y-4">
            {deliverables.map((item) => (
              <div key={item.id} className={`bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm transition-all ${!isApproved ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      item.status === 'graded' ? 'bg-green-50 text-green-600 border border-green-100' : 
                      item.status === 'submitted' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'TBD'}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    item.status === 'graded' ? 'bg-green-50 text-green-700 border border-green-100' : 
                    item.status === 'submitted' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-slate-100 border border-slate-200 text-slate-500'
                  }`}>
                    {item.status}
                  </div>
                </div>

                {isApproved ? (
                  item.status === 'todo' ? (
                    <div className="flex gap-3">
                      <input 
                        id={`input-${item.id}`}
                        placeholder="Paste your submission URL (GitHub, Drive, etc.)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                      <button 
                        disabled={submitting === item.id}
                        onClick={() => {
                          const val = (document.getElementById(`input-${item.id}`) as HTMLInputElement).value
                          handleSubmission(item.id, val)
                        }}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs text-white uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {submitting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Submit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-3">
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-slate-600 truncate max-w-[200px] font-semibold">{item.submission_url}</span>
                      </div>
                      {item.status === 'graded' ? (
                        <div className="text-xs font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded border border-green-100">Graded: {item.grade}</div>
                      ) : (
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Update Link</button>
                      )}
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Lock className="w-3 h-3 text-slate-400" /> Locked until proposal approval
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Feedback & Tasks */}
        <div className="space-y-8">
          {/* Task Board Section */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900">
                <ListTodo className="w-5 h-5 text-purple-600" />
                Internal Tasks
              </h3>
              <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all">
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="space-y-4">
              {['Define Goals', 'Market Research', 'Stack Choice'].map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs text-slate-600 font-bold">{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Supervisor Notes
            </h3>
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-xs text-slate-500 italic leading-relaxed mb-2 font-medium">
                  "I will review your proposal by the end of the week. Please prepare your system architecture in the meantime."
                </p>
                <div className="text-[10px] font-bold text-slate-400">— Supervisor Johnson</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
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
  Unlock,
  Users
} from 'lucide-react'

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

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

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  const isApproved = project.status === 'approved'

  return (
    <DashboardLayout role="student" userName={userProfile.full_name}>
      <div className="max-w-6xl mx-auto pb-20">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-sm font-bold text-slate-500">
          <button onClick={() => router.push('/student')} className="hover:text-white transition-colors">Dashboard</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Project Interaction</span>
        </div>

        {/* Hero Header */}
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
          
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="max-w-2xl">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${
                isApproved ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
              }`}>
                {project.status === 'pending' ? 'Waiting for Supervisor Approval' : project.status}
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-4 h-4 text-blue-400" />
                  Advisor: {project.profiles?.full_name || 'Unassigned'}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm transition-all border border-white/10">
                Team Chat
              </button>
            </div>
          </div>
        </div>

        {!isApproved && (
          <div className="mb-10 p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-sm text-slate-300 font-medium">
              Your project proposal is currently under review. <span className="text-white font-bold">Milestone submissions will unlock</span> as soon as your supervisor approves the project.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Deliverables List */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Project Deliverables
            </h2>

            <div className="space-y-4">
              {deliverables.map((item) => (
                <div key={item.id} className={`bg-white/5 border border-white/10 rounded-[2rem] p-6 transition-all ${!isApproved ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        item.status === 'graded' ? 'bg-green-500/10 text-green-400' : 
                        item.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-500'
                      }`}>
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">Due: {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'TBD'}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      item.status === 'graded' ? 'bg-green-500/10 text-green-400' : 
                      item.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'
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
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button 
                          disabled={submitting === item.id}
                          onClick={() => {
                            const val = (document.getElementById(`input-${item.id}`) as HTMLInputElement).value
                            handleSubmission(item.id, val)
                          }}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Submit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <ExternalLink className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-slate-400 truncate max-w-[200px]">{item.submission_url}</span>
                        </div>
                        {item.status === 'graded' ? (
                          <div className="text-xs font-black text-green-400 uppercase tracking-widest">Graded: {item.grade}</div>
                        ) : (
                          <button className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Update Link</button>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      <Lock className="w-3 h-3" /> Locked until proposal approval
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Feedback & Tasks */}
          <div className="space-y-8">
            {/* Task Board Section */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <ListTodo className="w-5 h-5 text-purple-400" />
                  Internal Tasks
                </h3>
                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="space-y-4">
                {['Define Goals', 'Market Research', 'Stack Choice'].map((t, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-300">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
                Supervisor Notes
              </h3>
              <div className="space-y-6">
                <div className="relative pl-6 border-l-2 border-white/10">
                  <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-xs text-slate-400 italic leading-relaxed mb-2">
                    "I will review your proposal by the end of the week. Please prepare your system architecture in the meantime."
                  </p>
                  <div className="text-[10px] font-bold text-slate-600">— Supervisor Johnson</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

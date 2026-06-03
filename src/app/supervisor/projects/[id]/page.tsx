'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  MessageSquare,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Lock,
  X
} from 'lucide-react'

export default function SupervisorReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      let projData = null
      let delivData = null
      
      try {
        const { data: proj, error: projErr } = await supabase
          .from('projects')
          .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
          .eq('id', id)
          .single()
        
        if (projErr) throw projErr
        projData = proj

        const { data: deliv, error: delivErr } = await supabase
          .from('deliverables')
          .select('*')
          .eq('project_id', id)
          .order('due_date', { ascending: true })
          
        if (delivErr) throw delivErr
        delivData = deliv
      } catch (err) {
        console.error('Supabase fetch failed:', err)
      }

      setProject(projData)
      setDeliverables(delivData || [])
      setLoading(false)
    }
    fetchData()
  }, [id, router])

  async function handleGradeSubmission(delivId: string, grade: string) {
    if (!grade) return
    setProcessing(true)
    try {
      const { error } = await supabase
        .from('deliverables')
        .update({ grade, status: 'graded' })
        .eq('id', delivId)
      if (error) throw new Error(error.message)

      setDeliverables(deliverables.map(d => d.id === delivId ? { ...d, grade, status: 'graded' } : d))
      setSuccessMsg('Grade submitted successfully!')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (dbErr: any) {
      console.error('Supabase grading update failed:', dbErr)
      alert('Failed to update grade: ' + dbErr.message)
    }
    setProcessing(false)
  }

  async function handleFeedbackSubmission(delivId: string, feedback: string) {
    if (!feedback.trim()) return
    setProcessing(true)
    
    const delivItem = deliverables.find(d => d.id === delivId)
    if (!delivItem || !project) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Insert recommendation comment message to the student
      const { error: msgErr } = await supabase.from('messages').insert({
        sender_id: user?.id,
        receiver_id: project.student_id,
        content: `[Supervisor Recommendation] Milestone "${delivItem.title}": ${feedback}`
      })
      if (msgErr) throw msgErr

      // 2. Insert notification
      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: project.student_id,
        title: `New Recommendation on ${delivItem.title}`,
        message: `Your supervisor added recommendations: "${feedback.slice(0, 80)}..."`,
        type: 'system'
      })
      if (notifErr) throw notifErr

      // Clear the textarea
      const textarea = document.getElementById(`recommend-${delivId}`) as HTMLTextAreaElement
      if (textarea) textarea.value = ''
      
      setSuccessMsg('Supervisor Recommendation sent successfully!')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (dbErr: any) {
      console.error('Supabase feedback submission failed:', dbErr)
      alert('Failed to submit recommendation: ' + dbErr.message)
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-slate-500 font-bold">
        Project not found or not assigned to you.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 pb-20 text-slate-800 font-sans">
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              {successMsg}
            </div>
            <button onClick={() => setSuccessMsg('')} className="p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-455">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-slate-100 pb-6">
        <div>
          <button 
            onClick={() => router.push('/supervisor/dashboard')} 
            className="text-slate-400 hover:text-slate-700 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Workspace
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">{project.title}</h1>
          <p className="text-xs font-semibold text-slate-450 mt-1">{project.description}</p>
        </div>

        <div className="flex gap-3 shrink-0">
          <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Project Approved & Assigned
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Deliverables Area */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-black text-slate-955 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Submission & Deliverable History
          </h2>
          
          <div className="space-y-4">
            {deliverables.length > 0 ? deliverables.map((item) => (
              <div key={item.id} className="bg-white border border-slate-150 rounded-[2.25rem] p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 pb-5 border-b border-slate-50">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400 shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs font-semibold text-slate-450 mt-1">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          item.status === 'graded' 
                            ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                            : item.status === 'submitted'
                              ? 'bg-blue-50 border-blue-100 text-blue-700 animate-pulse'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {item.status}
                        </span>
                        {item.due_date && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            Due: {new Date(item.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.submission_url && (
                    <a 
                      href={item.submission_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all text-slate-700 shadow-sm shrink-0 cursor-pointer self-start"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Submission
                    </a>
                  )}
                </div>
                
                {/* Grading & Feedback controls */}
                <div className="space-y-4">
                  {item.status === 'graded' ? (
                    <div className="flex items-center justify-between p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                      <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Final Milestone Grade</span>
                      <span className="font-black text-lg text-indigo-800">{item.grade}</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[9.5px] font-black text-slate-455 uppercase tracking-widest">Supervisor Recommendations</span>
                      </div>
                      <textarea 
                        id={`recommend-${item.id}`}
                        placeholder="Type comments, feedback, or recommendations for revisions..."
                        className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 rounded-xl p-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none text-slate-800"
                        rows={2}
                      />
                      
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <button 
                          onClick={() => {
                            const val = (document.getElementById(`recommend-${item.id}`) as HTMLTextAreaElement).value
                            handleFeedbackSubmission(item.id, val)
                          }}
                          disabled={processing}
                          className="flex-1 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
                        >
                          Send Recommendation
                        </button>
                        
                        {(item.status === 'submitted' || item.title.toLowerCase().includes('final') || item.title.toLowerCase().includes('report')) && (
                          <div className="flex gap-2">
                            <input 
                              id={`grade-${item.id}`}
                              placeholder="Grade (A, B...)"
                              maxLength={3}
                              className="w-24 bg-white border border-slate-250 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs font-bold text-center focus:outline-none"
                            />
                            <button 
                              onClick={() => {
                                const val = (document.getElementById(`grade-${item.id}`) as HTMLInputElement).value
                                handleGradeSubmission(item.id, val)
                              }}
                              disabled={processing}
                              className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0"
                            >
                              Grade
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-16 border-2 border-dashed border-slate-200 rounded-[2.25rem] text-center text-slate-400 font-bold text-xs bg-slate-50/30">
                Waiting for student to schedule or upload project milestones.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Panels */}
        <div className="space-y-6">
          {/* Student details card */}
          <div className="bg-white border border-slate-150 rounded-[2.25rem] p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Student Lead Information
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-150 text-indigo-700 flex items-center justify-center font-black text-md shrink-0 shadow-sm">
                {project.student?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'ST'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate block">{project.student?.full_name || 'Assigned Student'}</div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1 truncate block">{project.student?.email || 'No email provided'}</div>
              </div>
            </div>
            {project.industry_partner_id && (
              <button 
                onClick={() => router.push('/supervisor/teams')}
                className="w-full py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Open Team Workspace
              </button>
            )}
          </div>

          {/* Academic notice cards */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 border border-indigo-100 rounded-[2.25rem] p-6">
            <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3">Academic Guidelines</h3>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              As an Academic Supervisor, you are responsible for checking milestones regularly, leaving specific technical feedback/recommendations, and submitting the final deliverable grade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

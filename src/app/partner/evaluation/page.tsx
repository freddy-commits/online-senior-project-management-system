'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { 
  Target, 
  CheckCircle, 
  ExternalLink, 
  MessageSquare, 
  Star,
  FileText,
  AlertCircle,
  Loader2,
  ThumbsUp
} from 'lucide-react'

const getMilestoneDescription = (title: string): string => {
  const descMap: Record<string, string> = {
    'Project Proposal': 'Detailed research scope, timeline, risk mitigation plans, and software architecture diagrams.',
    'Initial Architecture & Schema': 'Define the application database modeling, entity relationship diagram, and API interface specifications.',
    'Mid-Term Presentation': 'Status report on baseline execution, initial results telemetry, and frontend/backend integration status.',
    'Final Execution & Thesis': 'Final code repository release, user evaluation validation reports, and the printed thesis defense draft.',
    'Project Pitch & Scoping': 'Aligning with the industry mentor on team expectations, technical stack requirements, and MVP objectives.',
    'System Architecture Diagram': 'Documenting application infrastructure, cloud service endpoints, data schemas, and API routes.',
    'Beta Demo & Testing': 'Deploying the interactive application build, executing end-to-end integration tests, and collecting partner telemetry.',
    'Final Client Deliverables': 'Handing over administrative control settings, final production build artifacts, and client handover presentations.'
  }
  return descMap[title] || 'No description provided.'
}

export default function PartnerEvaluationPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [selectedProj, setSelectedProj] = useState<any>(null)
  const [selectedDeliv, setSelectedDeliv] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comments, setComments] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchSponsorshipDetails()
  }, [])

  async function fetchSponsorshipDetails() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch partner sponsored projects
    const { data: projs } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email)')
      .eq('industry_partner_id', user.id)

    setProjects(projs || [])

    if (projs && projs.length > 0) {
      setSelectedProj(projs[0])
      
      // Fetch deliverables for the first project
      const { data: delivs } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projs[0].id)
        .order('due_date', { ascending: true })

      const enriched = (delivs || []).map((d: any) => ({
        ...d,
        description: d.description || getMilestoneDescription(d.title)
      }))
      setDeliverables(enriched)
      if (enriched.length > 0) {
        setSelectedDeliv(enriched[0])
      }
    }
    setLoading(false)
  }

  async function handleSignOff(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDeliv) return

    setProcessing(true)
    const { data: { user } } = await supabase.auth.getUser()

    // Update deliverable status to graded (or signed-off by sponsor)
    const { error } = await supabase
      .from('deliverables')
      .update({
        status: 'graded',
        grade: 'Pass (Sponsor Vetted)'
      })
      .eq('id', selectedDeliv.id)

    if (!error) {
      // Notify student
      await supabase.from('notifications').insert({
        user_id: selectedProj.student_id,
        title: 'Sponsor Approved Milestone',
        message: `Your industry sponsor has approved your milestone: "${selectedDeliv.title}". Feedback: ${comments || 'Excellent industry alignment.'}`,
        type: 'system'
      })

      // Send feedback message
      if (comments.trim() && user) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: selectedProj.student_id,
          content: `[Sponsor Sign-off] Rating: ${rating}/5. Comments: ${comments}`
        })
      }

      setComments('')
      
      // Refresh list
      const { data } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', selectedProj.id)
        .order('due_date', { ascending: true })

      const enriched = (data || []).map((d: any) => ({
        ...d,
        description: d.description || getMilestoneDescription(d.title)
      }))
      setDeliverables(enriched)
      const updatedDeliv = enriched.find((d: any) => d.id === selectedDeliv.id)
      setSelectedDeliv(updatedDeliv || null)
    }
    setProcessing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2">Milestone Evaluation Sign-off</h1>
        <p className="text-slate-400">Validate sponsored deliverables, check criteria alignments, and sign off milestones with feedback loops.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Project & Milestone lists column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Projects Select Card */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Sponsored Projects</h3>
            <div className="space-y-2">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={async () => {
                    setSelectedProj(p)
                    const { data } = await supabase
                      .from('deliverables')
                      .select('*')
                      .eq('project_id', p.id)
                      .order('due_date', { ascending: true })
                    const enriched = (data || []).map((d: any) => ({
                      ...d,
                      description: d.description || getMilestoneDescription(d.title)
                    }))
                    setDeliverables(enriched)
                    setSelectedDeliv(enriched[0] || null)
                  }}
                  className={`w-full p-4 text-left rounded-2xl border transition-all text-xs font-bold ${
                    selectedProj?.id === p.id 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Deliverables lists */}
          {selectedProj && (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Milestone Deliverables</h3>
              <div className="space-y-2">
                {deliverables.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDeliv(d)}
                    className={`w-full p-4 text-left rounded-2xl border transition-all text-xs font-bold flex items-center justify-between ${
                      selectedDeliv?.id === d.id 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="truncate pr-2">{d.title}</span>
                    <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded shrink-0 ${
                      d.status === 'graded' ? 'bg-green-500/20 text-green-400' :
                      d.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {d.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Detailed Evaluation details column */}
        <div className="lg:col-span-2">
          {selectedDeliv ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl"
            >
              <div className="border-b border-white/5 pb-6 mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${
                  selectedDeliv.status === 'graded' ? 'bg-green-500/10 text-green-400' :
                  selectedDeliv.status === 'submitted' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-white/5 text-slate-400'
                }`}>
                  {selectedDeliv.status}
                </span>
                <h2 className="text-2xl font-black text-white mb-2">{selectedDeliv.title}</h2>
                <p className="text-slate-400 text-sm">{selectedDeliv.description}</p>
              </div>

              {selectedDeliv.status === 'todo' && (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-700" />
                  Awaiting student submission for this milestone.
                </div>
              )}

              {selectedDeliv.status !== 'todo' && (
                <div className="space-y-6">
                  {/* Submission Link block */}
                  <div className="p-6 bg-slate-950/40 border border-white/5 rounded-2xl">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Student Work Submission</div>
                    <a 
                      href={selectedDeliv.submission_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:underline break-all"
                    >
                      {selectedDeliv.submission_url}
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </a>
                  </div>

                  {/* Sign-off Form */}
                  {selectedDeliv.status === 'submitted' ? (
                    <form onSubmit={handleSignOff} className="space-y-6">
                      <div className="border-t border-white/5 pt-6">
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Industry Readiness Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="p-1 cursor-pointer"
                            >
                              <Star className={`w-8 h-8 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Add Evaluation Feedback</label>
                        <textarea
                          rows={4}
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide suggestions to bridge academic design with production environments..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-green-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                        Approve & Sign-off Milestone
                      </button>
                    </form>
                  ) : (
                    <div className="p-6 bg-green-500/5 border border-green-500/10 rounded-2xl flex items-start gap-4">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-bold text-green-400 text-sm">Signed Off</h4>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          This milestone has been signed off and approved as meeting both academic and industry standards. Feedback has been sent to the team.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="h-64 border border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center text-slate-500 text-sm">
              Select a deliverable milestone from the menu to review.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

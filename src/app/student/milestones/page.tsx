'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Link as LinkIcon,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  FileCheck
} from 'lucide-react'

export default function StudentMilestonesPage() {
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDeliverables()
  }, [])

  async function fetchDeliverables() {
    // Fetch user profile first
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find user's project
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('student_id', user.id)

    if (projects && projects.length > 0) {
      const { data: delivs } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', projects[0].id)
        .order('due_date', { ascending: true })

      setDeliverables(delivs || [])
      if (delivs && delivs.length > 0) {
        setSelectedMilestone(delivs[0])
      }
    }
    setLoading(false)
  }

  async function handleSubmission(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMilestone || !submissionUrl.trim()) return

    setSubmitting(true)
    const { data, error } = await supabase
      .from('deliverables')
      .update({ 
        submission_url: submissionUrl,
        status: 'submitted'
      })
      .eq('id', selectedMilestone.id)
      .single()

    if (!error) {
      // update local state
      setDeliverables(deliverables.map(d => d.id === selectedMilestone.id ? { ...d, submission_url: submissionUrl, status: 'submitted' } : d))
      setSelectedMilestone({ ...selectedMilestone, submission_url: submissionUrl, status: 'submitted' })
      setSubmissionUrl('')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Clock className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Milestones & Submissions</h1>
        <p className="text-slate-600">Track upcoming deadlines, submit project deliverables, and view instructor reviews.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Milestones Checklist */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-2">Milestone Schedule</h2>
          {deliverables.map((deliv) => {
            const isSelected = selectedMilestone?.id === deliv.id
            const isTodo = deliv.status === 'todo'
            const isSubmitted = deliv.status === 'submitted'
            const isGraded = deliv.status === 'graded'

            return (
              <button
                key={deliv.id}
                onClick={() => setSelectedMilestone(deliv)}
                className={`w-full p-5 text-left border rounded-[2rem] transition-all flex items-start justify-between gap-4 cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/10' 
                    : 'bg-white border-slate-200 text-slate-600 hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    {isGraded && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                    {isSubmitted && <Clock className="w-4 h-4 text-yellow-400" />}
                    {isTodo && <AlertCircle className="w-4 h-4 text-slate-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                      {deliv.status}
                    </span>
                  </div>
                  <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{deliv.title}</h3>
                  <p className={`text-[10px] mt-2 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    Due {new Date(deliv.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 mt-1 opacity-50" />
              </button>
            )
          })}
        </div>

        {/* Milestone Detail & Submission Action */}
        <div className="lg:col-span-2">
          {selectedMilestone ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm"
            >
              {/* Deliverable Meta */}
              <div className="border-b border-slate-100 pb-6 mb-6">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${
                  selectedMilestone.status === 'graded' ? 'bg-green-100 text-green-700' :
                  selectedMilestone.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedMilestone.status}
                </span>
                <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedMilestone.title}</h2>
                <p className="text-slate-600 text-sm leading-relaxed">{selectedMilestone.description}</p>
              </div>

              {/* Submit panel */}
              <div className="space-y-6">
                {selectedMilestone.status === 'todo' ? (
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 mb-3">Submit Deliverable</h3>
                    <form onSubmit={handleSubmission} className="space-y-4">
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                          type="url"
                          required
                          value={submissionUrl}
                          onChange={(e) => setSubmissionUrl(e.target.value)}
                          placeholder="Paste document link (e.g. Google Doc, GitHub Repo URL)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] inline-flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {submitting ? 'Submitting...' : 'Upload Link'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Your Submission</div>
                      <a 
                        href={selectedMilestone.submission_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 hover:underline break-all"
                      >
                        {selectedMilestone.submission_url}
                        <ExternalLink className="w-4 h-4 shrink-0" />
                      </a>
                    </div>

                    {selectedMilestone.status === 'graded' && (
                      <div className="p-6 bg-green-50 border border-green-200 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                          <FileCheck className="w-5 h-5 text-green-600" />
                          <h4 className="font-bold text-green-700 text-sm">Graded & Reviewed</h4>
                        </div>
                        <div className="text-3xl font-black text-green-900 mb-2">{selectedMilestone.grade || 'A'}</div>
                        <p className="text-green-800 text-xs leading-relaxed">
                          Great job! The requirements are met. The UI and documentation look clean. Keep up the high standard for the system design phase.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-64 border border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center text-slate-500">
              No milestones found.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

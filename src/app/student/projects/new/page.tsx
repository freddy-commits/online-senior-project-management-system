'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Info } from 'lucide-react'
import { useTrack } from '@/components/providers/TrackProvider'

export default function NewProjectPage() {
  const { trackMode, setTrackMode } = useTrack()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // If the user lands here, they are starting a capstone project.
    // We should automatically transition their track mode context to 'thesis'.
    if (trackMode !== 'thesis') {
      setTrackMode('thesis')
    }
  }, [trackMode, setTrackMode])

  if (trackMode !== 'thesis') {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in.')

      const { error: insertError } = await supabase.from('projects').insert({
        title,
        description,
        status: 'pending',
        student_id: user.id
      })

      if (insertError) throw insertError

      router.push('/student/dashboard/overview')
    } catch (err: any) {
      console.error("Supabase project insert failed:", err)
      setError(err.message || 'Failed to submit the project proposal to Supabase.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Start Capstone Project</h1>
        <p className="text-sm text-slate-500 font-semibold mt-2">Submit your thesis proposal for Instructor review and Supervisor assignment.</p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed font-semibold">
          <strong className="block mb-1">Approval Workflow</strong>
          Once you submit this proposal, it will be placed in the <span className="font-bold">Pending</span> queue. Your Instructor will review the academic merit of your proposal and match you with a Faculty Supervisor. You will be notified once a Supervisor is assigned.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Project Title</label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Advanced Machine Learning for Dialect Datasets"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Abstract & Description</label>
          <textarea
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your methodology, goals, and intended research outcome..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !description.trim()}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Submit Proposal
          </button>
        </div>
      </form>
    </div>
  )
}

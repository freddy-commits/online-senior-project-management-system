'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  Rocket, 
  ArrowLeft, 
  Send, 
  FileText, 
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')

      // 1. Create the project
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          student_id: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (projError) throw projError

      // 2. Create the first milestone (Proposal) automatically
      const { error: delivError } = await supabase
        .from('deliverables')
        .insert({
          project_id: project.id,
          title: 'Project Proposal',
          submission_url: 'Submitted',
          status: 'submitted'
        })

      if (delivError) throw delivError

      // 3. Create a notification for the student
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Proposal Submitted',
        message: 'Your project proposal has been sent to the department for review.',
        type: 'system'
      })

      setSuccess(true)
      setTimeout(() => router.push('/student/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <button 
        onClick={() => router.back()} 
        className="text-slate-500 hover:text-slate-900 text-sm font-bold mb-8 flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </button>

      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 z-20 bg-white/95 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 border border-green-200">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Proposal Submitted!</h2>
            <p className="text-slate-500">Waiting for supervisor approval. Redirecting...</p>
          </div>
        )}

        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center">
            <Rocket className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Propose New Project</h1>
            <p className="text-slate-500 text-sm font-medium">Start your senior journey by submitting your proposal.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Project Title</label>
              <input 
                name="title"
                required
                placeholder="e.g. AI-Powered Healthcare Dashboard"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Project Description</label>
              <textarea 
                name="description"
                required
                rows={4}
                placeholder="Briefly describe the problem you're solving..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none font-medium leading-relaxed"
              />
            </div>

          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-xs text-white uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Submit Proposal
          </button>
        </form>
      </div>
    </div>
  )
}

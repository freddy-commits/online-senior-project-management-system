'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
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
    const proposalUrl = formData.get('proposal_url') as string

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
          description: 'Initial project scope and objectives.',
          submission_url: proposalUrl,
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
      setTimeout(() => router.push('/student'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="student" userName="Student">
      <div className="max-w-3xl mx-auto pb-20">
        <button 
          onClick={() => router.back()} 
          className="text-slate-500 hover:text-white text-sm font-bold mb-8 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl relative overflow-hidden">
          {/* Success Overlay */}
          {success && (
            <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center text-center p-8 backdrop-blur-md">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Proposal Submitted!</h2>
              <p className="text-slate-400">Waiting for supervisor approval. Redirecting...</p>
            </div>
          )}

          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center">
              <Rocket className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Propose New Project</h1>
              <p className="text-slate-500 text-sm">Start your senior journey by submitting your proposal.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Project Title</label>
                <input 
                  name="title"
                  required
                  placeholder="e.g. AI-Powered Healthcare Dashboard"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Project Description</label>
                <textarea 
                  name="description"
                  required
                  rows={4}
                  placeholder="Briefly describe the problem you're solving..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Proposal Document URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    name="proposal_url"
                    required
                    type="url"
                    placeholder="Link to Google Doc or PDF"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic">* Ensure the link is accessible to your supervisor.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Proposal
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

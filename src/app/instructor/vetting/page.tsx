'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardList, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink,
  MessageSquare,
  FileText,
  User,
  Loader2
} from 'lucide-react'

export default function InstructorVettingPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [feedback, setFeedback] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchPendingProposals()
  }, [])

  async function fetchPendingProposals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch all pending projects (or assigned projects that are pending)
    const { data: projs } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    setProposals(projs || [])
    if (projs && projs.length > 0) {
      setSelectedProposal(projs[0])
    } else {
      setSelectedProposal(null)
    }
    setLoading(false)
  }

  async function updateStatus(projectId: string, status: 'approved' | 'rejected') {
    setProcessing(projectId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('projects')
      .update({ 
        status: status,
        instructor_id: user.id // Self-assign advisor during approval if unassigned
      })
      .eq('id', projectId)

    if (!error) {
      // Notify student
      await supabase.from('notifications').insert({
        user_id: selectedProposal.student_id,
        title: status === 'approved' ? 'Proposal Approved' : 'Proposal Rejected',
        message: status === 'approved' 
          ? `Your project "${selectedProposal.title}" has been approved. You can now start submitting milestones.`
          : `Changes were requested on your proposal: ${feedback || 'Please review syllabus criteria.'}`,
        type: 'system'
      })

      // Add feedback note if provided
      if (feedback.trim()) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          receiver_id: selectedProposal.student_id,
          content: `Vetting feedback on proposal "${selectedProposal.title}": ${feedback}`
        })
      }

      setFeedback('')
      
      // Update local state
      const updatedList = proposals.filter(p => p.id !== projectId)
      setProposals(updatedList)
      if (updatedList.length > 0) {
        setSelectedProposal(updatedList[0])
      } else {
        setSelectedProposal(null)
      }
    }
    setProcessing(null)
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
        <h1 className="text-3xl font-black text-white mb-2">Proposal Vetting Queue</h1>
        <p className="text-slate-400">Review industry sponsorships and student project proposals. Verify team sizes and scope limits.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Proposal Queue List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Queue ({proposals.length})</h2>
          
          <div className="space-y-3">
            {proposals.length > 0 ? proposals.map((p) => {
              const isSelected = selectedProposal?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProposal(p)}
                  className={`w-full p-5 text-left border rounded-[2rem] transition-all flex items-start justify-between gap-4 cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/10' 
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm truncate">{p.title}</h3>
                    <p className={`text-[10px] mt-2 font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      Lead: {p.student?.full_name || 'Unknown Student'}
                    </p>
                  </div>
                  <span className="text-[9px] uppercase font-black bg-white/10 px-2 py-0.5 rounded shrink-0">Pending</span>
                </button>
              )
            }) : (
              <div className="p-8 border border-dashed border-white/5 text-center text-slate-500 rounded-[2rem] text-sm">
                Queue is empty. Excellent work!
              </div>
            )}
          </div>
        </div>

        {/* Detailed Review & Actions Panel */}
        <div className="lg:col-span-2">
          {selectedProposal ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-xl"
            >
              <div className="border-b border-white/5 pb-6 mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  Needs Vetting Review
                </span>
                <h2 className="text-2xl font-black text-white mb-2">{selectedProposal.title}</h2>
                
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Student: {selectedProposal.student?.full_name} ({selectedProposal.student?.email})</span>
                  </div>
                </div>
              </div>

              {/* Proposal description */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Abstract & Objectives</h3>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                    {selectedProposal.description}
                  </p>
                </div>

                {/* Feedback Input */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Add Feedback / Notes</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide revision suggestions or reason for rejection (optional)..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none"
                  />
                </div>

                {/* Vetting Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    disabled={processing === selectedProposal.id}
                    onClick={() => updateStatus(selectedProposal.id, 'approved')}
                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-green-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Approve Proposal
                  </button>

                  <button
                    disabled={processing === selectedProposal.id}
                    onClick={() => updateStatus(selectedProposal.id, 'rejected')}
                    className="py-4 px-6 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Request Changes
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-64 border border-dashed border-white/10 rounded-[2.5rem] flex items-center justify-center text-slate-500 text-sm">
              Select a proposal from the queue to start review.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

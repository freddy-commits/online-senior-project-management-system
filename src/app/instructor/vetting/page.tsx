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
  Loader2,
  Building2,
  Search,
  Archive,
  Inbox,
  CheckCircle2
} from 'lucide-react'

export default function InstructorVettingPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  
  // Tabs & Filter State
  const [activeTab, setActiveTab] = useState<'queue' | 'archive'>('queue')
  const [searchQuery, setSearchQuery] = useState('')
  const [originFilter, setOriginFilter] = useState<'all' | 'student' | 'industry'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  
  const [feedback, setFeedback] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchProposals()
  }, [])

  async function fetchProposals() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch all projects (both student proposals and industry pitches)
    const { data: projs } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), industry_partner:industry_partner_id(full_name, email)')
      .order('created_at', { ascending: false })

    const enrichedProjs = (projs || []).map((p: any) => ({
      ...p,
      origin: p.industry_partner_id ? 'industry' : 'student'
    }))
    setProposals(enrichedProjs)
    
    // Auto-select first item in current view if possible
    const initialList = enrichedProjs
    const pendingOnly = initialList.filter((p: any) => p.status === 'pending')
    if (pendingOnly.length > 0) {
      setSelectedProposal(pendingOnly[0])
    } else if (initialList.length > 0) {
      setSelectedProposal(initialList[0])
    } else {
      setSelectedProposal(null)
    }
    setLoading(false)
  }

  async function updateStatus(projectId: string, status: 'approved' | 'rejected') {
    setProcessing(projectId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Exclusive admin authority: we do NOT update instructor_id when approving.
    // It remains null or whatever the admin sets, as instructors do not assign themselves.
    let vettingError = null
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: status
        })
        .eq('id', projectId)
      if (error) throw new Error(error.message)
    } catch (dbErr: any) {
      console.warn('Supabase vetting status update failed, performing local database sync fallback:', dbErr)
      
      // Fallback: Sync with LocalStorage Mock Database so the UI stays 100% functional
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (parsed.projects) {
              parsed.projects = parsed.projects.map((p: any) => 
                p.id === projectId ? { ...p, status: status } : p
              )
              localStorage.setItem(storageKey, JSON.stringify(parsed))
              
              // Sync to server mock global state
              await fetch('/api/sandbox/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
              }).catch(() => {})
            }
          } catch (jsonErr) {
            vettingError = jsonErr
          }
        } else {
          vettingError = dbErr
        }
      } else {
        vettingError = dbErr
      }
    }

    if (!vettingError) {
      // Find the updated proposal details in local state to construct email/notifications
      const currentProj = proposals.find(p => p.id === projectId)
      if (currentProj) {
        if (currentProj.origin === 'student') {
          // Notify student
          await supabase.from('notifications').insert({
            user_id: currentProj.student_id,
            title: status === 'approved' ? 'Proposal Approved' : 'Proposal Rejected',
            message: status === 'approved' 
              ? `Your project "${currentProj.title}" has been approved. You can now start submitting milestones.`
              : `Changes were requested on your proposal: ${feedback || 'Please review syllabus criteria.'}`,
            type: 'system'
          })

          // Add feedback note as a message if provided
          if (feedback.trim()) {
            await supabase.from('messages').insert({
              sender_id: user.id,
              receiver_id: currentProj.student_id,
              content: `[Vetting Feedback] for proposal "${currentProj.title}": ${feedback}`
            })
          }

          // Send notification email
          const studentEmail = currentProj.student?.email
          const studentName = currentProj.student?.full_name
          if (studentEmail) {
            try {
              const { sendNotificationEmail } = await import('@/lib/email/emailService')
              const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`
              
              await sendNotificationEmail({
                toEmail: studentEmail,
                toName: studentName || 'Student',
                subject: status === 'approved' ? '🎉 Project Proposal Approved!' : '📝 Revisions Requested on Project Proposal',
                bodyText: status === 'approved'
                  ? `Hi ${studentName},\n\nWe are excited to inform you that your senior capstone project proposal "${currentProj.title}" has been APPROVED!\n\nYou can now log in to start submitting milestones.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`
                  : `Hi ${studentName},\n\nRevisions have been requested on your project proposal "${currentProj.title}" by your advisor.\n\nFeedback: ${feedback || 'Please log in to review standard syllabus criteria.'}\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
                bodyHtml: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #334155;">
                    <h2 style="color: ${status === 'approved' ? '#10b981' : '#f59e0b'}; margin-bottom: 20px;">
                      ${status === 'approved' ? '🎉 Proposal Approved!' : '📝 Revisions Requested'}
                    </h2>
                    <p>Hi <strong>${studentName}</strong>,</p>
                    <p>Your capstone advisor has updated your proposal status:</p>
                    <blockquote style="background: #f8fafc; border-left: 4px solid ${status === 'approved' ? '#10b981' : '#f59e0b'}; padding: 12px; margin: 16px 0;">
                      <strong>Project Title:</strong> ${currentProj.title}<br/>
                      <strong>Status:</strong> <span style="font-weight: bold; color: ${status === 'approved' ? '#10b981' : '#f59e0b'}; text-transform: uppercase;">${status}</span><br/>
                      ${feedback ? `<strong>Feedback:</strong> "${feedback}"` : ''}
                    </blockquote>
                    <p>${status === 'approved' ? 'You are now ready to begin executing milestone deliverables!' : 'Please review the comments above and edit your proposal details.'}</p>
                    <div style="margin: 30px 0; text-align: center;">
                      <a href="${loginUrl}" style="background: ${status === 'approved' ? '#10b981' : '#f59e0b'}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Access Portal</a>
                    </div>
                  </div>
                `
              })
            } catch (err) {
              console.error('Email send error:', err)
            }
          }
        } else {
          // It is an industry partner proposal
          if (currentProj.industry_partner_id) {
            await supabase.from('notifications').insert({
              user_id: currentProj.industry_partner_id,
              title: status === 'approved' ? 'Pitch Approved' : 'Pitch Rejected',
              message: status === 'approved' 
                ? `Your project pitch "${currentProj.title}" has been approved and is available for team allocation.`
                : `Changes were requested on your pitch: ${feedback}`,
              type: 'system'
            })
          }
        }
      }

      setFeedback('')
      
      // Refresh database records
      const { data: refreshedProjs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), industry_partner:industry_partner_id(full_name, email)')
        .order('created_at', { ascending: false })
      
      const newList = refreshedProjs || []
      setProposals(newList)
      
      // Keep selecting the current project but updated, or fall back
      const match = newList.find(p => p.id === projectId)
      if (match) {
        setSelectedProposal(match)
      } else if (newList.length > 0) {
        setSelectedProposal(newList[0])
      } else {
        setSelectedProposal(null)
      }
    } else {
      // Local sync fallback update
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (parsed.projects) {
              setProposals(parsed.projects)
              const match = parsed.projects.find((p: any) => p.id === projectId)
              if (match) setSelectedProposal(match)
            }
          } catch (e) {}
        }
      }
    }
    setProcessing(null)
  }

  // Client-side filtering logic
  const filteredProposals = proposals.filter((p) => {
    // 1. Tab filter
    if (activeTab === 'queue' && p.status !== 'pending') return false

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const titleMatch = p.title?.toLowerCase().includes(q)
      const descMatch = p.description?.toLowerCase().includes(q)
      const studentMatch = p.student?.full_name?.toLowerCase().includes(q)
      const partnerMatch = p.industry_partner?.full_name?.toLowerCase().includes(q)
      if (!titleMatch && !descMatch && !studentMatch && !partnerMatch) return false
    }

    // 3. Origin type filter
    if (originFilter !== 'all' && p.origin !== originFilter) return false

    // 4. Status filter (only applied in Archives tab)
    if (activeTab === 'archive' && statusFilter !== 'all' && p.status !== statusFilter) return false

    return true
  })

  // Count helper
  const pendingCount = proposals.filter(p => p.status === 'pending').length

  if (loading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 text-slate-800">
      {/* Header section */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Proposal Vetting Panel</h1>
        <p className="text-slate-500 font-medium">Review and validate student research ideas and industry sponsorship pitches before allocation.</p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-8 gap-6">
        <button
          onClick={() => {
            setActiveTab('queue')
            const filtered = proposals.filter(p => p.status === 'pending')
            setSelectedProposal(filtered[0] || null)
          }}
          className={`pb-4 px-2 font-bold text-sm tracking-wide transition-all flex items-center gap-2 border-b-2 outline-none cursor-pointer ${
            activeTab === 'queue'
              ? 'border-slate-900 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Active Vetting Queue
          {pendingCount > 0 && (
            <span className="ml-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('archive')
            setSelectedProposal(proposals[0] || null)
          }}
          className={`pb-4 px-2 font-bold text-sm tracking-wide transition-all flex items-center gap-2 border-b-2 outline-none cursor-pointer ${
            activeTab === 'archive'
              ? 'border-slate-900 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Archive className="w-4 h-4" />
          Proposal Archives
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
            {proposals.length}
          </span>
        </button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposals, students, sponsors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 transition-all font-semibold"
          />
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Origin:</span>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Submissions</option>
              <option value="student">Student-led Proposals</option>
              <option value="industry">Industry Pitches</option>
            </select>
          </div>

          {activeTab === 'archive' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Proposal Queue List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
            Matches ({filteredProposals.length})
          </h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProposals.length > 0 ? filteredProposals.map((p) => {
              const isSelected = selectedProposal?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProposal(p)}
                  className={`w-full p-5 text-left border rounded-[2rem] transition-all flex items-start justify-between gap-4 cursor-pointer hover:shadow-md ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-950 text-white shadow-xl shadow-slate-900/10' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-sm truncate leading-snug">{p.title}</h3>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded tracking-wider ${
                        p.origin === 'industry'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200/50'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200/50'
                      }`}>
                        {p.origin === 'industry' ? 'Industry Sponsored' : 'Student Proposal'}
                      </span>
                    </div>

                    <p className={`text-[10px] mt-2 font-semibold ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {p.origin === 'industry' 
                        ? `Sponsor: ${p.industry_partner?.full_name || 'Partner'}` 
                        : `Owner: ${p.student?.full_name || 'Student'}`
                      }
                    </p>
                  </div>

                  <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded shrink-0 border tracking-wider ${
                    p.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200/50' :
                    p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200/50' : 'bg-amber-50 text-amber-700 border-amber-200/50'
                  }`}>
                    {p.status}
                  </span>
                </button>
              )
            }) : (
              <div className="p-10 border border-dashed border-slate-200 text-center text-slate-400 rounded-[2rem] text-sm bg-white shadow-sm">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No matching proposals found in this section.
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
              className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm"
            >
              {/* Proposal Meta Header */}
              <div className="border-b border-slate-100 pb-6 mb-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    selectedProposal.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200/50' :
                    selectedProposal.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200/50' : 'bg-amber-50 text-amber-500 border-amber-200/50 animate-pulse'
                  }`}>
                    {selectedProposal.status === 'pending' ? 'Needs Vetting Review' : `Proposal ${selectedProposal.status}`}
                  </span>
                  
                  {selectedProposal.origin === 'student' ? (
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/50 tracking-wider">
                      Individual Solo Capstone
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200/50 tracking-wider">
                      Collaborative Team-Eligible Project
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">{selectedProposal.title}</h2>
                
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500 font-medium">
                  {selectedProposal.origin === 'industry' ? (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5">
                      <Building2 className="w-4 h-4 text-purple-500" />
                      <span><strong>Sponsor:</strong> {selectedProposal.industry_partner?.full_name} ({selectedProposal.industry_partner?.email})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-1.5">
                      <User className="w-4 h-4 text-emerald-500" />
                      <span><strong>Lead Student:</strong> {selectedProposal.student?.full_name} ({selectedProposal.student?.email})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposal content */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Abstract & Objectives</h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-200/70">
                    {selectedProposal.description}
                  </p>
                </div>

                {/* Supervisor Indicator Info */}
                <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-800 leading-normal">
                  <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Faculty Supervisor Match</span>
                    Instructors do not assign themselves to projects during vetting. Supervisor match-making is managed strictly by the system Administrator once the project is approved.
                  </div>
                </div>

                {selectedProposal.status === 'pending' ? (
                  <>
                    {/* Feedback Input */}
                    <div>
                      <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2.5">
                        Add Feedback / Revision Notes
                      </label>
                      <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide details if requesting changes or rejection reasons..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 transition-all text-sm resize-none"
                      />
                    </div>

                    {/* Vetting Action Buttons */}
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                      <button
                        disabled={processing === selectedProposal.id}
                        onClick={() => updateStatus(selectedProposal.id, 'approved')}
                        className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {processing === selectedProposal.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Approve Proposal
                      </button>

                      <button
                        disabled={processing === selectedProposal.id}
                        onClick={() => updateStatus(selectedProposal.id, 'rejected')}
                        className="py-4 px-6 bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        Request Changes
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs text-slate-500 font-medium">
                      This proposal has been <strong className="text-slate-800">{selectedProposal.status}</strong>. Supervisor allocation is handled on the <a href="/instructor/teams" className="text-emerald-600 hover:underline font-bold">Team Allocation</a> page under administrative command.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="h-64 border border-dashed border-slate-200 rounded-[2.5rem] bg-white shadow-sm flex flex-col items-center justify-center text-slate-400 text-sm">
              <ClipboardList className="w-8 h-8 text-slate-300 mb-2" />
              Select a proposal from the queue or archives to view details.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

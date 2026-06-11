'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useTrack } from '@/components/providers/TrackProvider'
import { getDeliverables, getStudentProjects } from '../milestones/actions'
import {
  FileText,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  History,
  FolderOpen,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface DocEntry {
  id: string
  milestoneTitle: string
  milestoneId: string
  fileName: string
  submittedAt: string
  status: 'submitted' | 'graded' | 'todo'
  grade?: string
  feedback?: string
  isLatest: boolean
  version: number
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    graded:    { label: 'Graded',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    submitted: { label: 'Submitted', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    todo:      { label: 'Pending',   className: 'bg-slate-50 text-slate-500 border-slate-200' },
  }
  const s = map[status] || map['todo']
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${s.className}`}>
      {s.label}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentDocumentsPage() {
  const supabase = createClient()
  const { trackMode } = useTrack()

  const [docs, setDocs] = useState<DocEntry[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchData()
  }, [trackMode])

  async function fetchData() {
    setLoading(true)
    // Reset state on track switch
    setDocs([])
    setMilestones([])
    setProject(null)
    try {
      const projRes = await getStudentProjects()
      if (!projRes.success) throw new Error(projRes.error)

      const expectedOrigin = trackMode === 'thesis' ? 'student' : 'industry'
      const projects = (projRes.data || []).map((p: any) => ({
        ...p,
        origin: p.origin || (p.industry_partner_id ? 'industry' : 'student')
      }))

      // Try to find project matching current track; fall back to first available project
      const activeProj =
        projects.find((p: any) =>
          p.origin === expectedOrigin ||
          (expectedOrigin === 'student' && p.origin === 'academic')
        ) || projects[0] || null

      setProject(activeProj)

      if (activeProj) {
        const delivRes = await getDeliverables(activeProj.id)
        if (!delivRes.success) throw new Error(delivRes.error)

        const allDelivs = delivRes.data || []
        setMilestones(allDelivs)

        // Build document list from deliverables that have a submission_url
        const docEntries: DocEntry[] = allDelivs
          .filter((d: any) => d.submission_url)
          .map((d: any) => ({
            id: d.id,
            milestoneTitle: d.title,
            milestoneId: d.id,
            fileName: d.submission_url,
            submittedAt: d.updated_at || d.created_at,
            status: d.status,
            grade: d.grade,
            feedback: d.feedback,
            isLatest: true,
            version: 1,
          }))

        setDocs(docEntries)

        // Auto-expand all groups on first load
        const expanded: Record<string, boolean> = {}
        allDelivs.forEach((d: any) => { expanded[d.id] = true })
        setExpandedGroups(expanded)
      }
    } catch (e: any) {
      console.error('Documents fetch failed:', e)
      showToast('Failed to load documents.')
    }
    setLoading(false)
  }



  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  function toggleGroup(id: string) {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── derived ──────────────────────────────────────────────────────────────────
  const totalUploaded = docs.length
  const totalMilestones = milestones.length
  const pendingMilestones = milestones.filter(m => !m.submission_url).length

  // Group docs by milestone
  const groupedDocs = milestones.reduce((acc: Record<string, { milestone: any; docs: DocEntry[] }>, m) => {
    acc[m.id] = {
      milestone: m,
      docs: docs.filter(d => d.milestoneId === m.id),
    }
    return acc
  }, {})

  // Sort groups: milestones with documents first (by due_date), then empty milestones (by due_date)
  const sortedGroupedDocs = Object.values(groupedDocs).sort((a, b) => {
    const hasA = a.docs.length > 0
    const hasB = b.docs.length > 0
    if (hasA && !hasB) return -1
    if (!hasA && hasB) return 1
    return new Date(a.milestone.due_date).getTime() - new Date(b.milestone.due_date).getTime()
  })

  // ── loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Documents...</span>
        </div>
      </div>
    )
  }

  // ── no project ────────────────────────────────────────────────────────────────
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-8">
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center max-w-md shadow-sm space-y-4">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-black text-slate-900">No Active Project</h2>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            You don't have an active project yet. Once a project is assigned or approved, your document library will appear here.
          </p>
        </div>
      </div>
    )
  }

  // ── main render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-slate-50/50 p-6 md:p-8 font-sans relative">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-24 right-8 z-50 bg-slate-900 text-white py-3.5 px-6 rounded-2xl shadow-xl border border-slate-700/50 flex items-center gap-3 text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {project.title}
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Document Library</h1>
            <p className="text-xs text-slate-500 font-semibold">
              Manage and view all your project deliverable documents in one place.
            </p>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <FileText className="w-4 h-4 text-indigo-500" />, label: 'Documents Uploaded', value: totalUploaded, color: 'text-indigo-600' },
            { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, label: 'Milestones Covered', value: `${totalUploaded} / ${totalMilestones}`, color: 'text-emerald-600' },
            { icon: <AlertCircle className="w-4 h-4 text-amber-500" />, label: 'Awaiting Upload', value: pendingMilestones, color: 'text-amber-600' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                {stat.icon}
              </div>
              <div>
                <span className={`text-xl font-black ${stat.color}`}>{stat.value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Milestone Document Groups ── */}
        {totalMilestones === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center shadow-sm space-y-3">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No milestones found for this project.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedGroupedDocs.map(({ milestone, docs: mDocs }, idx) => {
              const isOpen = expandedGroups[milestone.id] ?? true
              const hasDocs = mDocs.length > 0
              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 rounded-[1.75rem] shadow-sm overflow-hidden"
                >
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(milestone.id)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasDocs ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <FileText className={`w-4 h-4 ${hasDocs ? 'text-indigo-500' : 'text-slate-300'}`} />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-extrabold text-slate-900 block">{milestone.title}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Due {new Date(milestone.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}
                          {hasDocs ? `${mDocs.length} document${mDocs.length > 1 ? 's' : ''}` : 'No document uploaded'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={milestone.status} />
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                  </button>

                  {/* Group Body */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 px-6 py-4 space-y-3">
                          {!hasDocs ? (
                            <div className="flex items-center justify-between py-3">
                              <span className="text-xs text-slate-400 font-semibold italic">No document uploaded for this milestone yet. Please upload files in the Milestones module.</span>
                            </div>
                          ) : (
                            mDocs.map((doc, dIdx) => (
                              <motion.div
                                key={doc.id + dIdx}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: dIdx * 0.04 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl"
                              >
                                {/* File Info */}
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-extrabold text-slate-900 block leading-snug truncate max-w-[220px]">
                                      {doc.fileName}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                      {doc.isLatest && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                          <History className="w-2.5 h-2.5" />
                                          Latest · v{doc.version}
                                        </span>
                                      )}
                                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" />
                                        {new Date(doc.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    {doc.grade && (
                                      <span className="text-[9px] font-black text-emerald-600 mt-1 block">
                                        Grade: {doc.grade}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <a
                                    href={
                                      doc.fileName.startsWith('http')
                                        ? doc.fileName
                                        : `/preview/document?file=${encodeURIComponent(doc.fileName)}&title=${encodeURIComponent(milestone.title)}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open Document"
                                    className="inline-flex items-center justify-center w-9 h-9 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-sm"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>

                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>


    </div>
  )
}

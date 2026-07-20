'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FolderKanban,
  Search,
  Star,
  Eye,
  Mail,
  X,
  Loader2,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Filter,
  ChevronDown,
  BarChart3,
  BookOpen,
  Award,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
  approved:   { label: 'Approved',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  rejected:   { label: 'Rejected',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  in_progress:{ label: 'In Progress',color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  completed:  { label: 'Completed',  color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
}

export default function AdminProjectOversight() {
  const [projects, setProjects] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [fundingProject, setFundingProject] = useState<any | null>(null)
  const [fundAmount, setFundAmount] = useState('')
  const [fundNote, setFundNote] = useState('')
  const [fundLoading, setFundLoading] = useState(false)
  const [fundSuccess, setFundSuccess] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      // Fetch ALL projects — admin sees everything
      const { data: projs } = await supabase
        .from('projects')
        .select(`
          *,
          student:student_id(full_name, email, department),
          instructor:instructor_id(full_name, email)
        `)
        .order('created_at', { ascending: false })

      setProjects(projs || [])

      // Fetch all milestones for progress calculation
      const { data: ms } = await supabase
        .from('milestones')
        .select('id, project_id, status')

      setMilestones(ms || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  function getProgress(projectId: string) {
    const pms = milestones.filter(m => m.project_id === projectId)
    if (!pms.length) return 0
    const done = pms.filter(m => m.status === 'completed' || m.status === 'approved').length
    return Math.round((done / pms.length) * 100)
  }

  function getMilestoneStats(projectId: string) {
    const pms = milestones.filter(m => m.project_id === projectId)
    return {
      total: pms.length,
      done: pms.filter(m => m.status === 'completed' || m.status === 'approved').length,
      inProgress: pms.filter(m => m.status === 'in_progress').length,
      pending: pms.filter(m => !m.status || m.status === 'pending').length,
    }
  }

  async function toggleRecommendation(projectId: string, current: boolean) {
    setProcessing(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ is_recommended: !current })
      .eq('id', projectId)
    if (!error) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, is_recommended: !current } : p))
    }
    setProcessing(null)
  }

  async function handleFundProject() {
    if (!fundingProject || !fundAmount) return
    setFundLoading(true)
    setFundSuccess('')

    const amount = parseFloat(fundAmount)
    if (isNaN(amount) || amount <= 0) {
      setFundLoading(false)
      return
    }

    const { error } = await supabase
      .from('projects')
      .update({
        is_funded: true,
        funding_amount: amount,
        funding_note: fundNote || null,
      })
      .eq('id', fundingProject.id)

    if (!error) {
      setProjects(prev => prev.map(p =>
        p.id === fundingProject.id
          ? { ...p, is_funded: true, funding_amount: amount, funding_note: fundNote }
          : p
      ))
      setFundSuccess(`Successfully allocated KES ${amount.toLocaleString()} to "${fundingProject.title}"`)
      setTimeout(() => {
        setFundingProject(null)
        setFundAmount('')
        setFundNote('')
        setFundSuccess('')
      }, 2500)
    }
    setFundLoading(false)
  }

  const departments = useMemo(() => {
    const deps = new Set(projects.map(p => p.student?.department).filter(Boolean))
    return Array.from(deps) as string[]
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.student?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.student?.department?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchDept = deptFilter === 'all' || p.student?.department === deptFilter
      return matchSearch && matchStatus && matchDept
    })
  }, [projects, search, statusFilter, deptFilter])

  // Summary stats
  const totalProjects = projects.length
  const avgProgress = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + getProgress(p.id), 0) / projects.length)
    : 0
  const funded = projects.filter(p => p.is_funded).length
  const recommended = projects.filter(p => p.is_recommended).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Oversight</h1>
          <p className="text-sm text-slate-500 mt-1">Full visibility into all student projects — monitor progress, detect bias, and fund promising work.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: totalProjects, icon: <FolderKanban className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Avg. Progress', value: `${avgProgress}%`, icon: <BarChart3 className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
          { label: 'Funded Projects', value: funded, icon: <DollarSign className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
          { label: 'Recommended', value: recommended, icon: <Star className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-4 flex items-center gap-4 ${stat.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm shrink-0">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by project title, student, or department..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-700 font-semibold focus:outline-none cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Projects Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FolderKanban className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-semibold">No projects found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(project => {
            const progress = getProgress(project.id)
            const ms = getMilestoneStats(project.id)
            const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG['pending']

            return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                {/* Top: Title + badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                        {statusCfg.label}
                      </span>
                      {project.is_funded && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <DollarSign className="w-2.5 h-2.5" /> Funded
                        </span>
                      )}
                      {project.is_recommended && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-amber-200 bg-amber-50 text-amber-700 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" /> Recommended
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">{project.title}</h3>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Progress</span>
                    <span className="text-[10px] font-black text-indigo-600">{progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        progress >= 75 ? 'bg-emerald-500' :
                        progress >= 40 ? 'bg-indigo-500' :
                        progress > 0  ? 'bg-amber-400' :
                        'bg-slate-200'
                      }`}
                    />
                  </div>
                  {ms.total > 0 && (
                    <div className="flex gap-3 mt-2">
                      <span className="text-[9px] font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{ms.done} done</span>
                      <span className="text-[9px] font-semibold text-blue-500 flex items-center gap-1"><Clock className="w-3 h-3" />{ms.inProgress} active</span>
                      <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1"><Target className="w-3 h-3" />{ms.pending} pending</span>
                    </div>
                  )}
                </div>

                {/* People */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0">
                      {project.student?.full_name?.[0]?.toUpperCase() || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{project.student?.full_name || 'Unknown Student'}</p>
                      <p className="text-[9px] text-slate-400 font-semibold truncate">{project.student?.department || 'No dept'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center shrink-0">
                      {project.instructor?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{project.instructor?.full_name || 'No Instructor Assigned'}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">Instructor / Supervisor</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button
                    onClick={() => toggleRecommendation(project.id, project.is_recommended)}
                    disabled={processing === project.id}
                    className={`p-2 rounded-xl border transition-all ${
                      project.is_recommended
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-500'
                    }`}
                    title="Recommend to Industry Partners"
                  >
                    {processing === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setFundingProject(project); setFundAmount(project.funding_amount?.toString() || ''); setFundNote(project.funding_note || '') }}
                    className={`p-2 rounded-xl border transition-all ${
                      project.is_funded
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                    }`}
                    title="Fund this project"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10 rounded-t-[2rem]">
                <div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedProject.status] || STATUS_CONFIG['pending']
                      return <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>
                    })()}
                    {selectedProject.is_funded && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
                        Funded — KES {Number(selectedProject.funding_amount || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-slate-900 leading-snug">{selectedProject.title}</h2>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all cursor-pointer shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Progress</span>
                    <span className="text-sm font-black text-indigo-600">{getProgress(selectedProject.id)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${getProgress(selectedProject.id)}%` }}
                    />
                  </div>
                  {(() => {
                    const ms = getMilestoneStats(selectedProject.id)
                    return ms.total > 0 ? (
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-4 h-4" />{ms.done} Completed</div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-500"><Clock className="w-4 h-4" />{ms.inProgress} In Progress</div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"><AlertCircle className="w-4 h-4" />{ms.pending} Pending</div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">No milestones created yet.</p>
                    )
                  })()}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Project Description</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {selectedProject.description || 'No description provided.'}
                  </p>
                </div>

                {/* People */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student Lead</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center mb-2">
                        {selectedProject.student?.full_name?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <p className="text-xs font-bold text-slate-800">{selectedProject.student?.full_name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500">{selectedProject.student?.email}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{selectedProject.student?.department}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Faculty</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center mb-2">
                        {selectedProject.instructor?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <p className="text-xs font-bold text-slate-800">{selectedProject.instructor?.full_name || 'Not Assigned'}</p>
                      <p className="text-[10px] text-slate-500">{selectedProject.instructor?.email || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Funding note */}
                {selectedProject.is_funded && selectedProject.funding_note && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Funding Note</h4>
                    <p className="text-sm text-emerald-700 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      {selectedProject.funding_note}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setFundingProject(selectedProject); setSelectedProject(null); setFundAmount(selectedProject.funding_amount?.toString() || ''); setFundNote(selectedProject.funding_note || '') }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all"
                  >
                    <DollarSign className="w-4 h-4" />
                    {selectedProject.is_funded ? 'Update Funding' : 'Fund This Project'}
                  </button>
                  <button
                    onClick={() => { toggleRecommendation(selectedProject.id, selectedProject.is_recommended); setSelectedProject(null) }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border ${
                      selectedProject.is_recommended
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${selectedProject.is_recommended ? 'fill-amber-500 text-amber-500' : ''}`} />
                    {selectedProject.is_recommended ? 'Unrecommend' : 'Recommend to Partners'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fund Project Modal */}
      <AnimatePresence>
        {fundingProject && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-md w-full p-8 space-y-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Fund Project</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{fundingProject.title}</p>
                </div>
                <button onClick={() => setFundingProject(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {fundSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-bold flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {fundSuccess}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Funding Amount (KES)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">KES</span>
                      <input
                        type="number"
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        placeholder="50000"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-14 pr-4 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reason / Note (optional)</label>
                    <textarea
                      value={fundNote}
                      onChange={e => setFundNote(e.target.value)}
                      placeholder="e.g. This project shows strong innovation potential in AI-driven healthcare solutions..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all resize-none h-28"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setFundingProject(null)}
                      className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFundProject}
                      disabled={fundLoading || !fundAmount}
                      className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      {fundLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                      Confirm Funding
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

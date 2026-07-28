'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  User, 
  Briefcase, 
  Target, 
  FileText, 
  Search, 
  Plus, 
  Sliders, 
  GraduationCap, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Bookmark,
  Mail,
  Calendar,
  Check,
  X
} from 'lucide-react'
import { useTrack } from '@/components/providers/TrackProvider'

interface SupervisorDashboardClientProps {
  initialProfile: any
  initialProjects: any[]
}

interface TodoTask {
  id: string
  text: string
  completed: boolean
}

export default function SupervisorDashboardClient({ 
  initialProfile, 
  initialProjects 
}: SupervisorDashboardClientProps) {
  const { trackMode } = useTrack()
  const isIndustry = trackMode === 'industry' || trackMode === 'partner'
  const [profile, setProfile] = useState<any>(initialProfile || { full_name: 'Dr. James Wilson', role: 'supervisor' })
  const [projectList, setProjectList] = useState<any[]>(initialProjects || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [todos, setTodos] = useState<TodoTask[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false)
  const [isProfileClosed, setIsProfileClosed] = useState(false)

  useEffect(() => {
    if (initialProfile) setProfile(initialProfile)
    if (initialProjects) setProjectList(initialProjects)
  }, [initialProjects, initialProfile])

  // Filter projects by search query and filter tabs
  const filteredProjects = projectList.filter((p: any) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.student?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const industryTeams = filteredProjects.filter((p: any) => p.origin === 'industry')
  const capstoneProjects = filteredProjects.filter((p: any) => p.origin === 'academic' || p.origin === 'student')

  // Calculate stats
  const totalActiveTeams = projectList.filter((p: any) => p.origin === 'industry').length
  const soloCapstones = projectList.filter((p: any) => p.origin === 'academic' || p.origin === 'student').length

  const getProjectProgress = (deliverables: any[]) => {
    if (!deliverables || deliverables.length === 0) return 0
    const completed = deliverables.filter(d => d.status === 'graded' || d.status === 'completed').length
    const submitted = deliverables.filter(d => d.status === 'submitted').length
    return Math.round(((completed + submitted) / deliverables.length) * 100)
  }

  const getMilestoneDoneFraction = (deliverables: any[]) => {
    if (!deliverables || deliverables.length === 0) return '0/4'
    const completed = deliverables.filter(d => d.status === 'graded' || d.status === 'completed').length
    const submitted = deliverables.filter(d => d.status === 'submitted').length
    return `${completed + submitted}/${deliverables.length}`
  }

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    const newTodo: TodoTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false
    }
    setTodos([...todos, newTodo])
    setNewTaskText('')
    setIsAddingTask(false)
  }

  // Mini Calendar — always reflects the actual current date
  const _now = new Date()
  const currentDay = _now.getDate()
  const currentMonth = _now.getMonth()
  const currentYear = _now.getFullYear()
  const daysInMonthCount = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1)
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
  const calendarBlanks = Array.from({ length: firstDayOfWeek })
  const monthLabel = _now.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 text-slate-800 font-sans">
      
      {/* Search & Greeting Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Academic Supervisor Desk
          </h1>
          <p className="text-xs text-slate-450 font-semibold mt-0.5">Manage undergraduate teams and research candidacies.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects or students..."
            className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================== LEFT COLUMN: PROJECTS & CHARTS (Takes 8 cols) ================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Active Teams</span>
              <span className="text-3xl font-black text-slate-900 mt-2 block">{totalActiveTeams}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-100 mt-2">
                Industry
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Solo Capstones</span>
              <span className="text-3xl font-black text-[#F59E0B] mt-2 block">{soloCapstones}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 mt-2">
                Academic
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Partner Engagement</span>
              <span className="text-3xl font-black text-slate-900 mt-2 block">94%</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-650 border border-slate-100 mt-2">
                Sponsor Rate
              </span>
            </div>
          </div>

          {/* Performance Graph Section */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Cohort Average Progress</span>
              <div className="flex gap-4 text-[9px] font-black uppercase">
                <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Active</span>
                <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>Average</span>
              </div>
            </div>
            <div className="pt-2">
              <svg className="w-full h-44" viewBox="0 0 400 200" preserveAspectRatio="none">
                <line x1="20" y1="20" x2="380" y2="20" stroke="#f8fafc" strokeWidth="1" />
                <line x1="20" y1="70" x2="380" y2="70" stroke="#f8fafc" strokeWidth="1" />
                <line x1="20" y1="120" x2="380" y2="120" stroke="#f8fafc" strokeWidth="1" />
                <line x1="20" y1="170" x2="380" y2="170" stroke="#e2e8f0" strokeWidth="1.5" />
                
                <rect x="60" y="70" width="20" height="100" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="60" y="100" width="20" height="70" rx="3" fill="#F59E0B" />
                
                <rect x="140" y="50" width="20" height="120" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="140" y="90" width="20" height="80" rx="3" fill="#F59E0B" />
                
                <rect x="220" y="30" width="20" height="140" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="220" y="70" width="20" height="100" rx="3" fill="#F59E0B" />
                
                <rect x="300" y="80" width="20" height="90" rx="3" fill="#2563eb" opacity="0.85" />
                <rect x="300" y="120" width="20" height="50" rx="3" fill="#F59E0B" />

                <text x="70" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Phase 1</text>
                <text x="150" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Phase 2</text>
                <text x="230" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Phase 3</text>
                <text x="310" y="190" fontSize="9" fontWeight="bold" fill="#94a3b8" textAnchor="middle">Phase 4</text>
              </svg>
            </div>
          </div>

          {/* Table / Cards List */}
          <div className="space-y-4">
            {isIndustry ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Undergrad Industry Teams</h2>
                  <span className="text-xs font-bold text-slate-400">{industryTeams.length} assigned</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {industryTeams.map((p) => {
                    const progress = getProjectProgress(p.deliverables)
                    const isReviewPending = p.deliverables.some((d: any) => d.status === 'submitted')

                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[14rem] relative overflow-hidden group">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                              Industry Track
                            </span>
                            <Link
                              href={`/supervisor/projects/${p.id}`}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-sm font-black text-slate-900 leading-snug">{p.title}</h3>
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs font-bold text-slate-500">Partner: {p.partner?.full_name || 'Industry Partner'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>

                          {isReviewPending ? (
                            <div className="py-2 px-3 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-xl text-center">
                              Milestone Review Pending
                            </div>
                          ) : (
                            <div className="py-2 px-3 bg-amber-50 border border-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-xl text-center">
                              Pending Liaison Feedback
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  <button 
                    onClick={() => setAssignModalOpen(true)}
                    className="bg-slate-50/30 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center gap-3 text-center min-h-[14rem] transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-300 shadow-sm transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">Request Team Assignment</span>
                      <span className="text-[9.5px] text-slate-400 font-bold block mt-1">Contact Coordinator</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Senior Solo Capstones</h2>
                  <span className="text-xs font-bold text-slate-400">{capstoneProjects.length} assigned</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-150 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="py-4 px-6">Student</th>
                          <th className="py-4 px-6">Thesis Title</th>
                          <th className="py-4 px-6">Milestones</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {capstoneProjects.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 font-bold italic">
                              No solo capstone projects assigned to you.
                            </td>
                          </tr>
                        ) : (
                          capstoneProjects.map((p) => {
                            const statusFraction = getMilestoneDoneFraction(p.deliverables)
                            const deliverablesArr = p.deliverables || []

                            return (
                              <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                                      {p.student?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'ST'}
                                    </div>
                                    <div>
                                      <span className="text-xs font-black text-slate-900 block leading-tight">{p.student?.full_name || 'Student'}</span>
                                      <span className="text-[9px] text-slate-400 font-bold block mt-1 tracking-wider">ID: Capstone-Lead</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-6 max-w-xs">
                                  <span className="font-extrabold text-slate-800 block truncate leading-tight">{p.title}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold block truncate mt-1">{p.description}</span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      {[0, 1, 2, 3].map((idx) => {
                                        const deliv = deliverablesArr[idx]
                                        let fill = 'border-slate-200 bg-white'
                                        if (deliv) {
                                          if (deliv.status === 'graded') fill = 'bg-[#F59E0B] border-[#F59E0B]'
                                          else if (deliv.status === 'submitted') fill = 'bg-blue-500 border-blue-500'
                                        }
                                        return (
                                          <div 
                                            key={idx} 
                                            className={`w-3 h-3 rounded-full border transition-all ${fill}`}
                                            title={deliv ? `${deliv.title} (${deliv.status})` : 'Unscheduled'}
                                          />
                                        )
                                      })}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-450">{statusFraction}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <Link 
                                    href={`/supervisor/projects/${p.id}`}
                                    className="inline-flex items-center justify-center p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded-xl transition-all shadow-sm"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ================== RIGHT COLUMN: PROFILE & TO-DO & CALENDAR (Takes 4 cols) ================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PROFILE CARD */}
          {!isProfileClosed ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden">
              {/* Close Button */}
              <button
                onClick={() => setIsProfileClosed(true)}
                className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                title="Close Profile Details"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 text-center space-y-3">
                <div className="w-16 h-16 bg-[#F59E0B] text-[#111827] rounded-2xl flex items-center justify-center mx-auto shadow-sm font-black text-xl">
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'SP'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 leading-tight tracking-tight">{profile?.full_name || 'Dr. James Wilson'}</h3>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                    Academic Supervisor
                  </span>
                </div>
              </div>

              <div className="relative z-10 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{profile?.email || 'supervisor@ueab.ac.ke'}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsProfileClosed(false)}
              className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-[2rem] text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              Show Profile Details
            </button>
          )}

          {/* CALENDAR CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
            <button
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">{monthLabel}</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCalendarCollapsed ? '' : 'rotate-90'}`} />
              </div>
            </button>
            {!isCalendarCollapsed && (
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
                  {calendarBlanks.map((_, i) => <span key={`blank-${i}`}></span>)}
                  {daysInMonth.map((day) => {
                    const isToday = day === currentDay
                    return (
                      <span 
                        key={day} 
                        className={`h-6 w-6 flex items-center justify-center rounded-lg mx-auto ${
                          isToday 
                            ? 'bg-blue-600 text-white font-black shadow-sm' 
                            : 'hover:bg-slate-100 cursor-pointer'
                        }`}
                      >
                        {day}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TO-DO CHECKLIST CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">To Do List</span>
              <button 
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="w-5 h-5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAddingTask && (
              <form onSubmit={handleAddTodo} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 animate-in fade-in duration-200">
                <input
                  required
                  type="text"
                  placeholder="New task..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <div className="flex justify-end gap-1.5">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingTask(false)}
                    className="px-2 py-1 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {todos.map((t) => (
                <div 
                  key={t.id} 
                  onClick={() => handleToggleTodo(t.id)}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    t.completed 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'border-slate-300 group-hover:border-blue-500 bg-white'
                  }`}>
                    {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className={`text-xs font-extrabold block leading-tight ${
                    t.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}>
                    {t.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Assign Modal explanation Popup */}
      <AnimatePresence>
        {assignModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl max-w-md w-full p-6 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-[#a75d24] rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <Bookmark className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-md font-black text-slate-900">Allocation Authority</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  As an Academic Supervisor, you do not have authority to assign teams directly. Please contact the Program Coordinator to request team matchmaking allocations.
                </p>
              </div>
              <button 
                onClick={() => setAssignModalOpen(false)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  User, 
  Briefcase, 
  Building2, 
  Target, 
  FileText, 
  Search, 
  Bell, 
  Plus, 
  Sliders, 
  GraduationCap, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react'
import { useTrack } from '@/components/providers/TrackProvider'

interface SupervisorDashboardClientProps {
  initialProfile: any
  initialProjects: any[]
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

  useEffect(() => {
    const isDemo = false

    if (isDemo && typeof window !== 'undefined') {
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          // Find or create supervisor profile
          const activeEmail = localStorage.getItem('active_user_email')
          const supervisorProfile = (activeEmail ? parsed.profiles.find((p: any) => p.email.toLowerCase() === activeEmail.toLowerCase()) : null) || 
                                    parsed.profiles.find((p: any) => p.role === 'supervisor') || {
            id: 'demo-supervisor-id',
            full_name: 'Dr. James Wilson',
            role: 'supervisor',
            email: 'supervisor@university.edu'
          }
          setProfile(supervisorProfile)

          // Filter projects assigned to this supervisor
          let supervisorProjects = parsed.projects.filter((p: any) => p.instructor_id === supervisorProfile.id)
          
          // Seed initial mock projects if none exist for supervisor
          if (supervisorProjects.length === 0 && supervisorProfile.id === 'demo-supervisor-id') {
            const seedProjects = [
              {
                id: 'sup-proj-1',
                title: 'Smart Grid Management Simulator',
                description: 'Developing high-uptime simulation interfaces for metropolitan grid balance telemetry.',
                student_id: 'demo-student-id',
                instructor_id: supervisorProfile.id,
                industry_partner_id: 'demo-industry-id',
                status: 'approved',
                origin: 'industry',
                team_members: ['demo-student-id'],
                created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'sup-proj-2',
                title: 'HIPAA Compliant Patient Portal',
                description: 'End-to-end encrypted portal with granular access controls for clinical evaluations.',
                student_id: 'demo-student-3',
                instructor_id: supervisorProfile.id,
                industry_partner_id: 'demo-industry-id',
                status: 'approved',
                origin: 'industry',
                team_members: ['demo-student-3'],
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'sup-proj-3',
                title: 'Advanced Machine Learning Thesis',
                description: 'Neural network training optimizations on low-resource dialect translation models.',
                student_id: 'demo-student-id',
                instructor_id: supervisorProfile.id,
                industry_partner_id: null,
                status: 'approved',
                origin: 'student',
                team_members: ['demo-student-id'],
                created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
              },
              {
                id: 'sup-proj-4',
                title: 'IoT for Smart Cities Telemetry',
                description: 'Scalable cloud database schemas handling concurrent IoT sensor telemetry payloads.',
                student_id: 'demo-student-2',
                instructor_id: supervisorProfile.id,
                industry_partner_id: null,
                status: 'approved',
                origin: 'student',
                team_members: ['demo-student-2'],
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
              }
            ]

            // Inject mock deliverables
            const seedDeliverables = [
              { id: 'sup-d-1', project_id: 'sup-proj-1', title: 'Project Proposal', status: 'graded', due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-2', project_id: 'sup-proj-1', title: 'System Architecture Diagram', status: 'graded', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-3', project_id: 'sup-proj-1', title: 'Beta Demo & Testing', status: 'submitted', due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-4', project_id: 'sup-proj-1', title: 'Final Client Deliverables', status: 'todo', due_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString() },
              
              { id: 'sup-d-5', project_id: 'sup-proj-2', title: 'Project Proposal', status: 'graded', due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-6', project_id: 'sup-proj-2', title: 'System Architecture Diagram', status: 'graded', due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-7', project_id: 'sup-proj-2', title: 'Beta Demo & Testing', status: 'submitted', due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-8', project_id: 'sup-proj-2', title: 'Final Client Deliverables', status: 'todo', due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
              
              { id: 'sup-d-9', project_id: 'sup-proj-3', title: 'Project Proposal', status: 'graded', due_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-10', project_id: 'sup-proj-3', title: 'Initial Architecture & Schema', status: 'graded', due_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-11', project_id: 'sup-proj-3', title: 'Mid-Term Presentation', status: 'todo', due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-12', project_id: 'sup-proj-3', title: 'Final Execution & Thesis', status: 'todo', due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString() },
              
              { id: 'sup-d-13', project_id: 'sup-proj-4', title: 'Project Proposal', status: 'graded', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-14', project_id: 'sup-proj-4', title: 'Initial Architecture & Schema', status: 'graded', due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-15', project_id: 'sup-proj-4', title: 'Mid-Term Presentation', status: 'graded', due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'sup-d-16', project_id: 'sup-proj-4', title: 'Final Execution & Thesis', status: 'todo', due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() }
            ]

            parsed.projects.push(...seedProjects)
            parsed.deliverables.push(...seedDeliverables)
            localStorage.setItem(storageKey, JSON.stringify(parsed))
            
            supervisorProjects = seedProjects
          }

          const enriched = supervisorProjects.map((p: any) => {
            const student = parsed.profiles.find((prof: any) => prof.id === p.student_id) || { full_name: 'Alex Rivera', email: 'alex@university.edu' }
            const partner = parsed.profiles.find((prof: any) => prof.id === p.industry_partner_id) || { full_name: 'TechCorp Mentors' }
            const delivs = parsed.deliverables.filter((d: any) => d.project_id === p.id)

            return {
              ...p,
              student,
              partner,
              deliverables: delivs,
              origin: p.industry_partner_id ? 'industry' : 'academic'
            }
          })
          
          setProjectList(enriched)
        } catch (e) {
          console.error("Error setting up sandbox supervisor data:", e)
        }
      }
    }
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 text-slate-800 font-sans">
      
      {/* Workspace overview Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Workspace Overview</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search bar inside header */}
          <div className="relative w-full md:w-64">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or students..."
              className="w-full bg-white border border-slate-200 focus:border-indigo-600 rounded-xl py-2 pl-9 pr-4 text-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all placeholder:text-slate-350 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Top 3 metrics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-150 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Active Teams</span>
            <span className="text-3xl font-black text-slate-900 block">{totalActiveTeams}</span>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-150 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Solo Capstones</span>
            <span className="text-3xl font-black text-slate-900 block">{soloCapstones}</span>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <User className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-150 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Partner Engagement</span>
            <span className="text-3xl font-black text-slate-900 block">94%</span>
          </div>
          <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center text-[#d97706]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid Content Sections based on filters or showing both */}
      <div className="space-y-10">
        
        {/* SECTION 1: Undergrad Industry Teams */}
        {isIndustry && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Undergrad Industry Teams</h2>
              <span className="text-xs font-bold text-slate-400">{industryTeams.length} assigned</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {industryTeams.map((p) => {
                const progress = getProjectProgress(p.deliverables)
                const isReviewPending = p.deliverables.some((d: any) => d.status === 'submitted')

                return (
                  <div key={p.id} className="bg-white border border-slate-150 rounded-[2.25rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[14rem] relative overflow-hidden group">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-100">
                          Industry Track
                        </span>
                        <span className="text-slate-400 font-extrabold text-xs">...</span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">{p.title}</h3>
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-6 h-6 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-[9px] font-bold text-slate-500">
                            Partner
                          </div>
                          <span className="text-xs font-bold text-slate-600">{p.partner?.full_name || 'Industry Partner'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-50">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-amber-850 h-full rounded-full w-[65%] transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {isReviewPending ? (
                        <div className="py-2 px-3 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-xl text-center">
                          Milestone Review Pending
                        </div>
                      ) : (
                        <div className="py-2 px-3 bg-amber-50 border border-amber-150/50 text-amber-800 text-[9px] font-black uppercase tracking-wider rounded-xl text-center">
                          Pending Liaison Feedback
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Assign New Industry Team dotted Card */}
              <button 
                onClick={() => setAssignModalOpen(true)}
                className="bg-slate-50/30 border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-[2.25rem] p-6 shadow-sm flex flex-col items-center justify-center gap-3 text-center min-h-[14rem] transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-300 shadow-sm transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-800 block">Assign New Industry Team</span>
                  <span className="text-[9.5px] text-slate-400 font-bold block mt-1">Managed by Program Coordinator</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: Senior Solo Capstones */}
        {!isIndustry && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Senior Solo Capstones</h2>
              <button className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-2 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                Filter
              </button>
            </div>

            {/* Capstones Table card container */}
            <div className="bg-white border border-slate-150 rounded-[2.25rem] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6">Thesis Title</th>
                      <th className="py-4 px-6">Advisor</th>
                      <th className="py-4 px-6">Milestone Status</th>
                      <th className="py-4 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capstoneProjects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold text-xs">
                          No solo capstone projects assigned to you.
                        </td>
                      </tr>
                    ) : (
                      capstoneProjects.map((p) => {
                        const statusFraction = getMilestoneDoneFraction(p.deliverables)
                        const deliverablesArr = p.deliverables || []

                        return (
                          <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors">
                            {/* Student Info */}
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                                  {p.student?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'ST'}
                                </div>
                                <div>
                                  <span className="text-xs font-black text-slate-900 block leading-tight">{p.student?.full_name || 'Alex Rivera'}</span>
                                  <span className="text-[8.5px] text-slate-400 font-bold block mt-1 tracking-wider uppercase">ID: 2024-8842</span>
                                </div>
                              </div>
                            </td>

                            {/* Thesis Title */}
                            <td className="py-4.5 px-6 max-w-xs">
                              <span className="text-xs font-black text-slate-800 block truncate leading-tight" title={p.title}>{p.title}</span>
                              <span className="text-[9.5px] text-slate-400 font-semibold block truncate mt-1">{p.description}</span>
                            </td>

                            {/* Advisor */}
                            <td className="py-4.5 px-6">
                              <span className="text-xs font-bold text-slate-700 block">{p.supervisor?.full_name || profile.full_name}</span>
                            </td>

                            {/* Milestone circles progress */}
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  {[0, 1, 2, 3].map((idx) => {
                                    const deliv = deliverablesArr[idx]
                                    let fill = 'border-slate-200 bg-white'
                                    if (deliv) {
                                      if (deliv.status === 'graded') fill = 'bg-indigo-700 border-indigo-700'
                                      else if (deliv.status === 'submitted') fill = 'bg-blue-500 border-blue-500'
                                    }
                                    return (
                                      <div 
                                        key={idx} 
                                        className={`w-3.5 h-3.5 rounded-full border transition-all ${fill}`}
                                        title={deliv ? `${deliv.title} (${deliv.status})` : 'Unscheduled'}
                                      />
                                    )
                                  })}
                                </div>
                                <span className="text-[10px] font-black text-slate-450">{statusFraction}</span>
                              </div>
                            </td>

                            {/* Action Button */}
                            <td className="py-4.5 px-6 text-center">
                              <a 
                                href={`/supervisor/projects/${p.id}`}
                                className="inline-flex items-center justify-center p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-850 rounded-xl transition-all shadow-sm"
                                title="View Project"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
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
                  As an Academic Supervisor, you do not have authority to assign teams directly. Please contact the Program Coordinator (Dr. James Wilson) to request team matchmaking allocations.
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

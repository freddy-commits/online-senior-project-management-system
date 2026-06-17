'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  FolderGit, 
  Calendar, 
  Star, 
  Sparkles,
  User,
  Users,
  GraduationCap,
  Building,
  Tag,
  Loader2,
  Archive
} from 'lucide-react'

interface ArchiveProject {
  id: string
  title: string
  description: string
  student_name: string
  supervisor_name: string
  partner_name?: string
  team_name?: string
  team_members?: string[]
  academic_year: string
  track: string
  grade: string
}

export default function ProjectArchivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [trackFilter, setTrackFilter] = useState<'all' | 'thesis' | 'industry'>('all')
  const [projects, setProjects] = useState<ArchiveProject[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('student')

  const supabase = createClient()

  useEffect(() => {
    async function loadArchive() {
      setLoading(true)
      try {
        // Get current user and their role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role || 'student'
        setUserRole(role)

        // Build the query for completed projects
        // Completed = status is 'completed' OR has a graded final deliverable
        let query = supabase
          .from('projects')
          .select(`
            *,
            student:student_id(full_name),
            instructor:instructor_id(full_name),
            partner:industry_partner_id(full_name),
            teams:team_id(id, name),
            deliverables:deliverables(*)
          `)

        // Role-based filtering:
        // - Student: all completed projects (for reference/inspiration)
        // - Instructor: projects they supervised
        // - Supervisor: projects they supervised
        // - Industry: projects they sponsored
        // - Admin/Panel: all projects
        if (role === 'instructor' || role === 'supervisor') {
          query = query.eq('instructor_id', user.id)
        } else if (role === 'industry') {
          query = query.eq('industry_partner_id', user.id)
        }
        // Students and Admin see all completed projects

        const { data: rawProjects } = await query
        const projectsList = rawProjects || []

        // Filter: only show projects that are completed
        // A project is "completed" if:
        // 1. status === 'completed', OR
        // 2. It has a graded final deliverable
        const completedProjects = projectsList.filter((p: any) => {
          if (p.status === 'completed') return true
          const deliverables = p.deliverables || []
          const hasGradedFinal = deliverables.some((d: any) =>
            (d.title?.toLowerCase().includes('final') || d.title?.toLowerCase().includes('presentation')) &&
            d.status === 'graded'
          )
          return hasGradedFinal
        })

        // Fetch team members for projects that have teams
        const teamIds = completedProjects.map((p: any) => p.team_id).filter(Boolean)
        let membersMap: Record<string, string[]> = {}
        if (teamIds.length > 0) {
          const { data: members } = await supabase
            .from('team_members')
            .select('team_id, profiles:user_id(full_name)')
            .in('team_id', teamIds)
          if (members) {
            members.forEach((m: any) => {
              if (!membersMap[m.team_id]) membersMap[m.team_id] = []
              if (m.profiles?.full_name) {
                membersMap[m.team_id].push(m.profiles.full_name)
              }
            })
          }
        }

        // Map to display format
        const mapped: ArchiveProject[] = completedProjects.map((p: any) => {
          const deliverables = p.deliverables || []
          const gradedDelivs = deliverables.filter((d: any) => d.status === 'graded' && d.grade)
          const finalGrade = gradedDelivs.length > 0
            ? gradedDelivs[gradedDelivs.length - 1].grade
            : 'N/A'

          const createdYear = new Date(p.created_at).getFullYear()
          const academicYear = `${createdYear}/${createdYear + 1}`

          return {
            id: p.id,
            title: p.title,
            description: p.description || 'No description available.',
            student_name: p.student?.full_name || 'Unknown Student',
            supervisor_name: p.instructor?.full_name || 'Unassigned',
            partner_name: p.partner?.full_name || undefined,
            team_name: p.teams?.name || undefined,
            team_members: p.team_id ? (membersMap[p.team_id] || []) : [],
            academic_year: academicYear,
            track: p.industry_partner_id ? 'Industry Project' : 'Capstone Thesis',
            grade: finalGrade
          }
        })

        setProjects(mapped)
      } catch (e) {
        console.error("Archive loading error:", e)
      } finally {
        setLoading(false)
      }
    }
    loadArchive()
  }, [])

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supervisor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (p.team_members?.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())) || false)

    const matchesTrack =
      trackFilter === 'all' ||
      (trackFilter === 'thesis' && p.track === 'Capstone Thesis') ||
      (trackFilter === 'industry' && p.track === 'Industry Project')

    return matchesSearch && matchesTrack
  })

  const getRoleLabel = () => {
    switch (userRole) {
      case 'instructor': return 'Projects You Supervised'
      case 'supervisor': return 'Projects You Mentored'
      case 'industry': return 'Problems You Sponsored'
      case 'admin': return 'All Evaluated Projects'
      default: return 'Completed Projects'
    }
  }

  const getRoleDescription = () => {
    switch (userRole) {
      case 'instructor': return 'Browse projects you supervised that have been completed and graded.'
      case 'supervisor': return 'Review the final outcomes of projects you mentored.'
      case 'industry': return 'View completed outcomes from the industry problems you submitted.'
      case 'admin': return 'Full archive of evaluated and completed projects across all cohorts.'
      default: return 'Explore completed Capstone theses and Industry projects for inspiration and reference.'
    }
  }

  return (
    <div className="flex-1 bg-slate-50/50 p-6 md:p-8 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {getRoleLabel()}
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Archive</h1>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              {getRoleDescription()}
            </p>
          </div>

          {/* Stats badge */}
          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-indigo-600" />
              <div>
                <div className="text-lg font-black text-slate-900 leading-none">{projects.length}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Archived</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, student, supervisor, team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto self-stretch md:self-auto justify-end px-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">TRACK:</span>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl py-2 px-4 pr-8 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm min-w-[140px]"
              >
                <option value="all">All Tracks</option>
                <option value="thesis">Capstone Thesis</option>
                <option value="industry">Industry Projects</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="flex justify-center items-center py-20 flex-col gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Archive...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 bg-white rounded-[2rem] shadow-sm flex flex-col items-center justify-center gap-4 px-8">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center">
              <FolderGit className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-700">No Completed Projects Yet</h3>
              <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                {userRole === 'student' 
                  ? 'Completed and graded projects will appear here as a reference for future cohorts.'
                  : userRole === 'industry'
                    ? 'Once teams finish working on the problems you submitted, their completed projects will appear here.'
                    : 'Projects will appear here once they are completed and graded by the supervisor.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredProjects.map((proj, idx) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                        proj.track.toLowerCase().includes('industry')
                          ? 'bg-amber-50 border-amber-100 text-amber-800'
                          : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                      }`}>
                        {proj.track.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 select-none">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {proj.academic_year}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">{proj.title}</h3>
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed line-clamp-3">{proj.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-5 mb-4" />

                  {/* Team Details */}
                  <div className="flex justify-between items-end gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        TEAM DETAILS
                      </div>
                      
                      <div className="space-y-1">
                        {proj.team_name && (
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-2 truncate">
                            <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Team: <strong className="font-bold text-slate-950">{proj.team_name}</strong></span>
                          </div>
                        )}
                        {proj.team_members && proj.team_members.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {proj.team_members.map((member, mIdx) => (
                              <span
                                key={mIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700"
                              >
                                <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                {member}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-2 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Student: <strong className="font-bold text-slate-950">{proj.student_name}</strong></span>
                          </div>
                        )}
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-2 truncate">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Advisor: <strong className="font-bold text-slate-950">{proj.supervisor_name}</strong></span>
                        </div>
                        {proj.partner_name && (
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-2 truncate">
                            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Sponsor: <strong className="font-bold text-slate-950">{proj.partner_name}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    {proj.grade !== 'N/A' ? (
                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 select-none shadow-sm shrink-0">
                        <Star className="w-3.5 h-3.5 fill-current text-emerald-500" />
                        <span>GRADE: {proj.grade}</span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 text-slate-500 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 select-none shadow-sm shrink-0">
                        <Star className="w-3.5 h-3.5 text-slate-400" />
                        <span>COMPLETED</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

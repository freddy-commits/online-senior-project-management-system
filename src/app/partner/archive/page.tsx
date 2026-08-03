'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  Sparkles,
  User,
  Users,
  GraduationCap,
  Building,
  Loader2,
  Archive,
  Star,
  Award
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

export default function IndustryPartnerArchivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [projects, setProjects] = useState<ArchiveProject[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadArchive() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Fetch completed projects sponsored by this industry partner
        const { data: rawProjects } = await supabase
          .from('projects')
          .select(`
            *,
            student:student_id(full_name),
            instructor:instructor_id(full_name),
            partner:industry_partner_id(full_name),
            teams:team_id(id, name),
            deliverables:deliverables(*)
          `)
          .eq('industry_partner_id', user.id)

        const projectsList = rawProjects || []

        // Filter completed or graded projects
        const completedProjects = projectsList.filter((p: any) => {
          if (p.status === 'completed' || p.grade || p.grade_published) return true
          const deliverables = p.deliverables || []
          return deliverables.some((d: any) =>
            (d.title?.toLowerCase().includes('final') || d.title?.toLowerCase().includes('presentation')) &&
            d.status === 'graded'
          )
        })

        // Fetch team members if applicable
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

        const mapped: ArchiveProject[] = completedProjects.map((p: any) => {
          const deliverables = p.deliverables || []
          const gradedDelivs = deliverables.filter((d: any) => d.status === 'graded' && d.grade)
          const finalGrade = p.grade || (gradedDelivs.length > 0 ? gradedDelivs[gradedDelivs.length - 1].grade : 'N/A')
          const createdYear = new Date(p.created_at).getFullYear()

          return {
            id: p.id,
            title: p.title,
            description: p.description || 'No description provided.',
            student_name: p.student?.full_name || 'Assigned Student',
            supervisor_name: p.instructor?.full_name || 'Faculty Supervisor',
            partner_name: p.partner?.full_name || undefined,
            team_name: p.teams?.name || undefined,
            team_members: p.team_id ? (membersMap[p.team_id] || []) : [],
            academic_year: `${createdYear}/${createdYear + 1}`,
            track: 'Industry Sponsored Project',
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
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.student_name.toLowerCase().includes(q) ||
      p.supervisor_name.toLowerCase().includes(q) ||
      (p.team_members?.some(m => m.toLowerCase().includes(q)) || false)
    )
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1.5">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
            Your Sponsored Industry Projects
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Industry Project Archive</h1>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Review completed senior capstone solutions developed by university students for your organizational challenges.
          </p>
        </div>

        {/* Stats badge */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-indigo-600" />
            <div>
              <div className="text-lg font-black text-slate-900 leading-none">{projects.length}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search completed industry projects by title, description, or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider">Loading Industry Archive...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
            <Archive className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base mb-1">No Completed Projects Found</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {searchQuery
                ? `No projects matched your search criteria "${searchQuery}".`
                : 'Projects sponsored by your organization will appear here once students submit their final deliverables and receive faculty evaluation.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredProjects.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 hover:border-indigo-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-black uppercase tracking-wider rounded-lg">
                      {p.track}
                    </span>
                    {p.grade !== 'N/A' && (
                      <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg flex items-center gap-1">
                        <Award className="w-3 h-3" /> Grade: {p.grade}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 leading-snug mb-2">{p.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-6 font-medium">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Student
                    </span>
                    <span className="font-bold text-slate-800">{p.student_name}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Faculty Supervisor
                    </span>
                    <span className="font-bold text-slate-800">{p.supervisor_name}</span>
                  </div>

                  {p.team_members && p.team_members.length > 0 && (
                    <div className="flex items-center justify-between text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase">
                        <Users className="w-3.5 h-3.5 text-slate-400" /> Team Members
                      </span>
                      <span className="font-bold text-slate-700 text-[11px]">
                        {p.team_members.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

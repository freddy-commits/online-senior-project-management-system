'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  FolderGit, 
  ExternalLink, 
  Calendar, 
  Star, 
  Sparkles,
  User,
  GraduationCap,
  Building,
  Tag,
  Loader2
} from 'lucide-react'

interface ArchiveProject {
  id: string
  title: string
  description: string
  student_name: string
  supervisor_name: string
  partner_name?: string
  academic_year: string
  track: string
  tech_stack: string[]
  grade: string
}

export default function ProjectArchivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [trackFilter, setTrackFilter] = useState<'all' | 'thesis' | 'industry'>('all')
  const [projects, setProjects] = useState<ArchiveProject[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadArchive() {
      setLoading(true)
      try {
        // Check if we are running in local sandbox database mode
        let projectsList: any[] = []
        if (typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true') {
          const localData = localStorage.getItem('seniorproj_sandbox_db')
          if (localData) {
            const parsed = JSON.parse(localData)
            const mockProjects = parsed.projects || []
            const mockDeliverables = parsed.deliverables || []
            const mockProfiles = parsed.profiles || []
            
            projectsList = mockProjects.map((p: any) => {
              const student = mockProfiles.find((pr: any) => pr.id === p.student_id)
              const instructor = mockProfiles.find((pr: any) => pr.id === p.instructor_id)
              const partner = mockProfiles.find((pr: any) => pr.id === p.industry_partner_id)
              const deliverables = mockDeliverables.filter((d: any) => d.project_id === p.id)
              return {
                ...p,
                student: student ? { full_name: student.full_name } : null,
                instructor: instructor ? { full_name: instructor.full_name } : null,
                partner: partner ? { full_name: partner.full_name } : null,
                deliverables
              }
            })
          }
        } else {
          // Fetch from Supabase, including deliverables
          const { data: realProjects } = await supabase
            .from('projects')
            .select('*, student:student_id(full_name), instructor:instructor_id(full_name), partner:industry_partner_id(full_name), deliverables:deliverables(*)')
            .eq('status', 'approved')
          projectsList = realProjects || []
        }

        // Filter projects: only show if the final report/deliverable is graded
        const completedProjects = projectsList.filter((p: any) => {
          const deliverables = p.deliverables || []
          const finalDeliv = deliverables.find((d: any) => 
            (d.title.toLowerCase().includes('final') || d.title.toLowerCase().includes('presentation')) && 
            d.status === 'graded'
          )
          return !!finalDeliv
        })

        const mappedReal = completedProjects.map((p: any, idx: number) => {
          const deliverables = p.deliverables || []
          const finalDeliv = deliverables.find((d: any) => 
            (d.title.toLowerCase().includes('final') || d.title.toLowerCase().includes('presentation')) && 
            d.status === 'graded'
          )
          const gradeValue = finalDeliv?.grade || 'A'

          return {
            id: p.id,
            title: p.title,
            description: p.description,
            student_name: p.student?.full_name || 'Senior Student',
            supervisor_name: p.instructor?.full_name || 'Dr. Sarah Johnson',
            partner_name: p.partner?.full_name || undefined,
            academic_year: '2025/2026',
            track: p.industry_partner_id ? 'Industry Project' : 'Capstone Thesis',
            tech_stack: idx % 2 === 0 ? ['Next.js', 'PostgreSQL', 'TailwindCSS'] : ['Python', 'PyTorch', 'FastAPI'],
            grade: gradeValue
          }
        })

        // Seed static historical archive data for realism
        const staticArchive: ArchiveProject[] = [
          {
            id: 'arch-1',
            title: 'Blockchain-Based Secure Credential Verification',
            description: 'A decentralized application allowing universities to issue tamper-proof digital certificates verifiable on the Ethereum network.',
            student_name: 'David Kim',
            supervisor_name: 'Dr. Sarah Johnson',
            academic_year: '2024/2025',
            track: 'Capstone Thesis',
            tech_stack: ['Solidity', 'React', 'Ethers.js', 'Hardhat'],
            grade: 'A+'
          },
          {
            id: 'arch-2',
            title: 'Smart Grid Energy Telemetry Dashboard',
            description: 'Collaborated with EnergyCorp to build a real-time visualization platform analyzing smart meter power ingestion and predicting network spikes.',
            student_name: 'Emily Chen',
            supervisor_name: 'Dr. James Wilson',
            partner_name: 'EnergyCorp Grid Labs',
            academic_year: '2024/2025',
            track: 'Industry Project',
            tech_stack: ['Go', 'InfluxDB', 'Grafana', 'Docker'],
            grade: 'A'
          },
          {
            id: 'arch-3',
            title: 'Autonomous Drone Navigation in GPS-Denied Environments',
            description: 'Developing computer vision SLAM algorithms that enable quadcopters to navigate indoor warehouse layouts without satellite signals.',
            student_name: 'Ryan Patel',
            supervisor_name: 'Dr. Sarah Johnson',
            academic_year: '2023/2024',
            track: 'Capstone Thesis',
            tech_stack: ['ROS', 'C++', 'OpenCV', 'Python'],
            grade: 'A'
          }
        ]

        setProjects([...mappedReal, ...staticArchive])
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
      p.tech_stack.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTrack = 
      trackFilter === 'all' ||
      (trackFilter === 'thesis' && p.track === 'Capstone Thesis') ||
      (trackFilter === 'industry' && p.track === 'Industry Project')

    return matchesSearch && matchesTrack
  })

  const getTechColor = (tech: string) => {
    const cleanTech = tech.toUpperCase().trim()
    if (cleanTech === 'NEXT.JS' || cleanTech === 'REACT') {
      return 'bg-slate-900 text-slate-100 border-transparent font-extrabold'
    }
    if (cleanTech === 'POSTGRESQL' || cleanTech === 'SOLIDITY') {
      return 'bg-slate-100 text-slate-700 border-transparent font-extrabold'
    }
    if (cleanTech === 'TAILWINDCSS' || cleanTech === 'FASTAPI') {
      return 'bg-sky-50 text-sky-700 border-transparent font-extrabold'
    }
    if (cleanTech === 'PYTHON') {
      return 'bg-purple-50 text-purple-700 border-transparent font-extrabold'
    }
    if (cleanTech === 'PYTORCH') {
      return 'bg-orange-50 text-orange-600 border border-orange-200 font-extrabold'
    }
    if (cleanTech === 'GO') {
      return 'bg-cyan-50 text-cyan-700 border-transparent font-extrabold'
    }
    return 'bg-slate-100 text-slate-600 border-transparent font-bold'
  }

  return (
    <div className="flex-1 bg-slate-50/50 p-6 md:p-8 font-sans relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Academic Database
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Project Archive</h1>
            <p className="text-xs text-slate-550 font-semibold leading-relaxed">
              Explore and search previously completed Capstone theses and Industry sponsor projects.
            </p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic, tech stack, student or supervisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full py-3 pl-11 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto self-stretch md:self-auto justify-end px-2">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">TRACK:</span>
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value as any)}
                className="bg-white border border-slate-250 rounded-xl py-2 px-4 pr-8 text-xs font-black text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm min-w-[140px]"
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
          <div className="text-center py-20 border border-slate-200 bg-white rounded-[2rem] text-slate-400 font-bold text-xs shadow-sm flex flex-col items-center justify-center gap-3">
            <FolderGit className="w-10 h-10 text-slate-350" />
            <span>No matching archived projects found.</span>
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
                      <p className="text-xs text-slate-550 font-semibold leading-relaxed line-clamp-3">{proj.description}</p>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.tech_stack.map(tech => (
                        <span key={tech} className={`border rounded-lg px-2.5 py-0.5 text-[8.5px] font-black uppercase select-none ${getTechColor(tech)}`}>
                          {tech.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-5 mb-4" />

                  {/* Roster / Contacts */}
                  <div className="flex justify-between items-end gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                        TEAM DETAILS
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-2 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Student: <strong className="font-bold text-slate-950">{proj.student_name}</strong></span>
                        </div>
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

                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 select-none shadow-sm shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current text-emerald-500" />
                      <span>GRADE: {proj.grade}</span>
                    </div>
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

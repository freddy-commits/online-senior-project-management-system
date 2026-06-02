'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrack } from '@/components/providers/TrackProvider'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Building2, 
  Clock, 
  CheckCircle2, 
  UserPlus, 
  Trash2, 
  Sliders, 
  AlertCircle,
  HelpCircle,
  FileText,
  Loader2
} from 'lucide-react'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  role?: string
}

interface MentorProfile {
  id: string
  full_name: string
  email: string
}

interface TeamMember {
  team_id: string
  user_id: string
  profiles: StudentProfile
}

interface Project {
  id: string
  title: string
  description: string
  team_id: string | null
  industry_partner_id: string | null
  partner?: MentorProfile
}

interface Team {
  id: string
  name: string
  created_at: string
}

export default function InstructorTeamsClient({
  initialStudents,
  initialMentors,
  initialProjects,
  initialTeams,
  initialTeamMembers
}: {
  initialStudents: StudentProfile[]
  initialMentors: MentorProfile[]
  initialProjects: any[]
  initialTeams: Team[]
  initialTeamMembers: any[]
}) {
  const { trackMode } = useTrack()
  const isCapstone = trackMode === 'thesis' || trackMode === 'advisor' || trackMode === 'supervisor' || trackMode === 'panel'

  const [students, setStudents] = useState<StudentProfile[]>(initialStudents)
  const [mentors, setMentors] = useState<MentorProfile[]>(initialMentors)
  const [projects, setProjects] = useState<any[]>(initialProjects)
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [teamMembers, setTeamMembers] = useState<any[]>(initialTeamMembers)

  // Search query
  const [searchQuery, setSearchQuery] = useState('')

  // Filter unassigned students by year group
  const [yearFilter, setYearFilter] = useState<'all' | 'y1' | 'y2' | 'y3' | 'y4'>('all')

  // Draft team state
  const [teamName, setTeamName] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]) // array of student profile IDs

  // Collapse existing teams state
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({})

  // Loading / processing states
  const [confirming, setConfirming] = useState(false)
  const [dissolvingTeamId, setDissolvingTeamId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Create Project Modal state (fully functional placeholder)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [newProjTitle, setNewProjTitle] = useState('')
  const [newProjDesc, setNewProjDesc] = useState('')
  const [newProjMentorId, setNewProjMentorId] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)

  const supabase = createClient()

  // Dynamic helper to identify unassigned students
  const assignedStudentIds = new Set(teamMembers.map(m => m.user_id))
  const unassignedStudents = students.filter(s => !assignedStudentIds.has(s.id))

  // Refresh database states client-side
  async function refreshData() {
    // Refresh teams
    const { data: newTeams } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })
    if (newTeams) setTeams(newTeams)

    // Refresh team members
    const { data: newMembers } = await supabase
      .from('team_members')
      .select('*, profiles:user_id(id, full_name, email, avatar_url)')
    if (newMembers) setTeamMembers(newMembers)

    // Refresh projects
    const { data: newProjs } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:instructor_id(full_name), partner:industry_partner_id(full_name, email)')
      .order('created_at', { ascending: false })
    if (newProjs) setProjects(newProjs)
  }

  // Handle student toggle selection in checkbox list
  function handleToggleStudent(studentId: string) {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId))
    } else {
      if (selectedStudents.length >= 6) {
        setError('Maximum of 6 team members allowed.')
        setTimeout(() => setError(null), 3000)
        return
      }
      setSelectedStudents([...selectedStudents, studentId])
    }
  }

  // Handle cancel allocation
  function handleCancelDraft() {
    setTeamName('')
    setSelectedStudents([])
    setSelectedProjectId('')
    setError(null)
  }

  // Handle confirm team allocation
  async function handleConfirmTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) {
      setError('Please provide a team name.')
      return
    }
    if (selectedStudents.length < 3) {
      setError('A team must have at least 3 members (Min: 3, Max: 6).')
      return
    }
    setConfirming(true)
    setError(null)

    try {
      // 1. Insert into teams table
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName.trim() })
        .select()
        .single()

      if (teamError) throw teamError

      // 2. Insert team members
      const memberInserts = selectedStudents.map(studentId => ({
        team_id: newTeam.id,
        user_id: studentId
      }))

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(memberInserts)

      if (membersError) throw membersError

      // 3. If an industry project was selected, assign the team to the project
      if (selectedProjectId) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ team_id: newTeam.id })
          .eq('id', selectedProjectId)

        if (projectError) throw projectError

        // Also trigger notifications for members
        try {
          const selectedProj = projects.find(p => p.id === selectedProjectId)
          for (const sId of selectedStudents) {
            await supabase.from('notifications').insert({
              user_id: sId,
              title: 'Team Allocated to Project',
              message: `You have been allocated to the team "${teamName.trim()}" for project "${selectedProj?.title || 'Industry Project'}".`,
              type: 'system',
              action_url: '/student/dashboard'
            })
          }
        } catch (notifErr) {
          console.warn('Failed to insert system notifications:', notifErr)
        }
      }

      setSuccessMessage(`Team "${newTeam.name}" created and configured successfully!`)
      setTimeout(() => setSuccessMessage(''), 5000)
      
      // Reset form & Refresh state
      setTeamName('')
      setSelectedStudents([])
      setSelectedProjectId('')
      await refreshData()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to confirm team. Please check logs.')
    } finally {
      setConfirming(false)
    }
  }

  // Handle dissolve team
  async function handleDissolveTeam(teamId: string) {
    if (!confirm('Are you sure you want to dissolve this team? All members will be returned to the unassigned student pool.')) return
    setDissolvingTeamId(teamId)
    try {
      // 1. Remove project associations
      await supabase.from('projects').update({ team_id: null }).eq('team_id', teamId)
      // 2. Delete team members
      await supabase.from('team_members').delete().eq('team_id', teamId)
      // 3. Delete team
      await supabase.from('teams').delete().eq('id', teamId)

      setSuccessMessage('Team successfully dissolved.')
      setTimeout(() => setSuccessMessage(''), 4000)
      await refreshData()
    } catch (err: any) {
      console.error(err)
      alert('Failed to dissolve team.')
    } finally {
      setDissolvingTeamId(null)
    }
  }

  // Create new project handler (modal workflow)
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!newProjTitle.trim()) return
    setCreatingProject(true)

    try {
      const { error: projError } = await supabase
        .from('projects')
        .insert({
          title: newProjTitle.trim(),
          description: newProjDesc.trim() || 'Custom created Industry Project.',
          industry_partner_id: newProjMentorId || null,
          status: 'approved' // Automatically approve coordinator pitched projects
        })

      if (projError) throw projError

      setSuccessMessage(`Project "${newProjTitle.trim()}" created successfully!`)
      setTimeout(() => setSuccessMessage(''), 4000)
      setNewProjTitle('')
      setNewProjDesc('')
      setNewProjMentorId('')
      setShowCreateProjectModal(false)
      await refreshData()
    } catch (err: any) {
      alert(err.message || 'Failed to create project.')
    } finally {
      setCreatingProject(false)
    }
  }

  // Filter unassigned student list by name query & year filters
  const filteredUnassignedStudents = unassignedStudents.filter(s => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!s.full_name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q)) return false
    }

    // Year group filter mock (using student ID or name hash to randomize year levels for realism)
    const yearLevel = s.full_name.charCodeAt(0) % 4 + 1
    if (yearFilter === 'y1' && yearLevel !== 1) return false
    if (yearFilter === 'y2' && yearLevel !== 2) return false
    if (yearFilter === 'y3' && yearLevel !== 3) return false
    if (yearFilter === 'y4' && yearLevel !== 4) return false

    return true
  })

  // List of active projects for dropdown mapping (only show projects that do not have a team assigned yet)
  const availableIndustryProjects = projects.filter(p => p.industry_partner_id && !p.team_id)

  // Collapse / Expand utilities for existing teams
  const [allCollapsed, setAllCollapsed] = useState(true)
  function toggleCollapseAll() {
    const newState = !allCollapsed
    setAllCollapsed(newState)
    const update: Record<string, boolean> = {}
    teams.forEach(t => {
      update[t.id] = newState
    })
    setCollapsedTeams(update)
  }

  function toggleTeamCollapse(teamId: string) {
    setCollapsedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }))
  }

  // Helper to determine year group label dynamically
  function getStudentYearLabel(studentName: string) {
    const code = studentName.charCodeAt(0)
    const yr = code % 4 + 1
    const courses = ['Computer Science', 'Business Analytics', 'Software Eng.', 'Data Science']
    const course = courses[code % courses.length]
    return { year: yr, course }
  }

  if (isCapstone) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 pb-6 gap-6 mt-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            Academic Management System
          </h1>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 text-center shadow-sm max-w-2xl mx-auto mt-12 space-y-6">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 text-[#5c3e1c] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900">Capstone Track: Solo Projects</h3>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              Teams are not configured for Senior Capstone projects, as students complete their research and implementations individually.
            </p>
            <p className="text-xs text-slate-400 font-bold max-w-md mx-auto mt-2">
              To form team squads and assign industry projects, please select the <strong>Industry Track</strong> from the header switcher.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans relative">
      
      {/* Dynamic Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 bg-[#5c3e1c] border border-amber-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar matching the mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200/80 pb-6 gap-6 mt-2">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
          Academic Management System
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          {/* Search teams or students */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5c3e1c]/20 placeholder-slate-400"
            />
          </div>

          {/* Blue Create Project Button */}
          <button 
            onClick={() => setShowCreateProjectModal(true)}
            className="px-6 py-2.5 bg-[#0c59db] hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>

      {/* Main Grid: Left student checklist vs Right allocation form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: UNASSIGNED STUDENTS (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                  Unassigned Students
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pool Directory</p>
              </div>
              <span className="bg-orange-50 text-orange-700 border border-orange-200/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
                {unassignedStudents.length} Left
              </span>
            </div>

            {/* Filters panel */}
            <div className="p-4 border-b border-slate-100 flex gap-3 bg-slate-50/20">
              <select 
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value as any)}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#5c3e1c]/40 cursor-pointer"
              >
                <option value="all">All Years</option>
                <option value="y1">Year 1</option>
                <option value="y2">Year 2</option>
                <option value="y3">Year 3</option>
                <option value="y4">Year 4</option>
              </select>
              <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-sm cursor-pointer">
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {filteredUnassignedStudents.length > 0 ? (
                filteredUnassignedStudents.map(student => {
                  const details = getStudentYearLabel(student.full_name)
                  const isChecked = selectedStudents.includes(student.id)
                  
                  return (
                    <div 
                      key={student.id} 
                      onClick={() => handleToggleStudent(student.id)}
                      className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all cursor-pointer shadow-sm hover:shadow group ${
                        isChecked 
                          ? 'border-[#5c3e1c] bg-[#5c3e1c]/5' 
                          : 'border-slate-200 bg-white hover:border-slate-350'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Custom square checkbox */}
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-[#5c3e1c] border-[#5c3e1c] text-white' 
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        {/* Student avatar bubble */}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner uppercase shrink-0">
                          {student.full_name.substring(0, 2)}
                        </div>

                        {/* Name & Academic year details */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800 truncate">{student.full_name}</h4>
                          <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">
                            Year {details.year} • {details.course}
                          </p>
                        </div>
                      </div>

                      {/* Six dot drag handle styling icon */}
                      <div className="w-6 h-8 flex flex-col justify-center items-center gap-0.5 text-slate-300 group-hover:text-slate-450 shrink-0">
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-current" />
                          <span className="w-1 h-1 rounded-full bg-current" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-current" />
                          <span className="w-1 h-1 rounded-full bg-current" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-current" />
                          <span className="w-1 h-1 rounded-full bg-current" />
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="py-20 text-center text-slate-400 italic text-xs">
                  No matching unassigned students found.
                </div>
              )}
            </div>

            {/* Load more button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
              <button className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-650 flex items-center gap-1.5 py-1.5 cursor-pointer">
                Load More Students
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NEW ALLOCATION WORKSPACE & EXISTING LIST (Span 7) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* CARD 1: NEW ALLOCATION WORKSPACE */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm space-y-6 relative overflow-hidden">
            
            {/* Header bar matching the mockup */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  New Allocation Workspace
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Squad Formations</p>
              </div>
              <span className="px-2.5 py-1 bg-[#5c3e1c]/10 text-[#5c3e1c] rounded-md text-[8px] font-black uppercase tracking-wider border border-[#5c3e1c]/10">
                Draft Mode
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-150 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleConfirmTeam} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Team Name Input */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Team Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Team Gamma-4"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5c3e1c]/40 focus:border-[#5c3e1c]"
                  />
                </div>

                {/* Industry Project / Mentor Select */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Industry Project & Mentor</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#5c3e1c]/40 focus:border-[#5c3e1c] cursor-pointer"
                  >
                    <option value="">Select Project / Mentor Match...</option>
                    {availableIndustryProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.partner?.full_name || 'No Mentor Assigned'})
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* Selected Students Drag/Selection Box */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2.5">Allocated Members</label>
                <div className="border border-dashed border-slate-300 bg-slate-50/30 rounded-2xl p-6 min-h-[140px] flex flex-wrap gap-3 items-center justify-center">
                  
                  {selectedStudents.length > 0 ? (
                    selectedStudents.map(studentId => {
                      const studentObj = students.find(s => s.id === studentId)
                      if (!studentObj) return null
                      
                      return (
                        <div 
                          key={studentId}
                          className="flex items-center gap-2 bg-white border border-slate-250 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 shadow-sm transition-all"
                        >
                          <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                            {studentObj.full_name.substring(0, 2)}
                          </div>
                          <span>{studentObj.full_name}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleStudent(studentId)}
                            className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors ml-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center text-slate-400 select-none py-4">
                      <UserPlus className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold">Drag students here or select on the left to add</p>
                      <p className="text-[10px] mt-1 font-semibold">Min: 3 | Max: 6 Members</p>
                    </div>
                  )}

                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={handleCancelDraft}
                  className="px-6 py-3 border border-slate-250 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={confirming || !teamName.trim() || selectedStudents.length === 0}
                  className="px-8 py-3 bg-[#451a03] hover:bg-[#321201] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {confirming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirm Team
                </button>
              </div>
            </form>

          </div>

          {/* CARD 2: EXISTING TEAMS */}
          <div className="bg-white border border-slate-200/80 rounded-[2.5rem] p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Existing Teams ({teams.length})
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cohort Ensembles</p>
              </div>
              <button 
                onClick={toggleCollapseAll}
                className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                {allCollapsed ? 'Expand All' : 'Collapse All'}
              </button>
            </div>

            <div className="space-y-4">
              {teams.length > 0 ? (
                teams.map((team, idx) => {
                  const members = teamMembers.filter(m => m.team_id === team.id)
                  const associatedProject = projects.find(p => p.team_id === team.id)
                  const isCollapsed = collapsedTeams[team.id] ?? allCollapsed

                  // Distinct color vertical indicators based on index
                  const colorClass = idx % 3 === 0 
                    ? 'border-l-4 border-emerald-500' 
                    : idx % 3 === 1 
                      ? 'border-l-4 border-amber-500' 
                      : 'border-l-4 border-indigo-500'

                  return (
                    <div 
                      key={team.id} 
                      className={`bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all ${colorClass}`}
                    >
                      {/* Main Bar */}
                      <div 
                        onClick={() => toggleTeamCollapse(team.id)}
                        className="p-5 flex items-center justify-between gap-6 cursor-pointer hover:bg-slate-50/20"
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-800 leading-tight">{team.name}</h4>
                          <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 tracking-wider leading-snug">
                            {associatedProject ? (
                              <span>
                                Assigned to: <strong className="text-slate-600">{associatedProject.title}</strong> • Mentor: <strong className="text-slate-600">{associatedProject.partner?.full_name || 'No Mentor'}</strong>
                              </span>
                            ) : (
                              <span className="text-amber-600">Awaiting project allocation</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Avatars bubble overlapping list */}
                          <div className="flex -space-x-2">
                            {members.slice(0, 3).map((member, i) => (
                              <div 
                                key={i}
                                title={member.profiles?.full_name}
                                className="w-7 h-7 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center font-bold text-[9px] text-slate-600 uppercase shadow-inner"
                              >
                                {member.profiles?.full_name?.substring(0, 2) || '?'}
                              </div>
                            ))}
                            {members.length > 3 && (
                              <div className="w-7 h-7 rounded-lg bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-[9px] text-slate-600 shadow-inner">
                                +{members.length - 3}
                              </div>
                            )}
                          </div>

                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                        </div>
                      </div>

                      {/* Collapsible content details panel */}
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-slate-100 bg-slate-50/30"
                          >
                            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
                              
                              {/* Roster of members */}
                              <div>
                                <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Team Roster</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {members.map(member => (
                                    <div key={member.id} className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                                      <div>
                                        <div className="font-bold text-slate-800">{member.profiles?.full_name}</div>
                                        <div className="text-[9px] text-slate-400 mt-0.5">{member.profiles?.email}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Project info & Action button */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-100 pt-4 gap-4">
                                <div className="text-[10px] text-slate-400">
                                  Created at: {new Date(team.created_at).toLocaleDateString()}
                                </div>

                                <button
                                  onClick={() => handleDissolveTeam(team.id)}
                                  disabled={dissolvingTeamId === team.id}
                                  className="px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl border border-transparent hover:border-red-200 flex items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  {dissolvingTeamId === team.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  Dissolve Team
                                </button>
                              </div>

                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })
              ) : (
                <div className="py-12 text-center text-slate-400 italic text-sm bg-slate-50/50 rounded-2xl border border-slate-200">
                  No active teams found. Create a team above.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* CREATE NEW PROJECT DIALOG (Modal workflow) */}
      <AnimatePresence>
        {showCreateProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateProjectModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Create Industry Project</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Sponsor Allocation</p>
                </div>
                <button
                  onClick={() => setShowCreateProjectModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-250"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Project Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. AI-Powered Healthcare Dashboard"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about targets, deliverables, and expectations..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Industry Partner / Mentor</label>
                  <select
                    value={newProjMentorId}
                    onChange={(e) => setNewProjMentorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Select Partner Profile...</option>
                    {mentors.map(m => (
                      <option key={m.id} value={m.id}>{m.full_name} ({m.email})</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectModal(false)}
                    className="px-5 py-2.5 border border-slate-250 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-55"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject || !newProjTitle.trim()}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    {creatingProject && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Publish Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

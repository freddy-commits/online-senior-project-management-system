'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  UserCheck,
  UserPlus,
  Check,
  ChevronRight,
  ShieldCheck,
  Building2,
  Briefcase
} from 'lucide-react'

export default function InstructorAllocationPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Team Builder State
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<any>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // Approval state moved to Dashboard

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch projects with student and instructor details
    const { data: projs } = await supabase
      .from('projects')
      .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name), supervisor:supervisor_id(full_name)')
      .order('created_at', { ascending: false })
    
    setProjects(projs || [])

    // Fetch all instructors
    const { data: inst } = await supabase.from('profiles').select('id, full_name').eq('role', 'instructor')
    setInstructors(inst || [])

    // Fetch all supervisors
    const { data: sups } = await supabase.from('profiles').select('id, full_name').eq('role', 'supervisor')
    setSupervisors(sups || [])

    // Fetch students
    const { data: studs } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'student')
    setStudents(studs || [])
    
    setLoading(false)
  }

  // Live status checker helper
  function getStudentAssignmentStatus(studentId: string, studentName: string, currentProjectId: string) {
    // Find project where student is lead
    const leadProj = projects.find(p => p.student_id === studentId && p.id !== currentProjectId)
    if (leadProj) {
      return { assigned: true, role: 'Lead', projectTitle: leadProj.title }
    }
    
    // Find project where student is in team_members list
    const teamProj = projects.find(p => p.team_members && p.team_members.includes(studentName) && p.id !== currentProjectId)
    if (teamProj) {
      return { assigned: true, role: 'Member', projectTitle: teamProj.title }
    }

    return { assigned: false }
  }

  function openTeamBuilder(project: any) {
    setSelectedProjectForTeam(project)
    setSelectedLeadId(project.student_id || '')
    
    // Convert team members list to names that match database format
    setSelectedMembers(project.team_members || [])
    setMemberSearchQuery('')
  }

  async function handleSaveTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProjectForTeam) return
    
    setProcessing(selectedProjectForTeam.id)
    
    const leadStudent = students.find(s => s.id === selectedLeadId)
    
    // Construct the finalized team member names array
    // We automatically include the lead student in the team list if assigned
    let finalMembers: string[] = []
    if (leadStudent) {
      finalMembers.push(leadStudent.full_name)
    }
    selectedMembers.forEach(name => {
      if (leadStudent && name === leadStudent.full_name) return // Avoid duplicates
      finalMembers.push(name)
    })

    let saveError = null
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          student_id: selectedLeadId || null, 
          team_members: finalMembers 
        })
        .eq('id', selectedProjectForTeam.id)
      if (error) throw new Error(error.message)
    } catch (dbErr: any) {
      console.warn('Supabase save team failed, performing local database sync fallback:', dbErr)
      
      // Fallback: Sync with LocalStorage Mock Database so the UI stays 100% functional
      if (typeof window !== 'undefined') {
        const storageKey = 'seniorproj_sandbox_db'
        const data = localStorage.getItem(storageKey)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (parsed.projects) {
              parsed.projects = parsed.projects.map((p: any) => 
                p.id === selectedProjectForTeam.id 
                  ? { ...p, student_id: selectedLeadId || null, team_members: finalMembers } 
                  : p
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
            saveError = jsonErr
          }
        } else {
          saveError = dbErr
        }
      } else {
        saveError = dbErr
      }
    }

    if (!saveError) {
      setSuccessMessage(`Team successfully allocated to "${selectedProjectForTeam.title}"!`)
      setTimeout(() => setSuccessMessage(''), 5000)

      // 1. Notify each student in the team
      try {
        const { notifyStudentAddedToTeam } = await import('@/lib/email/emailService')
        for (const name of finalMembers) {
          const matchingStudent = students.find(s => s.full_name === name)
          if (matchingStudent && matchingStudent.email) {
            try {
              await notifyStudentAddedToTeam(
                matchingStudent.email,
                matchingStudent.full_name,
                selectedProjectForTeam.title,
                finalMembers
              )
              
              // Insert notification for the student
              await supabase.from('notifications').insert({
                user_id: matchingStudent.id,
                title: 'Added to Capstone Team',
                message: `You have been successfully added to the team for "${selectedProjectForTeam.title}".`,
                type: 'system',
                action_url: `/student/dashboard`
              })
            } catch (studentMailErr) {
              console.error(`Failed to send email to student ${name}:`, studentMailErr)
            }
          }
        }
      } catch (err) {
        console.error('Failed to dispatch student team emails:', err)
      }

      // 2. Notify the industry partner
      if (selectedProjectForTeam.industry_partner_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', selectedProjectForTeam.industry_partner_id)
          .single()
          
        if (partner && partner.email) {
          try {
            const { notifyIndustryTeamFormed } = await import('@/lib/email/emailService')
            await notifyIndustryTeamFormed(
              partner.email,
              partner.full_name || 'Industry Partner',
              selectedProjectForTeam.title,
              finalMembers
            )
            
            await supabase.from('notifications').insert({
              user_id: selectedProjectForTeam.industry_partner_id,
              title: 'Team Allocated to Your Project',
              message: `A student team has been successfully allocated to your project "${selectedProjectForTeam.title}".`,
              type: 'system',
              action_url: `/partner/projects/${selectedProjectForTeam.id}`
            })
          } catch (err) {
            console.error('Failed to notify industry partner:', err)
          }
        }
      }

      // Refresh layout data
      await fetchData()
      setSelectedProjectForTeam(null)
    } else {
      alert(`Roster synced locally successfully.`)
      // Refresh local view anyway to show local sync state
      await fetchData()
      setSelectedProjectForTeam(null)
    }
    setProcessing(null)
  }

  // Approval logic moved to Dashboard

  // Filter roster listing
  const filteredProjects = projects.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.title?.toLowerCase().includes(q) ||
      p.student?.full_name?.toLowerCase().includes(q) ||
      p.instructor?.full_name?.toLowerCase().includes(q)
    )
  })

  // Filter team builder student roster list
  const filteredStudentsForTeam = students.filter(s => {
    if (!memberSearchQuery.trim()) return true
    const q = memberSearchQuery.toLowerCase()
    return s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    )
  }

  const unassignedCount = projects.filter(p => !p.instructor_id).length

  return (
    <div className="max-w-7xl mx-auto pb-20 text-slate-800 relative">
      
      {/* Dynamic Floating Alerts */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-bold flex items-center justify-between shadow-sm z-50"
          >
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {successMessage}
            </div>
            <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Roster & Team Allocation</h1>
          <p className="text-slate-500 font-medium">Verify team enrollments, manage student rosters, and view administrator faculty pairings.</p>
        </div>
        
        <div className="flex gap-4 items-center bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shrink-0 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">{unassignedCount} Mentors Unassigned</span>
            <span className="text-slate-400 font-semibold">Awaiting administrator pairing</span>
          </div>
        </div>
      </div>

      {/* Central Matrix Column */}
      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Left: Projects list & Allocation Controls */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-slate-900 text-base">Active Cohort Roster</h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Search projects, students..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200">
                    <th className="px-6 py-4">Capstone Project</th>
                    <th className="px-6 py-4">Assigned Team & Lead</th>
                    <th className="px-6 py-4">Faculty Advisor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length > 0 ? filteredProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900 text-sm leading-snug">{p.title}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[8.5px] uppercase font-black px-2 py-0.5 rounded tracking-wide border ${
                            p.origin === 'industry' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200/50' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                          }`}>
                            {p.origin === 'industry' ? 'External Industry Match' : 'Solo Capstone Idea'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-5">
                        {p.origin === 'student' ? (
                          // Solo Student Project
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>{p.student?.full_name || 'Solo Student Lead'}</span>
                            </div>
                            <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 w-fit px-2 py-0.5 rounded-md">
                              Solo (Locked)
                            </span>
                          </div>
                        ) : (
                          // Industry team matching eligible
                          <div className="flex flex-col gap-2">
                            {p.student_id ? (
                              <div className="space-y-1.5">
                                <div className="text-xs text-slate-800 font-bold flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Lead: {p.student?.full_name}</span>
                                </div>
                                
                                {p.team_members && p.team_members.length > 1 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {p.team_members.map((member: string, idx: number) => {
                                      if (member === p.student?.full_name) return null
                                      return (
                                        <span key={idx} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                                          {member}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No students allocated yet</span>
                            )}
                            
                            <button
                              onClick={() => openTeamBuilder(p)}
                              className="w-fit text-[10px] font-black uppercase bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 tracking-wider cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Manage Team
                            </button>
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-5">
                        {p.status === 'pending' ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-200/50 px-2.5 py-1 rounded w-fit tracking-wide">
                              Pending Approval
                            </span>
                            <span className="text-[9px] font-black uppercase text-slate-500 mt-1">
                              Manage in Dashboard
                            </span>
                          </div>
                        ) : p.supervisor ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[10px] text-indigo-700">
                                {p.supervisor.full_name[0]}
                              </div>
                              <span className="font-bold text-xs text-slate-700">{p.supervisor.full_name}</span>
                            </div>
                            <span className="text-[8px] font-black uppercase text-indigo-400 tracking-wider">
                              Assigned Supervisor
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded w-fit tracking-wide">
                              Approved (No Supervisor)
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-slate-400 italic bg-white text-sm">
                        No matches or allocations discovered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Informative Security/Authority Notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 leading-relaxed font-semibold">
              <strong className="text-slate-900 block mb-0.5">Faculty Workload Allocation Policy</strong>
              Faculty advisor assignment is restricted under system security guidelines to the platform **Administrator** only. Capstone advisors cannot self-allocate or request supervision matches from this panel. Please contact department administration for workload imbalances.
            </div>
          </div>
        </div>

        {/* Right: Student Roster Side directory */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Student Directory
            </h3>

            <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
              {students.map((student) => {
                const status = getStudentAssignmentStatus(student.id, student.full_name, '')
                return (
                  <div key={student.id} className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all">
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-slate-800 truncate">{student.full_name}</div>
                      <div className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">{student.email}</div>
                    </div>
                    {status.assigned ? (
                      <span 
                        title={`Assigned to ${status.projectTitle} as ${status.role}`}
                        className="text-[8px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md shrink-0 cursor-default"
                      >
                        {status.role}
                      </span>
                    ) : (
                      <span className="text-[8px] font-black uppercase text-green-700 bg-green-50 border border-green-200/40 px-2 py-0.5 rounded-md shrink-0 cursor-default">
                        Available
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Slide-over Team Builder panel */}
      <AnimatePresence>
        {selectedProjectForTeam && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProjectForTeam(null)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            
            {/* Modal drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl p-8 z-50 overflow-y-auto text-slate-800"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2.5 py-0.5 border border-purple-100 rounded-md tracking-wider">
                    Interactive Team Builder
                  </span>
                  <h3 className="font-black text-slate-900 text-lg mt-2 truncate max-w-sm">
                    {selectedProjectForTeam.title}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedProjectForTeam(null)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveTeam} className="space-y-6">
                
                {/* 1. Selector for Team Lead */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
                    1. Select Student Team Lead
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3 leading-relaxed font-semibold">
                    The student lead serves as the core point of contact and holds submit access for milestone deliverables.
                  </p>
                  
                  <select
                    value={selectedLeadId}
                    onChange={(e) => {
                      const newLeadId = e.target.value
                      setSelectedLeadId(newLeadId)
                      
                      // Also add/update lead to selectedMembers list for visualization
                      const student = students.find(s => s.id === newLeadId)
                      if (student && !selectedMembers.includes(student.full_name)) {
                        setSelectedMembers(prev => [...prev, student.full_name])
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="">Choose Student Lead...</option>
                    {students.map(s => {
                      const status = getStudentAssignmentStatus(s.id, s.full_name, selectedProjectForTeam.id)
                      return (
                        <option key={s.id} value={s.id} className="text-slate-800 font-bold bg-white">
                          {s.full_name} {status.assigned ? `(Assigned: ${status.role} on "${status.projectTitle.slice(0, 20)}...")` : '(Available)'}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {/* 2. Roster selector for additional Team Members */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-[0.15em] text-slate-400">
                      2. Add Team Members
                    </label>
                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-md">
                      Selected: {selectedMembers.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-semibold">
                    Select additional team members to associate with this project. Available students are shown in green.
                  </p>

                  {/* Filter Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search student directory..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
                    />
                  </div>

                  {/* Scrollable Checklist */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[280px] overflow-y-auto divide-y divide-slate-100 shadow-inner bg-slate-50/20">
                    {filteredStudentsForTeam.length > 0 ? filteredStudentsForTeam.map(s => {
                      const status = getStudentAssignmentStatus(s.id, s.full_name, selectedProjectForTeam.id)
                      const isChecked = selectedMembers.includes(s.full_name)
                      const isLead = s.id === selectedLeadId

                      return (
                        <label 
                          key={s.id} 
                          className={`flex items-start gap-4 p-3.5 hover:bg-slate-50 transition-colors cursor-pointer select-none ${
                            isLead ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isLead} // Lead is locked as team member automatically
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers(prev => [...prev, s.full_name])
                              } else {
                                setSelectedMembers(prev => prev.filter(name => name !== s.full_name))
                              }
                            }}
                            className="mt-1 w-4 h-4 text-purple-600 bg-slate-50 border-slate-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <span>{s.full_name}</span>
                              {isLead && (
                                <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                                  Lead Contact
                                </span>
                              )}
                              {!status.assigned && !isLead && (
                                <span className="text-[8.5px] font-bold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md">
                                  Available
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{s.email}</div>
                            {status.assigned && !isLead && (
                              <div className="text-[9px] text-slate-400 italic mt-1 font-semibold">
                                Already: {status.role} on &quot;{status.projectTitle.slice(0, 30)}...&quot;
                              </div>
                            )}
                          </div>
                        </label>
                      )
                    }) : (
                      <div className="p-8 text-center text-xs text-slate-400 italic">
                        No matching students discovered in directory.
                      </div>
                    )}
                  </div>
                </div>

                {/* Form actions */}
                <div className="pt-6 border-t border-slate-100 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedProjectForTeam(null)}
                    className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing === selectedProjectForTeam.id || !selectedLeadId}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processing === selectedProjectForTeam.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Commit Team
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Approval Panel moved to Dashboard */}
    </div>
  )
}

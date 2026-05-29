'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, 
  Plus, 
  Check, 
  X, 
  ChevronRight, 
  Search, 
  GraduationCap, 
  UserCheck, 
  Building, 
  FileText, 
  Award,
  Sparkles,
  Layers,
  Database
} from 'lucide-react'

export default function InstructorDashboard() {
  const [activeTab, setActiveTab] = useState<'vetting' | 'allocation' | 'grading'>('vetting')
  const [projects, setProjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [supervisors, setSupervisors] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Allocation State
  const [selectedStudentId, setSelectedStudentId] = useState<Record<string, string>>({})
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<Record<string, string>>({})
  const [selectedPartnerId, setSelectedPartnerId] = useState<Record<string, string>>({})

  // Grading State
  const [finalGrades, setFinalGrades] = useState<Record<string, string>>({})

  const supabase = createClient()

  useEffect(() => {
    loadInstructorData()
  }, [])

  async function loadInstructorData() {
    try {
      setLoading(true)
      
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
      
      setProjects(projectsData || [])

      // Fetch profiles for allocations dropdown
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
      
      if (profilesData) {
        setStudents(profilesData.filter((p: any) => p.role === 'student'))
        setSupervisors(profilesData.filter((p: any) => p.role === 'supervisor'))
        setPartners(profilesData.filter((p: any) => p.role === 'partner'))
      } else {
        // Fallback static profiles
        setStudents([
          { id: 'demo-student-id', full_name: 'Alex Carter', email: 'student@university.edu' },
          { id: 'demo-student-2', full_name: 'Chloe Smith', email: 'chloe@university.edu' },
          { id: 'demo-student-3', full_name: 'Marcus Miller', email: 'marcus@university.edu' }
        ])
        setSupervisors([
          { id: 'demo-supervisor-id', full_name: 'Dr. Robert Miller', email: 'supervisor@university.edu' }
        ])
        setPartners([
          { id: 'demo-partner-id', full_name: 'TechCorp Mentorship', email: 'partner@techcorp.com' }
        ])
      }

      // Initialize default selectors
      if (projectsData) {
        const studMap: Record<string, string> = {}
        const superMap: Record<string, string> = {}
        const partMap: Record<string, string> = {}
        const gradeMap: Record<string, string> = {}

        projectsData.forEach((p: any) => {
          studMap[p.id] = p.student_id || ''
          superMap[p.id] = p.supervisor_id || ''
          partMap[p.id] = p.partner_id || ''
          gradeMap[p.id] = p.final_grade || ''
        })

        setSelectedStudentId(studMap)
        setSelectedSupervisorId(superMap)
        setSelectedPartnerId(partMap)
        setFinalGrades(gradeMap)
      }
    } catch (e) {
      console.error('Error loading coordinator dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  // Pitch Vetting approvals
  const handleVetting = async (projectId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setActionLoading(projectId)
      await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId)
      
      await loadInstructorData()
    } catch (e) {
      console.error('Error vetting project:', e)
    } finally {
      setActionLoading(null)
    }
  }

  // Central Allocation Save Action
  const handleSaveAllocation = async (projectId: string) => {
    try {
      setActionLoading(projectId)
      
      const sId = selectedStudentId[projectId] || null
      const svId = selectedSupervisorId[projectId] || null
      const pId = selectedPartnerId[projectId] || null

      await supabase
        .from('projects')
        .update({
          student_id: sId,
          supervisor_id: svId,
          partner_id: pId
        })
        .eq('id', projectId)
      
      await loadInstructorData()
      alert('Project allocation saved successfully!')
    } catch (e) {
      console.error('Error saving project allocations:', e)
    } finally {
      setActionLoading(null)
    }
  }

  // Submit Final Grade Action
  const handleSubmitGrade = async (projectId: string) => {
    const grade = finalGrades[projectId]
    if (!grade || !grade.trim()) return

    try {
      setActionLoading(projectId)
      await supabase
        .from('projects')
        .update({
          final_grade: grade
        })
        .eq('id', projectId)
      
      await loadInstructorData()
      alert(`Final course grade "${grade}" saved.`)
    } catch (e) {
      console.error('Error grading project:', e)
    } finally {
      setActionLoading(null)
    }
  }

  // Filter Categories
  const pendingPitches = projects.filter(p => p.status === 'pending')
  const approvedProjects = projects.filter(p => p.status === 'approved')
  const completionGradingList = projects.filter(p => p.status === 'approved') // can grade any active project

  // Metric Computations
  const totalRegisteredCount = students.length
  const totalProjectsCount = projects.length
  const unassignedCount = approvedProjects.filter(p => !p.student_id || !p.supervisor_id).length

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading course coordination panel...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto">
      
      {/* 1. COORDINATOR TITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-emerald-400 text-xs font-black uppercase tracking-widest block mb-1">
            Lecturer &amp; Course Director Office
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Academic Governance Console
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl leading-relaxed">
            Vet incoming proposals, utilize the central double-allocation grid to pair students and supervisors, and submit final graduation marks.
          </p>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GraduationCap className="w-16 h-16 text-emerald-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Total Enrolled Students
          </div>
          <div className="text-3xl font-black text-white mt-2">{totalRegisteredCount}</div>
          <div className="text-xs text-slate-400 mt-2">Individual graduation tracks</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Layers className="w-16 h-16 text-violet-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Total Capstones
          </div>
          <div className="text-3xl font-black text-white mt-2">{totalProjectsCount}</div>
          <div className="text-xs text-slate-400 mt-2">Vetted proposals &amp; pitches</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Database className="w-16 h-16 text-indigo-400" />
          </div>
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
            Pending Allocations
          </div>
          <div className="text-3xl font-black text-white mt-2">{unassignedCount}</div>
          <div className="text-xs text-slate-400 mt-2">Requires supervisor assignments</div>
        </div>
      </div>

      {/* 3. SLEEK NAVIGATION TABS */}
      <div className="flex border-b border-slate-800/80">
        {[
          { id: 'vetting', label: `Proposal Vetting Portal (${pendingPitches.length})`, icon: <ShieldAlert className="w-4 h-4" /> },
          { id: 'allocation', label: 'Central Allocation Control Grid', icon: <Layers className="w-4 h-4" /> },
          { id: 'grading', label: 'Graduation Grading Hub', icon: <Award className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. ACTIVE TAB PANEL CONTENT */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* T1: VETTING PORTAL */}
            {activeTab === 'vetting' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Review Pending Project Specifications
                  </h2>
                </div>

                {pendingPitches.length === 0 ? (
                  <div className="bg-slate-900/20 border border-slate-800/80 rounded-[2rem] p-12 text-center">
                    <Check className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-sm font-extrabold text-slate-300">Vetting Queue Empty</h3>
                    <p className="text-slate-500 text-xs mt-1">No incoming student or industry pitches require coordinator approval.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pendingPitches.map((p) => (
                      <div 
                        key={p.id}
                        className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                          <ShieldAlert className="w-20 h-20 text-slate-400" />
                        </div>

                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                              p.origin === 'industry' 
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            }`}>
                              {p.origin === 'industry' ? '🏢 Industry Pitch' : '🎓 Student Pitch'}
                            </span>
                          </div>

                          <h3 className="font-extrabold text-white text-base mt-3 leading-snug">
                            {p.title}
                          </h3>
                          <p className="text-slate-400 text-xs mt-2 line-clamp-4 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex gap-3 pt-6 mt-6 border-t border-slate-800/40">
                          <button
                            onClick={() => handleVetting(p.id, 'rejected')}
                            disabled={actionLoading === p.id}
                            className="w-1/2 py-2.5 bg-slate-950 hover:bg-slate-900 text-red-400 hover:text-red-300 font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all border border-red-500/10 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleVetting(p.id, 'approved')}
                            disabled={actionLoading === p.id}
                            className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/15 cursor-pointer transition-all"
                          >
                            Approve Pitch
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* T2: ALLOCATION CONTROL CENTRAL GRID */}
            {activeTab === 'allocation' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Supervisor-Student Dual Allocation Matrix
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Assign both a graduating student and a supervisor mentor to approved project templates simultaneously.
                  </p>
                </div>

                {approvedProjects.length === 0 ? (
                  <div className="bg-slate-900/20 border border-slate-800/80 rounded-[2rem] p-12 text-center">
                    <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-sm font-extrabold text-slate-300">No Approved Projects</h3>
                    <p className="text-slate-500 text-xs mt-1">Approve proposals in the Vetting Portal first before using the Allocation Control Panel.</p>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs font-semibold text-slate-400">
                        <thead className="bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-500 font-black uppercase tracking-wider">
                          <tr>
                            <th className="p-5">Project Scope Title</th>
                            <th className="p-5">Assign Graduating Student</th>
                            <th className="p-5">Assign Faculty Supervisor</th>
                            <th className="p-5">Assign Sponsor Partner (Opt)</th>
                            <th className="p-5 text-right">Commit Allocation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {approvedProjects.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-900/20 transition-all">
                              {/* Title / Description */}
                              <td className="p-5 max-w-xs">
                                <div className="font-extrabold text-white text-sm truncate">{p.title}</div>
                                <div className="text-[10px] text-slate-500 truncate mt-1">{p.description}</div>
                              </td>

                              {/* Student select */}
                              <td className="p-5">
                                <select
                                  value={selectedStudentId[p.id] || ''}
                                  onChange={(e) => setSelectedStudentId(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-violet-500 font-bold max-w-[160px]"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.full_name}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Supervisor select */}
                              <td className="p-5">
                                <select
                                  value={selectedSupervisorId[p.id] || ''}
                                  onChange={(e) => setSelectedSupervisorId(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-violet-500 font-bold max-w-[160px]"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {supervisors.map(sv => (
                                    <option key={sv.id} value={sv.id}>{sv.full_name}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Sponsor Partner select */}
                              <td className="p-5">
                                <select
                                  value={selectedPartnerId[p.id] || ''}
                                  onChange={(e) => setSelectedPartnerId(prev => ({ ...prev, [p.id]: e.target.value }))}
                                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-violet-500 font-bold max-w-[160px]"
                                >
                                  <option value="">-- Internal Academic --</option>
                                  {partners.map(part => (
                                    <option key={part.id} value={part.id}>{part.full_name}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Commit Action */}
                              <td className="p-5 text-right">
                                <button
                                  onClick={() => handleSaveAllocation(p.id)}
                                  disabled={actionLoading === p.id}
                                  className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-extrabold rounded-xl uppercase tracking-wider text-[10px] shadow-md shadow-violet-500/10 cursor-pointer transition-all active:scale-95"
                                >
                                  {actionLoading === p.id ? 'Saving...' : 'Save Allocation'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* T3: GRADING HUB */}
            {activeTab === 'grading' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Final Course Grade Evaluation
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    Enter official final university grades for student capstones to close graduation requirements.
                  </p>
                </div>

                {completionGradingList.length === 0 ? (
                  <div className="bg-slate-900/20 border border-slate-800/80 rounded-[2rem] p-12 text-center">
                    <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-sm font-extrabold text-slate-300">No Eligible Projects</h3>
                    <p className="text-slate-500 text-xs mt-1">There are no approved active capstones configured in the workspace.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completionGradingList.map((p) => {
                      const stud = students.find(s => s.id === p.student_id)
                      const sup = supervisors.find(s => s.id === p.supervisor_id)
                      return (
                        <div 
                          key={p.id}
                          className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-6 flex flex-col justify-between shadow-xl backdrop-blur-sm relative"
                        >
                          <div>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block">
                              Active Student Record
                            </span>
                            <h3 className="font-extrabold text-white text-base mt-1 truncate">
                              {stud?.full_name || 'Alex Carter'}
                            </h3>
                            <p className="text-slate-400 text-xs mt-1 truncate">
                              Capstone: {p.title}
                            </p>
                            <p className="text-slate-500 text-[10px] mt-1 font-bold">
                              Mentor: {sup?.full_name || 'Dr. Robert Miller'}
                            </p>
                          </div>

                          <div className="pt-5 mt-5 border-t border-slate-800/40 flex items-center justify-between gap-4">
                            <div>
                              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1 ml-0.5">Final Course Grade</label>
                              <select
                                value={finalGrades[p.id] || ''}
                                onChange={(e) => setFinalGrades(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-violet-300 font-black text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                              >
                                <option value="">-- No Grade --</option>
                                <option value="A+">Grade: A+</option>
                                <option value="A">Grade: A</option>
                                <option value="B+">Grade: B+</option>
                                <option value="B">Grade: B</option>
                                <option value="C">Grade: C</option>
                                <option value="F">Grade: F</option>
                              </select>
                            </div>

                            <button
                              onClick={() => handleSubmitGrade(p.id)}
                              disabled={actionLoading === p.id || !finalGrades[p.id]}
                              className="px-4 py-3.5 bg-slate-100 hover:bg-violet-600 disabled:opacity-50 text-slate-950 hover:text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all self-end cursor-pointer active:scale-95"
                            >
                              {actionLoading === p.id ? 'Saving...' : 'Submit Grade'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  )
}

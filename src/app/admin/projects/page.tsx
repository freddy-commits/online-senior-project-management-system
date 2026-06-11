'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  FolderKanban, 
  Users, 
  UserPlus, 
  Star, 
  Search, 
  CheckCircle, 
  MoreVertical,
  Loader2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'

export default function AdminProjectManagement() {
  const [projects, setProjects] = useState<any[]>([])
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

      // Fetch all projects with student and instructor names
      const { data: projs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
        .order('created_at', { ascending: false })
      
      setProjects(projs || [])

      // Fetch all instructors for the assignment dropdown
      const { data: inst } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'instructor')
      setInstructors(inst || [])
      
      setLoading(false)
    }
    fetchData()
  }, [])

  async function assignInstructor(projectId: string, instructorId: string) {
    setProcessing(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ instructor_id: instructorId || null })
      .eq('id', projectId)

    if (error) {
      alert(error.message)
    } else {
      // Find assigned instructor and project details to send notification email
      const instr = instructors.find(i => i.id === instructorId)
      const proj = projects.find(p => p.id === projectId)
      if (instr && instr.email && proj) {
        try {
          const { notifyInstructorAssigned, notifyStudentSupervisorAssigned } = await import('@/lib/email/emailService')
          const { sendSMS } = await import('@/lib/sms/smsService')
          
          // 1. Notify supervisor (Email + SMS)
          await notifyInstructorAssigned(
            instr.email,
            instr.full_name || 'Advisor',
            proj.title,
            proj.student?.full_name || 'Assigned Student'
          )
          await sendSMS({
            recipientId: instructorId,
            message: `🛡️ Department Assignment: You have been assigned as Faculty Supervisor for the project "${proj.title}" by student ${proj.student?.full_name || 'Student'}. Please log in to supervise.`
          })

          // 2. Notify student (Email + SMS)
          const studentEmail = proj.student?.email
          if (studentEmail) {
            await notifyStudentSupervisorAssigned(
              studentEmail,
              proj.student?.full_name || 'Student',
              instr.full_name || 'Advisor',
              proj.title
            )
          }
          if (proj.student_id) {
            await sendSMS({
              recipientId: proj.student_id,
              message: `🎉 Department Assignment: Dr. ${instr.full_name || 'Sarah Johnson'} has been assigned as your Faculty Supervisor for project "${proj.title}". Your milestone submission locks are now lifted!`
            })
          }
        } catch (err) {
          console.error('Failed to notify instructor or student via email/SMS:', err)
        }
      }

      // Refresh list
      const { data } = await supabase.from('projects').select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
      setProjects(data || [])
    }
    setProcessing(null)
  }

  async function toggleRecommendation(projectId: string, currentState: boolean) {
    setProcessing(projectId)
    const { error } = await supabase
      .from('projects')
      .update({ is_recommended: !currentState })
      .eq('id', projectId)

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, is_recommended: !currentState } : p))
    }
    setProcessing(null)
  }

  if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  return (
    <DashboardLayout role="admin" userName={userProfile?.full_name || 'Admin'}>
      <div className="max-w-7xl mx-auto pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Global Project Control</h1>
            <p className="text-slate-600">Oversee all student projects, assign faculty advisors, and manage industry links.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input placeholder="Search projects or students..." className="bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm w-80 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-slate-900 placeholder:text-slate-500 shadow-sm" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-200">
                  <th className="px-8 py-5">Project Title</th>
                  <th className="px-8 py-4">Student Lead</th>
                  <th className="px-8 py-4">Assigned Instructor</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {project.is_recommended && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {project.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-slate-700">{project.student?.full_name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <select 
                          disabled={processing === project.id}
                          value={project.instructor_id || ''}
                          onChange={(e) => assignInstructor(project.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Assign Instructor...</option>
                          {instructors.map(i => (
                            <option key={i.id} value={i.id} className="bg-white text-slate-900 font-bold">{i.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        project.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => toggleRecommendation(project.id, project.is_recommended)}
                          className={`p-2 rounded-lg border transition-all ${
                            project.is_recommended 
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:shadow-sm'
                          }`}
                          title="Recommend to Industry"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

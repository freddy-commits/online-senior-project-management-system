'use client'

import { useState, useEffect } from 'react'
import {
  FileText, Download, BarChart3, Loader2, Users, BookOpen,
  Building2, Layers, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Shield, ChevronDown, ChevronUp, Printer
} from 'lucide-react'
import { downloadReportFile } from '@/lib/utils/reportExporter'
import { fetchAllReportData } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportSection {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  borderColor: string
  stats: { label: string; value: number | string; color?: string }[]
  columns: { header: string; key: string }[]
  data: any[]
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['users']))
  const [sections, setSections] = useState<ReportSection[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    setFetchError(null)
    try {
      // Use server action with service-role admin client — bypasses RLS
      const result = await fetchAllReportData()

      if (!result.success || !result.data) {
        setFetchError(result.error || 'Failed to load report data.')
        setLoading(false)
        return
      }

      const { profiles, projects, deliverables, teams, roleRequests, notifications } = result.data

      // ── 1. Users Report ────────────────────────────────────────────────────
      const usersData = profiles.map((u: any) => ({
        fullName: u.full_name || 'N/A',
        email: u.email || 'N/A',
        role: (u.role || 'unknown').toUpperCase(),
        department: u.department || 'N/A',
        studentId: u.student_id || 'N/A',
        staffId: u.staff_id || 'N/A',
        status: u.status || 'active',
        registeredOn: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
      }))

      const roleCount = (role: string) => profiles.filter((p: any) => p.role === role).length

      // Build a quick lookup: profile_id → profile (for reliable supervisor name resolution)
      const profilesMap: Record<string, any> = {}
      profiles.forEach((pr: any) => { profilesMap[pr.id] = pr })

      // Build a quick lookup: project_id → project (for deliverables enrichment)
      const projectsMap: Record<string, any> = {}
      projects.forEach((pr: any) => { projectsMap[pr.id] = pr })

      // Helper: extract Target Department from industry project description
      function extractDeptFromDesc(desc: string): string {
        if (!desc) return 'N/A'
        const match = desc.match(/Target Department:\s*([^|\n]+)/)
        return match?.[1]?.trim() || 'N/A'
      }

      // ── 2. Projects Report ─────────────────────────────────────────────────
      const projectsData = projects.map((p: any) => {
        const isCompleted = p.status === 'completed' || !!p.grade || !!p.grade_published
        const resolvedStatus = isCompleted
          ? 'COMPLETED'
          : (p.status || 'pending').toUpperCase()

        // Resolve supervisor — use join result OR fall back to profilesMap by instructor_id
        const supervisorProfile = (p.instructor?.full_name ? p.instructor : null)
          || (p.instructor_id ? profilesMap[p.instructor_id] : null)
        const supervisorAssigned = !!(supervisorProfile || p.instructor_id)

        // Resolve student — use join result OR fall back to profilesMap by student_id
        const studentProfile = (p.student?.full_name ? p.student : null)
          || (p.student_id ? profilesMap[p.student_id] : null)

        // Resolve partner — use join result OR fall back to profilesMap
        const partnerProfile = (p.industry_partner?.full_name ? p.industry_partner : null)
          || (p.industry_partner_id ? profilesMap[p.industry_partner_id] : null)

        // Resolve student registration ID
        const regStudentId = studentProfile?.student_id || 'N/A'

        // Resolve department
        const department = studentProfile?.department
          || (p.industry_partner_id ? extractDeptFromDesc(p.description) : 'N/A')

        return {
          title: p.title || 'Untitled',
          origin: p.industry_partner_id ? 'Industry Sponsored' : 'Student Proposal',
          student: studentProfile?.full_name || partnerProfile?.full_name || 'N/A',
          studentEmail: studentProfile?.email || partnerProfile?.email || 'N/A',
          studentId: regStudentId,
          department,
          supervisorName: supervisorProfile?.full_name || (p.instructor_id ? 'Assigned' : 'Not Assigned'),
          supervisorEmail: supervisorProfile?.email || 'N/A',
          supervisorAssigned: supervisorAssigned ? 'YES — Assigned' : 'NO — Pending',
          status: resolvedStatus,
          grade: p.grade || 'N/A',
          gradePublished: p.grade_published ? 'Published' : 'Not Published',
          isFunded: p.is_funded ? `YES — KES ${Number(p.funding_amount || 0).toLocaleString()}` : 'No',
          isRecommended: p.is_recommended ? 'YES' : 'No',
          defenseDate: p.presentation_date ? new Date(p.presentation_date).toLocaleDateString() : 'Unscheduled',
          reviewStatus: p.review_completed ? 'Vetting Complete' : 'Pending Vetting',
          reviewNotes: p.review_notes || 'None',
          submittedOn: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
        }
      })

      // ── 3. Milestones / Deliverables Report ────────────────────────────────
      const milestonesData = deliverables.map((d: any) => {
        const proj = d.project || projectsMap[d.project_id]
        const studentId = proj?.student_id
        const studentProfile = studentId ? profilesMap[studentId] : null
        return {
          milestoneTitle: d.title || 'Untitled Milestone',
          projectTitle: proj?.title || 'N/A',
          studentName: studentProfile?.full_name || 'N/A',
          studentEmail: studentProfile?.email || 'N/A',
          status: (d.status || 'pending').toUpperCase(),
          dueDate: d.due_date ? new Date(d.due_date).toLocaleDateString() : 'No Deadline',
          submittedOn: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A',
          feedbackGiven: d.recommendation ? 'Yes' : 'No',
          grade: d.grade || 'N/A',
          fileAttached: d.submission_url ? 'Yes' : 'No',
        }
      })

      // ── 4. Teams Report ────────────────────────────────────────────────────
      const teamsData = teams.map((t: any) => ({
        teamName: t.name || 'Unnamed Team',
        projectTitle: t.project?.title || 'No Project Assigned',
        projectStatus: t.project?.status ? (t.project.status).toUpperCase() : 'N/A',
        teamLead: t.leader?.full_name || 'N/A',
        leadEmail: t.leader?.email || 'N/A',
        createdOn: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A',
      }))

      // ── 5. Industry Partners Report ────────────────────────────────────────
      const partners = profiles.filter((p: any) => p.role === 'partner' || p.role === 'industry_partner')
      const industryProjectsMap: Record<string, any[]> = {}
      projects.filter((p: any) => p.industry_partner_id).forEach((p: any) => {
        if (!industryProjectsMap[p.industry_partner_id]) industryProjectsMap[p.industry_partner_id] = []
        industryProjectsMap[p.industry_partner_id].push(p)
      })

      const industryData = partners.length > 0
        ? partners.map((p: any) => {
          const partnerProjects = industryProjectsMap[p.id] || []
          return {
            partnerName: p.full_name || 'N/A',
            email: p.email || 'N/A',
            totalSubmissions: partnerProjects.length,
            approved: partnerProjects.filter((pp: any) => pp.status === 'approved').length,
            pending: partnerProjects.filter((pp: any) => pp.status === 'pending').length,
            rejected: partnerProjects.filter((pp: any) => pp.status === 'rejected').length,
            registeredOn: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A',
          }
        })
        : projects.filter((p: any) => p.industry_partner_id).map((p: any) => ({
          partnerName: p.industry_partner?.full_name || 'N/A',
          email: p.industry_partner?.email || 'N/A',
          totalSubmissions: 1,
          approved: p.status === 'approved' ? 1 : 0,
          pending: p.status === 'pending' ? 1 : 0,
          rejected: p.status === 'rejected' ? 1 : 0,
          registeredOn: 'N/A',
        }))

      // ── 6. System Activity / Role Requests Report ──────────────────────────
      const activityData = roleRequests.map((r: any) => ({
        userName: r.profile?.full_name || 'N/A',
        userEmail: r.profile?.email || 'N/A',
        department: r.profile?.department || 'N/A',
        requestedRole: (r.requested_role || 'N/A').toUpperCase(),
        currentRole: (r.current_role || 'N/A').toUpperCase(),
        status: (r.status || 'pending').toUpperCase(),
        justification: r.justification || 'None provided',
        submittedOn: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A',
        reviewedOn: r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : 'Not Reviewed',
      }))

      // ── Assemble Sections ──────────────────────────────────────────────────
      const built: ReportSection[] = [
        {
          id: 'users',
          title: 'User Directory Report',
          icon: <Users className="w-5 h-5" />,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-600',
          borderColor: 'border-indigo-200',
          stats: [
            { label: 'Total Users', value: profiles.length, color: 'text-slate-900' },
            { label: 'Students', value: roleCount('student'), color: 'text-blue-600' },
            { label: 'Supervisors', value: roleCount('supervisor'), color: 'text-emerald-600' },
            { label: 'Instructors', value: roleCount('instructor'), color: 'text-purple-600' },
            { label: 'Examiners', value: roleCount('examiner'), color: 'text-amber-600' },
            { label: 'Partners', value: roleCount('partner') + roleCount('industry_partner'), color: 'text-pink-600' },
          ],
          columns: [
            { header: 'Full Name', key: 'fullName' },
            { header: 'Email', key: 'email' },
            { header: 'Role', key: 'role' },
            { header: 'Department', key: 'department' },
            { header: 'Student ID', key: 'studentId' },
            { header: 'Staff ID', key: 'staffId' },
            { header: 'Account Status', key: 'status' },
            { header: 'Registered On', key: 'registeredOn' },
          ],
          data: usersData,
        },
        {
          id: 'projects',
          title: 'Project & Cohort Status Report',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-600',
          borderColor: 'border-emerald-200',
          stats: [
            { label: 'Total Projects', value: projects.length, color: 'text-slate-900' },
            { label: 'Approved', value: projects.filter((p: any) => p.status === 'approved').length, color: 'text-emerald-600' },
            { label: 'Pending', value: projects.filter((p: any) => p.status === 'pending').length, color: 'text-amber-600' },
            { label: 'Rejected', value: projects.filter((p: any) => p.status === 'rejected').length, color: 'text-red-600' },
            { label: 'Graded', value: projects.filter((p: any) => p.grade).length, color: 'text-indigo-600' },
          ],
          columns: [
            { header: 'Project Title', key: 'title' },
            { header: 'Origin', key: 'origin' },
            { header: 'Student / Partner', key: 'student' },
            { header: 'Email', key: 'studentEmail' },
            { header: 'Student ID', key: 'studentId' },
            { header: 'Department', key: 'department' },
            { header: 'Supervisor / Advisor', key: 'supervisorName' },
            { header: 'Supervisor Email', key: 'supervisorEmail' },
            { header: 'Supervisor Assigned', key: 'supervisorAssigned' },
            { header: 'Project Status', key: 'status' },
            { header: 'Grade', key: 'grade' },
            { header: 'Grade Published', key: 'gradePublished' },
            { header: 'Funded', key: 'isFunded' },
            { header: 'Recommended', key: 'isRecommended' },
            { header: 'Defense / Presentation Date', key: 'defenseDate' },
            { header: 'Vetting Status', key: 'reviewStatus' },
            { header: 'Vetting Notes', key: 'reviewNotes' },
            { header: 'Submitted On', key: 'submittedOn' },
          ],
          data: projectsData,
        },
        {
          id: 'milestones',
          title: 'Milestones & Deliverables Report',
          icon: <Layers className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-600',
          borderColor: 'border-purple-200',
          stats: [
            { label: 'Total Milestones', value: deliverables.length, color: 'text-slate-900' },
            { label: 'Submitted / Graded', value: deliverables.filter((d: any) => ['submitted', 'approved', 'graded', 'completed'].includes(d.status)).length, color: 'text-blue-600' },
            { label: 'Approved', value: deliverables.filter((d: any) => d.status === 'approved').length, color: 'text-emerald-600' },
            { label: 'Pending / Todo', value: deliverables.filter((d: any) => !d.status || ['todo', 'pending', 'in_progress'].includes(d.status)).length, color: 'text-amber-600' },
            { label: 'With File', value: deliverables.filter((d: any) => d.submission_url).length, color: 'text-purple-600' },
          ],
          columns: [
            { header: 'Milestone Title', key: 'milestoneTitle' },
            { header: 'Project', key: 'projectTitle' },
            { header: 'Student Name', key: 'studentName' },
            { header: 'Student Email', key: 'studentEmail' },
            { header: 'Status', key: 'status' },
            { header: 'Due Date', key: 'dueDate' },
            { header: 'Submitted On', key: 'submittedOn' },
            { header: 'Feedback Given', key: 'feedbackGiven' },
            { header: 'Grade', key: 'grade' },
            { header: 'File Attached', key: 'fileAttached' },
          ],
          data: milestonesData,
        },
        {
          id: 'teams',
          title: 'Student Teams Report',
          icon: <Users className="w-5 h-5" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-500',
          borderColor: 'border-amber-200',
          stats: [
            { label: 'Total Teams', value: teams.length, color: 'text-slate-900' },
            { label: 'With Projects', value: teams.filter((t: any) => t.project_id).length, color: 'text-emerald-600' },
            { label: 'Unassigned', value: teams.filter((t: any) => !t.project_id).length, color: 'text-amber-600' },
          ],
          columns: [
            { header: 'Team Name', key: 'teamName' },
            { header: 'Project Title', key: 'projectTitle' },
            { header: 'Project Status', key: 'projectStatus' },
            { header: 'Team Lead', key: 'teamLead' },
            { header: 'Lead Email', key: 'leadEmail' },
            { header: 'Created On', key: 'createdOn' },
          ],
          data: teamsData,
        },
        {
          id: 'industry',
          title: 'Industry Partner Activity Report',
          icon: <Building2 className="w-5 h-5" />,
          color: 'text-pink-600',
          bgColor: 'bg-pink-600',
          borderColor: 'border-pink-200',
          stats: [
            { label: 'Total Partners', value: projects.filter((p: any) => p.industry_partner_id).map((p: any) => p.industry_partner_id).filter((v: any, i: any, a: any) => a.indexOf(v) === i).length, color: 'text-slate-900' },
            { label: 'Industry Projects', value: projects.filter((p: any) => p.industry_partner_id).length, color: 'text-pink-600' },
            { label: 'Approved', value: projects.filter((p: any) => p.industry_partner_id && p.status === 'approved').length, color: 'text-emerald-600' },
            { label: 'Pending', value: projects.filter((p: any) => p.industry_partner_id && p.status === 'pending').length, color: 'text-amber-600' },
          ],
          columns: [
            { header: 'Partner Name', key: 'partnerName' },
            { header: 'Email', key: 'email' },
            { header: 'Total Submissions', key: 'totalSubmissions' },
            { header: 'Approved', key: 'approved' },
            { header: 'Pending', key: 'pending' },
            { header: 'Rejected', key: 'rejected' },
            { header: 'Registered On', key: 'registeredOn' },
          ],
          data: industryData,
        },
        {
          id: 'activity',
          title: 'System Activity & Role Requests',
          icon: <Shield className="w-5 h-5" />,
          color: 'text-slate-600',
          bgColor: 'bg-slate-700',
          borderColor: 'border-slate-200',
          stats: [
            { label: 'Total Requests', value: roleRequests.length, color: 'text-slate-900' },
            { label: 'Pending', value: roleRequests.filter((r: any) => r.status === 'pending').length, color: 'text-amber-600' },
            { label: 'Approved', value: roleRequests.filter((r: any) => r.status === 'approved').length, color: 'text-emerald-600' },
            { label: 'Rejected', value: roleRequests.filter((r: any) => r.status === 'rejected').length, color: 'text-red-600' },
            { label: 'Notifications Sent', value: notifications.length, color: 'text-blue-600' },
          ],
          columns: [
            { header: 'User Name', key: 'userName' },
            { header: 'User Email', key: 'userEmail' },
            { header: 'Department', key: 'department' },
            { header: 'Requested Role', key: 'requestedRole' },
            { header: 'Current Role', key: 'currentRole' },
            { header: 'Request Status', key: 'status' },
            { header: 'Justification', key: 'justification' },
            { header: 'Submitted On', key: 'submittedOn' },
            { header: 'Reviewed On', key: 'reviewedOn' },
          ],
          data: activityData,
        },
      ]

      setSections(built)
    } catch (err) {
      console.error('Failed to load report data:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleSection(id: string) {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleExportSection(section: ReportSection, format: 'excel' | 'document' | 'json') {
    downloadReportFile({
      title: section.title,
      data: section.data,
      columns: section.columns,
      format,
      fileNamePrefix: `admin_${section.id}_report`,
    })
  }

  function handleExportAll(format: 'excel' | 'document' | 'json') {
    // Combine all sections into one master report
    const allData: any[] = []
    sections.forEach(section => {
      section.data.forEach(row => {
        allData.push({ _section: section.title, ...row })
      })
    })

    const masterColumns = [
      { header: 'Report Section', key: '_section' },
      ...sections.flatMap(s => s.columns).filter((col, index, self) => self.findIndex(c => c.key === col.key) === index),
    ]

    downloadReportFile({
      title: 'Admin Full System Report — Project Station',
      data: allData,
      columns: masterColumns,
      format,
      fileNamePrefix: 'admin_full_system_report',
    })
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Loading system report data…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-sm font-bold text-red-600">Failed to load report data</p>
        <p className="text-xs text-slate-400">{fetchError}</p>
        <button onClick={loadAllData} className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all cursor-pointer">
          Retry
        </button>
      </div>
    )
  }

  const totalRecords = sections.reduce((sum, s) => sum + s.data.length, 0)

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 font-sans text-slate-800">

      <div className="no-print space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Admin System Reports
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Comprehensive system-wide data across all users, projects, milestones, teams, and activity.
            </p>
          </div>
        </div>

        {/* Master Export Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Export All:</span>
          <button
            onClick={() => handleExportAll('excel')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={() => handleExportAll('document')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> TXT
          </button>
          <button
            onClick={() => handleExportAll('json')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
        </div>
      </div>

      {/* ── System-Wide Stats Strip ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {sections.map(section => (
          <div key={section.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className={`text-xs font-black uppercase tracking-wider mb-1 ${section.color}`}>
              {section.title.split(' ')[0]}
            </div>
            <div className="text-2xl font-black text-slate-900">{section.data.length}</div>
            <div className="text-[10px] text-slate-400 font-semibold mt-0.5">records</div>
          </div>
        ))}
      </div>

      {/* ── Report Sections ───────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {sections.map(section => {
          const isExpanded = expandedSections.has(section.id)
          return (
            <div key={section.id} className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">

              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${section.bgColor} rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
                    {section.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">{section.title}</h2>
                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      {section.data.length} record{section.data.length !== 1 ? 's' : ''} · {section.stats.map(s => `${s.value} ${s.label}`).join(' · ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full ${section.color} bg-slate-100`}>
                    {section.data.length} rows
                  </span>
                  {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-slate-400" />
                    : <ChevronDown className="w-5 h-5 text-slate-400" />
                  }
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100">

                  {/* Stats Row */}
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
                    <div className="flex flex-wrap gap-4">
                      {section.stats.map((stat, i) => (
                        <div key={i} className="text-center min-w-[80px]">
                          <div className={`text-xl font-black ${stat.color || 'text-slate-900'}`}>{stat.value}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export Buttons for this section */}
                  <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Export this section:</span>
                    <button
                      onClick={() => handleExportSection(section, 'excel')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> CSV / Excel
                    </button>
                    <button
                      onClick={() => handleExportSection(section, 'document')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Document
                    </button>
                    <button
                      onClick={() => handleExportSection(section, 'json')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> JSON
                    </button>
                  </div>

                  {/* Data Preview Table */}
                  {section.data.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-wider text-[10px] w-10">#</th>
                            {section.columns.slice(0, 6).map(col => (
                              <th key={col.key} className="px-4 py-3 font-black text-slate-400 uppercase tracking-wider text-[10px] whitespace-nowrap">
                                {col.header}
                              </th>
                            ))}
                            {section.columns.length > 6 && (
                              <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-wider text-[10px]">
                                +{section.columns.length - 6} more cols in export
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {section.data.slice(0, 10).map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-slate-400 font-bold">{rowIdx + 1}</td>
                              {section.columns.slice(0, 6).map(col => (
                                <td key={col.key} className="px-4 py-3 text-slate-700 font-semibold max-w-[180px] truncate">
                                  {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                                </td>
                              ))}
                              {section.columns.length > 6 && (
                                <td className="px-4 py-3 text-slate-400 font-semibold text-[10px]">
                                  Export to see all columns
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {section.data.length > 10 && (
                        <div className="px-6 py-3 text-center text-[11px] text-slate-400 font-bold bg-slate-50 border-t border-slate-100">
                          Showing first 10 of {section.data.length} records. Export to see all.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-6 py-10 text-center text-slate-400 text-sm font-semibold">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      No records found in this category yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>

      {/* ── Print-only Layout ─────────────────────────────────────────────────── */}
      <div className="hidden print:block mt-8 font-sans print-report-container">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Hide screen-only layouts */
            .no-print, nav, header, aside, sidebar, button {
              display: none !important;
            }
            
            /* Remove absolute positioning and overflow locks from parents */
            html, body, main, #__next, .h-screen, .max-h-screen, .overflow-hidden, .overflow-y-auto {
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              position: static !important;
              display: block !important;
            }

            .print-report-container {
              display: block !important;
              position: relative !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            
            tr {
              page-break-inside: avoid !important;
            }
          }
        `}} />
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black text-slate-900">Project Station — Admin System Report</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            Generated: {new Date().toLocaleString()} · Total Records: {totalRecords}
          </p>
        </div>
        {sections.map(section => (
          <div key={section.id} className="mb-10">
            <h2 className="text-lg font-black text-slate-900 mb-1">{section.title}</h2>
            <p className="text-xs text-slate-500 font-semibold mb-3">{section.data.length} records</p>
            <table className="w-full text-left border-collapse text-[10px] mb-4">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  {section.columns.map(col => (
                    <th key={col.key} className="py-1.5 pr-3 font-black text-slate-700">{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.data.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    {section.columns.map(col => (
                      <td key={col.key} className="py-1.5 pr-3 text-slate-600">
                        {row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

    </div>
  )
}

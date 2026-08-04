'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, BarChart3, Loader2 } from 'lucide-react'
import { downloadReportFile } from '@/lib/utils/reportExporter'

export default function SupervisorReportsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadReportData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name, email)')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch deliverables
      const enriched = await Promise.all((data || []).map(async (p: any) => {
        const { data: delivs } = await supabase
          .from('deliverables')
          .select('*')
          .eq('project_id', p.id)
          .order('due_date', { ascending: true })
        return {
          ...p,
          deliverables: delivs || []
        }
      }))

      setProjects(enriched)
      setLoading(false)
    }
    loadReportData()
  }, [])

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

  function handleDownload(format: 'excel' | 'document' | 'json') {
    const reportData = projects.map((p) => ({
      title: p.title,
      studentName: p.student?.full_name || 'Solo Student',
      advisor: p.supervisor?.full_name || 'Assigned',
      track: p.industry_partner_id ? 'Industry Sponsored' : 'Academic Solo',
      progress: `${getProjectProgress(p.deliverables)}%`,
      milestones: getMilestoneDoneFraction(p.deliverables)
    }))

    const columns = [
      { header: 'Project Title', key: 'title' },
      { header: 'Student Lead', key: 'studentName' },
      { header: 'Supervisor/Advisor', key: 'advisor' },
      { header: 'Track Type', key: 'track' },
      { header: 'Deliverable Progress', key: 'progress' },
      { header: 'Milestones Completed', key: 'milestones' }
    ]

    downloadReportFile({
      title: 'Supervisor Capstone Allocation & Progress Report',
      data: reportData,
      columns,
      format,
      fileNamePrefix: 'supervisor_allocation_report'
    })
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    )
  }

  // Calculate statistics
  const total = projects.length
  const completed = projects.filter(p => getProjectProgress(p.deliverables) === 100).length
  const inProgress = total - completed

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Supervisor Reports</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Download allocation status and tracking sheets for student teams assigned to you.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">My Assigned Teams</span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">{total}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">In Progress</span>
          <span className="text-3xl font-black text-[#F59E0B] mt-2 block">{inProgress}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Completed Milestones</span>
          <span className="text-3xl font-black text-emerald-600 mt-2 block">{completed}</span>
        </div>
      </div>

      {/* Download Center */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-[0.05em] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Report Exporter
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-1">Select your preferred export layout to save reports to your local machine.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Card 1 */}
          <div className="border border-slate-150 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 uppercase tracking-wide">Structured Sheet</span>
              <h4 className="text-sm font-black text-slate-800 mt-3">Excel Spreadsheet (CSV)</h4>
              <p className="text-[11px] text-slate-450 font-semibold mt-1">Best format for spreadsheet analyses, grading record audits, and supervisor matching.</p>
            </div>
            <button
              onClick={() => handleDownload('excel')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>

          {/* Card 2 */}
          <div className="border border-slate-150 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[9px] font-black text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5 uppercase tracking-wide">Document Text</span>
              <h4 className="text-sm font-black text-slate-800 mt-3">Printable Document (TXT)</h4>
              <p className="text-[11px] text-slate-450 font-semibold mt-1">Best format for printable reports, coordination feedback logs, and text summaries.</p>
            </div>
            <button
              onClick={() => handleDownload('document')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Document
            </button>
          </div>

          {/* Card 3 */}
          <div className="border border-slate-150 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[9px] font-black text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 uppercase tracking-wide">Programmatic Data</span>
              <h4 className="text-sm font-black text-slate-800 mt-3">Raw Data Object (JSON)</h4>
              <p className="text-[11px] text-slate-450 font-semibold mt-1">Best format for backing up database entries and programmatic system migrations.</p>
            </div>
            <button
              onClick={() => handleDownload('json')}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

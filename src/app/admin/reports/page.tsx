'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Download, BarChart3, Loader2 } from 'lucide-react'
import { downloadReportFile } from '@/lib/utils/reportExporter'

export default function AdminReportsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadReportData() {
      const { data } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email, department), instructor:instructor_id(full_name, email)')
        .order('created_at', { ascending: false })
      setProjects(data || [])
      setLoading(false)
    }
    loadReportData()
  }, [])

  function handleDownload(format: 'excel' | 'document' | 'json') {
    const reportData = projects.map((p, idx) => ({
      title: p.title,
      studentName: p.student?.full_name || 'Solo Student',
      studentEmail: p.student?.email || 'N/A',
      advisor: p.instructor?.full_name || 'Pending',
      status: p.status,
      reviewCompleted: p.review_completed ? 'Completed' : 'Pending Review',
      reviewNotes: p.review_notes || 'No notes',
      grade: p.grade || 'N/A',
      defenseDate: p.presentation_date ? new Date(p.presentation_date).toLocaleDateString() : 'Unscheduled'
    }))

    const columns = [
      { header: 'Project Title', key: 'title' },
      { header: 'Student Name', key: 'studentName' },
      { header: 'Student Email', key: 'studentEmail' },
      { header: 'Advisor', key: 'advisor' },
      { header: 'Proposal Status', key: 'status' },
      { header: 'Panel Vetting', key: 'reviewCompleted' },
      { header: 'Vetting Notes', key: 'reviewNotes' },
      { header: 'Published Grade', key: 'grade' },
      { header: 'Defense Schedule', key: 'defenseDate' }
    ]

    downloadReportFile({
      title: 'Admin Cohort Status Report',
      data: reportData,
      columns,
      format,
      fileNamePrefix: 'admin_cohort_report'
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
  const approved = projects.filter(p => p.status === 'approved').length
  const pending = projects.filter(p => p.status === 'pending').length
  const graded = projects.filter(p => p.grade).length

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Admin System Reports</h1>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Download system-wide progress summaries, student performance spreadsheets, and grade sheets.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Submissions</span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">{total}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Approved Tracks</span>
          <span className="text-3xl font-black text-emerald-600 mt-2 block">{approved}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Pending Review</span>
          <span className="text-3xl font-black text-amber-500 mt-2 block">{pending}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Graded Cohorts</span>
          <span className="text-3xl font-black text-indigo-600 mt-2 block">{graded}</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-2">
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
              <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded px-2 py-0.5 uppercase tracking-wide">PDF / PRINT</span>
              <h4 className="text-sm font-black text-slate-800 mt-3">Save PDF / Print</h4>
              <p className="text-[11px] text-slate-450 font-semibold mt-1">Generate a clean, print-friendly version of the cohort dashboard to save as PDF or print.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-amber-650 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>

          {/* Card 4 */}
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

      {/* Hidden print-only stylesheet & layout wrapper */}
      <div className="hidden print:block mt-8 font-sans">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden; }
            .print\\:block, .print\\:block * { visibility: visible; }
            .print\\:block { position: absolute; left: 0; top: 0; width: 100%; }
            nav, header, button, aside, .no-print { display: none !important; }
          }
        `}} />
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black text-slate-900">Online Senior Project Management System</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Admin Cohort Performance Report &mdash; Generated Live</p>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-300">
              <th className="py-2 font-black">Project Title</th>
              <th className="py-2 font-black">Student Name</th>
              <th className="py-2 font-black">Advisor</th>
              <th className="py-2 font-black">Status</th>
              <th className="py-2 font-black">Grade</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-2.5 font-bold pr-2">{p.title}</td>
                <td className="py-2.5">{p.student?.full_name || 'Solo Student'}</td>
                <td className="py-2.5">{p.instructor?.full_name || 'Unassigned'}</td>
                <td className="py-2.5 capitalize">{p.status}</td>
                <td className="py-2.5 font-bold">{p.grade || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

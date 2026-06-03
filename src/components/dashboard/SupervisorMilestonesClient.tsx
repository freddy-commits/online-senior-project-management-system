'use client'

import { useState } from 'react'
import { FileText, Target } from 'lucide-react'

interface Deliverable {
  id: string
  project_id: string
  title: string
  status: string
  grade?: string
  projectTitle: string
}

export default function SupervisorMilestonesClient({ 
  initialDeliverables 
}: { 
  initialDeliverables: Deliverable[] 
}) {
  const [deliverables] = useState<Deliverable[]>(initialDeliverables || [])

  const pendingCount = deliverables.filter(d => d.status === 'submitted').length
  const gradedCount = deliverables.filter(d => d.status === 'graded').length
  const todoCount = deliverables.filter(d => d.status === 'todo').length

  return (
    <div className="max-w-6xl mx-auto p-8 pb-20 text-slate-800 font-sans">
      <div className="mb-8 space-y-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Academic Supervisor
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Milestone Management</h1>
        <p className="text-xs text-slate-500 font-medium">Track student upload milestones and review pending submissions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Pending Review</span>
          <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Graded Milestones</span>
          <span className="text-2xl font-black text-indigo-700">{gradedCount}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Todo Items</span>
          <span className="text-2xl font-black text-slate-600">{todoCount}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-150 rounded-[2rem] p-6 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600" />
          Milestones Log
        </h2>

        {deliverables.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs">
            No milestones to display. Assigned project deliverables will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {deliverables.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-snug">{item.title}</div>
                    <div className="text-[9.5px] text-slate-450 font-semibold mt-1">{item.projectTitle}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                      item.status === 'graded' 
                        ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        : item.status === 'submitted'
                          ? 'bg-blue-50 border-blue-100 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>
                      {item.status}
                    </span>
                    {item.grade && (
                      <span className="text-[9px] font-black text-indigo-800 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        Grade: {item.grade}
                      </span>
                    )}
                  </div>
                  <a 
                    href={`/supervisor/projects/${item.project_id}`}
                    className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                  >
                    Review
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

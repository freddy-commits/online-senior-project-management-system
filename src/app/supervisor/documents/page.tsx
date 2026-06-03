'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, ExternalLink, Loader2 } from 'lucide-react'

export default function SupervisorDocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Use authenticated user ID directly from Supabase session
        const targetUserId = user.id

        const { data: projs } = await supabase
          .from('projects')
          .select('id, title')
          .eq('instructor_id', targetUserId)

        const projectsList = projs || []

        if (projectsList.length > 0) {
          const { data: delivs } = await supabase
            .from('deliverables')
            .select('*')
            .in('project_id', projectsList.map(p => p.id))
            .not('submission_url', 'is', null)
          
          if (delivs) {
            const mapped = delivs.map(d => {
              const project = projectsList.find(p => p.id === d.project_id)
              return {
                id: d.id,
                title: d.title,
                projectTitle: project?.title || 'Unknown Project',
                url: d.submission_url,
                created_at: d.created_at,
                project_id: d.project_id
              }
            })
            setDocuments(mapped)
          }
        }
      } catch (e) {
        console.error("Documents fetch error:", e)
      }
      setLoading(false)
    }
    fetchDocuments()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-8 pb-20 text-slate-800 font-sans">
      <div className="mb-8 space-y-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Academic Supervisor
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">File Repository</h1>
        <p className="text-xs text-slate-500 font-medium">Review and download milestone files uploaded by your project teams.</p>
      </div>

      <div className="bg-white border border-slate-150 rounded-[2rem] p-6 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          Document Library
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs">
            No uploaded documents found.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 leading-snug">{doc.title}</div>
                    <div className="text-[9.5px] text-slate-450 font-semibold mt-1">{doc.projectTitle}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <span className="text-[9px] text-slate-400 font-bold">
                    Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all shadow-sm"
                      title="Open Document"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a 
                      href={`/supervisor/projects/${doc.project_id}`}
                      className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                    >
                      Go to Project
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

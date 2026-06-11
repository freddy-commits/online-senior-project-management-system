'use client'

import { useSearchParams } from 'next/navigation'
import { FileText, ArrowLeft, Download, ShieldCheck, Calendar, Clock } from 'lucide-react'

export default function DocumentPreviewPage() {
  const searchParams = useSearchParams()
  
  const fileName = searchParams.get('file') || 'document.pdf'
  const title = searchParams.get('title') || 'Capstone Deliverable'
  const dateStr = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-md select-none">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.close()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Close Tab
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{fileName}</span>
          </div>
        </div>

        <button 
          onClick={() => {
            const element = document.createElement('a')
            const file = new Blob([`Simulated Capstone Document: ${title}\nFilename: ${fileName}`], {type: 'text/plain'})
            element.href = URL.createObjectURL(file)
            element.download = fileName
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-600/10 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </header>

      {/* Main Document Content Area */}
      <main className="flex-1 flex justify-center items-center p-8 bg-slate-900/50 relative overflow-y-auto">
        <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 md:p-16 max-w-2xl w-full border border-slate-800/40 shadow-2xl relative">
          {/* Top Decorative Strip */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 rounded-t-[2.5rem]" />
          
          <div className="space-y-8">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">Simulated Portal Preview</span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">{title}</h1>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-center text-slate-400">
                <FileText className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="border-y border-slate-100 py-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Submitted At</span>
                  <span className="text-xs font-bold text-slate-700 block">{dateStr}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Security Check</span>
                  <span className="text-xs font-bold text-emerald-600 block">Verified Secure</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Document Contents</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                This is a secure simulated preview of the student report submitted for the milestone <strong>{title}</strong>.
              </p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                In a production environment connected to live Supabase Storage, this link resolves to the document's authenticated public URI to download and view the actual document file directly in the browser.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              Project Station &bull; Integrated Academic Telemetry
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-[10px] text-slate-500 font-semibold uppercase tracking-widest select-none">
        Project Station Document Preview Roster
      </footer>
    </div>
  )
}

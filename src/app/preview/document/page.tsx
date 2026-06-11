'use client'

import { useSearchParams } from 'next/navigation'
import { FileText, ArrowLeft, Download, ShieldCheck, Calendar, Clock, ExternalLink, AlertTriangle, RefreshCw, Upload } from 'lucide-react'
import { Suspense, useState, useEffect } from 'react'

function DocumentPreviewInner() {
  const searchParams = useSearchParams()
  
  const fileParam = searchParams.get('file') || ''
  const title = searchParams.get('title') || 'Capstone Deliverable'
  const dateStr = new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })

  const isRealFile = fileParam.startsWith('/uploads/') || fileParam.startsWith('http')
  const fileUrl = isRealFile ? fileParam : null
  const fileName = fileParam.split('/').pop() || fileParam || 'document.pdf'
  const isPdf = fileName.toLowerCase().endsWith('.pdf')

  // Track whether the file actually exists on the server
  const [fileExists, setFileExists] = useState<'checking' | 'yes' | 'no'>('checking')

  useEffect(() => {
    if (!isRealFile) {
      setFileExists('no')
      return
    }
    // Do a HEAD request to verify the file is actually on the server
    fetch(fileParam, { method: 'HEAD' })
      .then(res => setFileExists(res.ok ? 'yes' : 'no'))
      .catch(() => setFileExists('no'))
  }, [fileParam, isRealFile])

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-slate-950 border-b border-slate-800/80 px-6 py-4 flex items-center justify-between shadow-md select-none flex-shrink-0">
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
            <span className="text-xs font-black text-slate-300 uppercase tracking-widest truncate max-w-[320px]">{fileName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRealFile && fileExists === 'yes' && (
            <a
              href={fileParam}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Raw
            </a>
          )}
          {isRealFile && fileExists === 'yes' && (
            <a
              href={fileParam}
              download={fileName}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-600/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* CHECKING state */}
        {fileExists === 'checking' && (
          <div className="flex-1 flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading document...</span>
            </div>
          </div>
        )}

        {/* FILE NOT FOUND — show a helpful re-upload prompt */}
        {fileExists === 'no' && (
          <div className="flex-1 flex items-center justify-center p-8 bg-slate-900/50">
            <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 md:p-14 max-w-xl w-full border border-slate-800/40 shadow-2xl relative text-center">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 rounded-t-[2.5rem]" />
              <div className="space-y-6">
                {/* Icon */}
                <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>

                {/* Title */}
                <div>
                  <h1 className="text-xl font-black text-slate-900 mb-2">File Not Found on Server</h1>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    The file <span className="font-black text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md">{fileName}</span> could not be found. 
                    This usually means the document was submitted before the file upload system was set up, 
                    or the upload did not complete successfully.
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Instructions */}
                <div className="text-left space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How to fix this</p>
                  <div className="space-y-2.5">
                    {[
                      { step: '1', text: 'Go to Student → Milestones' },
                      { step: '2', text: `Select the milestone: "${title}"` },
                      { step: '3', text: 'Click the upload zone and pick your PDF file' },
                      { step: '4', text: 'Click "Replace & Resubmit" to upload the file to the server' },
                      { step: '5', text: 'Then return to Documents and try opening again' },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[9px] font-black text-orange-600 shrink-0 mt-0.5">
                          {step}
                        </div>
                        <span className="text-xs text-slate-600 font-semibold leading-snug">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <a
                  href="/student/milestones"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-2xl transition-all shadow-lg uppercase tracking-wider"
                >
                  <Upload className="w-4 h-4" />
                  Go to Milestones to Re-upload
                </a>

                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {dateStr}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-slate-300" />
                    Secure Portal
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FILE EXISTS — render it */}
        {fileExists === 'yes' && (
          <div className="flex-1 flex flex-col">
            {isPdf ? (
              <iframe
                src={fileParam}
                className="flex-1 w-full border-none"
                style={{ minHeight: 'calc(100vh - 72px)' }}
                title={fileName}
              />
            ) : (
              // Non-PDF — show download card
              <div className="flex-1 flex items-center justify-center p-8 bg-slate-900/50">
                <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 md:p-16 max-w-lg w-full border border-slate-800/40 shadow-2xl relative text-center">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 rounded-t-[2.5rem]" />
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-orange-50 border border-orange-100 rounded-3xl flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-900 mb-2">{fileName}</h1>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        This file type cannot be previewed in the browser. Click below to download it.
                      </p>
                    </div>
                    <a
                      href={fileParam}
                      download={fileName}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Download {fileName}
                    </a>
                    <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {dateStr}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600">Verified Secure</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MOCK / NO PATH — show simulated preview for old mock entries */}
        {!isRealFile && (
          <div className="flex-1 flex justify-center items-center p-8 bg-slate-900/50 overflow-y-auto">
            <div className="bg-white text-slate-900 rounded-[2.5rem] p-10 md:p-16 max-w-2xl w-full border border-slate-800/40 shadow-2xl relative">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 rounded-t-[2.5rem]" />
              <div className="space-y-8">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block">Simulated Portal Preview</span>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">{title}</h1>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-center">
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
                    This is a simulated preview for the milestone <strong>{title}</strong>. No actual file was uploaded for this entry.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-100 flex items-center gap-2.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  Project Station &bull; Integrated Academic Telemetry
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 text-center text-[10px] text-slate-500 font-semibold uppercase tracking-widest select-none flex-shrink-0">
        Project Station Document Preview Roster
      </footer>
    </div>
  )
}

export default function DocumentPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 text-white font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
          <span className="text-xs uppercase tracking-widest text-slate-400 font-black">Loading Preview...</span>
        </div>
      </div>
    }>
      <DocumentPreviewInner />
    </Suspense>
  )
}

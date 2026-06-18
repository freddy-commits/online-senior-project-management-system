'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Briefcase, 
  Target, 
  MessageSquare, 
  Lightbulb, 
  Plus, 
  Users, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  Search,
  SlidersHorizontal,
  CloudUpload,
  AlertCircle,
  Settings as SettingsIcon,
  FileText,
  X
} from 'lucide-react'
import ProjectDescription from '@/components/project/ProjectDescription'

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'my-problems' | 'submit-problem'>('my-problems')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Submit form states
  const [probTitle, setProbTitle] = useState('')
  const [probCategory, setProbCategory] = useState('Operations')
  const [probPriority, setProbPriority] = useState('High')
  const [probDesc, setProbDesc] = useState('')
  const [probSkills, setProbSkills] = useState('')
  
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')

  const [uploadedFileUrl, setUploadedFileUrl] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 50MB
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size must be less than 50MB. Please use a smaller file.')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Upload failed (HTTP ${res.status})`)
      }

      if (data.url) {
        // Use the original filename for display but the server URL for downloading
        setUploadedFileUrl(data.url)
        setUploadedFileName(file.name) // always use original name for readability
      } else {
        throw new Error('Upload response did not include a file URL')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file. Please try again.')
      // Clear the file input so user can retry
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFileUrl('')
    setUploadedFileName('')
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile?.role !== 'industry') return router.push(`/${profile?.role || ''}`)

      // Fetch projects sponsored by this industry partner
      const { data: projs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), teams:team_id(id, name)')
        .eq('industry_partner_id', user.id)

      // Fetch all team members for assigned projects so we can show the full team
      const teamIds = (projs || []).map((p: any) => p.team_id).filter(Boolean)
      let membersMap: Record<string, any[]> = {}
      if (teamIds.length > 0) {
        const { data: members } = await supabase
          .from('team_members')
          .select('*, profiles:user_id(id, full_name, email, avatar_url)')
          .in('team_id', teamIds)
        if (members) {
          members.forEach((m: any) => {
            if (!membersMap[m.team_id]) membersMap[m.team_id] = []
            membersMap[m.team_id].push(m)
          })
        }
      }

      const enrichedProjs = (projs || []).map((p: any) => ({
        ...p,
        teamMembers: p.team_id ? (membersMap[p.team_id] || []) : []
      }))
      setProjects(enrichedProjs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleProblemSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!probTitle || !probDesc) return

    setSubmitLoading(true)
    setSubmitSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let descriptionWithBrief = probDesc
      // Append category, priority, and skills to help instructors vet the submission
      if (probSkills) {
        descriptionWithBrief += `\n\nRequired Skills: ${probSkills}`
      }
      descriptionWithBrief += `\n\nCategory: ${probCategory} | Priority: ${probPriority}`
      // Attach the uploaded file URL so the instructor can view the document
      if (uploadedFileUrl) {
        descriptionWithBrief += `\n\n[Attached Brief: ${uploadedFileName} | ${uploadedFileUrl}]`
      }

      const { error } = await supabase
        .from('projects')
        .insert({
          title: probTitle,
          description: descriptionWithBrief,
          industry_partner_id: user.id,
          status: 'pending' // waits for instructor to vet and approve
        })

      if (error) throw error

      setSubmitSuccess('Problem Statement submitted successfully! Waiting for instructor to vet, approve and assign student teams.')
      setProbTitle('')
      setProbDesc('')
      setProbSkills('')
      setUploadedFileUrl('')
      setUploadedFileName('')
      
      await fetchData()
      setTimeout(() => {
        setActiveTab('my-problems')
        setSubmitSuccess('')
      }, 3000)
    } catch (err: any) {
      console.error(err)
      setSubmitSuccess(`Failed to submit: ${err.message}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>

  const totalProblems = projects.length
  const pendingAssignment = projects.filter(p => p.status === 'pending').length
  const activeProjects = projects.filter(p => p.status === 'approved').length
  const totalStudentTeams = projects.filter(p => p.student_id !== null).length

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Dynamic Tab Navigation */}
      <div className="flex border-b border-slate-200 mb-8 text-sm font-black uppercase tracking-wider items-center flex-wrap">
        <button 
          onClick={() => setActiveTab('my-problems')}
          className={`pb-4 px-6 relative transition-all cursor-pointer ${activeTab === 'my-problems' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
        >
          My Problems
        </button>
        <button 
          onClick={() => setActiveTab('submit-problem')}
          className={`pb-4 px-6 relative transition-all cursor-pointer ${activeTab === 'submit-problem' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
        >
          Submit New Problem
        </button>
      </div>

      {/* MY PROBLEMS TAB */}
      {activeTab === 'my-problems' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search problems..." 
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600" 
              />
            </div>
            <button className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              More Filters
            </button>
          </div>

          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 relative hover:shadow-md transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">{p.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                          p.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {p.status === 'approved' ? 'active' : 'pending vetting'}
                        </span>
                      </div>
                      <ProjectDescription description={p.description} className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed max-w-4xl" />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-4 text-[10px] font-black uppercase tracking-wider text-slate-455">
                    <div className="flex items-center gap-4">
                      <span>Problem ID: PRB-{p.id.slice(0, 4).toUpperCase()}</span>
                      <span>Category: Industry Track</span>
                      <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {p.teamMembers && p.teamMembers.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">
                              {p.teams?.name || 'Team'} · {p.teamMembers.length} member{p.teamMembers.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {p.teamMembers.map((m: any, idx: number) => (
                              <div
                                key={idx}
                                title={m.profiles?.full_name}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                                  m.profiles?.id === p.student_id
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                }`}
                              >
                                {m.profiles?.full_name || 'Unknown'}
                                {m.profiles?.id === p.student_id && (
                                  <span className="ml-0.5 text-[8px] font-black uppercase opacity-80">★ Lead</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-100">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Awaiting Student Team Assignment</span>
                        </div>
                      )}
                      <button 
                        onClick={() => router.push(`/partner/projects/${p.id}`)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        View Project
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2.25rem] text-slate-450 font-bold text-xs bg-slate-50/20">
                No problems submitted yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBMIT NEW PROBLEM TAB */}
      {activeTab === 'submit-problem' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm animate-in fade-in duration-300">
          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-black text-slate-900">Submit a New Problem</h2>
            <p className="text-xs text-slate-500 font-semibold">Share a real-world challenge for senior student squads to build solutions for.</p>
          </div>

          <form onSubmit={handleProblemSubmit} className="space-y-5">
            {submitSuccess && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitSuccess}
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Problem Title *</label>
              <input 
                required
                type="text" 
                value={probTitle}
                onChange={(e) => setProbTitle(e.target.value)}
                placeholder="e.g. Customer Churn Prediction Model"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Category *</label>
              <select 
                value={probCategory}
                onChange={(e) => setProbCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option>Operations</option>
                <option>Data Engineering</option>
                <option>Machine Learning</option>
                <option>Web Development</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Priority Level *</label>
              <div className="flex gap-4 text-xs font-bold text-slate-700">
                {['Low', 'Medium', 'High'].map((p) => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="priority"
                      checked={probPriority === p}
                      onChange={() => setProbPriority(p)}
                      className="accent-indigo-600"
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Problem Description *</label>
              <textarea 
                required
                rows={5}
                value={probDesc}
                onChange={(e) => setProbDesc(e.target.value)}
                placeholder="Provide a detailed description of the challenge, technical background, and expected outcomes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none" 
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Required Skills</label>
              <input 
                type="text" 
                value={probSkills}
                onChange={(e) => setProbSkills(e.target.value)}
                placeholder="e.g. Python, Machine Learning, Data Analysis"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>

            {/* Resources & Data Drag box */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2">Resources & Data</label>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.csv,.xlsx,.xls,.zip"
                className="hidden"
              />

              {!uploadedFileUrl ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-6 text-center transition-all bg-slate-50/50 cursor-pointer group animate-in fade-in duration-200"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                  ) : (
                    <CloudUpload className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
                  )}
                  <span className="text-xs font-extrabold text-slate-800 block">
                    {uploading ? 'Uploading brief...' : 'Upload datasets, documentation, or related files'}
                  </span>
                  <span className="text-[9.5px] text-slate-400 font-bold block pt-0.5">PDF, CSV, XLSX, or ZIP up to 50MB</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block truncate max-w-[280px]">
                        {uploadedFileName}
                      </span>
                      <span className="text-[10px] text-green-600 font-bold block">File uploaded successfully</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {uploadError && <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">{uploadError}</p>}
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex gap-3 text-indigo-800">
              <Clock className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold leading-relaxed">
                Once submitted, your problem will be reviewed by our team and shared with partner schools for assignment.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit"
                disabled={submitLoading}
                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer active:scale-[0.98] flex items-center gap-1.5"
              >
                {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Publish Problem
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

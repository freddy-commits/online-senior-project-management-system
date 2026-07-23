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
  X,
  Mail,
  Calendar,
  Check,
  ChevronRight
} from 'lucide-react'
import ProjectDescription from '@/components/project/ProjectDescription'

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'my-problems' | 'submit-problem'>('my-problems')
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileClosed, setIsProfileClosed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
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
  const [partnerProfile, setPartnerProfile] = useState<any>(null)

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
        setUploadedFileUrl(data.url)
        setUploadedFileName(file.name)
      } else {
        throw new Error('Upload response did not include a file URL')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file. Please try again.')
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
      if (profile) setPartnerProfile(profile)
      if (profile?.role !== 'industry' && profile?.role !== 'industry_partner') {
        return router.push(`/${profile?.role || ''}`)
      }

      // Fetch projects sponsored by this industry partner
      const { data: projs } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), teams:team_id(id, name)')
        .eq('industry_partner_id', user.id)

      // Fetch all team members for assigned projects
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
      if (probSkills) {
        descriptionWithBrief += `\n\nRequired Skills: ${probSkills}`
      }
      descriptionWithBrief += `\n\nCategory: ${probCategory} | Priority: ${probPriority}`
      if (uploadedFileUrl) {
        descriptionWithBrief += `\n\n[Attached Brief: ${uploadedFileName} | ${uploadedFileUrl}]`
      }

      const { error } = await supabase
        .from('projects')
        .insert({
          title: probTitle,
          description: descriptionWithBrief,
          industry_partner_id: user.id,
          status: 'pending'
        })

      if (error) throw error

      setSubmitSuccess('Problem Statement submitted successfully! Waiting for coordinator review.')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    )
  }

  const totalProblems = projects.length
  const pendingAssignment = projects.filter(p => p.status === 'pending').length
  const activeProjects = projects.filter(p => p.status === 'approved').length

  const filteredProjects = projects.filter(p => {
    return p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  })

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1)
  const currentDay = 23

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 text-slate-800 font-sans relative">
      
      {/* Search & Greeting Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Industry Sponsor Desk
          </h1>
          <p className="text-xs text-slate-450 font-semibold mt-0.5">Submit organizational challenges and monitor senior projects.</p>
        </div>
        <div className="flex gap-3 items-center w-full sm:w-auto">
          {activeTab === 'my-problems' && (
            <div className="relative w-full sm:w-64">
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search statements..."
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-2 pl-10 pr-4 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          )}
          
          <button 
            onClick={() => setActiveTab(activeTab === 'my-problems' ? 'submit-problem' : 'my-problems')}
            className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0 cursor-pointer"
          >
            {activeTab === 'my-problems' ? 'Submit Problem' : 'Back to List'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ================== LEFT COLUMN: PROBLEMS & FORMS (Takes 8 cols) ================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeTab === 'my-problems' ? (
            <div className="space-y-6">
              
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Total Statements</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block">{totalProblems}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-50 text-slate-500 border border-slate-100 mt-2">
                    Submitted
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Pending Vetting</span>
                  <span className="text-3xl font-black text-[#F59E0B] mt-2 block">{pendingAssignment}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-100 mt-2">
                    In Review
                  </span>
                </div>
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Active Projects</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block">{activeProjects}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 mt-2">
                    Assigned
                  </span>
                </div>
              </div>

              {/* Visual SVG chart illustrating statement breakdown */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Problem Status Share</span>
                  <span className="text-[9.5px] font-black text-blue-600 uppercase">Live Telemetry</span>
                </div>
                <div className="flex items-center gap-6 py-2">
                  <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" className="stroke-slate-100 fill-none" strokeWidth="6" />
                      <circle 
                        cx="48" cy="48" r="40" 
                        className="stroke-blue-600 fill-none" 
                        strokeWidth="6" 
                        strokeDasharray="251" 
                        strokeDashoffset={totalProblems > 0 ? 251 - (251 * activeProjects) / totalProblems : 251} 
                      />
                    </svg>
                    <span className="text-sm font-black text-slate-900">
                      {totalProblems > 0 ? Math.round((activeProjects / totalProblems) * 100) : 0}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800">Approved Ratio</h4>
                    <p className="text-[10px] text-slate-450 font-semibold mt-1">Percentage of problem submissions approved for school syllabus alignment.</p>
                  </div>
                </div>
              </div>

              {/* Problems list */}
              <div className="space-y-4">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4 relative hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900 leading-tight">{p.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                              p.status === 'approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}>
                              {p.status === 'approved' ? 'active' : 'pending vetting'}
                            </span>
                          </div>
                          <ProjectDescription description={p.description} className="text-xs font-semibold text-slate-500 mt-2 leading-relaxed max-w-4xl" />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-4 text-[9px] font-black uppercase tracking-wider text-slate-400">
                        <div className="flex items-center gap-3">
                          <span>PRB-{p.id.slice(0, 4).toUpperCase()}</span>
                          <span>Industry Track</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {p.teamMembers && p.teamMembers.length > 0 ? (
                            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded border border-blue-100">
                              <Users className="w-3.5 h-3.5" />
                              <span>{p.teams?.name || 'Team'} Assigned</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded border border-amber-100">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Awaiting Team</span>
                            </div>
                          )}
                          <button 
                            onClick={() => router.push(`/partner/projects/${p.id}`)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer text-[9px] font-black uppercase tracking-wider"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-450 font-bold text-xs bg-slate-50/20">
                    No problem statements found matching search.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-900">Submit a New Problem</h2>
                <p className="text-xs text-slate-500 font-semibold">Share a real-world organizational challenge for senior student squads.</p>
              </div>

              <form onSubmit={handleProblemSubmit} className="space-y-5">
                {submitSuccess && (
                  <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {submitSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Problem Title *</label>
                  <input 
                    required
                    type="text" 
                    value={probTitle}
                    onChange={(e) => setProbTitle(e.target.value)}
                    placeholder="e.g. Customer Churn Prediction Model"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Category *</label>
                  <select 
                    value={probCategory}
                    onChange={(e) => setProbCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  >
                    <option>Operations</option>
                    <option>Data Engineering</option>
                    <option>Machine Learning</option>
                    <option>Web Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Priority Level *</label>
                  <div className="flex gap-4 text-xs font-bold text-slate-700">
                    {['Low', 'Medium', 'High'].map((p) => (
                      <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="radio" 
                          name="priority"
                          checked={probPriority === p}
                          onChange={() => setProbPriority(p)}
                          className="accent-blue-600"
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Problem Description *</label>
                  <textarea 
                    required
                    rows={5}
                    value={probDesc}
                    onChange={(e) => setProbDesc(e.target.value)}
                    placeholder="Provide a detailed description of the challenge, technical requirements, and expected outcomes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 resize-none" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Required Skills</label>
                  <input 
                    type="text" 
                    value={probSkills}
                    onChange={(e) => setProbSkills(e.target.value)}
                    placeholder="e.g. Python, Machine Learning, React"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-black text-slate-450 mb-2">Resources &amp; Data Brief</label>
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
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 text-center transition-all bg-slate-50/50 cursor-pointer group"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                      ) : (
                        <CloudUpload className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                      )}
                      <span className="text-xs font-extrabold text-slate-800 block">
                        {uploading ? 'Uploading brief...' : 'Upload datasets or brief PDF'}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-bold block pt-0.5">PDF, CSV, or ZIP up to 50MB</span>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block truncate max-w-[200px]">
                            {uploadedFileName}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold block">File uploaded</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-650 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit"
                    disabled={submitLoading}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Publish Problem
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* ================== RIGHT COLUMN: PROFILE & TO-DO & CALENDAR (Takes 4 cols) ================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PROFILE CARD */}
          {!isProfileClosed ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-6 relative overflow-hidden select-none">
              {/* Close Button */}
              <button
                onClick={() => setIsProfileClosed(true)}
                className="absolute top-4 right-4 z-20 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
                title="Close Profile Details"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="relative z-10 text-center space-y-3">
                <div className="w-16 h-16 bg-[#F59E0B] text-[#111827] rounded-2xl flex items-center justify-center mx-auto shadow-sm font-black text-xl">
                  {partnerProfile?.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || 'IP'}
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 leading-tight tracking-tight">{partnerProfile?.full_name || 'Industry Sponsor'}</h3>
                  <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[9px] font-black uppercase tracking-wider">
                    Industry Partner
                  </span>
                </div>
              </div>

              <div className="relative z-10 border-t border-slate-100 pt-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{partnerProfile?.email || 'sponsor@domain.com'}</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsProfileClosed(false)}
              className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-[2rem] text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              Show Profile Details
            </button>
          )}

          {/* CALENDAR CARD */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">July 2026</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-slate-400 uppercase">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-700">
              <span></span><span></span><span></span>
              {daysInMonth.map((day) => {
                const isToday = day === currentDay
                return (
                  <span 
                    key={day} 
                    className={`h-6 w-6 flex items-center justify-center rounded-lg mx-auto ${
                      isToday 
                        ? 'bg-blue-600 text-white font-black shadow-sm' 
                        : 'hover:bg-slate-100 cursor-pointer'
                    }`}
                  >
                    {day}
                  </span>
                )
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

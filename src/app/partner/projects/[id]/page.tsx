'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { 
  Briefcase, 
  Target, 
  MessageSquare, 
  Lightbulb, 
  ExternalLink, 
  Calendar,
  CheckCircle2,
  Loader2,
  ChevronRight,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'

export default function PartnerProjectDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [postingFeedback, setPostingFeedback] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // Fetch project with student and instructor info
      const { data: proj } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name, email)')
        .eq('id', id)
        .single()
      
      setProject(proj)

      // Fetch key deliverables
      const { data: deliv } = await supabase
        .from('deliverables')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: true })
      
      setDeliverables(deliv || [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleFeedbackSubmit() {
    if (!feedback.trim()) return
    setPostingFeedback(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user profile to get partner name
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const partnerName = prof?.full_name || 'Industry Partner'

      // 1. Insert a system message into the messages table
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: project.student_id,
        content: `[Industry Sponsor Feedback] "${project.title}": ${feedback}`
      })

      // 2. Notify student
      await supabase.from('notifications').insert({
        user_id: project.student_id,
        title: 'New Industry Sponsor Review',
        message: `${partnerName} posted professional review for project "${project.title}".`,
        type: 'system'
      })

      // 3. Send email to student
      if (project.student?.email) {
        const { sendNotificationEmail } = await import('@/lib/email/emailService')
        const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`
        await sendNotificationEmail({
          toEmail: project.student.email,
          toName: project.student.full_name || 'Student',
          subject: `🏢 Industry Sponsor Review: ${project.title}`,
          bodyText: `Hi ${project.student.full_name},\n\nYour Industry Sponsor (${partnerName}) has posted a professional review on your project "${project.title}".\n\nReview Comments: "${feedback}"\n\nPlease log in to see full details.\n\nLink to portal: ${loginUrl}\n\nBest regards,\nProject Hub Administration`,
          bodyHtml: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background: #fff; color: #334155;">
              <h2 style="color: #4f46e5; margin-bottom: 20px;">🏢 Industry Sponsor Review</h2>
              <p>Hi <strong>${project.student.full_name}</strong>,</p>
              <p>Your industry sponsor <strong>${partnerName}</strong> has reviewed your project progress:</p>
              <blockquote style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; margin: 16px 0; font-style: italic;">
                "${feedback}"
              </blockquote>
              <p>Please log in to your dashboard to collaborate and address their feedback.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${loginUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">View Dashboard</a>
              </div>
            </div>
          `
        })
      }

      setFeedback('')
      setSuccessMsg('Your professional feedback has been submitted to the student and faculty advisor!')
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (err) {
      console.error(err)
      setSuccessMsg('Failed to submit feedback. Please try again.')
      setTimeout(() => setSuccessMsg(''), 5000)
    } finally {
      setPostingFeedback(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>

  if (!project) return <div className="text-center py-20 text-slate-500 font-bold">Project not found</div>

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <button onClick={() => router.push('/partner/dashboard')} className="text-slate-400 hover:text-slate-900 text-sm font-bold mb-8 flex items-center gap-2 transition-colors cursor-pointer bg-transparent border-none outline-none">
        <ChevronRight className="w-4 h-4 rotate-180" />
        Partner Dashboard
      </button>

      {/* Hero Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 mb-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/60 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              Industry Partnership
            </div>
            <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
              Active Sponsorship
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight max-w-3xl">
            {project.title}
          </h1>
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-blue-600">
                {project.student?.full_name?.[0] || '?'}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Student Lead</div>
                <div className="text-sm font-bold text-slate-900">{project.student?.full_name || 'Unassigned'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center font-bold text-violet-600">
                {project.instructor?.full_name?.[0] || '?'}
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Faculty Advisor</div>
                <div className="text-sm font-bold text-slate-900">{project.instructor?.full_name || 'Unassigned'}</div>
              </div>
            </div>
            {project.team_members?.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Team Size</div>
                  <div className="text-sm font-bold text-slate-900">{project.team_members.length} member{project.team_members.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Student Team Information */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
              <Users className="w-6 h-6 text-indigo-600" />
              Assigned Student Team
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                  {project.student?.full_name?.[0] || '?'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-455 block">STUDENT LEAD</span>
                  <span className="text-sm font-black text-slate-900">{project.student?.full_name || 'Awaiting assignment'}</span>
                  <span className="text-xs text-slate-450 block mt-0.5">{project.student?.email}</span>
                </div>
              </div>

              {/* Team Members List */}
              <div className="p-4 border border-slate-100 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Team Members & Assigned Roles</span>
                {project.team_members && project.team_members.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {project.team_members.map((member: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-655 flex items-center justify-center font-bold text-[10px]">
                          M{idx + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate">{member}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 block italic">No additional team members registered. Works as a solo capstone/project.</span>
                )}
              </div>
            </div>
          </section>

          {/* Final Product Submission */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-900">
              <Briefcase className="w-6 h-6 text-emerald-600" />
              Final Product Deliverables
            </h2>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Review the final execution release, codebase, and printed system files handed over by the student squad.
            </p>

            {(() => {
              const finalDeliv = deliverables.find(d => d.title.toLowerCase().includes('final') || d.title.toLowerCase().includes('client') || d.title.toLowerCase().includes('thesis'))
              if (finalDeliv && finalDeliv.submission_url) {
                return (
                  <div className="p-5 bg-emerald-50 border border-emerald-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 border border-emerald-200/50 px-2 py-0.5 rounded uppercase">Submitted Product</span>
                      <h4 className="text-sm font-black text-slate-900 mt-2">{finalDeliv.title}</h4>
                      <p className="text-xs font-semibold text-slate-500 mt-1">Uploaded file / deployment URL is ready for download.</p>
                    </div>
                    <a 
                      href={finalDeliv.submission_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] shrink-0"
                    >
                      <ExternalLink className="w-4.5 h-4.5" />
                      Get Final Deliverables
                    </a>
                  </div>
                )
              } else {
                return (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <span className="text-xs font-bold text-slate-700 block">Awaiting Final Product Submission</span>
                    <p className="text-[10px] text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">The student team has not uploaded their final client deliverables package yet. You will be notified as soon as it is submitted.</p>
                  </div>
                )
              }
            })()}
          </section>

          {/* Mentorship Area */}
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-indigo-600">
              <TrendingUp className="w-6 h-6" />
              Industry Evaluation
            </h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Provide feedback on the project&apos;s industry relevance, technical approach, and potential market impact.
            </p>
            
            <div className="space-y-6">
              {successMsg && (
                <div className={`p-4 rounded-xl text-sm font-bold ${successMsg.includes('Failed') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                  {successMsg}
                </div>
              )}
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your professional insights and suggestions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 resize-none min-h-[150px] placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Visible to Student & Instructor
                </div>
                <button 
                  onClick={handleFeedbackSubmit}
                  disabled={postingFeedback}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all text-white cursor-pointer flex items-center gap-2"
                >
                  {postingFeedback && <Loader2 className="w-4 h-4 animate-spin" />}
                  Post Industry Review
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Activity & Meeting Sidebar */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-900">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Schedule Sync
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Request a 15-minute sync with the team to discuss technical roadblocks.
            </p>
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all cursor-pointer">
              Book Meeting
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Project Log
            </h3>
            <div className="space-y-6">
              {[
                { user: 'Student Team', msg: 'Uploaded the hardware schematic', time: '1d ago' },
                { user: 'Advisor', msg: 'Requested more info on budget', time: '3d ago' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 mb-1">{log.user}</div>
                    <div className="text-[10px] text-slate-500 italic">&quot;{log.msg}&quot;</div>
                    <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

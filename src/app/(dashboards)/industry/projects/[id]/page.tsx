'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion } from 'framer-motion'
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
  TrendingUp
} from 'lucide-react'

export default function IndustryMentorshipPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

      // Fetch project with student and instructor info
      const { data: proj } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email), instructor:instructor_id(full_name)')
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

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  return (
    <DashboardLayout role="industry" userName={userProfile.full_name}>
      <div className="max-w-6xl mx-auto pb-20">
        {/* Breadcrumbs */}
        <button onClick={() => router.push('/industry')} className="text-slate-500 hover:text-white text-sm font-bold mb-8 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Partner Dashboard
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-white/10 rounded-[2.5rem] p-10 mb-10 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                Industry Partnership
              </div>
              <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-500/10">
                Active Sponsorship
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight max-w-3xl">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-blue-400">
                  {project.student?.full_name?.[0]}
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Student Lead</div>
                  <div className="text-sm font-bold text-white">{project.student?.full_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-indigo-400">
                  {project.instructor?.full_name?.[0]}
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Faculty Advisor</div>
                  <div className="text-sm font-bold text-white">{project.instructor?.full_name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Technical Milestones */}
            <section>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-400" />
                Technical Roadmap
              </h2>
              <div className="space-y-4">
                {deliverables.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        item.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-600'
                      }`}>
                        <Lightbulb className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-slate-500">Status: {item.status}</p>
                      </div>
                    </div>
                    {item.submission_url && (
                      <a href={item.submission_url} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Mentorship Area */}
            <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-indigo-400">
                <TrendingUp className="w-6 h-6" />
                Industry Evaluation
              </h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Provide feedback on the project's industry relevance, technical approach, and potential market impact.
              </p>
              
              <div className="space-y-6">
                <textarea 
                  placeholder="Share your professional insights and suggestions..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none min-h-[150px]"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Visible to Student & Instructor
                  </div>
                  <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all">
                    Post Industry Review
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Activity & Meeting Sidebar */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-400" />
                Schedule Sync
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Request a 15-minute sync with the team to discuss technical roadblocks.
              </p>
              <button className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">
                Book Meeting
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                Project Log
              </h3>
              <div className="space-y-6">
                {[
                  { user: 'Student Team', msg: 'Uploaded the hardware schematic', time: '1d ago' },
                  { user: 'Advisor', msg: 'Requested more info on budget', time: '3d ago' },
                ].map((log, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <ExternalLink className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white mb-1">{log.user}</div>
                      <div className="text-[10px] text-slate-500 italic">"{log.msg}"</div>
                      <div className="text-[10px] text-slate-700 mt-2 font-bold uppercase">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

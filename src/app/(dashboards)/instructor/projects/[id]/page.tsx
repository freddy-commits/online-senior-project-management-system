'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Star,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Lock,
  Unlock
} from 'lucide-react'

export default function InstructorReviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [deliverables, setDeliverables] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUserProfile(profile)

      const { data: proj } = await supabase
        .from('projects')
        .select('*, student:student_id(full_name, email)')
        .eq('id', id)
        .single()
      
      setProject(proj)

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

  async function handleStatusChange(status: string) {
    setProcessing(true)
    const { error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
    
    if (!error) {
      setProject({ ...project, status })
    }
    setProcessing(false)
  }

  async function handleGradeSubmission(delivId: string, grade: string) {
    if (!grade) return
    const { error } = await supabase
      .from('deliverables')
      .update({ grade, status: 'graded' })
      .eq('id', delivId)
    
    if (!error) {
      setDeliverables(deliverables.map(d => d.id === delivId ? { ...d, grade, status: 'graded' } : d))
    }
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>

  const isApproved = project.status === 'approved'

  return (
    <DashboardLayout role="instructor" userName={userProfile.full_name}>
      <div className="max-w-6xl mx-auto pb-20">
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <button onClick={() => router.push('/instructor')} className="text-slate-500 hover:text-white text-sm font-bold mb-4 flex items-center gap-2 transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Supervisor Dashboard
            </button>
            <h1 className="text-4xl font-black text-white tracking-tight">{project.title}</h1>
          </div>
          
          <div className="flex gap-3">
            {project.status === 'pending' ? (
              <>
                <button 
                  onClick={() => handleStatusChange('rejected')}
                  disabled={processing}
                  className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 font-bold text-sm transition-all flex items-center gap-2"
                >
                  Reject Proposal
                </button>
                <button 
                  onClick={() => handleStatusChange('approved')}
                  disabled={processing}
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 active:scale-95"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve Project
                </button>
              </>
            ) : (
              <div className="px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl font-bold text-sm flex items-center gap-2">
                <Unlock className="w-4 h-4" /> Project Approved & Open for Grading
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Project Milestones */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Submission History
              </h2>
              {!isApproved && (
                <div className="flex items-center gap-2 text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  <Lock className="w-3 h-3" /> Grading Locked
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {deliverables.length > 0 ? deliverables.map((item) => (
                <div key={item.id} className={`bg-white/5 border border-white/10 rounded-[2rem] p-8 transition-all ${!isApproved ? 'opacity-60 grayscale-[0.5]' : 'hover:bg-white/[0.08]'}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">
                          {item.status} — {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {item.submission_url && (
                      <a 
                        href={item.submission_url} 
                        target="_blank" 
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border border-white/10"
                      >
                        <ExternalLink className="w-4 h-4" /> Open Work
                      </a>
                    )}
                  </div>
                  
                  {isApproved ? (
                    <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                      {item.status === 'graded' ? (
                        <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-2xl">
                          <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Assigned Grade</span>
                          <span className="font-black text-xl text-green-400">{item.grade}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 mb-2">
                            <MessageSquare className="w-4 h-4 text-slate-500" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supervisor Recommendations</span>
                          </div>
                          <textarea 
                            id={`recommend-${item.id}`}
                            placeholder="Type your technical recommendations..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                            rows={2}
                          />
                          
                          <div className="flex gap-3">
                            <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10">
                              Send Recommendation
                            </button>
                            
                            {(item.title.toLowerCase().includes('final') || item.title.toLowerCase().includes('report')) && (
                              <div className="flex gap-2">
                                <input 
                                  id={`grade-${item.id}`}
                                  placeholder="Final Grade"
                                  className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none"
                                />
                                <button 
                                  onClick={() => handleGradeSubmission(item.id, (document.getElementById(`grade-${item.id}`) as HTMLInputElement).value)}
                                  className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 transition-all"
                                >
                                  Submit Final Grade
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-white/5 text-[10px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Approve project above to unlock review tools
                    </div>
                  )}
                </div>
              )) : (
                <div className="p-16 border border-dashed border-white/10 rounded-[2.5rem] text-center text-slate-500">
                  Waiting for student to upload first milestone.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-400" />
                Team Info
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center font-bold text-blue-400">
                  {project.student?.full_name?.[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{project.student?.full_name}</div>
                  <div className="text-xs text-slate-500">{project.student?.email}</div>
                </div>
              </div>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all border border-white/10">
                Contact Student
              </button>
            </div>

            <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-white/10 rounded-[2.5rem] p-8">
              <h3 className="text-lg font-bold mb-4">Academic Notice</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                By approving this project, you confirm that the proposal meets the university's technical and academic standards for the Senior Project.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

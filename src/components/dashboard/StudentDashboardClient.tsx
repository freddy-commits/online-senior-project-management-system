'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  GraduationCap, 
  Users, 
  HelpCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  Search, 
  Bell, 
  X, 
  Briefcase, 
  Building2, 
  GitBranch, 
  Eye, 
  ArrowRight, 
  Code, 
  Leaf, 
  Megaphone, 
  Copy, 
  Check, 
  FileDown,
  ChevronRight,
  TrendingUp,
  Network,
  Users2,
  FileSignature,
  Sliders,
  AlertTriangle
} from 'lucide-react'

import { useTrack } from '@/components/providers/TrackProvider'

interface StudentDashboardClientProps {
  initialProfile: {
    full_name: string | null
    role: string | null
  } | null
  initialProjects: any[] | null
}

interface SoloTask {
  id: string
  text: string
  desc: string
  completed: boolean
}

export default function StudentDashboardClient({ 
  initialProfile, 
  initialProjects 
}: StudentDashboardClientProps) {
  const { trackMode } = useTrack()
  const activeProject = initialProjects && initialProjects.length > 0 ? initialProjects[0] : null
  const hasActiveProject = activeProject && activeProject.status !== 'rejected'
  
  
  // Interactive features states
  const [nudgeAlert, setNudgeAlert] = useState(false)
  const [meetingAlert, setMeetingAlert] = useState(false)
  const [pairingMtgId, setPairingMtgId] = useState<string | null>(null)
  const [pairingSuccess, setPairingSuccess] = useState(false)

  // Solo Task Checklist (localStorage persisted)
  const [soloTasks, setSoloTasks] = useState<SoloTask[]>([
    { id: '1', text: 'Scrape Dialect-A Dataset', desc: 'Gathering 10k sentences from verified archives.', completed: true },
    { id: '2', text: 'Baseline Model Config', desc: 'Initial training run with vanilla BERT.', completed: true },
    { id: '3', text: 'Optimize Hyperparameters', desc: 'Iterate on learning rate and dropout ratios.', completed: false },
    { id: '4', text: 'Write Ch. 3: Methodology', desc: 'Document architectural changes to Transformer layers.', completed: false },
    { id: '5', text: 'Final Evaluation Metrics', desc: 'Calculate F1 scores across three linguistic subsets.', completed: false }
  ])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('projectstation_solo_tasks')
      if (saved) {
        try {
          setSoloTasks(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to parse saved solo tasks', e)
        }
      }
    }
  }, [])

  const saveSoloTasks = (newTasks: SoloTask[]) => {
    setSoloTasks(newTasks)
    if (typeof window !== 'undefined') {
      localStorage.setItem('projectstation_solo_tasks', JSON.stringify(newTasks))
    }
  }

  const handleToggleTask = (id: string) => {
    const updated = soloTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    saveSoloTasks(updated)
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return

    const newItem: SoloTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      desc: newTaskDesc.trim() || 'Custom added task.',
      completed: false
    }

    const updated = [...soloTasks, newItem]
    saveSoloTasks(updated)
    setNewTaskText('')
    setNewTaskDesc('')
    setIsAddingTask(false)
  }

    // Hook global search bridge triggers to switch dashboard displays dynamically
    // removed setTrackMode usage inside handleGlobalSearch as trackMode is controlled by TrackContext now.
    // To wire it up fully we would need to get setTrackMode from useTrack().
    const { setTrackMode: contextSetTrackMode } = useTrack()
    useEffect(() => {
      const handleGlobalSearch = (e: Event) => {
        const customEvent = e as CustomEvent
        const query = (customEvent.detail || '').toLowerCase()
        if (query.includes('thesis') || query.includes('solo')) {
          contextSetTrackMode('thesis')
        } else if (query.includes('ind') || query.includes('client')) {
          contextSetTrackMode('industry')
        } else if (query.includes('admin') || query.includes('risk')) {
          contextSetTrackMode('admin')
        } else if (query.includes('coord') || query.includes('pairing')) {
          contextSetTrackMode('coordinator')
        }
      }
      window.addEventListener('global-search', handleGlobalSearch)
      return () => {
        window.removeEventListener('global-search', handleGlobalSearch)
      }
    }, [contextSetTrackMode])

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16 text-slate-800 font-sans relative">
      {/* ===== PORTAL VIEWS SWITCH ENGINE ===== */}
      <AnimatePresence mode="wait">
        
        {/* ================== MODE 1: STUDENT INDUSTRY TRACK (Screenshot 4) ================== */}
        {trackMode === 'industry' && (
          <motion.div
            key="industry"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {!hasActiveProject ? (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm mt-8">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Waiting for Allocation</h2>
                <p className="text-sm font-semibold text-slate-500 mt-2 max-w-md mx-auto">
                  Your Instructor will assign you to an Industry Project shortly. Please check back later.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">{activeProject?.title || 'TechCorp Smart City API'}</h1>
                <p className="text-xs text-slate-400 font-semibold mt-1">{activeProject?.description || 'Real-time traffic orchestration and data visualization platform.'}</p>
              </div>

              <div className="flex gap-2 text-center shrink-0">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Year</span>
                  <span className="text-sm font-black text-slate-900">02</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Grade</span>
                  <span className="text-sm font-black text-[#0f8b5a]">A-</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column Area (Sponsor Brief & Milestones) */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Sponsor Brief Card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div className="sm:col-span-2 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Sponsor Brief</h3>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      "Our goal is to prototype a scalable API that handles up to 5,000 concurrent sensor nodes for metropolitan traffic management. Students must ensure 99.9% uptime for the simulation module."
                    </p>
                    <div className="flex gap-1.5 flex-wrap">
                      {['Python 3.11', 'PostgreSQL', 'Docker', 'Redis'].map(t => (
                        <span key={t} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2.5 py-1 rounded border border-slate-150">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-36 bg-slate-50 rounded-2xl overflow-hidden border border-slate-150">
                    <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300" 
                      alt="TechCorp Smart City" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Industry Milestones Timeline Checklist */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Industry Milestones</h3>
                  
                  <div className="space-y-4 relative pl-5 border-l-2 border-slate-100">
                    {/* Milestone 1 */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-white" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">Phase 1: Architecture Review</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          System design document and database schema approval by TechCorp mentors.
                        </p>
                        <span className="text-[8px] text-emerald-600 font-black uppercase tracking-wider block mt-1">
                          COMPLETED OCT 14
                        </span>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-white" />
                      <div className="space-y-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-800 leading-snug">Phase 2: Alpha Simulation Prototype</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Developing the core simulation engine with WebSocket real-time updates.
                          </p>
                        </div>
                        <div className="w-1/2 space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-400">
                            <span>Progress</span>
                            <span className="text-blue-600">65%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-100">
                            <div className="bg-blue-600 h-full rounded-full w-[65%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white ring-4 ring-white" />
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">Phase 3: Security &amp; Load Testing</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Penetration testing and benchmarking under high-concurrency loads.
                        </p>
                        <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mt-1">
                          DUE JAN 15
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column Area (Leaderboard & Team Roster) */}
              <div className="space-y-6">
                
                {/* Team Leaderboard Card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Team Leaderboard</h3>
                  
                  <div className="space-y-2">
                    {/* Rank 1 */}
                    <div className="bg-[#b37a1f]/10 border border-[#b37a1f]/20 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#b37a1f]/20 text-[#b37a1f] font-extrabold text-[10px] flex items-center justify-center shrink-0">01</span>
                        <span className="text-xs font-bold text-slate-800">Visionary Voyagers</span>
                      </div>
                      <span className="text-xs font-black text-[#b37a1f]">2,450 pts</span>
                    </div>

                    {/* Rank 2 */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-white border border-slate-200 rounded-lg text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">02</span>
                        <span className="text-xs font-bold text-slate-700">Urban Grid Tech</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-500">2,310 pts</span>
                    </div>

                    {/* Rank 3 */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-white border border-slate-200 rounded-lg text-slate-400 font-bold text-[10px] flex items-center justify-center shrink-0">03</span>
                        <span className="text-xs font-bold text-slate-700">Node Knights</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-500">2,180 pts</span>
                    </div>
                  </div>

                  <button className="text-[10px] font-black text-slate-400 hover:text-slate-700 block text-center w-full uppercase tracking-widest pt-1">
                    View full rankings →
                  </button>
                </div>

                {/* My Team Card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">My Team</h3>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Alex Rivera', role: 'Lead Developer', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', isMe: true },
                      { name: 'Sara Chen', role: 'UX/UI Designer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', isMe: false },
                      { name: 'Marcus Thorne', role: 'Data Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isMe: false }
                    ].map((member, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img className="w-8 h-8 rounded-full object-cover shadow-sm border border-slate-100" src={member.avatar} alt={member.name} />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{member.name}</h4>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5">{member.role}</p>
                          </div>
                        </div>

                        {member.isMe && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">
                            YOU
                          </span>
                        )}
                      </div>
                    ))}

                    {/* Invite Role button */}
                    <button className="w-full py-3.5 bg-slate-50 border border-dashed border-slate-200 hover:border-slate-400 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition-colors group cursor-pointer mt-4">
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      Invite Student / Open Role
                    </button>

                    {/* Team Chat button */}
                    <button className="w-full bg-[#f4f7fe] hover:bg-blue-50 text-[#0c59db] flex items-center justify-center py-3 rounded-2xl font-extrabold text-xs tracking-wider uppercase transition-colors cursor-pointer mt-2.5">
                      Team Chat
                    </button>
                  </div>
                </div>

              </div>

            </div>
              </>
            )}
          </motion.div>
        )}

        {/* ================== MODE 2: STUDENT ACADEMIC THESIS TRACK (Screenshot 5) ================== */}
        {trackMode === 'thesis' && (
          <motion.div
            key="thesis"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {!hasActiveProject ? (
              <div className="p-12 text-center bg-white rounded-[2rem] border border-slate-200 shadow-sm mt-8">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeProject?.status === 'rejected' ? 'Proposal Rejected' : 'No Active Project'}
                </h2>
                <p className="text-sm font-semibold text-slate-500 mt-2 mb-8 max-w-md mx-auto">
                  {activeProject?.status === 'rejected' 
                    ? 'Your previous Capstone Proposal was rejected by the instructor. Please revise your ideas and submit a new proposal.'
                    : "You haven't submitted a Capstone Proposal yet. Start your academic thesis by drafting a proposal."}
                </p>
                <a href="/student/projects/new" className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all">
                  <Plus className="w-4 h-4" />
                  {activeProject?.status === 'rejected' ? 'Submit New Proposal' : 'Start Capstone Project'}
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    YEAR 4 • CAPSTONE TRACK
                  </span>
              <div className="flex justify-between items-start border-b border-slate-100 pb-2 gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none">{activeProject?.title || 'Advanced Machine Learning Thesis'}</h1>
                  <p className="text-xs text-slate-400 font-semibold mt-1.5">{activeProject?.description || 'A solo research project focused on transformer architectures for low-resource linguistic datasets.'}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100 shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Solo Track
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Progress circle dial & Thesis Metadata */}
              <div className="space-y-6">
                
                {/* Radial progress ring dial */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block text-left">Total Progress</h3>
                  
                  {/* Circle shape progress indicator */}
                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="72" cy="72" r="58" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                      <circle cx="72" cy="72" r="58" stroke="#0c59db" strokeWidth="10" fill="transparent" strokeDasharray="364" strokeDashoffset="127" strokeLinecap="round" />
                    </svg>
                    <div className="text-center space-y-1">
                      <span className="text-2xl font-black text-slate-950 block leading-none">65%</span>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Complete</span>
                    </div>
                  </div>

                  <div className="text-left border-t border-slate-50 pt-4 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">Research Phase</span>
                    <span className="text-[#0c59db]">In Progress</span>
                  </div>
                </div>

                {/* Thesis Metadata table card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Thesis Metadata</h3>
                  
                  <div className="space-y-3 font-semibold text-xs text-slate-700">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-400">Supervisor</span>
                      <span className="text-slate-800 font-bold">{activeProject?.supervisor?.full_name || 'Pending Assignment...'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <span className="text-slate-400">Credits</span>
                      <span className="text-slate-800 font-bold">12 Units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Deadline</span>
                      <span className="text-rose-600 font-bold">May 15, 2024</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Center Column: Academic Milestones Timeline */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-5">Academic Milestones</h3>
                
                <div className="space-y-5 relative pl-5 border-l-2 border-slate-100">
                  {/* Milestone 1 */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-white" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">Proposal Defense</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        Successfully defended initial research scope and methodology.
                      </p>
                      <span className="text-[8px] text-emerald-600 font-black uppercase tracking-wider block mt-1">
                        COMPLETED OCT 12
                      </span>
                    </div>
                  </div>

                  {/* Milestone 2 */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-white" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">Literature Review</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        Comprehensive analysis of 45+ peer-reviewed papers on Transformers.
                      </p>
                      <span className="text-[8px] text-emerald-600 font-black uppercase tracking-wider block mt-1">
                        COMPLETED DEC 05
                      </span>
                    </div>
                  </div>

                  {/* Milestone 3 */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-white" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">Data Preprocessing</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        Cleaning and tokenizing low-resource dialect datasets.
                      </p>
                      <span className="text-[8px] text-blue-600 font-black uppercase tracking-wider block mt-1">
                        IN PROGRESS
                      </span>
                    </div>
                  </div>

                  {/* Milestone 4 */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-white ring-4 ring-white" />
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">Defense Prep</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        Preparing final results and presentation deck for committee.
                      </p>
                      <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider block mt-1">
                        DUE APRIL 20
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Solo Task Checklist */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Solo Task Checklist</h3>
                
                <div className="space-y-3.5">
                  {soloTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-2.5 hover:bg-slate-50 p-0.5 rounded-lg transition-colors">
                      <button 
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          task.completed 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                      >
                        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-xs font-bold text-slate-800 leading-snug ${task.completed ? 'line-through text-slate-400 font-medium' : ''}`}>
                          {task.text}
                        </h4>
                        <p className={`text-[9px] text-slate-400 mt-0.5 ${task.completed ? 'text-slate-400' : ''}`}>
                          {task.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add task inline form */}
                <AnimatePresence>
                  {isAddingTask ? (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddTask}
                      className="pt-3 border-t border-slate-105 space-y-3 overflow-hidden"
                    >
                      <input 
                        type="text" 
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Enter task name..." 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                        autoFocus
                      />
                      <input 
                        type="text" 
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        placeholder="Description (optional)" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => setIsAddingTask(false)}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                        >
                          Save Task
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingTask(true)}
                      className="w-full py-3 bg-white border border-dashed border-slate-200 hover:border-slate-400 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition-colors group cursor-pointer mt-4 uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      Add New Task
                    </button>
                  )}
                </AnimatePresence>
              </div>

            </div>
              </>
            )}
          </motion.div>
        )}

        {/* ================== MODE 3: ADMIN COHORT DASHBOARD (Screenshot 6) ================== */}
        {trackMode === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">Capstone Program Overview &amp; cohort metrics.</p>
            </div>

            {/* Admin Stats row widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Partner Count</span>
                <span className="text-2xl font-black text-slate-950 block">24</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Active Industry Liaisons</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Active Teams</span>
                <span className="text-2xl font-black text-slate-950 block">112</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Under supervision</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Graduating Seniors</span>
                <span className="text-2xl font-black text-slate-950 block">87</span>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">Final Semester Phase</span>
              </div>
            </div>

            {/* Content grid columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column Areas (Progress overview & Activities) */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Team Progress Overview radial ring list */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Team Progress Overview</h3>
                    <button className="text-xs font-bold text-blue-600 hover:underline">View All Teams</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    
                    {/* Ring 1 */}
                    <div className="bg-[#f5f8fc] border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                      {/* Small radial ring SVG */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="18" stroke="#0c59db" strokeWidth="4.5" fill="transparent" strokeDasharray="113" strokeDashoffset="22" strokeLinecap="round" />
                        </svg>
                        <span className="text-[10px] font-black text-slate-900">80%</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Architecture Dept</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Design Phase Complete</p>
                      </div>
                    </div>

                    {/* Ring 2 */}
                    <div className="bg-[#f5f8fc] border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                      {/* Small radial ring SVG */}
                      <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="18" stroke="#e2e8f0" strokeWidth="3" fill="transparent" />
                          <circle cx="24" cy="24" r="18" stroke="#0c59db" strokeWidth="4.5" fill="transparent" strokeDasharray="113" strokeDashoffset="79" strokeLinecap="round" />
                        </svg>
                        <span className="text-[10px] font-black text-slate-900">30%</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Data Science Unit</h4>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Awaiting Documentation</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Recent Activities list */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Recent Activity</h3>
                  
                  <div className="space-y-4 text-xs font-semibold text-slate-700">
                    
                    {/* Item 1 */}
                    <div className="flex gap-4 items-start border-b border-slate-50 pb-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileSignature className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-slate-800 leading-snug">
                          Team Alpha submitted <span className="font-bold">"Midterm Report V2"</span>
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">2 hours ago • Industry Track</span>
                      </div>
                    </div>

                    {/* Item 2 */}
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0f8b5a] flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <p className="text-slate-800 leading-snug">
                          Sarah Jenkins marked <span className="font-bold">"User Interviews"</span> as complete
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold block mt-1">5 hours ago • Capstone Track</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Right Column Areas (At-risk alerts & Deadlines) */}
              <div className="space-y-6">
                
                {/* At risk alerts panel card */}
                <div className="bg-[#fee8e6] border border-[#fdd1cd] rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-[#ffd9d6] pb-3">
                    <AlertTriangle className="w-4.5 h-4.5 text-[#ea382a]" />
                    <h3 className="text-[10px] font-black text-[#ea382a] tracking-wider uppercase block">At-Risk Alerts</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Alert 1 */}
                    <div className="bg-white border border-red-100 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-slate-900">Team Echo-4</h4>
                        <span className="px-1.5 py-0.5 bg-red-100 text-[#ea382a] rounded text-[8px] font-black uppercase tracking-wider">
                          Stagnant
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        No activity recorded for 14 consecutive days. Milestone "Technical Spec" overdue.
                      </p>
                      <button 
                        onClick={() => {
                          setNudgeAlert(true)
                          setTimeout(() => setNudgeAlert(false), 2000)
                        }}
                        className="w-full py-2 bg-white border border-red-200 hover:bg-red-50 text-[#ea382a] rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer text-center"
                      >
                        {nudgeAlert ? 'Nudged!' : 'Nudge Team'}
                      </button>
                    </div>

                    {/* Alert 2 */}
                    <div className="bg-white border border-red-100 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-extrabold text-slate-900">David Chen (Solo)</h4>
                        <span className="px-1.5 py-0.5 bg-red-100 text-[#ea382a] rounded text-[8px] font-black uppercase tracking-wider">
                          Grad Risk
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Missing core documentation for final review. Predicted graduation completion &lt; 40%.
                      </p>
                      <button 
                        onClick={() => {
                          setMeetingAlert(true)
                          setTimeout(() => setMeetingAlert(false), 2000)
                        }}
                        className="w-full py-2 bg-white border border-red-200 hover:bg-red-50 text-[#ea382a] rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer text-center"
                      >
                        {meetingAlert ? 'Meeting Slotted!' : 'Schedule Meeting'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Deadlines timelines card */}
                <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Milestone Deadlines</h3>
                  
                  <div className="space-y-4 relative pl-5 border-l-2 border-slate-100">
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-white" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Phase 1 Submissions</h4>
                        <span className="text-[8px] text-emerald-600 font-black uppercase block mt-0.5">COMPLETED OCT 12</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white ring-4 ring-white" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Interim Peer Review</h4>
                        <span className="text-[8px] text-blue-600 font-black uppercase block mt-0.5">DUE IN 3 DAYS</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}

        {/* ================== MODE 4: PARTNER COORDINATOR DASHBOARD (Screenshot 7) ================== */}
        {trackMode === 'coordinator' && (
          <motion.div
            key="coordinator"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coordinator Dashboard</h1>
              <p className="text-xs text-slate-400 font-semibold mt-1">Manage dual-track academic and industry projects.</p>
            </div>

            {/* Coordinator Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Pending Pairings</span>
                <span className="text-2xl font-black text-slate-950 block">14</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Sponsor Capacity</span>
                <span className="text-2xl font-black text-slate-950 block">82%</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block mb-1">Match Accuracy</span>
                <span className="text-2xl font-black text-slate-950 block">94%</span>
              </div>
            </div>

            {/* Coordinator pairing queue slot list */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Sponsor Pairing Queue</h3>
                <button className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest text-[10px]">Filter</button>
              </div>

              <div className="space-y-4">
                {/* Pairing Item 1 */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 font-black">
                      CA
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">CloudScale AI</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Sponsor: Sarah Jenkins • Project: Distributed Graph Neural Networks
                      </p>
                      <div className="flex gap-1 mt-2">
                        {['AI/ML', 'PYTHON'].map(t => (
                          <span key={t} className="text-[8px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-150">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 self-end sm:self-auto w-full sm:w-auto">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">3 Student Teams Matching</span>
                    <button 
                      onClick={() => {
                        setPairingMtgId('CloudScale AI')
                        setPairingSuccess(true)
                        setTimeout(() => {
                          setPairingSuccess(false)
                          setPairingMtgId(null)
                        }, 1500)
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase transition-colors cursor-pointer w-full sm:w-auto text-center"
                    >
                      {pairingSuccess && pairingMtgId === 'CloudScale AI' ? 'Assigned!' : 'Assign Team'}
                    </button>
                  </div>
                </div>

                {/* Pairing Item 2 */}
                <div className="border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-200 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 font-black">
                      VS
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">VitaHealth Systems</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Sponsor: Marcus Thorne • Project: HIPAA Compliant Patient Portal
                      </p>
                      <div className="flex gap-1 mt-2">
                        {['SECURE', 'REACT'].map(t => (
                          <span key={t} className="text-[8px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-150">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 self-end sm:self-auto w-full sm:w-auto">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider">1 Student Team Matching</span>
                    <button 
                      onClick={() => {
                        setPairingMtgId('VitaHealth Systems')
                        setPairingSuccess(true)
                        setTimeout(() => {
                          setPairingSuccess(false)
                          setPairingMtgId(null)
                        }, 1500)
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase transition-colors cursor-pointer w-full sm:w-auto text-center"
                    >
                      {pairingSuccess && pairingMtgId === 'VitaHealth Systems' ? 'Assigned!' : 'Assign Team'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
}

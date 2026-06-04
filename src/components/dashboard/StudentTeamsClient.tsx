'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrack } from '@/components/providers/TrackProvider'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Mail, 
  MessageSquare, 
  Calendar, 
  ExternalLink, 
  GitBranch, 
  FolderGit, 
  Send,
  Video,
  Clock,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface StudentProfile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  phone?: string
}

interface TeamMember {
  team_id: string
  user_id: string
  profiles: StudentProfile
}

interface Project {
  id: string
  title: string
  description: string
  team_id: string | null
  instructor_id: string | null
  industry_partner_id: string | null
  origin: string
  status: string
  instructor?: { full_name: string; email: string }
  supervisor?: { full_name: string; email: string }
  partner?: { full_name: string; email: string }
}

interface Team {
  id: string
  name: string
  created_at: string
}

export default function StudentTeamsClient() {
  const { trackMode } = useTrack()
  const isCapstone = trackMode === 'thesis' || trackMode === 'advisor' || trackMode === 'supervisor' || trackMode === 'panel'

  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [project, setProject] = useState<Project | null>(null)
  
  // Custom states for interactive collaboration tools
  const [activeTab, setActiveTab] = useState<'roster' | 'chat' | 'scheduler' | 'guidelines'>('roster')
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: '1', sender: 'Chloe Smith', text: "Hey team! Has everyone looked at the project requirements?", time: "10:14 AM" },
    { id: '2', sender: 'Marcus Miller', text: "Yes, I reviewed the backend API specifications. Looks solid.", time: "10:16 AM" }
  ])
  const [newMessage, setNewMessage] = useState('')
  
  const [meetings, setMeetings] = useState<any[]>([
    { id: 'm1', title: 'Sprint Planning Sync', date: 'June 08, 2026', time: '2:00 PM - 3:00 PM', type: 'Virtual (Google Meet)' },
    { id: 'm2', title: 'Weekly Mentor Review', date: 'June 11, 2026', time: '11:00 AM - 12:00 PM', type: 'Office Sync' }
  ])
  const [newMeetingTitle, setNewMeetingTitle] = useState('')
  const [newMeetingDate, setNewMeetingDate] = useState('')
  const [newMeetingTime, setNewMeetingTime] = useState('')

  const [repoUrl, setRepoUrl] = useState('https://github.com/alexcarter/ai-healthcare-dashboard')
  const [slackUrl, setSlackUrl] = useState('https://slack.com/workspace-invite')
  const [docsUrl, setDocsUrl] = useState('https://docs.google.com/folder-shared')
  
  const [successToast, setSuccessToast] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          loadMockData()
          return
        }

        // Fetch team memberships
        const { data: userMemberships } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)

        if (userMemberships && userMemberships.length > 0) {
          const teamId = userMemberships[0].team_id
          
          // Fetch team name
          const { data: teamObj } = await supabase
            .from('teams')
            .select('*')
            .eq('id', teamId)
            .single()

          if (teamObj) {
            setTeam(teamObj)
          }

          // Fetch team members
          const { data: allMembers, error: membersError } = await supabase
            .from('team_members')
            .select('*, profiles:user_id(id, full_name, email, avatar_url)')
            .eq('team_id', teamId)

          if (membersError) {
            console.error("Error loading team members:", membersError)
          }

          if (allMembers) {
            const teammates = allMembers.filter((m: any) => m.user_id !== user.id)
            setMembers(teammates)
          }

          // Fetch project
          const { data: projObj } = await supabase
            .from('projects')
            .select('*, instructor:instructor_id(full_name, email), partner:industry_partner_id(full_name, email)')
            .eq('team_id', teamId)
            .single()

          if (projObj) {
            setProject(projObj)
          }
        }
      } catch (e) {
        console.warn("Real database fetching failed, loading local storage sandbox state instead:", e)
        loadMockData()
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [trackMode])

  const loadMockData = () => {
    if (typeof window !== 'undefined') {
      const storageKey = 'seniorproj_sandbox_db'
      const data = localStorage.getItem(storageKey)
      if (data) {
        try {
          const parsed = JSON.parse(data)
          // Find standard demo student or active student profile
          const activeProfile = parsed.profiles.find((p: any) => p.role === 'student') || parsed.profiles[0]
          
          // Let's find project first
          // Wait, is there a project in mock projects assigned to this student?
          const assignedProj = parsed.projects.find((p: any) => 
            p.origin === 'industry' &&
            (p.student_id === activeProfile?.id || (p.team_members && p.team_members.includes(activeProfile?.id)))
          )

          if (assignedProj) {
            // Build temporary mock team
            setTeam({
              id: 'mock-team-id',
              name: 'Nexus Innovators',
              created_at: assignedProj.created_at
            })

             // Teammates: Let's gather other students from profiles table, excluding ourselves
             const teamProfiles = parsed.profiles.filter((p: any) => 
               p.role === 'student' && p.id !== activeProfile?.id
             )

            const mappedMembers = teamProfiles.map((p: any) => ({
              team_id: 'mock-team-id',
              user_id: p.id,
              profiles: p
            }))

            setMembers(mappedMembers)

            // Setup project details
            const instructor = parsed.profiles.find((p: any) => p.id === assignedProj.instructor_id)
            const partner = parsed.profiles.find((p: any) => p.id === assignedProj.industry_partner_id)
            
            setProject({
              ...assignedProj,
              instructor: instructor ? { full_name: instructor.full_name, email: instructor.email } : undefined,
              partner: partner ? { full_name: partner.full_name, email: partner.email } : undefined
            })
          }
        } catch (jsonErr) {
          console.error("Error parsing sandbox mock db:", jsonErr)
        }
      }
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const msg = {
      id: Date.now().toString(),
      sender: 'Alex Carter (You)',
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setChatMessages([...chatMessages, msg])
    setNewMessage('')

    // Trigger mock automated teammate reply
    setTimeout(() => {
      const replies = [
        "That makes complete sense! Let's divide the next sprint tasks.",
        "Got it, I will update my branch with these changes.",
        "Perfect, let's sync up during our scheduled meeting.",
        "I'm on it. Let's make sure the deliverable is ready before the deadline."
      ]
      const randomReply = replies[Math.floor(Math.random() * replies.length)]
      setChatMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: members.find(m => m.profiles.full_name !== 'Alex Carter')?.profiles.full_name || 'Chloe Smith',
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }, 1500)
  }

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMeetingTitle || !newMeetingDate || !newMeetingTime) return

    const formattedDate = new Date(newMeetingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    const item = {
      id: Date.now().toString(),
      title: newMeetingTitle.trim(),
      date: formattedDate,
      time: newMeetingTime,
      type: 'Virtual (Google Meet)'
    }

    setMeetings([...meetings, item])
    setNewMeetingTitle('')
    setNewMeetingDate('')
    setNewMeetingTime('')
    triggerToast('New sync meeting scheduled with the team!')
  }

  const triggerToast = (msg: string) => {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(''), 4000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-10 h-10 text-indigo-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Team Portal...</span>
        </div>
      </div>
    )
  }

  if (isCapstone) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center shadow-md space-y-6">
          <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-[#a75d24] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">Capstone Academic Track</h3>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              Teams and group collaborations are configured for students on the **Industry Track**. Under the **Capstone Thesis Track**, students execute their projects individually.
            </p>
            <p className="text-xs text-slate-400 font-bold max-w-md mx-auto mt-2">
              If you wish to simulate industry team collaboration, please switch to the **Industry Track** from the header menu switcher.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!team || !project) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-12 text-center shadow-md space-y-6">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Awaiting Team & Project Allocation</h2>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              You haven't been assigned to a team or an industry project yet. Once your course coordinator finalizes your team allocation, your workspace containing group chat, calendar, and teammates directory will activate here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-16 text-slate-800 font-sans relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 bg-indigo-900 border border-indigo-700 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-[2rem] p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Industry Allocated Project
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mt-2">{project.title}</h1>
          <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed max-w-3xl">
            {project.description}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shrink-0 text-center">
          <span className="text-[9px] text-indigo-300 font-black uppercase block tracking-wider">Team Squad</span>
          <span className="text-lg font-black text-white block mt-1">{team.name}</span>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        {[
          { id: 'roster', label: 'Teammates & Leads', icon: <Users className="w-4 h-4" /> },
          { id: 'chat', label: 'Team Portal Chat', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'scheduler', label: 'Meeting Syncs', icon: <Calendar className="w-4 h-4" /> },
          { id: 'guidelines', label: 'Agile Best Practices', icon: <BookOpen className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-700 text-indigo-700 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left main area (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* Tab: Teammates & Leads */}
            {activeTab === 'roster' && (
              <motion.div
                key="roster"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Teammates list */}
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Teammates Roster</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Colleague Profiles</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {members.map((member, idx) => {
                      const initial = member.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'
                      return (
                        <div 
                          key={member.user_id}
                          className="p-5 border border-slate-150 rounded-2xl flex items-center justify-between gap-4 bg-slate-50/20 hover:bg-slate-50 transition-all hover:border-slate-300 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm shadow-inner uppercase">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-800 truncate">{member.profiles?.full_name}</h4>
                              <p className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-wider mt-0.5">
                                Teammate
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <a 
                              href={`mailto:${member.profiles?.email}`} 
                              className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                            <button 
                              onClick={() => {
                                setActiveTab('chat')
                                setNewMessage(`@${member.profiles?.full_name.split(' ')[0]} `)
                              }}
                              className="p-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"
                              title="Direct Chat"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Collaboration Links Section */}
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Collaboration Spaces</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Integration Channels</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Github Repository */}
                    <div className="p-5 border border-slate-150 rounded-2xl flex flex-col justify-between h-40 bg-slate-50/20 hover:border-slate-300 transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <GitBranch className="w-8 h-8 text-slate-800" />
                        <span className="text-[8px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded uppercase border border-slate-200">Active</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800">Github Repository</h4>
                        <input
                          type="text"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          className="w-full text-[10px] font-semibold text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5"
                        />
                      </div>
                      <a 
                        href={repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        Open Repository <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Slack Workspace */}
                    <div className="p-5 border border-slate-150 rounded-2xl flex flex-col justify-between h-40 bg-slate-50/20 hover:border-slate-300 transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <MessageSquare className="w-8 h-8 text-indigo-600" />
                        <span className="text-[8px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded uppercase border border-slate-200">Active</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800">Slack Slack workspace</h4>
                        <input
                          type="text"
                          value={slackUrl}
                          onChange={(e) => setSlackUrl(e.target.value)}
                          className="w-full text-[10px] font-semibold text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5"
                        />
                      </div>
                      <a 
                        href={slackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        Join Slack Workspace <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Shared Folder */}
                    <div className="p-5 border border-slate-150 rounded-2xl flex flex-col justify-between h-40 bg-slate-50/20 hover:border-slate-300 transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <FolderGit className="w-8 h-8 text-amber-500" />
                        <span className="text-[8px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded uppercase border border-slate-200">Active</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-slate-800">Shared Documents</h4>
                        <input
                          type="text"
                          value={docsUrl}
                          onChange={(e) => setDocsUrl(e.target.value)}
                          className="w-full text-[10px] font-semibold text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none py-0.5"
                        />
                      </div>
                      <a 
                        href={docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        View Drive Folder <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab: Team Portal Chat */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm flex flex-col h-[550px]"
              >
                {/* Chat header */}
                <div className="border-b border-slate-100 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Nexus Live Sync Portal</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Simulated Team Room</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Connected
                  </span>
                </div>

                {/* Message list */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                  {chatMessages.map((msg) => {
                    const isSelf = msg.sender.includes('You')
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isSelf ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">{msg.sender}</span>
                          <span className="text-[9px] text-slate-350">{msg.time}</span>
                        </div>
                        <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                          isSelf 
                            ? 'bg-indigo-700 text-white rounded-tr-none' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Message input */}
                <form onSubmit={handleSendMessage} className="flex gap-3 border-t border-slate-100 pt-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to your teammates..."
                    className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Send
                  </button>
                </form>
              </motion.div>
            )}

            {/* Tab: Meeting Syncs */}
            {activeTab === 'scheduler' && (
              <motion.div
                key="scheduler"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                {/* Existing Meetings list */}
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Upcoming Sync Meetings</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Calendar Milestones</p>
                  </div>

                  <div className="space-y-3">
                    {meetings.map((mtg) => (
                      <div 
                        key={mtg.id}
                        className="p-4 border border-slate-150 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/20 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-inner">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800">{mtg.title}</h4>
                            <p className="text-[9px] text-indigo-500 font-extrabold uppercase tracking-wider mt-0.5">
                              {mtg.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{mtg.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{mtg.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Booking Calendar Widget Form */}
                <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Schedule Teammate Sync</h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Booking Workspace</p>
                  </div>

                  <form onSubmit={handleCreateMeeting} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Meeting Title</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Frontend Integration Review"
                        value={newMeetingTitle}
                        onChange={(e) => setNewMeetingTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-650"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Date</label>
                      <input
                        required
                        type="date"
                        value={newMeetingDate}
                        onChange={(e) => setNewMeetingDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-650"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">Time Slot</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. 3:00 PM - 4:00 PM"
                        value={newMeetingTime}
                        onChange={(e) => setNewMeetingTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-650"
                      />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Book Team Sync
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Tab: Agile Best Practices */}
            {activeTab === 'guidelines' && (
              <motion.div
                key="guidelines"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white border border-slate-200/80 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Agile Collaboration guidelines</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Best Practices Guide</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" /> Daily Standups
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Spend 10 minutes at the beginning of each day sync answering three questions: What did I accomplish yesterday? What will I work on today? Are there any blockers in my way?
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" /> Git Flow & Version Control
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Never commit directly to the `main` or `production` branch. Create a feature branch (e.g. `feature/login-ui`), make your changes, and submit a Pull Request. Ensure at least one teammate reviews and approves your code changes before merging.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600" /> Sprint Planning
                    </h4>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      Divide the upcoming deliverables and milestones into small, actionable tasks. Assign tasks to individual teammates during your planning meetings, and review progress on a shared board.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar Details Column (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Supervisor Card */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Academic Supervisor</h3>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs select-none">
                  {project.instructor?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'SI'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">{project.instructor?.full_name || 'Dr. Sarah Johnson'}</span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">{project.instructor?.email || 'instructor@university.edu'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Industry Partner Card */}
          <div className="bg-white border border-slate-200/80 rounded-[2rem] p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Industry Partner</h3>
              <div className="flex items-center gap-3 mt-3">
                <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center font-bold text-white text-xs select-none">
                  {project.partner?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'IP'}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-900 block truncate">{project.partner?.full_name || 'TechCorp Mentorship'}</span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">{project.partner?.email || 'partner@techcorp.com'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white space-y-5 shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-400">Collaboration Index</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-slate-400 font-medium">Sprint Cycle</span>
                <span className="font-bold text-white">Sprint 3 of 5</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2.5">
                <span className="text-slate-400 font-medium">Scheduled Syncs</span>
                <span className="font-bold text-white">{meetings.length} Upcoming</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="font-bold text-emerald-400 uppercase">On Track</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

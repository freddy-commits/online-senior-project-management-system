'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  Users, 
  Activity, 
  Database,
  Lock,
  Globe,
  Settings2,
  AlertTriangle,
  Megaphone,
  Pin,
  Clock,
  Check,
  UserCheck,
  UserX,
  ShieldCheck,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [usersList, setUsersList] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Announcement form state
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPinned, setAnnPinned] = useState(false)
  const [annRole, setAnnRole] = useState<'all' | 'student' | 'instructor' | 'industry'>('all')
  const [publishing, setPublishing] = useState(false)
  const [pubSuccess, setPubSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function initAdmin() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      // Fetch user profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'admin') {
        window.location.href = `/${prof?.role || ''}`
        return
      }
      setProfile(prof)

      // Fetch all users
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*')
      setUsersList(allUsers || [])

      // Fetch announcements
      fetchAnnouncementsList()

      setLoading(false)
    }

    initAdmin()
  }, [])

  async function fetchAnnouncementsList() {
    const { data: anns } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(anns || [])
  }

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitle || !annContent) return

    setPublishing(true)
    const newAnn = {
      title: annTitle,
      content: annContent,
      is_pinned: annPinned,
      target_role: annRole,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert(newAnn)

    setPublishing(false)
    if (!error) {
      setPubSuccess(true)
      setAnnTitle('')
      setAnnContent('')
      setAnnPinned(false)
      setAnnRole('all')
      fetchAnnouncementsList()
      setTimeout(() => setPubSuccess(false), 3000)
    }
  }

  // Admin User Actions (Approving, Suspending, Editing Roles)
  const updateUserRole = async (userId: string, newRole: 'student' | 'instructor' | 'industry' | 'admin') => {
    const { data } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    // Update local state
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const { data } = await supabase
      .from('profiles')
      .update({ status: newStatus }) // Mock client dynamically handles custom keys
      .eq('id', userId)

    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u))
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    { label: 'Total Users', value: usersList.length.toString(), icon: <Users className="w-5 h-5 text-violet-600" /> },
    { label: 'Active Projects', value: '142', icon: <Activity className="w-5 h-5 text-emerald-600" /> },
    { label: 'Storage Used', value: '42.8 GB', icon: <Database className="w-5 h-5 text-indigo-600" /> },
    { label: 'System Health', value: '100%', icon: <ShieldCheck className="w-5 h-5 text-purple-600" /> },
  ]

  return (
    <DashboardLayout role="admin" userName={profile.full_name || 'Administrator'}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              Admin Control Center
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Publish university communications, audit platform security, and manage user portfolios.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl border border-red-200 font-bold text-xs transition-all flex items-center gap-2 tracking-widest uppercase">
              <Lock className="w-4 h-4" />
              Security Audit
            </button>
            <button className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 tracking-widest uppercase">
              <Settings2 className="w-4 h-4" />
              System Config
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900">{stat.value}</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: User Management & University Communications */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* University Communications Panel */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">University Communications</h3>
                  <p className="text-xs text-slate-400 font-medium">Broadcast notices directly to student and supervisor dashboards</p>
                </div>
              </div>

              <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Announcement Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Milestone 2 Deadline Extended"
                      value={annTitle}
                      onChange={e => setAnnTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Target Audience</label>
                    <select
                      value={annRole}
                      onChange={e => setAnnRole(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all font-semibold"
                    >
                      <option value="all">Everyone (All Users)</option>
                      <option value="student">Students Only</option>
                      <option value="instructor">Supervisors &amp; Instructors</option>
                      <option value="industry">Industry Partners Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notice Content</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write detailed announcements, links, or instructions..."
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={e => setAnnPinned(e.target.checked)}
                      className="w-4.5 h-4.5 text-violet-600 bg-slate-50 border-slate-300 rounded focus:ring-violet-500 focus:ring-2"
                    />
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-violet-600" />
                      Pin to top of feed
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={publishing}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20 uppercase tracking-widest"
                  >
                    {publishing ? 'Publishing...' : 'Publish Announcement'}
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <AnimatePresence>
                {pubSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center z-10"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mb-3">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-950 text-lg">Broadcast Published!</h4>
                    <p className="text-slate-400 text-xs mt-1">Students and supervisors will see this announcement instantly.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Portfolio Management Table */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">User Directory</h3>
                  <p className="text-xs text-slate-400 font-medium">Verify system registrations, suspend credentials, or adjust roles</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-xs rounded-full font-bold">
                  {usersList.length} Active Accounts
                </span>
              </div>

              <div className="space-y-3">
                {usersList.map((u) => {
                  const isSuspended = u.status === 'suspended'
                  return (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-slate-700 flex items-center justify-center font-bold border border-slate-200">
                          {u.full_name ? u.full_name[0] : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                            {u.full_name || 'Anonymous User'}
                            {isSuspended && (
                              <span className="px-1.5 py-0.5 bg-red-50 border border-red-100 text-red-600 rounded text-[8px] font-black uppercase tracking-wider">
                                Suspended
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">{u.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end">
                        {/* Role Selector dropdown */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Role:</span>
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="industry">Industry Partner</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>

                        {/* Suspend/Restore button */}
                        <button
                          onClick={() => toggleUserStatus(u.id, u.status || 'active')}
                          className={`p-2 rounded-lg border transition-all ${
                            isSuspended 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                              : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                          }`}
                          title={isSuspended ? 'Activate Account' : 'Suspend Account'}
                        >
                          {isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Right Panel: Recent Broadcasts & System Health */}
          <div className="space-y-8">
            
            {/* Live Announcements Log */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Broadcasts</h3>
              <div className="space-y-4">
                {announcements.length > 0 ? announcements.map((ann) => (
                  <div key={ann.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 relative">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight pr-6">{ann.title}</h4>
                      {ann.is_pinned && <Pin className="w-3.5 h-3.5 text-violet-600 fill-violet-600 shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded text-[8px] font-bold uppercase tracking-wider border border-violet-100">
                        {ann.target_role}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Megaphone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No announcements published yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Server Statistics & Health */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Platform Resource Health</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400 uppercase tracking-widest">CPU Engine</span>
                    <span className="text-slate-900">14% Load</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-violet-600 h-full w-[14%] rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-400 uppercase tracking-widest">Database Sync latency</span>
                    <span className="text-slate-900">0.08ms</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div className="bg-emerald-500 h-full w-[8%] rounded-full" />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <Globe className="w-4.5 h-4.5 text-slate-400" />
                    <span>Global CDN: Operational</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <ShieldCheck className="w-4.5 h-4.5 text-slate-400" />
                    <span>Firewall Integrity: 100% Active</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}

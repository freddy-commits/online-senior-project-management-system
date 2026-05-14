import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  ShieldCheck, 
  Users, 
  Activity, 
  Database,
  Lock,
  Globe,
  Settings2,
  AlertTriangle
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return redirect(`/${profile?.role || ''}`)

  const stats = [
    { label: 'Total Users', value: '1,248', icon: <Users className="w-5 h-5 text-blue-400" /> },
    { label: 'Active Projects', value: '412', icon: <Activity className="w-5 h-5 text-green-400" /> },
    { label: 'Storage Used', value: '85%', icon: <Database className="w-5 h-5 text-indigo-400" /> },
    { label: 'System Alerts', value: '0', icon: <AlertTriangle className="w-5 h-5 text-yellow-400" /> },
  ]

  return (
    <DashboardLayout role="admin" userName={profile.full_name || 'Administrator'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Control Center</h1>
            <p className="text-slate-400">System-wide monitoring, user management, and security settings.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 font-bold text-sm transition-all flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security Audit
            </button>
            <Link href="/admin/projects" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Manage Projects
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Management Quick View */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Recent Signups</h3>
              <button className="text-xs font-bold text-blue-400 hover:underline">View All Users</button>
            </div>
            <div className="space-y-4">
              {[
                { name: 'Alice Smith', email: 'alice@uni.edu', role: 'Student', status: 'active' },
                { name: 'Dr. Robert Fox', email: 'robert.fox@uni.edu', role: 'Instructor', status: 'active' },
                { name: 'TechCorp Solutions', email: 'partner@techcorp.com', role: 'Industry', status: 'pending' },
              ].map((u, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10" />
                    <div>
                      <div className="font-bold text-sm">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{u.role}</div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${u.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {u.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
            <h3 className="text-xl font-bold mb-8">System Health</h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase tracking-widest">CPU Usage</span>
                  <span className="text-white">24%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-400 h-full w-[24%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase tracking-widest">Memory</span>
                  <span className="text-white">6.2 GB</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full w-[62%]" />
                </div>
              </div>
              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-3 text-xs">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">API Latency: 12ms</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-300">Firewall: Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

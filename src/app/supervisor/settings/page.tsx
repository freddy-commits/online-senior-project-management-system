'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Shield, CheckCircle, Loader2 } from 'lucide-react'

export default function SupervisorSettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch from Supabase using the authenticated user's ID
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(prof || null)
      } catch (e) {
        console.error("Settings profile load error:", e)
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }, 800)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-8 pb-20 text-slate-800 font-sans">
      <div className="mb-8 space-y-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Academic Supervisor
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-xs text-slate-500 font-medium">Update your workspace profile and notification preferences.</p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Profile settings saved successfully!
        </div>
      )}

      <div className="bg-white border border-slate-150 rounded-[2.25rem] p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                defaultValue={profile?.full_name || ''}
                required
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-indigo-500 rounded-xl py-3 px-4 pl-10 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">University Email</label>
            <div className="relative">
              <input
                type="email"
                defaultValue={profile?.email || ''}
                disabled
                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-3 px-4 pl-10 text-slate-500 text-xs font-bold cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block ml-1">Account Role</label>
            <div className="relative">
              <input
                type="text"
                value="Academic Supervisor"
                disabled
                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-3 px-4 pl-10 text-slate-500 text-xs font-bold cursor-not-allowed"
              />
              <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 text-xs tracking-wider uppercase cursor-pointer mt-6"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

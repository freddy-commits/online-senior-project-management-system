'use client'

import { useState } from 'react'
import { Bell, Save, ShieldCheck, Loader2 } from 'lucide-react'

export default function NotificationPreferencesSection({ onSave }: { onSave?: (data: any) => Promise<boolean> }) {
  const [prefs, setPrefs] = useState({
    email: true,
    push: false,
    milestones: true,
    team_activity: true,
    documents: false,
    deadlines: true
  })
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggle = (key: keyof typeof prefs) => {
    setPrefs({ ...prefs, [key]: !prefs[key] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    
    // Mock save
    if (onSave) {
      await onSave(prefs)
    } else {
      await new Promise(r => setTimeout(r, 600))
    }
    
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  const ToggleItem = ({ title, desc, flag }: { title: string, desc: string, flag: keyof typeof prefs }) => (
    <div className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
      <div>
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => toggle(flag)}
        className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${prefs[flag] ? 'bg-blue-600' : 'bg-slate-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${prefs[flag] ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  )

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
        <Bell className="w-5 h-5 text-blue-600" />
        Notification Preferences
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Delivery Channels</h3>
          <div className="space-y-2">
            <ToggleItem title="Email Notifications" desc="Receive updates via your registered email address." flag="email" />
            <ToggleItem title="Push Notifications" desc="Receive browser push notifications when active." flag="push" />
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Alert Types</h3>
          <div className="space-y-2">
            <ToggleItem title="Milestone Approvals" desc="Alerts when an instructor approves or rejects a milestone." flag="milestones" />
            <ToggleItem title="Team Chat Activity" desc="Direct messages and @mentions in the team portal." flag="team_activity" />
            <ToggleItem title="Document Reviews" desc="Comments and feedback left on uploaded documents." flag="documents" />
            <ToggleItem title="Upcoming Deadlines" desc="24-hour and 48-hour warnings before milestone submissions are due." flag="deadlines" />
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                Preferences updated successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  )
}

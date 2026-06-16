'use client'

import { useState } from 'react'
import { Link2, Save, ShieldCheck, Loader2, GitBranch, Briefcase, MessageSquare, Globe } from 'lucide-react'

export default function SocialLinksSection({ initialData, onSave }: { initialData?: any, onSave?: (data: any) => Promise<boolean> }) {
  const [links, setLinks] = useState({
    github: initialData?.github || '',
    linkedin: initialData?.linkedin || '',
    portfolio: initialData?.portfolio || '',
    twitter: initialData?.twitter || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    
    if (onSave) {
      await onSave(links)
    } else {
      await new Promise(r => setTimeout(r, 600))
    }
    
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
        <Link2 className="w-5 h-5 text-indigo-600" />
        Social Links
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">GitHub Profile</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={links.github}
                onChange={(e) => setLinks({ ...links, github: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                placeholder="https://github.com/username"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">LinkedIn Profile</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={links.linkedin}
                onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Personal Portfolio</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <Globe className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={links.portfolio}
                onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Twitter / X</label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={links.twitter}
                onChange={(e) => setLinks({ ...links, twitter: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                placeholder="https://twitter.com/username"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                Social links saved successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Links
          </button>
        </div>
      </form>
    </div>
  )
}

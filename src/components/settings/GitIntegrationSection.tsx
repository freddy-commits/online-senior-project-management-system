'use client'

import { useState } from 'react'
import { GitBranch, Webhook, Terminal, Save, ShieldCheck, Loader2 } from 'lucide-react'

export default function GitIntegrationSection({ onSave }: { onSave?: (data: any) => Promise<boolean> }) {
  const [gitProvider, setGitProvider] = useState('github')
  const [repoUrl, setRepoUrl] = useState('https://github.com/alexcarter/ai-healthcare-dashboard')
  const [apiToken, setApiToken] = useState('ghp_************************************')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    
    if (onSave) {
      await onSave({ gitProvider, repoUrl, apiToken })
    } else {
      await new Promise(r => setTimeout(r, 600))
    }
    
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-slate-900">
        <GitBranch className="w-5 h-5 text-indigo-600" />
        Git Repository Integration
      </h2>
      <p className="text-slate-500 text-xs mb-6">Connect your codebase to verify continuous integration builds and repository status updates.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Git Provider</label>
            <select
              value={gitProvider}
              onChange={(e) => setGitProvider(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-bold appearance-none"
            >
              <option value="github" className="bg-white text-slate-900 font-bold">GitHub</option>
              <option value="gitlab" className="bg-white text-slate-900 font-bold">GitLab</option>
              <option value="bitbucket" className="bg-white text-slate-900 font-bold">Bitbucket</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Repository URL</label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Personal Access Token (PAT)</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-mono"
          />
        </div>

        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4">
          <Webhook className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-indigo-800 text-xs uppercase tracking-widest mb-1">Webhook Configuration Guide</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Setup webhooks in your git settings to receive commit messages and CI test scores on milestones inside your senior project dashboard.
            </p>
            <div className="flex items-center gap-2 bg-white/50 p-2.5 rounded-lg border border-indigo-100 text-[10px] font-mono text-slate-600 break-all select-all">
              <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              https://seniorproj.university.edu/api/webhooks/git/9b1deb4d
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                Integration updated!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Integration
          </button>
        </div>
      </form>
    </div>
  )
}

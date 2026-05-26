'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, 
  User, 
  Save, 
  ShieldCheck, 
  Loader2,
  Globe,
  Briefcase
} from 'lucide-react'

export default function PartnerSettingsPage() {
  const [profile, setProfile] = useState<any>({ full_name: '', email: '' })
  const [companyName, setCompanyName] = useState('TechCorp Solutions')
  const [companyWebsite, setCompanyWebsite] = useState('https://techcorp.com')
  const [industryFocus, setIndustryFocus] = useState('Artificial Intelligence & Analytics')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (prof) setProfile(prof)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name })
      .eq('id', user.id)

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Partner Settings</h1>
        <p className="text-slate-600">Manage your company profile details and representative configurations.</p>
      </div>

      <div className="space-y-8">
        
        {/* Representative Info */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
            <User className="w-5 h-5 text-indigo-600" />
            Representative details
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profile.email || ''}
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-500 focus:outline-none cursor-not-allowed text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {success && (
                  <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                    <ShieldCheck className="w-4 h-4" />
                    Profile details updated successfully!
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Rep Profile
              </button>
            </div>
          </form>
        </div>

        {/* Company profile */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-2 text-slate-900">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Company Profile Metadata
          </h2>
          <p className="text-slate-500 text-xs mb-6 font-medium">Update organization directories visible to vetting committees and student teams.</p>

          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Company name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Core Industry Focus</label>
                <input
                  type="text"
                  value={industryFocus}
                  onChange={(e) => setIndustryFocus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Organization Website</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

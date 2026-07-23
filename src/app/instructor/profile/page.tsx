'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, X } from 'lucide-react'
import Link from 'next/link'
import ProfileSection from '@/components/settings/ProfileSection'
import SecuritySection from '@/components/settings/SecuritySection'
import SocialLinksSection from '@/components/settings/SocialLinksSection'

export default function InstructorProfilePage() {
  const [profile, setProfile] = useState<any>(null)
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

  const handleSaveProfile = async (data: any) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: data.full_name,
        phone: data.phone,
        bio: data.bio,
        dob: data.dob,
        gender: data.gender,
        avatar_url: data.avatar_url,
        department: data.department || null
      })
      .eq('id', user.id)

    return !error
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 p-4 md:p-8 relative">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your profile details, social links, and security credentials.</p>
        </div>
        <Link 
          href="/instructor/dashboard" 
          className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center transition-all shadow-sm cursor-pointer shrink-0"
          title="Close Settings & Return to Dashboard"
        >
          <X className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-8">
        <ProfileSection initialProfile={profile} onSave={handleSaveProfile} />
        <SocialLinksSection initialData={profile} />
        <SecuritySection />
      </div>
    </div>
  )
}

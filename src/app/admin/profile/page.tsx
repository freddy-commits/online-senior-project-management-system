'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import ProfileSection from '@/components/settings/ProfileSection'
import SecuritySection from '@/components/settings/SecuritySection'
import SocialLinksSection from '@/components/settings/SocialLinksSection'

export default function AdminProfilePage() {
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
        gender: data.gender
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
    <div className="max-w-4xl mx-auto pb-20 p-4 md:p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Account Settings</h1>
        <p className="text-slate-500">Manage your profile details, social links, and security credentials.</p>
      </div>

      <div className="space-y-8">
        <ProfileSection initialProfile={profile} onSave={handleSaveProfile} />
        <SocialLinksSection initialData={profile} />
        <SecuritySection />
      </div>
    </div>
  )
}

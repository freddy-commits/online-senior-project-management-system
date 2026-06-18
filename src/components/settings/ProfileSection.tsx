'use client'

import { useState, useRef } from 'react'
import { User, Save, ShieldCheck, Loader2, Camera } from 'lucide-react'

export default function ProfileSection({ initialProfile, onSave }: { initialProfile: any, onSave: (data: any) => Promise<boolean> }) {
  const [profile, setProfile] = useState({
    full_name: initialProfile?.full_name || '',
    email: initialProfile?.email || '',
    phone: initialProfile?.phone || '',
    bio: initialProfile?.bio || '',
    dob: initialProfile?.dob || '',
    gender: initialProfile?.gender || 'not_specified',
    avatar_url: initialProfile?.avatar_url || ''
  })
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size must be less than 2MB.')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'avatars')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to upload image.')
      }

      const data = await res.json()
      if (data.success && data.url) {
        setProfile((prev) => ({ ...prev, avatar_url: data.url }))
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload photo.')
    } finally {
      setUploading(false)
    }
  }

  const validate = () => {
    const newErrors: { [key: string]: boolean } = {}
    if (!profile.full_name.trim()) newErrors.full_name = true
    if (!profile.phone.trim()) newErrors.phone = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setSaving(true)
    setSuccess(false)
    
    const ok = await onSave(profile)
    if (ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
        <User className="w-5 h-5 text-indigo-600" />
        Profile Details
      </h2>

      <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
        <div className="relative group shrink-0">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-350 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            ) : profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile photo" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors shadow-md border-2 border-white flex items-center justify-center cursor-pointer active:scale-95"
            title="Upload profile photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <div className="flex-1 space-y-1">
          <h3 className="font-bold text-slate-800">Profile Photo</h3>
          <p className="text-xs text-slate-500">Upload a professional photo for your workspace profile. Max size 2MB.</p>
          {uploadError && <p className="text-red-500 text-xs mt-1 ml-1 font-semibold">{uploadError}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className={`w-full bg-slate-50 border ${errors.full_name ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium`}
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1 ml-1">Full name is required.</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Email Address</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-500 focus:outline-none cursor-not-allowed text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Phone Number <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">+254</span>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={`w-full bg-slate-50 border ${errors.phone ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 pl-14 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium`}
                placeholder="712345678"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">Phone number is required.</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Date of Birth</label>
            <input
              type="date"
              value={profile.dob}
              onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Bio</label>
            <textarea
              maxLength={200}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium min-h-[100px] resize-none"
              placeholder="Tell us about yourself..."
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-slate-400 font-medium">{profile.bio.length}/200</span>
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Gender</label>
            <select
              value={profile.gender}
              onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium appearance-none"
            >
              <option value="not_specified">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                Profile changes saved successfully!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  )
}

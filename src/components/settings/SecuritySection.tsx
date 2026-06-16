'use client'

import { useState } from 'react'
import { ShieldAlert, Key, Save, ShieldCheck, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react'

export default function SecuritySection({ onSave }: { onSave?: (data: any) => Promise<boolean> }) {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({})

  // Calculate rough password strength
  const calculateStrength = (pass: string) => {
    if (!pass) return 0
    let score = 0
    if (pass.length > 8) score += 25
    if (pass.match(/[A-Z]/)) score += 25
    if (pass.match(/[0-9]/)) score += 25
    if (pass.match(/[^A-Za-z0-9]/)) score += 25
    return score
  }

  const strength = calculateStrength(passwords.new)

  const validate = () => {
    const newErrors: { [key: string]: boolean } = {}
    if (passwords.new && !passwords.current) newErrors.current = true
    if (passwords.new !== passwords.confirm) newErrors.confirm = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    setSaving(true)
    setSuccess(false)
    
    // Mock save
    if (onSave) {
      await onSave({ passwords, twoFactor })
    } else {
      await new Promise(r => setTimeout(r, 800))
    }
    
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setPasswords({ current: '', new: '', confirm: '' })
    setSaving(false)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900">
        <Key className="w-5 h-5 text-indigo-600" />
        Password & Security
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className={`w-full bg-slate-50 border ${errors.current ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 pl-4 pr-12 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.current && <p className="text-red-500 text-xs mt-1 ml-1">Current password required to set a new one.</p>}
            </div>
            
            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Login</span>
              <span className="text-sm font-semibold text-slate-800">Today, 09:42 AM (Nairobi, KE)</span>
              <span className="text-xs text-slate-500 mt-1">Chrome on Windows 11</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium mb-3"
              />
              
              {/* Password Strength Bar */}
              <div className="flex gap-1.5 h-1.5 mb-2">
                {[25, 50, 75, 100].map(tier => (
                  <div key={tier} className={`flex-1 rounded-full ${
                    strength >= tier 
                      ? strength > 50 ? 'bg-green-500' : 'bg-amber-400'
                      : 'bg-slate-100'
                  }`} />
                ))}
              </div>
              <p className="text-[10px] text-slate-500 font-medium ml-1">Must be at least 8 characters with numbers and symbols.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Confirm New Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className={`w-full bg-slate-50 border ${errors.confirm ? 'border-red-500' : 'border-slate-200'} rounded-2xl py-3.5 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium`}
              />
              {errors.confirm && <p className="text-red-500 text-xs mt-1 ml-1">Passwords do not match.</p>}
            </div>
          </div>
        </div>

        <div className="py-6 border-y border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication (2FA)</h4>
            <p className="text-xs text-slate-500 mt-1">Add an extra layer of security to your account using an authenticator app.</p>
          </div>
          
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => setTwoFactor(!twoFactor)}
            className={`w-12 h-6 rounded-full p-1 transition-colors ${twoFactor ? 'bg-indigo-600' : 'bg-slate-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="flex items-center gap-4 justify-between pt-2">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                Security settings saved!
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Security
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-red-100">
        <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h4>
        <p className="text-xs text-slate-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
        <button className="px-5 py-2.5 border-2 border-red-100 hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}

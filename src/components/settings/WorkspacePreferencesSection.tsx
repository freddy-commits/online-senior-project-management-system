'use client'

import { useState, useEffect, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations, useLocale } from 'next-intl'
import { setUserLocale } from '@/lib/i18n'
import { Sliders, Save, ShieldCheck, Loader2 } from 'lucide-react'

export default function WorkspacePreferencesSection({ onSave }: { onSave?: (data: any) => Promise<boolean> }) {
  const currentLocale = useLocale()
  const t = useTranslations('Settings')
  const [isPending, startTransition] = useTransition()
  
  const [prefs, setPrefs] = useState({
    language: currentLocale,
    timezone: 'Africa/Nairobi',
    theme: 'light',
    dateFormat: 'MMM DD, YYYY'
  })
  
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    
    if (onSave) {
      await onSave(prefs)
    } else {
      await new Promise(r => setTimeout(r, 500))
    }
    
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setSaving(false)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-sm transition-colors">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
        <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        {t('workspace_preferences')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 ml-1">{t('language')}</label>
            <select
              value={prefs.language}
              disabled={isPending}
              onChange={(e) => {
                const newLocale = e.target.value;
                setPrefs({ ...prefs, language: newLocale });
                startTransition(() => {
                  setUserLocale(newLocale);
                });
              }}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium disabled:opacity-50"
            >
              <option value="en">English (US)</option>
              <option value="fr">Français</option>
              <option value="sw">Swahili</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 ml-1">{t('timezone')}</label>
            <select
              value={prefs.timezone}
              onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
            >
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 ml-1">{t('theme')}</label>
            <div className="flex gap-4">
              {mounted ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-3.5 px-4 rounded-2xl border text-sm font-bold transition-colors ${theme === 'light' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                  >
                    {t('light')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-3.5 px-4 rounded-2xl border text-sm font-bold transition-colors ${theme === 'dark' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                  >
                    {t('dark')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex-1 py-3.5 px-4 rounded-2xl border text-sm font-bold transition-colors ${theme === 'system' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-600 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                  >
                    {t('system')}
                  </button>
                </>
              ) : (
                <div className="flex-1 py-3.5 px-4 rounded-2xl border bg-slate-50 border-slate-200 h-12 animate-pulse" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 ml-1">{t('date_format')}</label>
            <select
              value={prefs.dateFormat}
              onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-medium"
            >
              <option value="MMM DD, YYYY">Oct 12, 2026 (MMM DD, YYYY)</option>
              <option value="DD/MM/YYYY">12/10/2026 (DD/MM/YYYY)</option>
              <option value="MM/DD/YYYY">10/12/2026 (MM/DD/YYYY)</option>
              <option value="YYYY-MM-DD">2026-10-12 (YYYY-MM-DD)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {success && (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4" />
                {t('success')}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t('save_settings')}
          </button>
        </div>
      </form>
    </div>
  )
}

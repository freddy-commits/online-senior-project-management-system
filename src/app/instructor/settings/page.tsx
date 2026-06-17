'use client'

import NotificationPreferencesSection from '@/components/settings/NotificationPreferencesSection'
import WorkspacePreferencesSection from '@/components/settings/WorkspacePreferencesSection'

export default function InstructorSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto pb-20 p-4 md:p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">System Settings</h1>
        <p className="text-slate-500">Configure workspace preferences and notification alerts.</p>
      </div>

      <div className="space-y-8">
        <WorkspacePreferencesSection />
        <NotificationPreferencesSection />
      </div>
    </div>
  )
}

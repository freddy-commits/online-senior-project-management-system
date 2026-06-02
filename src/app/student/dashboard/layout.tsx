import ContextualTabs from '@/components/navigation/ContextualTabs'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { label: 'Overview', href: '/student/dashboard/overview' },
    { label: 'Action Items', href: '/student/dashboard/action-items' },
    { label: 'Notifications', href: '/student/dashboard/notifications' }
  ]

  return (
    <div className="flex flex-col h-full relative">
      <ContextualTabs tabs={tabs} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

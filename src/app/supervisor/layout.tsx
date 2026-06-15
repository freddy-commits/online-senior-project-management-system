import MasterSidebar from '@/components/layout/MasterSidebar'
import MasterHeader from '@/components/layout/MasterHeader'
import { TrackProvider } from '@/components/providers/TrackProvider'

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackProvider>
      <div className="h-screen max-h-screen bg-[#f8fafc] flex overflow-hidden font-sans text-slate-900">
        <MasterSidebar role="supervisor" />
        <main className="flex-1 flex flex-col h-screen max-h-screen overflow-hidden relative bg-[#f8fafc]">
          <MasterHeader role="supervisor" />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </TrackProvider>
  )
}

import MasterSidebar from '@/components/layout/MasterSidebar'
import MasterHeader from '@/components/layout/MasterHeader'
import { TrackProvider } from '@/components/providers/TrackProvider'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackProvider>
      <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden font-sans text-slate-900">
        <MasterSidebar role="student" />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative bg-[#f8fafc]">
          <MasterHeader role="student" />
          {children}
        </main>
      </div>
    </TrackProvider>
  )
}

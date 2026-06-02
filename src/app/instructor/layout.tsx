import MasterSidebar from '@/components/layout/MasterSidebar'
import MasterHeader from '@/components/layout/MasterHeader'
import { TrackProvider } from '@/components/providers/TrackProvider'
import SandboxToolbar from '@/components/dashboard/SandboxToolbar'

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <TrackProvider>
      <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden font-sans text-slate-900">
        <MasterSidebar role="instructor" />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative bg-[#f8fafc]">
          <MasterHeader role="instructor" />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
        <SandboxToolbar />
      </div>
    </TrackProvider>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ActionItemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch student's project
  const { data: project } = await supabase
    .from('projects')
    .select('*, deliverables(*), instructor:instructor_id(full_name)')
    .eq('student_id', user.id)
    .maybeSingle()

  const items: Array<{
    id: string
    title: string
    subtitle: string
    badge: string
    badgeColor: string
    link: string
    icon: any
  }> = []

  if (!project) {
    items.push({
      id: 'submit-proposal',
      title: 'Submit Senior Project Proposal',
      subtitle: 'Upload your proposal PDF or enter topic description to begin vetting.',
      badge: 'ACTION REQUIRED',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/student/milestones',
      icon: ClipboardList
    })
  } else {
    if (project.status === 'pending') {
      items.push({
        id: 'vetting-pending',
        title: 'Proposal Vetting in Progress',
        subtitle: 'Your proposal has been submitted and is currently being reviewed by the department instructor.',
        badge: 'UNDER REVIEW',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        link: '/student/milestones',
        icon: Clock
      })
    } else if (project.status === 'rejected') {
      items.push({
        id: 'proposal-rejected',
        title: 'Revise & Resubmit Project Proposal',
        subtitle: 'Your previous proposal was rejected by the instructor. Please upload an updated proposal.',
        badge: 'REVISION NEEDED',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        link: '/student/milestones',
        icon: AlertTriangle
      })
    } else if (project.status === 'approved' && !project.instructor_id) {
      items.push({
        id: 'awaiting-supervisor',
        title: 'Awaiting Administrator Supervisor Assignment',
        subtitle: 'Your proposal was approved! The Administrator will assign your academic supervisor shorty.',
        badge: 'PENDING ASSIGNMENT',
        badgeColor: 'bg-[#fdf5f0] text-[#a75d24] border-[#a75d24]/20',
        link: '/student/milestones',
        icon: UserCheck
      })
    }

    // Add instructor-created deliverables as action items
    if (project.deliverables && project.deliverables.length > 0) {
      project.deliverables.forEach((d: any) => {
        const isDone = d.status === 'graded' || d.status === 'completed'
        const isSubmitted = d.status === 'submitted'
        const isOverdue = !isDone && !isSubmitted && d.due_date && new Date(d.due_date).getTime() < Date.now()

        let badge = 'PENDING'
        let badgeColor = 'bg-amber-50 text-amber-700 border-amber-200'

        if (isDone) {
          badge = 'GRADED'
          badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
        } else if (isSubmitted) {
          badge = 'SUBMITTED'
          badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'
        } else if (isOverdue) {
          badge = 'OVERDUE'
          badgeColor = 'bg-rose-50 text-rose-700 border-rose-200'
        }

        items.push({
          id: d.id,
          title: d.title,
          subtitle: d.due_date 
            ? `Due: ${new Date(d.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} • Instructor Milestone`
            : 'Instructor Created Milestone',
          badge,
          badgeColor,
          link: '/student/milestones',
          icon: FileSpreadsheet
        })
      })
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 min-h-[50vh] shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Action Items</h2>
          <p className="text-xs text-slate-500 font-semibold">Track live deliverables created by your department instructor and required workflow actions.</p>
        </div>
        
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-xs">
              No pending action items right now. Check back when new department milestones are created!
            </div>
          ) : (
            items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  href={item.link}
                  className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 hover:border-blue-500 hover:bg-blue-50/20 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 leading-tight group-hover:text-blue-600 transition-colors truncate">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

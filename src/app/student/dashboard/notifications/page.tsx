import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch real notifications for this user from database
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 min-h-[50vh] shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-1">Notifications</h2>
          <p className="text-xs text-slate-500 font-semibold">Recent activity, supervisor feedback, and system alerts.</p>
        </div>
        
        <div className="space-y-3">
          {!notifications || notifications.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
              <div className="w-12 h-12 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">No Notifications Yet</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5 max-w-sm mx-auto">
                  You have no new alerts. Real notifications will appear here when your instructor, supervisor, or admin sends feedback or updates your status.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  notif.is_read 
                    ? 'bg-white border-slate-200' 
                    : 'bg-blue-50/30 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.is_read ? 'bg-slate-300' : 'bg-blue-600'}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 leading-tight">
                      {notif.title || 'System Notification'}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                      {notif.message || notif.content || ''}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-2">
                      {new Date(notif.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

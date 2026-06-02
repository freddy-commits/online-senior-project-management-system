export default function NotificationsPage() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 min-h-[50vh] shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Notifications</h2>
        <p className="text-sm text-slate-500 font-semibold mb-6">Recent activity and system alerts.</p>
        
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/50 rounded-xl flex items-start gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-slate-900">Your Advisor left a comment</h4>
              <p className="text-xs text-slate-600 mt-1">"Great progress on the architecture diagram. Please review my notes on the database schema."</p>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-2">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

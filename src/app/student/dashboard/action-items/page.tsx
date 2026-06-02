export default function ActionItemsPage() {
  return (
    <div className="p-8">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 min-h-[50vh] shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-2">Action Items</h2>
        <p className="text-sm text-slate-500 font-semibold mb-6">Track and manage your upcoming tasks and deliverables.</p>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border border-slate-200 rounded-xl flex items-center gap-4 hover:border-indigo-500 transition-colors cursor-pointer">
              <div className="w-5 h-5 rounded-md border-2 border-slate-300 shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900">Submit Project Proposal Draft</h4>
                <p className="text-xs text-slate-500 mt-1">Due in 2 days • Capstone Requirement</p>
              </div>
              <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                Pending
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

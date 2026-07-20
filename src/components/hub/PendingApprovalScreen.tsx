'use client'

import { Clock, RefreshCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PendingApprovalScreen({ requestedRole, department }: { requestedRole: string, department: string | null }) {
  const router = useRouter()

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100 text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
        <Clock className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Pending Approval</h1>
      <p className="text-slate-600">
        Your account is currently under review by an administrator. You requested the <strong className="capitalize">{requestedRole.replace('_', ' ')}</strong> role.
        {department && <span> Department: <strong>{department}</strong>.</span>}
      </p>
      <div className="pt-4">
        <button
          onClick={() => {
            router.refresh()
          }}
          className="inline-flex items-center justify-center space-x-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          <span>Check Status</span>
        </button>
      </div>
    </div>
  )
}

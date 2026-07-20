'use client'

import { XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RejectedScreen({ requestedRole, department, reviewerNotes }: { requestedRole: string, department: string | null, reviewerNotes: string | null }) {
  const router = useRouter()

  return (
    <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
        <XCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800">Request Declined</h1>
      <p className="text-slate-600">
        Your request for the <strong className="capitalize">{requestedRole.replace('_', ' ')}</strong> role was declined.
      </p>
      {reviewerNotes && (
        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 text-left border border-slate-200">
          <strong>Note from reviewer:</strong>
          <p className="mt-1">{reviewerNotes}</p>
        </div>
      )}
      <div className="pt-4">
        <button
          onClick={() => {
            router.push('/student/dashboard')
          }}
          className="inline-flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg hover:bg-slate-200 transition-colors w-full"
        >
          <span>Continue to Student Dashboard</span>
        </button>
      </div>
    </div>
  )
}

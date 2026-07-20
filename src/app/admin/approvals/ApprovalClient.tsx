'use client';

import { useState } from 'react';
import { approveRequest, rejectRequest } from './actions';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

type Request = {
  id: string;
  user_id: string;
  requested_role: string;
  department: string | null;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    university_id: string | null;
  } | any;
};

export default function ApprovalClient({ initialRequests }: { initialRequests: Request[] }) {
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleApprove = async (id: string, userId: string, requestedRole: string) => {
    setProcessingId(id);
    setMessage(null);
    try {
      await approveRequest(id, userId, requestedRole);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setMessage({ text: `Request approved. User is now ${requestedRole}.`, type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to approve request.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setMessage(null);
    try {
      await rejectRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setMessage({ text: 'The role request has been rejected.', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to reject request.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500 opacity-20" />
        <p className="font-semibold">No pending requests at this time.</p>
        <p className="text-sm mt-1">All caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold mb-4 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' 
            : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {requests.map((request) => (
        <div
          key={request.id}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 dark:text-white">
                {(Array.isArray(request.profiles) ? request.profiles[0]?.full_name : request.profiles?.full_name) || 'Unknown User'}
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                {request.requested_role}
              </span>
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:gap-4">
              <span>{Array.isArray(request.profiles) ? request.profiles[0]?.email : request.profiles?.email}</span>
              {(Array.isArray(request.profiles) ? request.profiles[0]?.university_id : request.profiles?.university_id) && (
                <span>ID: {Array.isArray(request.profiles) ? request.profiles[0]?.university_id : request.profiles?.university_id}</span>
              )}
              {request.department && <span>Dept: {request.department}</span>}
            </div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Requested: {new Date(request.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              disabled={processingId === request.id}
              onClick={() => handleApprove(request.id, request.user_id, request.requested_role)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {processingId === request.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve
            </button>
            <button
              disabled={processingId === request.id}
              onClick={() => handleReject(request.id)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {processingId === request.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

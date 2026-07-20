import { getPendingRequests } from './actions';
import ApprovalClient from './ApprovalClient';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Role Approvals | Admin',
};

export default async function ApprovalsPage() {
  const requests = await getPendingRequests();

  return (
    <div className="p-4 md:p-8 pb-20 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-100 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Role Approvals
            </h1>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
              Review and approve requests for elevated roles. You have {requests?.length || 0} pending request(s).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Pending Requests</h2>
        </div>
        <ApprovalClient initialRequests={(requests as any) || []} />

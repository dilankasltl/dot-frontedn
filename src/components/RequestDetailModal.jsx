import React from 'react';
import { X, Calendar, Clock, Building, User, CheckCircle, XCircle, AlertCircle, Trash2, Edit3 } from 'lucide-react';

export default function RequestDetailModal({ request, onClose, onDelete, onEdit }) {
  if (!request) return null;

  const canEdit = request.status === 'PENDING_L1' && !!onEdit;
  const canDelete = !!onDelete;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Fully Authorized (Mr. Vinod)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      case 'PENDING_FINAL':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Final Approval (Mr. Vinod)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending ({request.l1Approver?.name || 'HOD'})
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg text-slate-900 dark:text-white">{request.reqNumber}</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                {request.department}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Submitted by {request.requesterName} ({request.requesterUsername})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
            {getStatusBadge(request.status)}
          </div>

          {/* Quick Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> OT Date
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">{request.date}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Shift
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">{request.shift}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">DOT Hours</span>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">{request.hours} Hours</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Employees</span>
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-1">{request.employeeCount || request.employees?.length} Persons</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Reason / Justification</h4>
            <p className="text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed">
              {request.reason || 'No specific notes entered.'}
            </p>
          </div>

          {/* Employee Master List Table */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Assigned Double OT Employees ({request.employees?.length || 0})
            </h4>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2 px-3 w-12">#</th>
                    <th className="py-2 px-3 w-28">EPF Number</th>
                    <th className="py-2 px-3">Full Name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {request.employees?.map((emp, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-slate-400 font-mono">{index + 1}</td>
                      <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">EPF {emp.epfNo}</td>
                      <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{emp.fullName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Workflow Audit Trail */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Approval Workflow Audit</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-white">1. Level 1 ({request.l1Approver?.name})</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    request.l1Approver?.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    request.l1Approver?.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {request.l1Approver?.status || 'PENDING'}
                  </span>
                </div>
                {request.l1Approver?.actionAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Date: {new Date(request.l1Approver.actionAt).toLocaleString()}</p>
                )}
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">{request.l1Approver?.remarks || 'Pending decision'}</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800 dark:text-white">2. Final (Authority: Mr. Vinod)</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    request.finalApprover?.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    request.finalApprover?.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {request.finalApprover?.status || 'PENDING'}
                  </span>
                </div>
                {request.finalApprover?.actionAt && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Date: {new Date(request.finalApprover.actionAt).toLocaleString()}</p>
                )}
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 italic">{request.finalApprover?.remarks || 'Waiting for Level 1 approval'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(request);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Request
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  if (confirm('Remove this request from your view? (It will not affect other users).')) {
                    onDelete(request._id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove from My List
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

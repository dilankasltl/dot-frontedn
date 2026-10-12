import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, RefreshCw, BarChart3, Users, Clock, Trash2, Calendar } from 'lucide-react';
import RequestDetailModal from './RequestDetailModal';
import AnalyticsCharts from './AnalyticsCharts';
import { api } from '../api';

export default function RohithaView({ user }) {
  const [activeTab, setActiveTab] = useState('hr_approvals'); // 'hr_approvals' | 'company_monitor' | 'charts'
  const [actionable, setActionable] = useState([]);
  const [allPending, setAllPending] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequestForModal, setSelectedRequestForModal] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [message, setMessage] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [monitorDateMode, setMonitorDateMode] = useState('all_pending'); // 'all_pending' | 'today' | 'all'

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests(user.username);
      setActionable(data.actionable || []);
      setAllPending(data.allPending || []);
      setAllRequests(data.requests || []);
    } catch (err) {
      console.error('Failed to load Rohitha data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.username]);

  const handleHrAction = async (id, action) => {
    setActionInProgress(true);
    setMessage(null);
    try {
      await api.l1Action(id, action, user.username, 'Approved by Mr. Rohitha (HR Approver)');
      setMessage({
        type: 'success',
        text: `HR Double OT Request ${action === 'APPROVE' ? 'recommended and forwarded to Mr. Vinod for Final Approval' : 'rejected'}.`
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteRequest(id, user.username);
      setMessage({ type: 'success', text: 'Request removed from your view.' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove request.' });
    }
  };

  const getFilteredMonitoringList = () => {
    if (monitorDateMode === 'today') {
      return allPending.filter((r) => r.date === todayStr);
    }
    return allPending;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">R</span>
            Mr. Rohitha — Executive HR Portal & Company Monitor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            HR Level 1 Approvals (Mr. Sanka) • Plant-wide Double OT Live Monitoring • Operations Analytics
          </p>
        </div>

        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 w-full sm:w-auto inline-flex shadow-inner">
        <button
          onClick={() => setActiveTab('hr_approvals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'hr_approvals'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span>HR Approvals (Mr. Sanka)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            actionable.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
          }`}>
            {actionable.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('company_monitor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'company_monitor'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Live Pending (Plant-Wide)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
            {allPending.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'charts'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Department Bar Chart & Analytics</span>
        </button>
      </div>

      {/* TAB 1: HR APPROVALS */}
      {activeTab === 'hr_approvals' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Pending HR Double OT Requests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitted by Mr. Sanka (HR) awaiting Level 1 approval
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading HR requests...</div>
          ) : actionable.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              ✓ No pending HR requests at the moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Req No</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">DOT Hours</th>
                    <th className="py-3 px-4">Headcount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {actionable.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{req.requesterName} (HR)</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.shift}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{req.hours}h</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedRequestForModal(req)}
                          className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 underline decoration-slate-300 cursor-pointer"
                        >
                          {req.employeeCount || req.employees?.length} Persons
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedRequestForModal(req)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={actionInProgress}
                            onClick={() => handleHrAction(req._id, 'APPROVE')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve (To Vinod)
                          </button>
                          <button
                            disabled={actionInProgress}
                            onClick={() => handleHrAction(req._id, 'REJECT')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY-WIDE LIVE PENDING MONITOR */}
      {activeTab === 'company_monitor' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">View Filter:</span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  onClick={() => setMonitorDateMode('all_pending')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    monitorDateMode === 'all_pending' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Pending Live ({allPending.length})
                </button>
                <button
                  onClick={() => setMonitorDateMode('today')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    monitorDateMode === 'today' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pending for Today ({todayStr})
                </button>
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Company-wide authorization monitor (Read-Only)
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading pending requests...</div>
            ) : getFilteredMonitoringList().length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No requests currently pending across the company.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Req No</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Requester</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Shift</th>
                      <th className="py-3 px-4">Hours</th>
                      <th className="py-3 px-4">Headcount</th>
                      <th className="py-3 px-4">Approval Stage</th>
                      <th className="py-3 px-4 text-right">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {getFilteredMonitoringList().map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {req.department}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{req.requesterName}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.date}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.shift}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{req.hours}h</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedRequestForModal(req)}
                            className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 underline decoration-slate-300 cursor-pointer"
                          >
                            {req.employeeCount || req.employees?.length} Persons
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          {req.status === 'PENDING_L1' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Pending ({req.l1Approver?.name})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Pending (Mr. Vinod)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedRequestForModal(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHARTS & ANALYTICS */}
      {activeTab === 'charts' && (
        <AnalyticsCharts title="Plant Operations — Double OT Bar Chart & Analytics" />
      )}

      {selectedRequestForModal && (
        <RequestDetailModal
          request={selectedRequestForModal}
          onClose={() => setSelectedRequestForModal(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

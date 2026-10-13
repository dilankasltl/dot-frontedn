import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Eye, RefreshCw, CheckCheck, XSquare, Building2, AlertCircle, BarChart3, Trash2, Calendar, FileSpreadsheet, Bell } from 'lucide-react';
import RequestDetailModal from './RequestDetailModal';
import AnalyticsCharts from './AnalyticsCharts';
import { api } from '../api';
import { playNotificationSound } from '../utils/sound';

export default function ApproverL1View({ user }) {
  const [requests, setRequests] = useState([]);
  const [actionable, setActionable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history' | 'charts'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedRequestForModal, setSelectedRequestForModal] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [message, setMessage] = useState(null);

  const prevActionableCountRef = useRef(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [historyDateMode, setHistoryDateMode] = useState('today'); // 'today' | 'date' | 'all'
  const [historyDate, setHistoryDate] = useState(todayStr);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const filters = {};
      if (historyDateMode === 'today') {
        filters.date = todayStr;
      } else if (historyDateMode === 'date' && historyDate) {
        filters.date = historyDate;
      }

      const data = await api.getRequests(user.username, filters);
      setRequests(data.requests || []);
      const newActionable = data.actionable || [];

      // Check if new pending requests arrived
      if (prevActionableCountRef.current !== null && newActionable.length > prevActionableCountRef.current) {
        playNotificationSound();
        setMessage({
          type: 'info',
          text: `🔔 New Double OT approval request received (${newActionable.length} pending)!`
        });
      }
      prevActionableCountRef.current = newActionable.length;
      setActionable(newActionable);
      if (!isSilent) setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load L1 requests', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Live polling every 10 seconds for real-time notification
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [user.username, historyDateMode, historyDate]);

  const handleSingleAction = async (id, action) => {
    setActionInProgress(true);
    setMessage(null);
    try {
      await api.l1Action(id, action, user.username, `Recommended by ${user.name}`);
      setMessage({
        type: 'success',
        text: `Request successfully ${action === 'APPROVE' ? 'recommended and routed to Mr. Vinod for Final Approval' : 'rejected'}.`
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBatchAction = async (action) => {
    if (!selectedIds.length) return;
    setActionInProgress(true);
    setMessage(null);
    try {
      const res = await api.batchAction(selectedIds, action, user.username, 'l1');
      setMessage({
        type: 'success',
        text: `Successfully ${action === 'APPROVE' ? 'recommended' : 'rejected'} ${res.updatedCount} request(s). Routed to Mr. Vinod!`
      });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Batch action failed' });
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

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = (items) => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i._id));
    }
  };

  const filterItems = (list) => {
    if (selectedDeptFilter === 'ALL') return list;
    return list.filter((r) => r.department === selectedDeptFilter);
  };

  const pendingList = filterItems(actionable);
  const historyList = filterItems(requests.filter((r) => r.status !== 'PENDING_L1'));

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            HOD Level 1 Review & Recommendation — {user.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assigned Departments: {' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {user.approvedDepartments?.join(', ') || user.department}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => {
              playNotificationSound();
              setMessage({ type: 'info', text: '🔔 Chime notification test sounded successfully!' });
            }}
            title="Test alert notification chime"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" /> Test Sound
          </button>
          <button
            onClick={() => fetchData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh List
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : message.type === 'info'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Tabs and Department Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Live Pending Queue</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              actionable.length > 0 ? 'bg-amber-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
            }`}>
              {actionable.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Processed History ({requests.length - actionable.length})
          </button>
          <button
            onClick={() => setActiveTab('epf_summary')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'epf_summary'
                ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
            <span>EPF Number-Wise Table</span>
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'charts'
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
            <span>Department Charts</span>
          </button>
        </div>

        {/* Multi-department filter */}
        {user.approvedDepartments?.length > 1 && activeTab !== 'charts' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Department:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
            >
              <option value="ALL">All Departments ({user.approvedDepartments.length})</option>
              {user.approvedDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* PENDING TABLE */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {/* Batch Actions Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-blue-50/90 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                {selectedIds.length} request(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionInProgress}
                  onClick={() => handleBatchAction('APPROVE')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Recommend to Mr. Vinod
                </button>
                <button
                  type="button"
                  disabled={actionInProgress}
                  onClick={() => handleBatchAction('REJECT')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  <XSquare className="w-3.5 h-3.5" /> Reject Selected
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading pending requests...</div>
          ) : pendingList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              ✓ All caught up! No requests waiting for your Level 1 recommendation right now.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === pendingList.length && pendingList.length > 0}
                        onChange={() => toggleSelectAll(pendingList)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Req No</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">Hours</th>
                    <th className="py-3 px-4">Headcount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {pendingList.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req._id)}
                          onChange={() => toggleSelect(req._id)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
                            onClick={() => handleSingleAction(req._id, 'APPROVE')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Recommend (To Vinod)
                          </button>
                          <button
                            disabled={actionInProgress}
                            onClick={() => handleSingleAction(req._id, 'REJECT')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this request? Neither HOD nor Mr. Vinod will see it.')) {
                                handleDelete(req._id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* HISTORY TABLE WITH LIVE DAY FILTER */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Date View:</span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  onClick={() => setHistoryDateMode('today')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    historyDateMode === 'today' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Live Today ({todayStr})
                </button>
                <button
                  onClick={() => setHistoryDateMode('date')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    historyDateMode === 'date' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pick Specific Date
                </button>
                <button
                  onClick={() => setHistoryDateMode('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    historyDateMode === 'all' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All History
                </button>
              </div>

              {historyDateMode === 'date' && (
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Req No</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">Headcount</th>
                    <th className="py-3 px-4">Workflow Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {historyList.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{req.department}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{req.requesterName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.shift}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{req.employeeCount} Persons</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          req.status === 'PENDING_FINAL' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {req.status === 'PENDING_FINAL' ? 'With Mr. Vinod (Final Approval)' : req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedRequestForModal(req)}
                          className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EPF NUMBER-WISE TABLE */}
      {activeTab === 'epf_summary' && (
        <AnalyticsCharts
          allowedDepartments={user.approvedDepartments}
          title={`${user.name} — Department EPF Number-Wise Breakdown`}
          defaultSubTab="epf"
        />
      )}

      {/* TAB 4: HOD DEPARTMENT CHARTS */}
      {activeTab === 'charts' && (
        <AnalyticsCharts
          allowedDepartments={user.approvedDepartments}
          title={`${user.name} — Department Analytics & Headcount Charts`}
          defaultSubTab="charts"
        />
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

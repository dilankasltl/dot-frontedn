import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCheck, XSquare, Eye, RefreshCw, BarChart3, ListFilter, CheckCircle2, XCircle, Search, Clock, Trash2, FileSpreadsheet } from 'lucide-react';
import RequestDetailModal from './RequestDetailModal';
import AnalyticsCharts from './AnalyticsCharts';
import { api } from '../api';

const DEPARTMENTS = [
  'ALL',
  'Production',
  'WIP',
  'RIM',
  'RMS',
  'FGS',
  'LAB',
  'Quality',
  'HR',
  'Finance',
  'ENGINEERING',
  'Mixing/Bandroom'
];

export default function VinodView({ user }) {
  const [activeTab, setActiveTab] = useState('pending_final'); // 'pending_final' | 'charts' | 'all_archive'
  const [requests, setRequests] = useState([]);
  const [actionable, setActionable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRequestForModal, setSelectedRequestForModal] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [message, setMessage] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [archiveDateMode, setArchiveDateMode] = useState('today'); // 'today' | 'date' | 'all'
  const [archiveDate, setArchiveDate] = useState(todayStr);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (archiveDateMode === 'today') {
        filters.date = todayStr;
      } else if (archiveDateMode === 'date' && archiveDate) {
        filters.date = archiveDate;
      }

      const data = await api.getRequests(user.username, filters);
      setRequests(data.requests || []);
      setActionable(data.actionable || []);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load final approval requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.username, archiveDateMode, archiveDate]);

  const handleSingleAction = async (id, action) => {
    setActionInProgress(true);
    setMessage(null);
    try {
      await api.finalAction(id, action, user.username, 'Final Authorization granted by Mr. Vinod');
      setMessage({
        type: 'success',
        text: `Double OT Request successfully ${action === 'APPROVE' ? 'Authorized and Approved' : 'Rejected'}.`
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
      const res = await api.batchAction(selectedIds, action, user.username, 'final');
      setMessage({
        type: 'success',
        text: `Successfully ${action === 'APPROVE' ? 'Authorized' : 'Rejected'} ${res.updatedCount} Double OT request(s)!`
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

  const getStatusBadgeVinod = (req) => {
    if (req.status === 'APPROVED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          ✓ Approved
        </span>
      );
    }
    if (req.status === 'REJECTED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          ✕ Rejected
        </span>
      );
    }
    if (req.status === 'PENDING_FINAL') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 animate-pulse">
          ⏳ Awaiting You (Final)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
        ⏳ Pending ({req.l1Approver?.name || 'HOD'})
      </span>
    );
  };

  // Filter actionable by dept & search
  const filteredActionable = actionable.filter((req) => {
    const matchDept = selectedDept === 'ALL' || req.department === selectedDept;
    const matchSearch =
      !searchFilter ||
      req.reqNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.department.toLowerCase().includes(searchFilter.toLowerCase());
    return matchDept && matchSearch;
  });

  // Filter all requests archive
  const filteredArchive = requests.filter((req) => {
    const matchDept = selectedDept === 'ALL' || req.department === selectedDept;
    const matchSearch =
      !searchFilter ||
      req.reqNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.department.toLowerCase().includes(searchFilter.toLowerCase());
    return matchDept && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-black">
              <ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-400" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Executive Final Approval Portal — Mr. Vinod
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Plant-wide Double OT Final Authorization • Cross-Department Audit • Executive Analytics
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

      {/* Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('pending_final')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pending_final'
                ? 'bg-white dark:bg-slate-700 text-purple-800 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Awaiting Final Approval</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              actionable.length > 0 ? 'bg-purple-600 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
            }`}>
              {actionable.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('epf_summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'epf_summary'
                ? 'bg-white dark:bg-slate-700 text-purple-800 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
            <span>EPF Number-Wise Table</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-white dark:bg-slate-700 text-purple-800 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>Department Bar Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('all_archive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all_archive'
                ? 'bg-white dark:bg-slate-700 text-purple-800 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>All Requests Archive ({requests.length})</span>
          </button>
        </div>
      </div>

      {/* Department Filter Pills (RMS, PRODUCTION, WIP, etc.) */}
      {activeTab !== 'charts' && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Department Drilldown (RMS, Production, WIP, etc.):
            </span>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search Req No / Requester..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DEPARTMENTS.map((dept) => {
              const isSelected = selectedDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: PENDING FINAL APPROVAL TABLE */}
      {activeTab === 'pending_final' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {selectedIds.length > 0 && (
            <div className="p-3 bg-purple-50/90 dark:bg-purple-950/60 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-950 dark:text-purple-200">
                {selectedIds.length} request(s) selected for Final Decision
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionInProgress}
                  onClick={() => handleBatchAction('APPROVE')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Authorize Double OT
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
          ) : filteredActionable.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              ✓ No Double OT requests currently awaiting your final approval.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredActionable.length && filteredActionable.length > 0}
                        onChange={() => toggleSelectAll(filteredActionable)}
                        className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Req No</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Requester</th>
                    <th className="py-3 px-4">Recommended By</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">DOT Hours</th>
                    <th className="py-3 px-4">Headcount</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredActionable.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(req._id)}
                          onChange={() => toggleSelect(req._id)}
                          className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md font-bold text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {req.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{req.requesterName}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">✓ {req.l1Approver?.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.shift}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{req.hours}h</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedRequestForModal(req)}
                          className="px-2.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-900 dark:text-white underline decoration-slate-300 cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve DOT
                          </button>
                          <button
                            disabled={actionInProgress}
                            onClick={() => handleSingleAction(req._id, 'REJECT')}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
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

      {/* TAB: EPF NUMBER-WISE TABLE */}
      {activeTab === 'epf_summary' && (
        <AnalyticsCharts
          title="Plant-Wide EPF Number-Wise Double OT Breakdown"
          defaultSubTab="epf"
        />
      )}

      {/* TAB 2: CHARTS & ANALYTICS */}
      {activeTab === 'charts' && (
        <AnalyticsCharts
          title="Executive Double OT Headcount & Department Authorization Analytics"
          defaultSubTab="charts"
        />
      )}

      {/* TAB 3: ALL ARCHIVE */}
      {activeTab === 'all_archive' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Date View:</span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  onClick={() => setArchiveDateMode('today')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    archiveDateMode === 'today' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Live Today ({todayStr})
                </button>
                <button
                  onClick={() => setArchiveDateMode('date')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    archiveDateMode === 'date' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pick Date
                </button>
                <button
                  onClick={() => setArchiveDateMode('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    archiveDateMode === 'all' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All Archive
                </button>
              </div>

              {archiveDateMode === 'date' && (
                <input
                  type="date"
                  value={archiveDate}
                  onChange={(e) => setArchiveDate(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              )}
            </div>

            <span className="text-xs text-slate-400">
              Showing {filteredArchive.length} records
            </span>
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
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredArchive.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{req.department}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{req.requesterName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.date}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.shift}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{req.employeeCount} Persons</td>
                      <td className="py-3 px-4">
                        {getStatusBadgeVinod(req)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setSelectedRequestForModal(req)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Remove this request from your view? (It will remain in the system for other users).')) {
                                handleDelete(req._id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Remove from my view"
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
          </div>
        </div>
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

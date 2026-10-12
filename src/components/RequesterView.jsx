import React, { useState, useEffect } from 'react';
import { Send, PlusCircle, Calendar, Clock, CheckCircle, AlertCircle, Eye, RefreshCw, FileText, Trash2, Edit3, Filter, FileSpreadsheet } from 'lucide-react';
import EmployeeSelector from './EmployeeSelector';
import RequestDetailModal from './RequestDetailModal';
import AnalyticsCharts from './AnalyticsCharts';
import { api } from '../api';

export default function RequesterView({ user }) {
  const [activeTab, setActiveTab] = useState('new');
  const [editingRequestId, setEditingRequestId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [date, setDate] = useState(todayStr);
  const [shift, setShift] = useState('Day');
  const [hours, setHours] = useState(4);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // History filtering
  const [filterMode, setFilterMode] = useState('today'); // 'today' | 'date' | 'all'
  const [filterDate, setFilterDate] = useState(todayStr);

  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequestForModal, setSelectedRequestForModal] = useState(null);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const filters = {};
      if (filterMode === 'today') {
        filters.date = todayStr;
      } else if (filterMode === 'date' && filterDate) {
        filters.date = filterDate;
      }
      const data = await api.getRequests(user.username, filters);
      setRequests(data.requests || []);
      setPendingRequests(data.pendingRequests || []);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user.username, filterMode, filterDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployees.length) {
      setMessage({ type: 'error', text: 'Please select at least one employee from the list.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      if (editingRequestId) {
        await api.editRequest(editingRequestId, {
          requesterUsername: user.username,
          date,
          shift,
          hours: Number(hours),
          reason,
          employees: selectedEmployees
        });
        setMessage({
          type: 'success',
          text: `Request updated successfully! Resubmitted to ${user.assignedL1Approver}.`
        });
        setEditingRequestId(null);
      } else {
        const res = await api.createRequest({
          requesterUsername: user.username,
          requesterName: user.name,
          department: user.department,
          date,
          shift,
          hours: Number(hours),
          reason,
          employees: selectedEmployees
        });
        setMessage({
          type: 'success',
          text: `Double OT Request ${res.reqNumber} submitted successfully! Routed to ${user.assignedL1Approver} for Level 1 Approval.`
        });
      }

      // Reset form
      setSelectedEmployees([]);
      setReason('');
      setDate(todayStr);
      fetchMyRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (req) => {
    setEditingRequestId(req._id);
    setDate(req.date);
    setShift(req.shift);
    setHours(req.hours);
    setReason(req.reason);
    setSelectedEmployees(req.employees || []);
    setActiveTab('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingRequestId(null);
    setSelectedEmployees([]);
    setReason('');
    setDate(todayStr);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteRequest(id, user.username);
      setMessage({ type: 'success', text: 'Request removed from your view.' });
      fetchMyRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove request.' });
    }
  };

  const getStatusBadge = (status, l1Name) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            ✓ Final Authorized (Mr. Vinod)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            ✕ Rejected
          </span>
        );
      case 'PENDING_FINAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            ⏳ Pending Final (Mr. Vinod)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            ⏳ Pending ({l1Name || 'HOD'})
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* View Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 w-full sm:w-auto inline-flex shadow-inner">
        <button
          onClick={() => {
            setActiveTab('new');
            if (!editingRequestId) cancelEdit();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'new'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          {editingRequestId ? 'Editing Request' : 'Create New Double OT Request'}
        </button>
        <button
          onClick={() => {
            setActiveTab('history');
            fetchMyRequests();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Submitted Requests Log ({requests.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('epf_summary');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'epf_summary'
              ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          EPF Number-Wise Summary
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

      {/* NEW OR EDIT REQUEST FORM */}
      {activeTab === 'new' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-6 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {editingRequestId ? <Edit3 className="w-4 h-4 text-amber-500" /> : <PlusCircle className="w-4 h-4 text-blue-600" />}
                {editingRequestId ? 'Modify Existing Double OT Request' : 'New Double Overtime (DOT) Authorization Request'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Department: <strong className="text-slate-800 dark:text-slate-200">{user.department}</strong> • Prepared by: <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 font-medium">
                Route: <strong className="text-blue-900 dark:text-blue-200">{user.assignedL1Approver}</strong> ➔ <strong className="text-purple-900 dark:text-purple-300">Mr. Vinod</strong>
              </div>
              {editingRequestId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Overtime Date
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Shift / Period
                </label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800"
                >
                  <option value="Day">Day Shift</option>
                  <option value="Night">Night Shift</option>
                  <option value="Shift A">Shift A (Morning)</option>
                  <option value="Shift B">Shift B (Evening)</option>
                  <option value="Weekend / Holiday">Weekend / Poya / Holiday</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  DOT Hours (Double OT)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  step="0.5"
                  required
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason / Justification for Double OT
              </label>
              <textarea
                rows="2"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify reason (e.g., Urgent tyre mold delivery, breakdown recovery, export shipment rush)..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            {/* Employee Multi Selector */}
            <EmployeeSelector
              selectedEmployees={selectedEmployees}
              onSelectionChange={setSelectedEmployees}
            />

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Selected candidates:{' '}
                <strong className="text-slate-900 dark:text-white font-bold">{selectedEmployees.length}</strong> employees
              </div>

              <button
                type="submit"
                disabled={submitting || selectedEmployees.length === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Processing...' : (editingRequestId ? 'Update & Save Changes' : `Submit Request (${selectedEmployees.length} Persons)`)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBMITTED REQUESTS LOG & LIVE MONITOR */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Active Pending Highlights */}
          {pendingRequests.length > 0 && (
            <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 p-4">
              <div className="flex items-center gap-2 mb-2 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Your Active Pending Requests ({pendingRequests.length}) — Visible in Real-Time
              </div>
              <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
                {pendingRequests.map((pReq) => (
                  <div key={pReq._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{pReq.reqNumber}</span>
                      <span className="text-slate-700 dark:text-slate-300">Date: {pReq.date}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{pReq.employeeCount} Persons</span>
                      {getStatusBadge(pReq.status, pReq.l1Approver?.name)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {pReq.status === 'PENDING_L1' && (
                        <button
                          onClick={() => handleStartEdit(pReq)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 hover:bg-amber-300 cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(pReq._id)}
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Delete request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Filter View:</span>
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                <button
                  onClick={() => setFilterMode('today')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    filterMode === 'today' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Live Today ({todayStr})
                </button>
                <button
                  onClick={() => setFilterMode('date')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    filterMode === 'date' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Pick Specific Date
                </button>
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    filterMode === 'all' ? 'bg-white dark:bg-slate-700 font-bold text-blue-600 dark:text-blue-300 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All History
                </button>
              </div>

              {filterMode === 'date' && (
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              )}
            </div>

            <button
              onClick={fetchMyRequests}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            {loadingRequests ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No requests found for this filter period. Click "Create New Double OT Request" above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Req Number</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Shift</th>
                      <th className="py-3 px-4">DOT Hours</th>
                      <th className="py-3 px-4">Headcount</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {requests.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{req.reqNumber}</td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{req.date}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{req.shift}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{req.hours}h</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedRequestForModal(req)}
                            className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 underline decoration-slate-300 cursor-pointer"
                          >
                            {req.employeeCount || req.employees?.length} Persons
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(req.status, req.l1Approver?.name)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedRequestForModal(req)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {req.status === 'PENDING_L1' && (
                              <button
                                onClick={() => handleStartEdit(req)}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                                title="Edit request"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {req.status !== 'APPROVED' && (
                              <button
                                onClick={() => {
                                  if (confirm('Delete this request? Neither HOD nor Mr. Vinod will see it.')) {
                                    handleDelete(req._id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Delete request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* EPF NUMBER-WISE SUMMARY TAB */}
      {activeTab === 'epf_summary' && (
        <AnalyticsCharts
          allowedDepartments={[user.department]}
          title={`${user.department} Department - EPF Number-Wise Summary`}
          defaultSubTab="epf"
        />
      )}

      {selectedRequestForModal && (
        <RequestDetailModal
          request={selectedRequestForModal}
          onClose={() => setSelectedRequestForModal(null)}
          onDelete={handleDelete}
          onEdit={handleStartEdit}
        />
      )}
    </div>
  );
}

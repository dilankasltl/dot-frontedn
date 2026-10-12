import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, Users, CheckCircle, Clock, AlertTriangle, RefreshCw, Calendar, Filter } from 'lucide-react';
import { api } from '../api';

export default function AnalyticsCharts({ allowedDepartments = null, title = 'Double OT Department-Wise Analytics' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters: 'month' | 'range' | 'all'
  const [filterType, setFilterType] = useState('all');
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g., '2026-10'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterType === 'month' && selectedMonth) {
        filters.month = selectedMonth;
      } else if (filterType === 'range' && startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      if (allowedDepartments && allowedDepartments.length > 0) {
        filters.departments = allowedDepartments.join(',');
      }

      const res = await api.getAnalytics(filters);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [filterType, selectedMonth, startDate, endDate]);

  const chartData = data?.chartData || [];
  const summary = data?.summary || {
    totalRequests: 0,
    totalHeadcountRequested: 0,
    totalHeadcountApproved: 0,
    totalHeadcountPending: 0,
    pendingL1Count: 0,
    pendingFinalCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Interactive Double OT comparison, request volume, and employee headcount authorization
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Date / Month Filter Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilterType('month')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filterType === 'month'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Month-wise
            </button>
            <button
              onClick={() => setFilterType('range')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                filterType === 'range'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Custom Date Range
            </button>
          </div>

          {filterType === 'month' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Select Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {filterType === 'range' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <span className="text-slate-500 dark:text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total DOT Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{summary.totalHeadcountRequested}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Total persons requested</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Authorized Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{summary.totalHeadcountApproved}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Final approved by Mr. Vinod</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{summary.totalHeadcountPending}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting HOD or Final sign-off</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Requests</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{summary.totalRequests}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Submitted request batches</span>
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Double OT Headcount Comparison Bar Chart
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Production, WIP, RIM, RMS, FGS, LAB, Quality, HR, Finance, Engineering, Mixing
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <span className="w-3 h-3 rounded-xs bg-blue-500"></span> Requested
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Approved
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No Double OT records matching the selected period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: -10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis
                  dataKey="department"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#ffffff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="totalHeadcount" name="Requested" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approvedHeadcount" name="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Department Headcount Breakdown Table
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold text-left">
              <tr>
                <th className="py-2.5 px-4">Department</th>
                <th className="py-2.5 px-4 text-center">Requests</th>
                <th className="py-2.5 px-4 text-center">Total Requested</th>
                <th className="py-2.5 px-4 text-center">Approved</th>
                <th className="py-2.5 px-4 text-center">Pending</th>
                <th className="py-2.5 px-4 text-center">Approval Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {chartData.map((d) => {
                const rate = d.totalHeadcount > 0
                  ? Math.round((d.approvedHeadcount / d.totalHeadcount) * 100)
                  : 0;
                return (
                  <tr key={d.department} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-white">{d.department}</td>
                    <td className="py-2.5 px-4 text-center text-slate-600 dark:text-slate-400">{d.requestsCount}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">{d.totalHeadcount}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{d.approvedHeadcount}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">{d.pendingHeadcount}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rate > 50 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                        rate > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

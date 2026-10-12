import React, { useState, useEffect, useMemo } from 'react';
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
import {
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Filter,
  Search,
  Download,
  FileSpreadsheet,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../api';

export default function AnalyticsCharts({
  allowedDepartments = null,
  title = 'Double OT Department & EPF Analytics',
  defaultSubTab = 'epf' // 'epf' | 'charts'
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active sub-tab: 'epf' (EPF Table) or 'charts' (Bar Chart)
  const [activeSubTab, setActiveSubTab] = useState(defaultSubTab);

  // Filters: 'month' | 'range' | 'all'
  const [filterType, setFilterType] = useState('all');
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g., '2026-10'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // EPF Table specific filters
  const [epfSearch, setEpfSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('count'); // 'count' | 'epf' | 'approved'

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
  const epfStats = data?.epfStats || [];
  const summary = data?.summary || {
    totalRequests: 0,
    totalHeadcountRequested: 0,
    totalHeadcountApproved: 0,
    totalHeadcountPending: 0,
    uniqueEmployeesCount: 0,
    pendingL1Count: 0,
    pendingFinalCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  };

  // Available departments in the current result for sub-filtering
  const availableDepts = useMemo(() => {
    if (allowedDepartments && allowedDepartments.length > 0) {
      return allowedDepartments;
    }
    const depts = new Set();
    epfStats.forEach(item => depts.add(item.department));
    chartData.forEach(item => depts.add(item.department));
    return Array.from(depts);
  }, [allowedDepartments, epfStats, chartData]);

  // Filtered & Sorted EPF records
  const filteredEpfStats = useMemo(() => {
    let list = epfStats.filter(item => {
      const matchesSearch =
        item.epfNo.toLowerCase().includes(epfSearch.toLowerCase()) ||
        item.fullName.toLowerCase().includes(epfSearch.toLowerCase());

      const matchesDept =
        selectedDeptFilter === 'ALL' || item.department === selectedDeptFilter;

      return matchesSearch && matchesDept;
    });

    if (sortBy === 'count') {
      list.sort((a, b) => b.totalCount - a.totalCount);
    } else if (sortBy === 'approved') {
      list.sort((a, b) => b.approvedCount - a.approvedCount);
    } else if (sortBy === 'epf') {
      list.sort((a, b) => {
        const numA = parseInt(a.epfNo, 10);
        const numB = parseInt(b.epfNo, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.epfNo.localeCompare(b.epfNo);
      });
    }

    return list;
  }, [epfStats, epfSearch, selectedDeptFilter, sortBy]);

  // Export filtered EPF table as CSV
  const handleExportCSV = () => {
    if (!filteredEpfStats.length) return;
    const headers = ['EPF Number', 'Employee Name', 'Department', 'Total Requests', 'Approved Count', 'Pending Count', 'Rejected Count', 'Total Hours', 'Dates'];
    const rows = filteredEpfStats.map(item => [
      `"${item.epfNo}"`,
      `"${item.fullName.replace(/"/g, '""')}"`,
      `"${item.department}"`,
      item.totalCount,
      item.approvedCount,
      item.pendingCount,
      item.rejectedCount,
      item.totalHours,
      `"${(item.dates || []).join(', ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DOT_EPF_Summary_${filterType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              Live Double OT summary by Department and Employee EPF Number breakdown
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Date / Month Filter Bar & Sub-Tab Switcher */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Sub-Tab Toggle: EPF Table vs Bar Chart */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold shadow-inner">
            <button
              onClick={() => setActiveSubTab('epf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'epf'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              EPF Number-Wise Table ({filteredEpfStats.length})
            </button>
            <button
              onClick={() => setActiveSubTab('charts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'charts'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Department Bar Chart
            </button>
          </div>

          {/* Date Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
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
                Custom Range
              </button>
            </div>

            {filterType === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:white"
              />
            )}

            {filterType === 'range' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:white"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:white"
                />
              </div>
            )}
          </div>
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
          <span className="text-[11px] text-slate-400 mt-0.5 block">{summary.uniqueEmployeesCount || 0} unique employees</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Authorized Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{summary.totalHeadcountApproved}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Approved by Mr. Vinod</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Headcount</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{summary.totalHeadcountPending}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting authorization</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Request Batches</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{summary.totalRequests}</p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Batches submitted</span>
        </div>
      </div>

      {/* VIEW 1: EPF NUMBER-WISE EMPLOYEE BREAKDOWN TABLE */}
      {activeSubTab === 'epf' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {/* Table Header with Search & Controls */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                EPF Number-Wise Double OT Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exact Double OT count, approved status, and hours requested per employee
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search EPF # or Name..."
                  value={epfSearch}
                  onChange={(e) => setEpfSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Department Filter (if multiple depts available) */}
              {availableDepts.length > 1 && (
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">All Departments</option>
                  {availableDepts.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 text-xs text-slate-600 dark:text-slate-300">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="count">Most Requests</option>
                  <option value="approved">Most Approved</option>
                  <option value="epf">EPF No. (Low to High)</option>
                </select>
              </div>

              {/* Export CSV button */}
              <button
                onClick={handleExportCSV}
                title="Download table as CSV spreadsheet"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>

          {/* EPF Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">EPF No.</th>
                  <th className="py-3 px-4">Employee Full Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Total DOT Requests</th>
                  <th className="py-3 px-4 text-center">Approved</th>
                  <th className="py-3 px-4 text-center">Pending</th>
                  <th className="py-3 px-4 text-center">Rejected</th>
                  <th className="py-3 px-4 text-center">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredEpfStats.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No employee DOT records found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEpfStats.map((item, idx) => (
                    <tr
                      key={`${item.epfNo}_${item.department}_${idx}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                          #{item.epfNo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.fullName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.department}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                          {item.totalCount} {item.totalCount === 1 ? 'time' : 'times'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {item.approvedCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                            ✓ {item.approvedCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                        {item.pendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                            ⏳ {item.pendingCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {item.rejectedCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                            ✕ {item.rejectedCount}
                          </span>
                        ) : (
                          '0'
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.totalHours} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DEPARTMENT BAR CHART & HEADCOUNT BREAKDOWN */}
      {activeSubTab === 'charts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Double OT Headcount Comparison Bar Chart
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Requested vs Approved Double OT Headcount
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

          {/* Department Breakdown Table */}
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
      )}
    </div>
  );
}

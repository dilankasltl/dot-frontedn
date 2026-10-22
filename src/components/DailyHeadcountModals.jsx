import React, { useState, useMemo } from 'react';
import { X, Clock, Download, Search, Edit3, PlusCircle, Users, Calendar, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

const isLeaveVal = (val) => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s !== '' && s !== 'no' && s !== 'none' && s !== '-';
};

// Drilldown Modal 1: LEAVE != 'NO' Employees (Supports Single, Month-Wise & Date-Range with Grouped Employee Counts)
export function LeaveDrilldownModal({
  isOpen,
  onClose,
  records = [],
  selectedDate,
  filterMode = 'single',
  selectedMonth = '',
  startDate = '',
  endDate = '',
  formatMonthName
}) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'detailed'

  if (!isOpen) return null;

  const isMultiDay = filterMode === 'month' || filterMode === 'range';

  // Group by Employee (EPF) to calculate how many times each employee was on leave
  const groupedEmployees = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const epf = String(r.epfNo || '').trim();
      if (!epf || epf === '00001' || epf === '1' || epf.endsWith('00001')) return;

      const dateStr = r.firstDate || r.reportDate || selectedDate || '';
      if (!map.has(epf)) {
        map.set(epf, {
          epfNo: epf,
          fullName: r.fullName || 'Unknown',
          department: r.department || 'General',
          unit: r.unit || 'General',
          shiftName: r.shiftName || 'General',
          count: 0,
          dates: [],
          rawRecords: []
        });
      }
      const item = map.get(epf);
      item.count += 1;
      item.dates.push({
        date: dateStr,
        leaveType: r.leave || 'Yes',
        shiftName: r.shiftName || ''
      });
      item.rawRecords.push(r);
    });

    // Sort by count descending (most leaves first), then by EPF number
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.epfNo.localeCompare(b.epfNo));
  }, [records, selectedDate]);

  // Filter Grouped List by Search Query
  const filteredGrouped = useMemo(() => {
    if (!search) return groupedEmployees;
    const q = search.toLowerCase();
    return groupedEmployees.filter((emp) => {
      const matchEpf = String(emp.epfNo).toLowerCase().includes(q);
      const matchName = String(emp.fullName).toLowerCase().includes(q);
      const matchDept = String(emp.department).toLowerCase().includes(q);
      const matchUnit = String(emp.unit).toLowerCase().includes(q);
      const matchDate = emp.dates.some(d => String(d.date).toLowerCase().includes(q) || String(d.leaveType).toLowerCase().includes(q));
      return matchEpf || matchName || matchDept || matchUnit || matchDate;
    });
  }, [groupedEmployees, search]);

  // Filter Detailed (Flat) List by Search Query
  const filteredDetailed = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter((r) => {
      return (
        String(r.epfNo).toLowerCase().includes(q) ||
        String(r.fullName).toLowerCase().includes(q) ||
        String(r.department).toLowerCase().includes(q) ||
        String(r.unit).toLowerCase().includes(q) ||
        String(r.firstDate || r.reportDate || '').toLowerCase().includes(q) ||
        String(r.leave || '').toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  // Period Title Description
  const periodTitle = useMemo(() => {
    if (filterMode === 'month') {
      const mLabel = formatMonthName ? formatMonthName(selectedMonth) : selectedMonth;
      return `Month: ${mLabel || selectedMonth} • ${records.length} Total Leave Incidents across ${groupedEmployees.length} Employees`;
    }
    if (filterMode === 'range') {
      return `Period: ${startDate} to ${endDate} • ${records.length} Total Leave Incidents across ${groupedEmployees.length} Employees`;
    }
    return `Daily Report: ${selectedDate || 'Selected Day'} • ${records.length} Employees on Leave`;
  }, [filterMode, selectedMonth, startDate, endDate, selectedDate, records.length, groupedEmployees.length, formatMonthName]);

  const exportExcel = () => {
    let ws;
    let exportFileName = `Employees_On_Leave_${filterMode === 'month' ? selectedMonth : filterMode === 'range' ? `${startDate}_to_${endDate}` : selectedDate || 'Report'}`;

    if (viewMode === 'grouped') {
      ws = XLSX.utils.json_to_sheet(
        filteredGrouped.map((emp) => ({
          'Number (EPF)': emp.epfNo,
          'Full Name': emp.fullName,
          Department: emp.department,
          Unit: emp.unit,
          'Leave Count (Days)': emp.count,
          'Dates on Leave': emp.dates.map(d => `${d.date} (${d.leaveType})`).join(', ')
        }))
      );
    } else {
      ws = XLSX.utils.json_to_sheet(
        filteredDetailed.map((r) => ({
          'Number (EPF)': r.epfNo,
          'Full Name': r.fullName,
          Date: r.firstDate || r.reportDate || selectedDate,
          Department: r.department,
          Unit: r.unit,
          Shift: r.shiftName,
          Leave: r.leave
        }))
      );
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave_Employees');
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-300 dark:border-amber-800 shadow-2xl max-w-4xl w-full p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Employees on Leave</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  {isMultiDay ? `${groupedEmployees.length} Employees (${records.length} Incidents)` : `${records.length} Employees`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>{periodTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, View Switcher & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Number (EPF), Full Name, Department, Date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {isMultiDay && (
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  By Employee ({groupedEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'detailed'
                      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Dates ({records.length})
                </button>
              </div>
            )}

            {(records.length > 0) && (
              <button
                type="button"
                onClick={exportExcel}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export List</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          {viewMode === 'grouped' ? (
            /* GROUPED BY EMPLOYEE TABLE (Shows Leave Count e.g. 2, 3 times) */
            filteredGrouped.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No employees on Leave found for this period.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Number (EPF)</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-center">Leave Count</th>
                    <th className="py-2.5 px-3">Dates on Leave & Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredGrouped.map((emp) => (
                    <tr key={emp.epfNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {emp.epfNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {emp.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {emp.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {emp.unit || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black ${
                          emp.count >= 3
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300'
                            : emp.count === 2
                            ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 border border-amber-400'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                        }`}>
                          {emp.count} {emp.count > 1 ? 'Days' : 'Day'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {emp.dates.map((d, dIdx) => (
                            <span
                              key={dIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              title={`${d.date} - ${d.leaveType} (${d.shiftName || 'General'})`}
                            >
                              <span>{d.date}</span>
                              {d.leaveType && d.leaveType !== 'Yes' && d.leaveType !== 'Leave' && (
                                <span className="ml-1 text-amber-600 dark:text-amber-400 font-bold">({d.leaveType})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* DETAILED DAY-BY-DAY INCIDENTS TABLE */
            filteredDetailed.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No employees on Leave found for this period.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Number (EPF)</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3">Shift</th>
                    <th className="py-2.5 px-3 text-center">Leave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredDetailed.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {r.epfNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {r.fullName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.firstDate || r.reportDate || selectedDate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {r.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {r.unit || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {r.shiftName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          {r.leave || 'Yes'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {viewMode === 'grouped' ? `${filteredGrouped.length} employee(s)` : `${filteredDetailed.length} incident record(s)`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Drilldown Modal 2: Late > 00:15 Employees (Supports Single, Month-Wise & Date-Range with Grouped Employee Counts)
export function LateDrilldownModal({
  isOpen,
  onClose,
  records = [],
  selectedDate,
  filterMode = 'single',
  selectedMonth = '',
  startDate = '',
  endDate = '',
  formatMonthName,
  parseMinutes = (t) => 0
}) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'detailed'

  if (!isOpen) return null;

  const isMultiDay = filterMode === 'month' || filterMode === 'range';

  // Group by Employee (EPF) to calculate how many times each employee was late > 15m
  const groupedEmployees = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const epf = String(r.epfNo || '').trim();
      if (!epf || epf === '00001' || epf === '1' || epf.endsWith('00001')) return;

      const mins = r.lateMinutes !== undefined ? r.lateMinutes : parseMinutes(r.late);
      const dateStr = r.firstDate || r.reportDate || selectedDate || '';

      if (!map.has(epf)) {
        map.set(epf, {
          epfNo: epf,
          fullName: r.fullName || 'Unknown',
          department: r.department || 'General',
          unit: r.unit || 'General',
          count: 0,
          totalLateMins: 0,
          incidents: [],
          rawRecords: []
        });
      }
      const item = map.get(epf);
      item.count += 1;
      item.totalLateMins += mins;
      item.incidents.push({
        date: dateStr,
        late: r.late,
        mins: mins,
        inTime: r.inTime || '',
        shiftName: r.shiftName || ''
      });
      item.rawRecords.push(r);
    });

    // Sort by count descending (most late incidents first), then by total late minutes
    return Array.from(map.values()).sort((a, b) => b.count - a.count || b.totalLateMins - a.totalLateMins);
  }, [records, selectedDate, parseMinutes]);

  // Filter Grouped List by Search Query
  const filteredGrouped = useMemo(() => {
    if (!search) return groupedEmployees;
    const q = search.toLowerCase();
    return groupedEmployees.filter((emp) => {
      const matchEpf = String(emp.epfNo).toLowerCase().includes(q);
      const matchName = String(emp.fullName).toLowerCase().includes(q);
      const matchDept = String(emp.department).toLowerCase().includes(q);
      const matchUnit = String(emp.unit).toLowerCase().includes(q);
      const matchDate = emp.incidents.some(inc => String(inc.date).toLowerCase().includes(q) || String(inc.late).toLowerCase().includes(q));
      return matchEpf || matchName || matchDept || matchUnit || matchDate;
    });
  }, [groupedEmployees, search]);

  // Filter Detailed (Flat) List by Search Query
  const filteredDetailed = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter((r) => {
      return (
        String(r.epfNo).toLowerCase().includes(q) ||
        String(r.fullName).toLowerCase().includes(q) ||
        String(r.department).toLowerCase().includes(q) ||
        String(r.unit).toLowerCase().includes(q) ||
        String(r.firstDate || r.reportDate || '').toLowerCase().includes(q) ||
        String(r.late || '').toLowerCase().includes(q)
      );
    });
  }, [records, search]);

  // Period Title Description
  const periodTitle = useMemo(() => {
    if (filterMode === 'month') {
      const mLabel = formatMonthName ? formatMonthName(selectedMonth) : selectedMonth;
      return `Month: ${mLabel || selectedMonth} • ${records.length} Total Late Incidents across ${groupedEmployees.length} Employees`;
    }
    if (filterMode === 'range') {
      return `Period: ${startDate} to ${endDate} • ${records.length} Total Late Incidents across ${groupedEmployees.length} Employees`;
    }
    return `Daily Report: ${selectedDate || 'Selected Day'} • ${records.length} Employees Late > 15m`;
  }, [filterMode, selectedMonth, startDate, endDate, selectedDate, records.length, groupedEmployees.length, formatMonthName]);

  const exportExcel = () => {
    let ws;
    let exportFileName = `Employees_Late_Over_15m_${filterMode === 'month' ? selectedMonth : filterMode === 'range' ? `${startDate}_to_${endDate}` : selectedDate || 'Report'}`;

    if (viewMode === 'grouped') {
      ws = XLSX.utils.json_to_sheet(
        filteredGrouped.map((emp) => ({
          'Number (EPF)': emp.epfNo,
          'Full Name': emp.fullName,
          Department: emp.department,
          Unit: emp.unit,
          'Late Count (Times)': emp.count,
          'Total Late Minutes': emp.totalLateMins,
          'Total Late Hours': `${Math.floor(emp.totalLateMins / 60)}h ${emp.totalLateMins % 60}m`,
          'Incidents List': emp.incidents.map(inc => `${inc.date}: ${inc.late} (${inc.mins}m)`).join(', ')
        }))
      );
    } else {
      ws = XLSX.utils.json_to_sheet(
        filteredDetailed.map((r) => ({
          'Number (EPF)': r.epfNo,
          'Full Name': r.fullName,
          Date: r.firstDate || r.reportDate || selectedDate,
          Department: r.department,
          Unit: r.unit,
          Shift: r.shiftName,
          'In Time': r.inTime,
          Late: r.late,
          'Late Minutes': r.lateMinutes || parseMinutes(r.late)
        }))
      );
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Late_Employees');
    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-800 shadow-2xl max-w-4xl w-full p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Employees Late &gt; 15 Minutes</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                  {isMultiDay ? `${groupedEmployees.length} Employees (${records.length} Incidents)` : `${records.length} Employees`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>{periodTitle}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, View Switcher & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Number (EPF), Full Name, Department, Date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {isMultiDay && (
              <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'grouped'
                      ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  By Employee ({groupedEmployees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    viewMode === 'detailed'
                      ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Dates ({records.length})
                </button>
              </div>
            )}

            {(records.length > 0) && (
              <button
                type="button"
                onClick={exportExcel}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100 cursor-pointer whitespace-nowrap shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export List</span>
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          {viewMode === 'grouped' ? (
            /* GROUPED BY EMPLOYEE TABLE (Shows Late Count e.g. 2, 3 times) */
            filteredGrouped.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No employees late over 15 minutes found for this period.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Number (EPF)</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-center">Late Count</th>
                    <th className="py-2.5 px-3 text-center">Total Late Time</th>
                    <th className="py-2.5 px-3">Incident Dates & Times</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredGrouped.map((emp) => (
                    <tr key={emp.epfNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                        {emp.epfNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {emp.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {emp.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {emp.unit || 'General'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black ${
                          emp.count >= 3
                            ? 'bg-rose-200 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400'
                            : emp.count === 2
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {emp.count} {emp.count > 1 ? 'Times' : 'Time'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-rose-600 dark:text-rose-400">
                        {Math.floor(emp.totalLateMins / 60) > 0 ? `${Math.floor(emp.totalLateMins / 60)}h ` : ''}
                        {emp.totalLateMins % 60}m
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                          {emp.incidents.map((inc, iIdx) => (
                            <span
                              key={iIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              title={`${inc.date}: Late ${inc.late} (${inc.mins}m)${inc.inTime ? ` | In: ${inc.inTime}` : ''}`}
                            >
                              <span>{inc.date}:</span>
                              <span className="ml-1 text-rose-600 dark:text-rose-400 font-bold">{inc.late}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* DETAILED DAY-BY-DAY INCIDENTS TABLE */
            filteredDetailed.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No employees late over 15 minutes found for this period.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Number (EPF)</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">In Time</th>
                    <th className="py-2.5 px-3 text-right">Late Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredDetailed.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-700 dark:text-rose-400 whitespace-nowrap">
                        {r.epfNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {r.fullName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.firstDate || r.reportDate || selectedDate}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {r.department || 'General'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {r.inTime || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {r.late} ({parseMinutes(r.late)}m)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {viewMode === 'grouped' ? `${filteredGrouped.length} employee(s)` : `${filteredDetailed.length} incident record(s)`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Record Modal
export function EditRecordModal({ record, onClose, onSave }) {
  const [fullName, setFullName] = useState(record?.fullName || '');
  const [dept, setDept] = useState(record?.department || 'General');
  const [unit, setUnit] = useState(record?.unit || 'General');
  const [gender, setGender] = useState(record?.gender || 'MALE');
  const [present, setPresent] = useState(record?.present || 'Yes');
  const [leave, setLeave] = useState(record?.leave || 'No');
  const [inTime, setInTime] = useState(record?.inTime || '');
  const [outTime, setOutTime] = useState(record?.outTime || '');
  const [late, setLate] = useState(record?.late || '00:00');
  const [workHrs, setWorkHrs] = useState(record?.workHrs || 8);

  if (!record) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      epfNo: record.epfNo,
      fullName,
      department: dept,
      unit,
      gender,
      present,
      leave,
      inTime,
      outTime,
      late,
      workHrs: Number(workHrs)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-cyan-600" />
            <span>Edit Record — #{record.epfNo}</span>
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department:</label>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Present:</label>
              <select
                value={present}
                onChange={(e) => setPresent(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Leave:</label>
              <select
                value={leave}
                onChange={(e) => setLeave(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">In Time:</label>
              <input
                type="text"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Out Time:</label>
              <input
                type="text"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Late (HH:MM):</label>
              <input
                type="text"
                value={late}
                onChange={(e) => setLate(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-xs">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Employee Modal
export function AddEmployeeModal({ isOpen, onClose, onAdd }) {
  const [epfNo, setEpfNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [dept, setDept] = useState('Production');
  const [unit, setUnit] = useState('General');
  const [gender, setGender] = useState('MALE');
  const [present, setPresent] = useState('Yes');
  const [leave, setLeave] = useState('No');
  const [late, setLate] = useState('00:00');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!epfNo) return;
    onAdd({
      epfNo,
      fullName,
      department: dept,
      unit,
      gender,
      present,
      leave,
      late,
      workHrs: 8
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-600" />
            <span>Add Employee to Daily Headcount</span>
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">EPF Number *:</label>
              <input
                type="text"
                required
                placeholder="e.g. 0346"
                value={epfNo}
                onChange={(e) => setEpfNo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender:</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name (optional):</label>
            <input
              type="text"
              placeholder="Auto-matched from directory if blank"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department:</label>
              <input
                type="text"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Present:</label>
              <select
                value={present}
                onChange={(e) => setPresent(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Leave:</label>
              <select
                value={leave}
                onChange={(e) => setLeave(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Late (HH:MM):</label>
              <input
                type="text"
                value={late}
                onChange={(e) => setLate(e.target.value)}
                placeholder="00:00"
                className="w-full px-2.5 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-700 shadow-xs">
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

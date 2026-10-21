import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  CalendarRange,
  Upload,
  RefreshCw,
  Search,
  Building,
  Layers,
  ChevronRight,
  AlertTriangle,
  XCircle,
  FileCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { api } from '../api';
import { DailyHeadcountTable } from './DailyHeadcountTable';
import {
  LeaveDrilldownModal,
  LateDrilldownModal,
  EditRecordModal,
  AddEmployeeModal
} from './DailyHeadcountModals';

export default function DailyHeadcountView({ user }) {
  const [filterMode, setFilterMode] = useState('single');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [availableDates, setAvailableDates] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [headcountData, setHeadcountData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  // Table filters
  const [searchFilter, setSearchFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Drilldown & Action Modals
  const [drilldownModal, setDrilldownModal] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canManage =
    !!user.canManageAttendance ||
    user.username === 'Nimesh' ||
    user.name?.toLowerCase().includes('nimesh') ||
    user.username === 'Admin' ||
    user.role === 'admin';

  const formatMonthName = (mStr) => {
    if (!mStr) return '';
    try {
      const parts = String(mStr).split('-');
      if (parts.length === 2) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {}
    return mStr;
  };

  const parseMinutes = (t) => {
    if (!t) return 0;
    const parts = String(t).trim().split(':');
    if (parts.length >= 2) {
      return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }
    return 0;
  };

  const loadHeadcountData = async (paramOverrides = {}) => {
    setLoading(true);
    setMessage(null);
    try {
      let queryParams = {};
      if (typeof paramOverrides === 'string') {
        queryParams = { mode: 'single', date: paramOverrides };
      } else {
        const mode = paramOverrides.mode || filterMode;
        if (mode === 'month') {
          queryParams = {
            mode: 'month',
            month: paramOverrides.month || selectedMonth || (availableMonths[0] || '')
          };
        } else if (mode === 'range') {
          queryParams = {
            mode: 'range',
            startDate: paramOverrides.startDate || startDate,
            endDate: paramOverrides.endDate || endDate
          };
        } else {
          queryParams = {
            mode: 'single',
            date: paramOverrides.date || selectedDate
          };
        }
      }

      const res = await api.getDailyHeadcount(queryParams);
      setAvailableDates(res.availableDates || []);
      setAvailableMonths(res.availableMonths || []);
      setHeadcountData(res.headcountData || null);

      if (res.filterMode) setFilterMode(res.filterMode);

      if (res.targetMonth) {
        setSelectedMonth(res.targetMonth);
      } else if (!selectedMonth && res.availableMonths?.length > 0) {
        setSelectedMonth(res.availableMonths[0]);
      }

      if (res.startDate && res.endDate) {
        setStartDate(res.startDate);
        setEndDate(res.endDate);
      } else if (!startDate && res.availableDates?.length > 0) {
        setStartDate(res.availableDates[res.availableDates.length - 1]);
        setEndDate(res.availableDates[0]);
      }

      if (res.filterMode === 'single') {
        if (res.headcountData && res.headcountData.reportDate) {
          setSelectedDate(res.headcountData.reportDate);
        } else if (queryParams.date) {
          setSelectedDate(queryParams.date);
        } else if (res.availableDates?.length > 0 && !selectedDate) {
          setSelectedDate(res.availableDates[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load daily headcount', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load daily headcount data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeadcountData();
  }, []);

  const handlePresetRange = (days) => {
    if (availableDates.length === 0) return;
    const sorted = [...availableDates].sort();
    const latestDateStr = sorted[sorted.length - 1];
    const latestDate = new Date(latestDateStr);
    const pastDate = new Date(latestDate);
    pastDate.setDate(pastDate.getDate() - (days - 1));
    const startStr = pastDate.toISOString().split('T')[0];
    setStartDate(startStr);
    setEndDate(latestDateStr);
    loadHeadcountData({ mode: 'range', startDate: startStr, endDate: latestDateStr });
  };

  const handleAllDates = () => {
    if (availableDates.length === 0) return;
    const sorted = [...availableDates].sort();
    const startStr = sorted[0];
    const endStr = sorted[sorted.length - 1];
    setStartDate(startStr);
    setEndDate(endStr);
    loadHeadcountData({ mode: 'range', startDate: startStr, endDate: endStr });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: 'info', text: `Parsing attendance report "${file.name}"...` });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < 3) {
          throw new Error('Attendance file appears to be empty or unrecognized format.');
        }

        let extractedDateStr = '';
        for (let i = 0; i < Math.min(5, rawRows.length); i++) {
          const rowStr = rawRows[i].join(' ');
          const dateMatch = rowStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dateMatch) {
            extractedDateStr = dateMatch[1];
            break;
          }
        }

        let headerRowIndex = -1;
        let colMap = {};
        for (let i = 0; i < Math.min(10, rawRows.length); i++) {
          const row = rawRows[i].map(c => String(c).trim().toLowerCase());
          if (row.some(c => c === 'number' || c === 'epf no' || c === 'epf') && row.some(c => c === 'present')) {
            headerRowIndex = i;
            row.forEach((colName, colIdx) => {
              if (colName === 'department') colMap.department = colIdx;
              if (colName === 'unit') colMap.unit = colIdx;
              if (colName === 'number' || colName === 'epf no' || colName === 'epf') colMap.number = colIdx;
              if (colName === 'full name' || colName === 'name') colMap.fullName = colIdx;
              if (colName === 'gender') colMap.gender = colIdx;
              if (colName === 'shift name' || colName === 'shift') colMap.shiftName = colIdx;
              if (colName === 'present') colMap.present = colIdx;
              if (colName === 'leave') colMap.leave = colIdx;
              if (colName === 'first date' || colName === 'date') colMap.firstDate = colIdx;
              if (colName === 'in time') colMap.inTime = colIdx;
              if (colName === 'out time') colMap.outTime = colIdx;
              if (colName === 'late') colMap.late = colIdx;
              if (colName === 'work hrs' || colName === 'work hours') colMap.workHrs = colIdx;
            });
            break;
          }
        }

        if (headerRowIndex === -1 || colMap.number === undefined) {
          throw new Error('Could not identify table headers (Number/EPF, Present, Late, etc.).');
        }

        const extractedHeadcountRecords = [];
        const extractedDotRecords = [];
        let currentDept = 'General';
        let currentUnit = 'General';
        let fallbackDate = extractedDateStr;

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          const deptCell = colMap.department !== undefined ? String(row[colMap.department] || '').trim() : '';
          const unitCell = colMap.unit !== undefined ? String(row[colMap.unit] || '').trim() : '';
          if (deptCell) {
            currentDept = deptCell;
            currentUnit = 'General';
          }
          if (unitCell) {
            currentUnit = unitCell;
          }

          const rawNum = String(row[colMap.number] || '').trim();
          if (!rawNum || rawNum.toLowerCase().includes('total') || rawNum.length > 10) continue;
          if (rawNum === '00001' || rawNum === '1' || rawNum.endsWith('00001')) continue;

          const rawFullName = colMap.fullName !== undefined ? String(row[colMap.fullName] || '').trim() : '';
          const gender = colMap.gender !== undefined ? String(row[colMap.gender] || 'MALE').trim().toUpperCase() : 'MALE';
          const shiftName = colMap.shiftName !== undefined ? String(row[colMap.shiftName] || '').trim() : '';
          const present = colMap.present !== undefined ? String(row[colMap.present] || 'Yes').trim() : 'Yes';
          const leave = colMap.leave !== undefined ? String(row[colMap.leave] || 'No').trim() : 'No';
          const firstDate = colMap.firstDate !== undefined ? String(row[colMap.firstDate] || '').trim() : extractedDateStr;
          const inTime = colMap.inTime !== undefined ? String(row[colMap.inTime] || '').trim() : '';
          const outTime = colMap.outTime !== undefined ? String(row[colMap.outTime] || '').trim() : '';
          const late = colMap.late !== undefined ? String(row[colMap.late] || '00:00').trim() : '00:00';
          const workHrsRaw = colMap.workHrs !== undefined ? row[colMap.workHrs] : 0;
          const workHrs = parseFloat(String(workHrsRaw).replace(',', '.')) || 0;

          if (firstDate && !fallbackDate) fallbackDate = firstDate;

          const lateMins = parseMinutes(late);
          const isLateOver15 = lateMins > 15;

          extractedHeadcountRecords.push({
            epfNo: rawNum,
            fullName: rawFullName,
            department: currentDept,
            unit: currentUnit,
            gender: gender.includes('FEMALE') ? 'FEMALE' : 'MALE',
            shiftName: shiftName || 'General GE',
            present: present,
            leave: leave,
            firstDate: firstDate || fallbackDate,
            inTime: inTime,
            outTime: outTime,
            late: late,
            lateMinutes: lateMins,
            isLateOver15: isLateOver15,
            workHrs: workHrs
          });

          const isPresentYes = String(present).toLowerCase() === 'yes';
          const isOffShift = shiftName.toLowerCase().includes('off');
          const isHighHours = workHrs >= 19;
          if ((isOffShift && isPresentYes) || isHighHours) {
            extractedDotRecords.push({
              epfNo: rawNum,
              fullName: rawFullName,
              department: currentDept,
              unit: currentUnit,
              shiftName: shiftName,
              present: present,
              firstDate: firstDate || fallbackDate,
              workHrs: workHrs,
              inTime: inTime,
              outTime: outTime,
              isDot: isOffShift && isPresentYes,
              is24Hours: isHighHours
            });
          }
        }

        const effectiveReportDate = fallbackDate || new Date().toISOString().split('T')[0];

        const payload = {
          reportDate: effectiveReportDate,
          rawDateStr: fallbackDate,
          uploadedBy: user.name || user.username,
          records: extractedHeadcountRecords
        };

        const res = await api.saveDailyHeadcount(payload);

        if (extractedDotRecords.length > 0) {
          try {
            await api.saveAttendanceAudit({
              reportDate: effectiveReportDate,
              rawDateStr: fallbackDate,
              uploadedBy: user.name || user.username,
              totalReportRows: extractedHeadcountRecords.length,
              records: extractedDotRecords
            });
          } catch (syncErr) {
            console.warn('DOT sync background notice:', syncErr);
          }
        }

        setMessage({
          type: 'success',
          text: `Daily Headcount for ${effectiveReportDate} saved successfully! Headcount: ${res.headcount?.headcount || extractedHeadcountRecords.length} (excl. 00001). Male: ${res.headcount?.maleCount}, Female: ${res.headcount?.femaleCount}, Present: ${res.headcount?.presentCount}, Leave: ${res.headcount?.leaveCount}, Late > 15m: ${res.headcount?.lateOver15Count}.`
        });

        setFilterMode('single');
        setSelectedDate(effectiveReportDate);
        await loadHeadcountData({ mode: 'single', date: effectiveReportDate });
      } catch (err) {
        console.error('File parse error:', err);
        setMessage({ type: 'error', text: err.message || 'Failed to process attendance file' });
      } finally {
        setUploading(false);
      }
    };

    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDeleteReport = async () => {
    if (!headcountData?.reportDate) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the Daily Headcount report for ${headcountData.reportDate}?`
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await api.deleteDailyHeadcount(headcountData.reportDate);
      setMessage({ type: 'success', text: `Daily Headcount for ${headcountData.reportDate} was deleted.` });
      await loadHeadcountData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete report' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId, epfNo, name) => {
    if (!headcountData?.reportDate) return;
    const confirmDelete = window.confirm(`Remove employee #${epfNo} (${name}) from this headcount report?`);
    if (!confirmDelete) return;

    try {
      await api.deleteHeadcountRecord(headcountData.reportDate, recordId);
      setMessage({ type: 'success', text: `Employee #${epfNo} removed.` });
      await loadHeadcountData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to remove employee' });
    }
  };

  const handleSaveEdit = async (data) => {
    if (!editingRecord || !headcountData) return;
    try {
      await api.updateHeadcountRecord(headcountData.reportDate, editingRecord._id, data);
      setMessage({ type: 'success', text: `Employee #${data.epfNo} record updated.` });
      setEditingRecord(null);
      await loadHeadcountData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update record' });
    }
  };

  const handleAddEmployee = async (data) => {
    if (!headcountData?.reportDate) return;
    try {
      await api.addHeadcountRecord(headcountData.reportDate, data);
      setMessage({ type: 'success', text: `Employee #${data.epfNo} added.` });
      setShowAddModal(false);
      await loadHeadcountData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add employee' });
    }
  };

  const allRecords = headcountData?.records || [];

  const filteredRecords = allRecords.filter((r) => {
    const epf = String(r.epfNo || '').trim();
    if (epf === '00001' || epf === '1' || epf.endsWith('00001')) return false;

    if (genderFilter !== 'ALL' && String(r.gender).toUpperCase() !== genderFilter) return false;
    if (statusFilter === 'PRESENT' && String(r.present).toLowerCase() !== 'yes') return false;
    if (statusFilter === 'ABSENT' && String(r.present).toLowerCase() === 'yes') return false;
    if (statusFilter === 'LEAVE' && String(r.leave).toLowerCase() !== 'yes') return false;
    if (statusFilter === 'LATE' && !r.isLateOver15 && parseMinutes(r.late) <= 15) return false;

    if (deptFilter !== 'ALL' && (r.department || 'General') !== deptFilter) return false;
    if (unitFilter !== 'ALL' && (r.unit || 'General') !== unitFilter) return false;

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchEpf = String(r.epfNo || '').toLowerCase().includes(q);
      const matchName = String(r.fullName || '').toLowerCase().includes(q);
      const matchDept = String(r.department || '').toLowerCase().includes(q);
      const matchUnit = String(r.unit || '').toLowerCase().includes(q);
      const matchShift = String(r.shiftName || '').toLowerCase().includes(q);
      const matchDate = String(r.firstDate || r.reportDate || '').toLowerCase().includes(q);
      return matchEpf || matchName || matchDept || matchUnit || matchShift || matchDate;
    }
    return true;
  });

  const uniqueDepartments = Array.from(new Set(allRecords.map(r => r.department || 'General'))).sort();
  const availableUnitsForDept = Array.from(
    new Set(
      allRecords
        .filter(r => deptFilter === 'ALL' || (r.department || 'General') === deptFilter)
        .map(r => r.unit || 'General')
    )
  ).sort();

  const totalHeadcount = headcountData?.headcount || 0;
  const maleCount = headcountData?.maleCount || 0;
  const femaleCount = headcountData?.femaleCount || 0;
  const presentCount = headcountData?.presentCount || 0;
  const absentCount = headcountData?.absentCount || 0;
  const leaveCount = headcountData?.leaveCount || 0;
  const lateOver15Count = headcountData?.lateOver15Count || 0;

  const attendanceBarData = [
    { category: 'Present', count: presentCount, fill: '#10b981' },
    { category: 'Absent', count: absentCount, fill: '#64748b' },
    { category: 'On Leave', count: leaveCount, fill: '#f59e0b' },
    { category: 'Late > 15m', count: lateOver15Count, fill: '#f43f5e' }
  ];

  const deptSummaryMap = {};
  allRecords.forEach(r => {
    const d = r.department || 'General';
    if (!deptSummaryMap[d]) {
      deptSummaryMap[d] = { department: d, total: 0, present: 0, late: 0 };
    }
    deptSummaryMap[d].total++;
    if (String(r.present).toLowerCase() === 'yes') deptSummaryMap[d].present++;
    if (r.isLateOver15 || parseMinutes(r.late) > 15) deptSummaryMap[d].late++;
  });
  const deptChartData = Object.values(deptSummaryMap).sort((a, b) => b.total - a.total);
  const dailyTimelineData = headcountData?.dailyTimeline || [];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Daily Headcount & Attendance Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Plant-wide Workforce Demographics • Gender Distribution • Leave & Late Arrival Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <label className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
              uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700 active:scale-98'
            }`}>
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Parsing...' : 'Upload Attendance Report'}</span>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}

          <button
            onClick={() => loadHeadcountData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' :
          message.type === 'info' ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300' :
          'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* PERIOD FILTER CONTROLS BAR (Single Day, Month-Wise, Date Range) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => {
                setFilterMode('single');
                loadHeadcountData({ mode: 'single', date: selectedDate || (availableDates[0] || '') });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Single Day</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterMode('month');
                const targetM = selectedMonth || (availableMonths[0] || (selectedDate ? selectedDate.slice(0, 7) : ''));
                setSelectedMonth(targetM);
                loadHeadcountData({ mode: 'month', month: targetM });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Month-Wise</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterMode('range');
                const s = startDate || (availableDates.length > 0 ? availableDates[availableDates.length - 1] : '');
                const e = endDate || (availableDates.length > 0 ? availableDates[0] : '');
                setStartDate(s);
                setEndDate(e);
                loadHeadcountData({ mode: 'range', startDate: s, endDate: e });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'range'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Date Range</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {headcountData && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  {filterMode === 'single'
                    ? `1 Day Report Loaded`
                    : `${headcountData.daysCount || 0} Daily Report(s) Combined`}
                </span>
              </span>
            )}
            {filterMode === 'single' && headcountData && canManage && (
              <button
                type="button"
                onClick={handleDeleteReport}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                title="Permanently delete this day's headcount report"
              >
                <span>Delete Day Report</span>
              </button>
            )}
          </div>
        </div>

        {filterMode === 'single' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Select Daily Report:</span>
              </label>
              {availableDates.length > 0 ? (
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    loadHeadcountData({ mode: 'single', date: e.target.value });
                  }}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  {availableDates.map(d => (
                    <option key={d} value={d}>Report: {d}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-400 italic">No reports uploaded yet.</span>
              )}
            </div>

            {headcountData && headcountData.uploadedBy && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Uploaded by: <strong className="text-slate-700 dark:text-slate-200">{headcountData.uploadedBy}</strong>
              </span>
            )}
          </div>
        )}

        {filterMode === 'month' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5 text-purple-500" />
                <span>Select Month:</span>
              </label>
              {availableMonths.length > 0 && (
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    loadHeadcountData({ mode: 'month', month: e.target.value });
                  }}
                  className="px-3 py-1.5 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 bg-purple-50/50 dark:bg-purple-950/40 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{formatMonthName(m)} ({m})</option>
                  ))}
                </select>
              )}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    loadHeadcountData({ mode: 'month', month: e.target.value });
                  }
                }}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        )}

        {filterMode === 'range' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5 text-emerald-500" />
                <span>From:</span>
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
              />

              <span className="font-bold text-slate-700 dark:text-slate-300">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="button"
                onClick={() => {
                  if (startDate && endDate) {
                    loadHeadcountData({ mode: 'range', startDate, endDate });
                  } else {
                    setMessage({ type: 'error', text: 'Please select both start and end date.' });
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Apply Range</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetRange(7)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetRange(30)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={handleAllDates}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                All Available Dates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DISTINCT 5 KPI CARDS (HEAD COUNT, GENDER, ATTENDANCE, LEAVE CLICKABLE, LATE > 15M CLICKABLE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total HEAD COUNT */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-cyan-200 dark:border-cyan-900/50 p-4 shadow-2xs bg-cyan-50/20 dark:bg-cyan-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-600" />
              <span>HEAD COUNT</span>
            </p>
            <h3 className="text-3xl font-black text-cyan-950 dark:text-cyan-100 mt-1">
              {totalHeadcount}
            </h3>
            <p className="text-[11px] text-cyan-700/90 dark:text-cyan-400 mt-0.5 font-medium">
              Excluding #00001 Admin
            </p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </span>
        </div>

        {/* Card 2: Gender Demographics (Male / Female) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/50 p-4 shadow-2xs bg-blue-50/20 dark:bg-blue-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300">
              GENDER DEMOGRAPHICS
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-900 dark:text-blue-100">
                {maleCount} <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Male</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-2xl font-black text-pink-600 dark:text-pink-400">
                {femaleCount} <span className="text-xs font-bold text-pink-600 dark:text-pink-400">Female</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {totalHeadcount > 0 ? `${Math.round((maleCount / totalHeadcount) * 100)}% M • ${Math.round((femaleCount / totalHeadcount) * 100)}% F` : '0%'}
            </p>
          </div>
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
            ⚤
          </div>
        </div>

        {/* Card 3: Present vs Absent */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 p-4 shadow-2xs bg-emerald-50/20 dark:bg-emerald-950/20 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ATTENDANCE</span>
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                {presentCount} <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Pres</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-xl font-bold text-slate-600 dark:text-slate-400">
                {absentCount} <span className="text-xs font-semibold">Abs</span>
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400 mt-0.5 font-medium">
              {totalHeadcount > 0 ? `${Math.round((presentCount / totalHeadcount) * 100)}% Attendance Rate` : '0%'}
            </p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </span>
        </div>

        {/* Card 4: Leave = 'Yes' (CLICKABLE DRILLDOWN) */}
        <div
          onClick={() => setDrilldownModal('leave')}
          className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 p-4 shadow-xs bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between cursor-pointer hover:border-amber-500 dark:hover:border-amber-600 hover:shadow-md transition-all active:scale-98 group"
          title="Click to view list of employees on Leave"
        >
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>LEAVE = 'YES'</span>
            </p>
            <h3 className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-1">
              {leaveCount}
            </h3>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-bold flex items-center gap-0.5 group-hover:underline">
              <span>View Employee List</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </span>
        </div>

        {/* Card 5: Late > 00:15 (CLICKABLE DRILLDOWN) */}
        <div
          onClick={() => setDrilldownModal('late')}
          className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 p-4 shadow-xs bg-rose-50/30 dark:bg-rose-950/20 flex items-center justify-between cursor-pointer hover:border-rose-500 dark:hover:border-rose-600 hover:shadow-md transition-all active:scale-98 group"
          title="Click to view list of employees Late > 15 minutes"
        >
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>LATE &gt; 00:15</span>
            </p>
            <h3 className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-1">
              {lateOver15Count}
            </h3>
            <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 font-bold flex items-center gap-0.5 group-hover:underline">
              <span>View Employee List</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
          <span className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
            <XCircle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* FILTER BAR: Status, Gender, Department, Unit, Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Records ({allRecords.length})
            </button>
            <button
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'PRESENT'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              onClick={() => setStatusFilter('ABSENT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'ABSENT'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Absent ({absentCount})
            </button>
            <button
              onClick={() => setStatusFilter('LEAVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'LEAVE'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              Leave ({leaveCount})
            </button>
            <button
              onClick={() => setStatusFilter('LATE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                statusFilter === 'LATE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              Late &gt; 15m ({lateOver15Count})
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Gender:</span>
            <button
              onClick={() => setGenderFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                genderFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setGenderFilter('MALE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                genderFilter === 'MALE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              Male ({maleCount})
            </button>
            <button
              onClick={() => setGenderFilter('FEMALE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                genderFilter === 'FEMALE'
                  ? 'bg-pink-600 text-white'
                  : 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 hover:bg-pink-100'
              }`}
            >
              Female ({femaleCount})
            </button>
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <label className="font-bold text-slate-600 dark:text-slate-300">Dept:</label>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setUnitFilter('ALL');
                }}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">All Departments ({allRecords.length})</option>
                {uniqueDepartments.map(dept => {
                  const cnt = allRecords.filter(r => (r.department || 'General') === dept).length;
                  return (
                    <option key={dept} value={dept}>{dept} ({cnt})</option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <label className="font-bold text-slate-600 dark:text-slate-300">Unit:</label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">All Units ({availableUnitsForDept.length})</option>
                {availableUnitsForDept.map(unit => {
                  const cnt = allRecords.filter(r =>
                    (deptFilter === 'ALL' || (r.department || 'General') === deptFilter) &&
                    (r.unit || 'General') === unit
                  ).length;
                  return (
                    <option key={unit} value={unit}>{unit} ({cnt})</option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search EPF, Name, Dept, Unit, Shift, Date..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* MAIN EMPLOYEE ATTENDANCE TABLE */}
      <DailyHeadcountTable
        records={filteredRecords}
        allRecordsCount={allRecords.length}
        canManage={canManage}
        selectedDate={selectedDate}
        filterMode={filterMode}
        selectedMonth={selectedMonth}
        startDate={startDate}
        endDate={endDate}
        formatMonthName={formatMonthName}
        parseMinutes={parseMinutes}
        onEdit={(rec) => setEditingRecord(rec)}
        onDelete={handleDeleteRecord}
        onAddNew={() => setShowAddModal(true)}
      />

      {/* VISUAL ANALYTICS SECTION */}
      {headcountData && allRecords.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>Plant Attendance Breakdown</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val} Employees`, 'Count']}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {attendanceBarData.map((entry, index) => (
                      <Cell key={`attendance-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-500" />
              <span>Department Headcount & Punctuality</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="total" name="Total Headcount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late > 15m" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Chart in Multi-Day Mode */}
      {dailyTimelineData.length > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-cyan-500" />
            <span>Daily Headcount & Attendance Timeline Trend</span>
          </h4>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="headcount" name="Headcount" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leave" name="Leave = Yes" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lateOver15" name="Late > 15m" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MODALS */}
      <LeaveDrilldownModal
        isOpen={drilldownModal === 'leave'}
        onClose={() => setDrilldownModal(null)}
        records={allRecords.filter(r => String(r.leave).toLowerCase() === 'yes' && r.epfNo !== '00001' && r.epfNo !== '1')}
        selectedDate={selectedDate}
      />

      <LateDrilldownModal
        isOpen={drilldownModal === 'late'}
        onClose={() => setDrilldownModal(null)}
        records={allRecords.filter(r => (r.isLateOver15 || parseMinutes(r.late) > 15) && r.epfNo !== '00001' && r.epfNo !== '1')}
        selectedDate={selectedDate}
        parseMinutes={parseMinutes}
      />

      <EditRecordModal
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
      />

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddEmployee}
      />
    </div>
  );
}

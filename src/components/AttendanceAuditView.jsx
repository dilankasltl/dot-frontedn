import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Trash2,
  FileCheck,
  ShieldCheck,
  Building,
  Info,
  Edit3,
  PlusCircle,
  X,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  CalendarRange
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

export default function AttendanceAuditView({ user }) {
  // Filter View Mode: 'single' | 'month' | 'range'
  const [filterMode, setFilterMode] = useState('single');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [availableDates, setAvailableDates] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableAudits, setAvailableAudits] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [graphTab, setGraphTab] = useState('all'); // 'all' | 'trend' | 'dept' | 'unit' | '24hrs' | 'status'
  
  // Table filters & search
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'NOT_APPROVED' | 'PENDING'
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'DOT' | '24_HRS'
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [presentOnly, setPresentOnly] = useState(true); // default: show people who attended/worked

  // Check upload & edit permissions (canManageAttendance, Mr. Nimesh, or Admin)
  const canManage = !!user.canManageAttendance || user.username === 'Nimesh' || user.name?.toLowerCase().includes('nimesh') || user.username === 'Admin' || user.role === 'admin';
  const canUpload = canManage;

  // Edit single record modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editShiftName, setEditShiftName] = useState('Off');
  const [editPresent, setEditPresent] = useState('Yes');
  const [editWorkHrs, setEditWorkHrs] = useState(0);
  const [editDotReason, setEditDotReason] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editUnit, setEditUnit] = useState('');

  // Add manual record modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEpfNo, setNewEpfNo] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newShiftName, setNewShiftName] = useState('Off');
  const [newPresent, setNewPresent] = useState('Yes');
  const [newWorkHrs, setNewWorkHrs] = useState(12);
  const [newDepartment, setNewDepartment] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // Format month string helper (e.g. '2026-10' -> 'October 2026')
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

  // Quick Presets for Date Range mode
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
    loadAuditData({ mode: 'range', startDate: startStr, endDate: latestDateStr });
  };

  const handleAllDates = () => {
    if (availableDates.length === 0) return;
    const sorted = [...availableDates].sort();
    const startStr = sorted[0];
    const endStr = sorted[sorted.length - 1];
    setStartDate(startStr);
    setEndDate(endStr);
    loadAuditData({ mode: 'range', startDate: startStr, endDate: endStr });
  };

  // Load audit data supporting single date, month, or custom date range
  const loadAuditData = async (paramOverrides = {}) => {
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

      const data = await api.getAttendanceAudit(queryParams);
      setAvailableDates(data.availableDates || []);
      setAvailableMonths(data.availableMonths || []);
      setAvailableAudits(data.availableAudits || []);
      setAuditData(data.audit || null);

      if (data.filterMode) {
        setFilterMode(data.filterMode);
      }

      if (data.targetMonth) {
        setSelectedMonth(data.targetMonth);
      } else if (!selectedMonth && data.availableMonths && data.availableMonths.length > 0) {
        setSelectedMonth(data.availableMonths[0]);
      }

      if (data.startDate && data.endDate) {
        setStartDate(data.startDate);
        setEndDate(data.endDate);
      } else if (!startDate && data.availableDates && data.availableDates.length > 0) {
        setStartDate(data.availableDates[data.availableDates.length - 1]);
        setEndDate(data.availableDates[0]);
      }

      if (data.filterMode === 'single') {
        if (data.audit && data.audit.reportDate) {
          setSelectedDate(data.audit.reportDate);
        } else if (queryParams.date) {
          setSelectedDate(queryParams.date);
        } else if (data.availableDates && data.availableDates.length > 0 && !selectedDate) {
          setSelectedDate(data.availableDates[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load attendance audit', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load attendance audit' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  // Handle file upload and client-side memory parsing (NO Excel saved in DB!)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: 'info', text: `Analyzing attendance file "${file.name}" in memory...` });

    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const binaryStr = evt.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Parse sheet to raw 2D array of rows
        const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        if (!rawRows || rawRows.length < 3) {
          throw new Error('Attendance file appears to be empty or unrecognized format.');
        }

        // 1. Detect report date from header (e.g., "Daily Attendance Report For: 10/16/2026")
        let extractedDateStr = '';
        for (let i = 0; i < Math.min(5, rawRows.length); i++) {
          const rowStr = rawRows[i].join(' ');
          const dateMatch = rowStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dateMatch) {
            extractedDateStr = dateMatch[1];
            break;
          }
        }

        // 2. Locate table column headers row
        let headerRowIndex = -1;
        let colMap = {};

        for (let i = 0; i < Math.min(10, rawRows.length); i++) {
          const row = rawRows[i].map(c => String(c).trim().toLowerCase());
          const hasNumber = row.some(c => c === 'number' || c === 'epf no' || c === 'epf');
          const hasShift = row.some(c => c === 'shift name' || c === 'shift');

          if (hasNumber && hasShift) {
            headerRowIndex = i;
            row.forEach((colName, colIdx) => {
              if (colName === 'department') colMap.department = colIdx;
              if (colName === 'unit') colMap.unit = colIdx;
              if (colName === 'number' || colName === 'epf no' || colName === 'epf') colMap.number = colIdx;
              if (colName === 'full name' || colName === 'name') colMap.fullName = colIdx;
              if (colName === 'shift name' || colName === 'shift') colMap.shiftName = colIdx;
              if (colName === 'present') colMap.present = colIdx;
              if (colName === 'first date' || colName === 'date') colMap.firstDate = colIdx;
              if (colName === 'in time') colMap.inTime = colIdx;
              if (colName === 'out time') colMap.outTime = colIdx;
              if (colName === 'work hrs' || colName === 'work hours' || colName === 'work hour') colMap.workHrs = colIdx;
            });
            break;
          }
        }

        if (headerRowIndex === -1 || colMap.number === undefined) {
          throw new Error('Could not identify table headers (Number/EPF, Shift Name, Work Hrs). Please check the file.');
        }

        // 3. Extract and filter rows according to:
        //    A) Double OT: Shift Name === 'off' AND Present === 'yes'
        //    B) 24 Hours Duty: Work Hrs >= 19
        const extractedDotRecords = [];
        let totalCount = 0;
        let fallbackDate = extractedDateStr;

        let currentDept = 'General';
        let currentUnit = 'General';

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];

          // Carry forward hierarchical Department and Unit section headers
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

          totalCount++;

          const rawFullName = colMap.fullName !== undefined ? String(row[colMap.fullName] || '').trim() : '';
          const shiftName = colMap.shiftName !== undefined ? String(row[colMap.shiftName] || '').trim() : '';
          const present = colMap.present !== undefined ? String(row[colMap.present] || '').trim() : 'Yes';
          const firstDate = colMap.firstDate !== undefined ? String(row[colMap.firstDate] || '').trim() : extractedDateStr;
          const workHrsRaw = colMap.workHrs !== undefined ? row[colMap.workHrs] : 0;
          const workHrs = parseFloat(String(workHrsRaw).replace(',', '.')) || 0;
          const inTime = colMap.inTime !== undefined ? String(row[colMap.inTime] || '').trim() : '';
          const outTime = colMap.outTime !== undefined ? String(row[colMap.outTime] || '').trim() : '';

          if (firstDate && !fallbackDate) fallbackDate = firstDate;

          const isPresentYes = String(present || '').trim().toLowerCase() === 'yes';
          const isOffShift = shiftName.toLowerCase() === 'off' || shiftName.toLowerCase().includes('off');
          const isHighHours = workHrs >= 19;

          // Double OT is strictly: Shift = 'off' AND Present = 'yes' (Off day එකේ වැඩ කළ අය)
          // 24 Hours Duty is strictly: Work Hrs >= 19 (පැය 19 හෝ ඊට වැඩි කාලයක් වැඩ කළ අය)
          const isDot = isOffShift && isPresentYes;
          const is24Hours = isHighHours;

          if (isDot || is24Hours) {
            let category = 'DOT';
            let dotReason = '';
            if (isDot && is24Hours) {
              category = 'BOTH';
              dotReason = 'Off Day & 24 Hours Duty';
            } else if (isDot) {
              category = 'DOT';
              dotReason = 'Double OT (Off Day Worked)';
            } else {
              category = '24_HRS';
              dotReason = `24 Hours Duty (${workHrs}h)`;
            }

            extractedDotRecords.push({
              epfNo: rawNum,
              fullName: rawFullName,
              department: currentDept,
              unit: currentUnit,
              shiftName: shiftName || 'Off',
              present: present || 'Yes',
              firstDate: firstDate || fallbackDate,
              workHrs: workHrs,
              inTime: inTime,
              outTime: outTime,
              dotReason: dotReason,
              category: category,
              isDot: isDot,
              is24Hours: is24Hours
            });
          }
        }

        if (extractedDotRecords.length === 0) {
          setMessage({
            type: 'error',
            text: `No Double OT or 24 Hours Duty incidents found in this file (Checked ${totalCount} employee attendance rows).`
          });
          setUploading(false);
          return;
        }

        const effectiveReportDate = fallbackDate || new Date().toISOString().split('T')[0];

        // 4. Send structured records to backend for auto full-name lookup & Mr. Vinod approval cross-referencing
        const payload = {
          reportDate: effectiveReportDate,
          rawDateStr: fallbackDate,
          uploadedBy: user.name || user.username,
          totalReportRows: totalCount,
          records: extractedDotRecords
        };

        const res = await api.saveAttendanceAudit(payload);

        setMessage({
          type: 'success',
          text: `Attendance for date ${effectiveReportDate} processed! Found ${extractedDotRecords.length} incidents: ${res.audit?.dotCount ?? extractedDotRecords.filter(r => r.isDot).length} Double OT (Off Day) & ${res.audit?.twentyFourHrsCount ?? extractedDotRecords.filter(r => r.is24Hours).length} 24 Hours Duty from ${totalCount} attendance records.`
        });

        // Reload fresh audit data
        setFilterMode('single');
        setSelectedDate(effectiveReportDate);
        await loadAuditData({ mode: 'single', date: effectiveReportDate });
      } catch (err) {
        console.error('File parse error:', err);
        setMessage({ type: 'error', text: err.message || 'Failed to process attendance file.' });
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Handle Delete Entire Report for this date
  const handleDeleteReport = async () => {
    if (!selectedDate) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete the Double OT attendance report for date "${selectedDate}"?\n\nThis will permanently delete the report for ALL users (Mr. Dhammika, Mr. Vinod, Mr. Niranjan, Mr. Rohitha, and Admin).`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.deleteAttendanceAudit(selectedDate);
      setMessage({ type: 'success', text: `Attendance report for ${selectedDate} has been deleted for all users.` });
      await loadAuditData();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete attendance report' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Single Record
  const handleDeleteRecord = async (recordId, epfNo, name) => {
    const confirmed = window.confirm(`Remove employee #${epfNo} (${name}) from this date's Double OT audit?`);
    if (!confirmed) return;

    try {
      await api.deleteAttendanceAuditRecord(selectedDate, recordId);
      setMessage({ type: 'success', text: `Employee #${epfNo} removed from audit.` });
      await loadAuditData(selectedDate);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete record' });
    }
  };

  // Handle Save Edit Record
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingRecord) return;
    try {
      await api.updateAttendanceAuditRecord(selectedDate, editingRecord._id, {
        shiftName: editShiftName,
        present: editPresent,
        workHrs: Number(editWorkHrs),
        department: editDepartment,
        unit: editUnit,
        dotReason: editDotReason || (editShiftName.toLowerCase() === 'off' ? 'Shift = Off (Edited)' : `Work Hrs >= 19h (${editWorkHrs}h)`)
      });
      setMessage({ type: 'success', text: `Employee #${editingRecord.epfNo} updated successfully!` });
      setEditingRecord(null);
      await loadAuditData(selectedDate);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update record' });
    }
  };

  // Handle Add Manual Record
  const handleAddManualRecord = async (e) => {
    e.preventDefault();
    if (!newEpfNo.trim()) {
      setMessage({ type: 'error', text: 'EPF Number is required' });
      return;
    }
    try {
      await api.addAttendanceAuditRecord(selectedDate, {
        epfNo: newEpfNo.trim(),
        fullName: newFullName.trim(),
        shiftName: newShiftName,
        present: newPresent,
        workHrs: Number(newWorkHrs),
        department: newDepartment || 'General',
        unit: newUnit || 'General'
      });
      setMessage({ type: 'success', text: `Employee #${newEpfNo} added to ${selectedDate} audit successfully!` });
      setShowAddModal(false);
      setNewEpfNo('');
      setNewFullName('');
      setNewDepartment('');
      setNewUnit('');
      setNewWorkHrs(12);
      await loadAuditData(selectedDate);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add record' });
    }
  };

  // Filter dot records based on user search and filters
  const records = auditData?.dotRecords || [];

  // Unique departments for filter dropdown
  const uniqueDepartments = Array.from(new Set(records.map(r => r.department || 'General').filter(Boolean))).sort();

  // Unique units for selected department (or all units)
  const availableUnitsForDept = Array.from(new Set(
    records
      .filter(r => selectedDeptFilter === 'ALL' || (r.department || 'General') === selectedDeptFilter)
      .map(r => r.unit || 'General')
      .filter(Boolean)
  )).sort();

  const filteredRecords = records.filter(r => {
    // 1. Present filter
    if (presentOnly) {
      const isPresent = String(r.present || '').toLowerCase() === 'yes' || Number(r.workHrs || 0) > 0;
      if (!isPresent) return false;
    }

    // 2. Category filter: 'ALL' | 'DOT' | '24_HRS'
    if (categoryFilter === 'DOT') {
      const isDot = r.isDot || (String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes');
      if (!isDot) return false;
    } else if (categoryFilter === '24_HRS') {
      const is24 = r.is24Hours || Number(r.workHrs || 0) >= 19;
      if (!is24) return false;
    }

    // 3. Status filter
    if (statusFilter === 'APPROVED' && r.vinodStatus !== 'APPROVED') return false;
    if (statusFilter === 'NOT_APPROVED' && r.vinodStatus !== 'NOT_APPROVED') return false;
    if (statusFilter === 'PENDING' && r.vinodStatus !== 'PENDING') return false;

    // 4. Department filter
    if (selectedDeptFilter !== 'ALL' && (r.department || 'General') !== selectedDeptFilter) return false;

    // 5. Unit filter
    if (selectedUnitFilter !== 'ALL' && (r.unit || 'General') !== selectedUnitFilter) return false;

    // 6. Search query
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchEpf = String(r.epfNo || '').toLowerCase().includes(q);
      const matchName = String(r.fullName || '').toLowerCase().includes(q);
      const matchDept = String(r.department || '').toLowerCase().includes(q);
      const matchUnit = String(r.unit || '').toLowerCase().includes(q);
      const matchShift = String(r.shiftName || '').toLowerCase().includes(q);
      const matchDate = String(r.firstDate || r.reportDate || '').toLowerCase().includes(q);
      if (!matchEpf && !matchName && !matchDept && !matchUnit && !matchShift && !matchDate) return false;
    }

    return true;
  });

  // Summary counts
  const totalIncidents = records.length;
  const dotRecordsList = records.filter(r => r.isDot || (String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes'));
  const dotCount = dotRecordsList.length;
  const twentyFourRecordsList = records.filter(r => r.is24Hours || Number(r.workHrs || 0) >= 19);
  const twentyFourHrsCount = twentyFourRecordsList.length;
  const approvedCount = records.filter(r => r.vinodStatus === 'APPROVED').length;
  const notApprovedCount = records.filter(r => r.vinodStatus === 'NOT_APPROVED').length;
  const pendingCount = records.filter(r => r.vinodStatus === 'PENDING').length;
  const bothCount = records.filter(r => (r.isDot || String(r.shiftName).toLowerCase().includes('off')) && (r.is24Hours || Number(r.workHrs || 0) >= 19)).length;

  // Daily Incidents Timeline / Trend (Chronological day-by-day distribution)
  const dailyTrendMap = {};
  records.forEach(r => {
    const d = r.firstDate || r.reportDate || 'Unknown';
    if (!dailyTrendMap[d]) {
      dailyTrendMap[d] = { date: d, dot: 0, twentyFour: 0, approved: 0, total: 0 };
    }
    dailyTrendMap[d].total++;
    const isDot = r.isDot || (String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes');
    const is24 = r.is24Hours || Number(r.workHrs || 0) >= 19;
    if (isDot) dailyTrendMap[d].dot++;
    if (is24) dailyTrendMap[d].twentyFour++;
    if (r.vinodStatus === 'APPROVED') dailyTrendMap[d].approved++;
  });
  const dailyTrendData = Object.values(dailyTrendMap).sort((a, b) => a.date.localeCompare(b.date));

  // Department-Wise Chart Data
  const deptMap = {};
  records.forEach(r => {
    const dept = r.department || 'General';
    if (!deptMap[dept]) {
      deptMap[dept] = { department: dept, dot: 0, twentyFour: 0, approved: 0, total: 0 };
    }
    deptMap[dept].total++;
    const isDot = r.isDot || (String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes');
    const is24 = r.is24Hours || Number(r.workHrs || 0) >= 19;
    if (isDot) deptMap[dept].dot++;
    if (is24) deptMap[dept].twentyFour++;
    if (r.vinodStatus === 'APPROVED') deptMap[dept].approved++;
  });
  const deptChartData = Object.values(deptMap).sort((a, b) => b.total - a.total);

  // Unit-Wise Chart Data
  const unitMap = {};
  records.forEach(r => {
    const unit = r.unit || 'General';
    if (!unitMap[unit]) {
      unitMap[unit] = { unit: unit, dot: 0, twentyFour: 0, approved: 0, total: 0 };
    }
    unitMap[unit].total++;
    const isDot = r.isDot || (String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes');
    const is24 = r.is24Hours || Number(r.workHrs || 0) >= 19;
    if (isDot) unitMap[unit].dot++;
    if (is24) unitMap[unit].twentyFour++;
    if (r.vinodStatus === 'APPROVED') unitMap[unit].approved++;
  });
  const unitChartData = Object.values(unitMap).sort((a, b) => b.total - a.total);

  // Dedicated 24 Hours Duty Breakdown Data
  const twentyFourHoursChartData = [
    { range: '19.0h - 21.9h', count: 0, fill: '#60a5fa' },
    { range: '22.0h - 23.9h', count: 0, fill: '#3b82f6' },
    { range: '24.0h - 24.2h', count: 0, fill: '#2563eb' },
    { range: '> 24.2h (Extreme)', count: 0, fill: '#1d4ed8' }
  ];
  let twentyFourHoursSum = 0;
  let maxTwentyFourHours = 0;
  twentyFourRecordsList.forEach(r => {
    const h = Number(r.workHrs || 0);
    twentyFourHoursSum += h;
    if (h > maxTwentyFourHours) maxTwentyFourHours = h;
    if (h < 22) twentyFourHoursChartData[0].count++;
    else if (h < 24) twentyFourHoursChartData[1].count++;
    else if (h <= 24.2) twentyFourHoursChartData[2].count++;
    else twentyFourHoursChartData[3].count++;
  });
  const avgTwentyFourHours = twentyFourHrsCount > 0 ? (twentyFourHoursSum / twentyFourHrsCount).toFixed(2) : 0;

  // 24 Hours by Department Data
  const twentyFourDeptMap = {};
  twentyFourRecordsList.forEach(r => {
    const d = r.department || 'General';
    twentyFourDeptMap[d] = (twentyFourDeptMap[d] || 0) + 1;
  });
  const twentyFourDeptData = Object.entries(twentyFourDeptMap)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // Analytics chart datasets for this date
  const approvalChartData = [
    { name: 'Vinod Approved', count: approvedCount, fill: '#10b981' },
    ...(pendingCount > 0 ? [{ name: 'Pending Approval', count: pendingCount, fill: '#f59e0b' }] : []),
    { name: 'Not Approved', count: notApprovedCount, fill: '#f43f5e' }
  ];

  // Double OT vs 24 Hours Duty Criteria Comparison
  const dotCriteriaChartData = [
    {
      name: 'Double OT (Shift = Off)',
      count: dotCount,
      fill: '#a855f7'
    },
    {
      name: '24 Hours Duty (Work Hrs ≥ 19h)',
      count: twentyFourHrsCount,
      fill: '#f59e0b'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Daily Attendance vs Double OT Reconciliation Portal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Biometric Attendance Machine Cross-Audit • Shift Off / Work Hrs ≥ 19h Verification against Mr. Vinod's Approvals
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload Button (Mr. Nimesh & Admin) */}
          {canUpload && (
            <label className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
              uploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
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
            onClick={() => loadAuditData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Message Banner */}
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
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => {
                setFilterMode('single');
                loadAuditData({ mode: 'single', date: selectedDate || (availableDates[0] || '') });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'single'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Single Day (දිනපතා)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterMode('month');
                const targetM = selectedMonth || (availableMonths[0] || (selectedDate ? selectedDate.slice(0, 7) : ''));
                setSelectedMonth(targetM);
                loadAuditData({ mode: 'month', month: targetM });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Month-Wise (මාසික)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterMode('range');
                const s = startDate || (availableDates.length > 0 ? availableDates[availableDates.length - 1] : '');
                const e = endDate || (availableDates.length > 0 ? availableDates[0] : '');
                setStartDate(s);
                setEndDate(e);
                loadAuditData({ mode: 'range', startDate: s, endDate: e });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'range'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Date Range (දින පරාසය)</span>
            </button>
          </div>

          {/* Quick Info Badge for active mode */}
          <div className="flex items-center gap-2 text-xs">
            {auditData && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {filterMode === 'single'
                    ? `1 Day Report Loaded`
                    : `${auditData.daysCount || 0} Daily Audit(s) Combined`}
                </span>
              </span>
            )}
            {filterMode === 'single' && auditData && canManage && (
              <button
                type="button"
                onClick={handleDeleteReport}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                title="Permanently delete this day's Double OT report for all users"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Day Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Controls based on selected Filter Mode */}
        {filterMode === 'single' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Select Daily Audit:</span>
              </label>
              {availableDates.length > 0 ? (
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    loadAuditData({ mode: 'single', date: e.target.value });
                  }}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {availableDates.map(d => (
                    <option key={d} value={d}>Report: {d}</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-slate-400 italic">No reports uploaded yet.</span>
              )}
            </div>

            {auditData && auditData.uploadedBy && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Uploaded by: <strong className="text-slate-700 dark:text-slate-200">{auditData.uploadedBy}</strong>
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

              {availableMonths.length > 0 ? (
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    loadAuditData({ mode: 'month', month: e.target.value });
                  }}
                  className="px-3 py-1.5 border border-purple-300 dark:border-purple-800 rounded-xl text-xs font-bold text-purple-900 dark:text-purple-200 bg-purple-50/50 dark:bg-purple-950/40 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>{formatMonthName(m)} ({m})</option>
                  ))}
                </select>
              ) : null}

              {/* Native month picker */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    loadAuditData({ mode: 'month', month: e.target.value });
                  }
                }}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Quick Month Pills */}
            {availableMonths.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">Available:</span>
                {availableMonths.slice(0, 4).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m);
                      loadAuditData({ mode: 'month', month: m });
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      selectedMonth === m
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {formatMonthName(m)}
                  </button>
                ))}
              </div>
            )}
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
                    loadAuditData({ mode: 'range', startDate, endDate });
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

            {/* Quick Range Presets */}
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

      {/* DISTINCT 5 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Active Period Overview */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200 dark:border-blue-900/40 p-4 shadow-2xs bg-blue-50/20 dark:bg-blue-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {filterMode === 'single' ? 'Single Day Audit' : (filterMode === 'month' ? 'Monthly Audit' : 'Date Range Audit')}
            </p>
            <h3 className="text-lg font-black text-blue-900 dark:text-blue-100 mt-1 truncate max-w-[150px]" title={filterMode === 'month' ? formatMonthName(selectedMonth) : (filterMode === 'range' ? `${startDate} to ${endDate}` : selectedDate)}>
              {filterMode === 'month'
                ? formatMonthName(selectedMonth || (auditData?.reportDate ? auditData.reportDate.slice(0,7) : ''))
                : (filterMode === 'range' ? `${startDate || ''} → ${endDate || ''}` : (selectedDate || 'No Date'))}
            </h3>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400 mt-0.5 font-medium">
              {auditData?.daysCount || 1} day(s) • {totalIncidents} incident(s)
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
            <CalendarRange className="w-6 h-6" />
          </span>
        </div>

        {/* Card 2: KPI: Double OT (Off Day Worked) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200 dark:border-purple-900/40 p-4 shadow-2xs bg-purple-50/20 dark:bg-purple-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Double OT (DOT)
            </p>
            <h3 className="text-2xl font-black text-purple-900 dark:text-purple-100 mt-1">{dotCount}</h3>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-400 mt-0.5 font-medium">Shift = 'Off' & Present = 'Yes'</p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </span>
        </div>

        {/* Card 3: KPI: 24 Hours Duty (Work Hrs >= 19h) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-4 shadow-2xs bg-amber-50/20 dark:bg-amber-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> 24 Hours Duty
            </p>
            <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">{twentyFourHrsCount}</h3>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5 font-medium">Work Hrs ≥ 19h Continuous</p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </span>
        </div>

        {/* Card 4: KPI: Approved by Mr. Vinod */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-4 shadow-2xs bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Vinod Approved
            </p>
            <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{approvedCount}</h3>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
              {totalIncidents > 0 ? `${Math.round((approvedCount / totalIncidents) * 100)}% of total incidents` : '0%'}
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </span>
        </div>

        {/* Card 5: KPI: Unauthorized / Not Approved Warning */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-4 shadow-2xs bg-rose-50/20 dark:bg-rose-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Not Approved
            </p>
            <h3 className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">{notApprovedCount}</h3>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5">
              {pendingCount > 0 ? `(${pendingCount} pending in portal)` : 'Requires management audit'}
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Filter Bar: Category, Status, Department, Unit, and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs transition-colors">
        {/* Row 1: Category Filter & Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Category Filter Pills (Double OT vs 24 Hours) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Incidents ({totalIncidents})
            </button>
            <button
              onClick={() => setCategoryFilter('DOT')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === 'DOT'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Double OT ({dotCount})
            </button>
            <button
              onClick={() => setCategoryFilter('24_HRS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                categoryFilter === '24_HRS'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> 24 Hours Duty ({twentyFourHrsCount})
            </button>
          </div>

          {/* Approval Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Vinod Status:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('NOT_APPROVED')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                statusFilter === 'NOT_APPROVED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Not Approved ({notApprovedCount})
            </button>
            {pendingCount > 0 && (
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Pending ({pendingCount})
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Department Dropdown, Unit Dropdown, Present Only Toggle, Search */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Department Dropdown */}
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <label className="font-bold text-slate-600 dark:text-slate-300">Dept:</label>
              <select
                value={selectedDeptFilter}
                onChange={(e) => {
                  setSelectedDeptFilter(e.target.value);
                  setSelectedUnitFilter('ALL');
                }}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Departments ({records.length})</option>
                {uniqueDepartments.map(dept => {
                  const cnt = records.filter(r => (r.department || 'General') === dept).length;
                  return (
                    <option key={dept} value={dept}>{dept} ({cnt})</option>
                  );
                })}
              </select>
            </div>

            {/* Unit Dropdown */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <label className="font-bold text-slate-600 dark:text-slate-300">Unit:</label>
              <select
                value={selectedUnitFilter}
                onChange={(e) => setSelectedUnitFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Units ({availableUnitsForDept.length})</option>
                {availableUnitsForDept.map(unit => {
                  const cnt = records.filter(r => 
                    (selectedDeptFilter === 'ALL' || (r.department || 'General') === selectedDeptFilter) && 
                    (r.unit || 'General') === unit
                  ).length;
                  return (
                    <option key={unit} value={unit}>{unit} ({cnt})</option>
                  );
                })}
              </select>
            </div>

            {/* Present Only Toggle */}
            <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none ml-1">
              <input
                type="checkbox"
                checked={presentOnly}
                onChange={(e) => setPresentOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Present Only (Attended)</span>
            </label>
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search EPF, Name, Dept, Unit, Shift..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Double OT & 24 Hours Reconciliation Table</span>
              {filterMode === 'month' && selectedMonth && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300">
                  {formatMonthName(selectedMonth)}
                </span>
              )}
              {filterMode === 'range' && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  {startDate} to {endDate}
                </span>
              )}
              {filterMode === 'single' && selectedDate && (
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
                  {selectedDate}
                </span>
              )}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                ({filteredRecords.length} records)
              </span>
            </h3>
            <span className="text-[11px] text-slate-400 block w-full sm:w-auto">
              Double OT: (Shift = 'Off' & Present = 'Yes') • 24 Hours Duty: (Work Hrs ≥ 19)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canManage && auditData && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Add Employee
              </button>
            )}

            {filteredRecords.length > 0 && (
              <button
                onClick={() => {
                  const periodTag = filterMode === 'month' ? (selectedMonth || 'Month') : (filterMode === 'range' ? `${startDate}_to_${endDate}` : (selectedDate || 'Report'));
                  const ws = XLSX.utils.json_to_sheet(filteredRecords.map(r => ({
                    'EPF NO': r.epfNo,
                    'Full Name': r.fullName,
                    'Date': r.firstDate || r.reportDate || selectedDate,
                    'Department': r.department || 'General',
                    'Unit': r.unit || 'General',
                    'Category': r.isDot && r.is24Hours ? 'Both (Off Day & 24h)' : (r.isDot ? 'Double OT (Off Day)' : '24 Hours Duty'),
                    'Shift Name': r.shiftName,
                    'Present': r.present,
                    'Work Hrs': r.workHrs,
                    'DOT / Duty Reason': r.dotReason,
                    'Mr. Vinod Approval': r.vinodStatus,
                    'Req Number': r.vinodReqNumber || 'None'
                  })));
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'DOT_24Hrs_Audit');
                  XLSX.writeFile(wb, `DOT_24Hrs_Attendance_Audit_${periodTag}.xlsx`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading attendance reconciliation report...</div>
        ) : !auditData ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-slate-600 dark:text-slate-400">No attendance report loaded for this period.</p>
            {canUpload && (
              <p className="text-slate-400 mt-1">Please upload the biometric attendance CSV or Excel file above to begin reconciliation.</p>
            )}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No Double OT or 24 Hours Duty records matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3">Number (EPF)</th>
                  <th className="py-3 px-3">Full Name (Auto-Matched)</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Shift Name</th>
                  <th className="py-3 px-3 text-center">Present</th>
                  <th className="py-3 px-3 text-center">Work Hrs</th>
                  <th className="py-3 px-3">DOT / Duty Reason</th>
                  <th className="py-3 px-3 text-right">Mr. Vinod Approval</th>
                  {canManage && <th className="py-3 px-3 text-center">Manage</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredRecords.map((r, idx) => {
                  const isOffDay = r.isDot || (String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes');
                  const is24h = r.is24Hours || Number(r.workHrs || 0) >= 19;

                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {/* 1. EPF Number */}
                      <td className="py-3 px-3 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {r.epfNo}
                      </td>

                      {/* 2. Full Name (Auto-Matched) */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {r.fullName}
                      </td>

                      {/* 3. Date */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.firstDate || r.reportDate || selectedDate}
                      </td>

                      {/* 4. Department Column */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.department || 'General'}
                        </span>
                      </td>

                      {/* 5. Unit Column */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {r.unit || 'General'}
                        </span>
                      </td>

                      {/* 6. Distinct Category Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isOffDay && is24h ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            Off Day & 24h
                          </span>
                        ) : isOffDay ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-purple-600" /> Double OT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> 24 Hours Duty
                          </span>
                        )}
                      </td>

                      {/* 7. Shift Name */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          String(r.shiftName).toLowerCase() === 'off'
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          {r.shiftName}
                        </span>
                      </td>

                      {/* 8. Present */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          String(r.present).toLowerCase() === 'yes'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}>
                          {r.present}
                        </span>
                      </td>

                      {/* 9. Work Hrs */}
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded font-mono ${
                          r.workHrs >= 19
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-black'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {r.workHrs}h
                        </span>
                      </td>

                      {/* 10. DOT / Duty Reason */}
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          {is24h && <Clock className="w-3 h-3 text-amber-500" />}
                          {isOffDay && <ShieldCheck className="w-3 h-3 text-purple-500" />}
                          {r.dotReason}
                        </span>
                      </td>

                      {/* 11. Mr. Vinod Approval Status */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {r.vinodStatus === 'APPROVED' ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approved by Mr. Vinod</span>
                            </span>
                            {r.vinodReqNumber && (
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {r.vinodReqNumber}
                              </span>
                            )}
                          </div>
                        ) : r.vinodStatus === 'PENDING' ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Pending Approval</span>
                            </span>
                            {r.vinodReqNumber && (
                              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                                {r.vinodReqNumber}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shadow-2xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Not Approved / No Request</span>
                            </span>
                            <span className="text-[10px] text-rose-600/80 dark:text-rose-400 mt-0.5">
                              Unauthorized OT
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 12. Management Actions */}
                      {canManage && (
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(r);
                                setEditShiftName(r.shiftName || 'Off');
                                setEditPresent(r.present || 'Yes');
                                setEditWorkHrs(r.workHrs || 0);
                                setEditDotReason(r.dotReason || '');
                                setEditDepartment(r.department || '');
                                setEditUnit(r.unit || '');
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit this employee's record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(r._id, r.epfNo, r.fullName)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Remove this employee from audit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* GRAPH & VISUAL ANALYTICS SECTION UNDER TABLE */}
      {auditData && records.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Double OT & 24 Hours Duty Visual Analytics</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {filterMode === 'month'
                      ? formatMonthName(selectedMonth || (auditData?.reportDate ? auditData.reportDate.slice(0, 7) : ''))
                      : (filterMode === 'range' ? `${startDate} to ${endDate}` : selectedDate)}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visual breakdown across Daily Timelines, Departments, Units, 24 Hours Duty shifts, and Mr. Vinod's Approvals
                </p>
              </div>
            </div>

            {/* Sub-tab view toggle */}
            <div className="flex flex-wrap rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs gap-1">
              <button
                onClick={() => setGraphTab('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  graphTab === 'all'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Visuals
              </button>
              {dailyTrendData.length > 1 && (
                <button
                  onClick={() => setGraphTab('trend')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    graphTab === 'trend'
                      ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" /> Daily Timeline ({dailyTrendData.length}d)
                </button>
              )}
              <button
                onClick={() => setGraphTab('dept')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  graphTab === 'dept'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" /> Department-Wise
              </button>
              <button
                onClick={() => setGraphTab('unit')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  graphTab === 'unit'
                    ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Unit-Wise
              </button>
              <button
                onClick={() => setGraphTab('24hrs')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  graphTab === '24hrs'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> 24 Hours Duty ({twentyFourHrsCount})
              </button>
              <button
                onClick={() => setGraphTab('status')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  graphTab === 'status'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Vinod Approval
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60">
              <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 block">Double OT (Shift = Off)</span>
              <span className="text-xl font-black text-purple-900 dark:text-purple-200 mt-0.5 block">
                {dotCount} <span className="text-xs font-semibold">({records.length > 0 ? Math.round((dotCount / records.length) * 100) : 0}%)</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">24 Hours Duty (Work Hrs ≥ 19h)</span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5 block">
                {twentyFourHrsCount} <span className="text-xs font-semibold">({records.length > 0 ? Math.round((twentyFourHrsCount / records.length) * 100) : 0}%)</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">Authorized by Mr. Vinod</span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5 block">
                {approvedCount} <span className="text-xs font-semibold">({records.length > 0 ? Math.round((approvedCount / records.length) * 100) : 0}%)</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">Not Approved / No Request</span>
              <span className="text-xl font-black text-rose-900 dark:text-rose-200 mt-0.5 block">
                {notApprovedCount} <span className="text-xs font-semibold">({records.length > 0 ? Math.round((notApprovedCount / records.length) * 100) : 0}%)</span>
              </span>
            </div>
          </div>

          {/* CHARTS CONTAINER */}
          <div className="space-y-6">
            {/* 0. DAILY TIMELINE TREND GRAPH (Especially useful in Month-Wise and Range modes) */}
            {(graphTab === 'all' || graphTab === 'trend') && dailyTrendData.length > 1 && (
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CalendarRange className="w-3.5 h-3.5 text-indigo-500" />
                    Daily Incidents Trend: Day-by-Day Double OT vs 24 Hours Duty vs Vinod Approved
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {dailyTrendData.length} Audited Days Chronological Progression
                  </span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="dot" name="Double OT (Off Day)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="twentyFour" name="24 Hours Duty" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" name="Vinod Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 1. DEPARTMENT-WISE GRAPH */}
            {(graphTab === 'all' || graphTab === 'dept') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    Department-Wise Breakdown: Double OT vs 24 Hours Duty vs Vinod Approved
                  </h4>
                  <span className="text-[10px] text-slate-400">Headcount by Department</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="dot" name="Double OT (Off Day)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="twentyFour" name="24 Hours Duty" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="approved" name="Vinod Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 2. UNIT-WISE GRAPH */}
            {(graphTab === 'all' || graphTab === 'unit') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    Unit-Wise Distribution: Double OT vs 24 Hours Duty
                  </h4>
                  <span className="text-[10px] text-slate-400">Headcount by Factory Unit</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="unit" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="dot" name="Double OT (Off Day)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="twentyFour" name="24 Hours Duty" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* 3. DEDICATED 24 HOURS DUTY SECTION */}
            {(graphTab === 'all' || graphTab === '24hrs') && (
              <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/60 dark:border-amber-900/40">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>24 Hours Duty Dedicated Analytics (Work Hrs ≥ 19h)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                          {twentyFourHrsCount} Continuous Workers
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Classified strictly as 24 Hours Duty separate from Double OT
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 font-bold text-amber-800 dark:text-amber-300">
                      Avg Shift: <span className="font-mono">{avgTwentyFourHours}h</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900 font-bold text-amber-800 dark:text-amber-300">
                      Max Shift: <span className="font-mono">{maxTwentyFourHours}h</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Chart 3A: Continuous Hours Range Breakdown */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      Work Hours Range Breakdown (Continuous Shift Duration)
                    </h5>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={twentyFourHoursChartData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px'
                            }}
                            formatter={(val) => [`${val} Workers`, 'Headcount']}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {twentyFourHoursChartData.map((entry, index) => (
                              <Cell key={`twentyFour-cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3B: 24 Hours Duty by Department */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      24 Hours Workers by Department
                    </h5>
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={twentyFourDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              borderColor: '#334155',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px'
                            }}
                            formatter={(val) => [`${val} Workers`, '24 Hours Duty']}
                          />
                          <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. VINOD APPROVAL STATUS DISTRIBUTION */}
            {(graphTab === 'all' || graphTab === 'status') && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Mr. Vinod Approval Status Distribution
                  </h4>
                  <span className="text-[10px] text-slate-400">Headcount</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={approvalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderColor: '#334155',
                          borderRadius: '10px',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                        formatter={(val) => [`${val} Employees`, 'Headcount']}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {approvalChartData.map((entry, index) => (
                          <Cell key={`approval-cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL (Includes Department and Unit) */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Edit Record — #{editingRecord.epfNo} ({editingRecord.fullName})
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    placeholder="e.g. Production"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="e.g. Mixing, Press Lines"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editShiftName}
                    onChange={(e) => setEditShiftName(e.target.value)}
                    placeholder="e.g. Off, Night, Day"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Present
                  </label>
                  <select
                    value={editPresent}
                    onChange={(e) => setEditPresent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Hours
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editWorkHrs}
                  onChange={(e) => setEditWorkHrs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  DOT / Duty Reason
                </label>
                <input
                  type="text"
                  value={editDotReason}
                  onChange={(e) => setEditDotReason(e.target.value)}
                  placeholder="e.g. Shift = Off (Worked on Off Day) or 24 Hours Duty"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MANUAL RECORD MODAL (Includes Department and Unit) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                Add Employee to {selectedDate} Audit
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualRecord} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    EPF Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1195"
                    value={newEpfNo}
                    onChange={(e) => setNewEpfNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Production"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-match"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mixing"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Present
                  </label>
                  <select
                    value={newPresent}
                    onChange={(e) => setNewPresent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Work Hrs
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newWorkHrs}
                    onChange={(e) => setNewWorkHrs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  Add to Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

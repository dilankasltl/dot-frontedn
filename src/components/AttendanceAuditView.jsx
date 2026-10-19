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
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../api';

export default function AttendanceAuditView({ user }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Table filters & search
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'APPROVED' | 'NOT_APPROVED' | 'PENDING' | 'OFF_SHIFT' | 'HIGH_HOURS'
  const [presentOnly, setPresentOnly] = useState(true); // default: show people who attended/worked

  // Check upload & edit permissions (Mr. Nimesh & Admin)
  const canManage = user.username === 'Nimesh' || user.name?.toLowerCase().includes('nimesh') || user.username === 'Admin' || user.role === 'admin';
  const canUpload = canManage;

  // Edit single record modal state
  const [editingRecord, setEditingRecord] = useState(null);
  const [editShiftName, setEditShiftName] = useState('Off');
  const [editPresent, setEditPresent] = useState('Yes');
  const [editWorkHrs, setEditWorkHrs] = useState(0);
  const [editDotReason, setEditDotReason] = useState('');

  // Add manual record modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEpfNo, setNewEpfNo] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newShiftName, setNewShiftName] = useState('Off');
  const [newPresent, setNewPresent] = useState('Yes');
  const [newWorkHrs, setNewWorkHrs] = useState(12);
  const [newDepartment, setNewDepartment] = useState('');

  // Load audit data for a given date
  const loadAuditData = async (dateToLoad = '') => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await api.getAttendanceAudit(dateToLoad);
      setAvailableDates(data.availableDates || []);
      setAuditData(data.audit || null);
      if (data.audit && data.audit.reportDate) {
        setSelectedDate(data.audit.reportDate);
      } else if (dateToLoad) {
        setSelectedDate(dateToLoad);
      } else if (data.availableDates && data.availableDates.length > 0) {
        setSelectedDate(data.availableDates[0]);
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

        // 3. Extract and filter rows according to the Double OT conditions:
        //    Condition A: Shift Name === 'off'
        //    Condition B: Work Hrs >= 19
        const extractedDotRecords = [];
        let totalCount = 0;
        let fallbackDate = extractedDateStr;

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          const rawNum = String(row[colMap.number] || '').trim();
          if (!rawNum || rawNum.toLowerCase().includes('total') || rawNum.length > 10) continue;

          totalCount++;

          const rawFullName = colMap.fullName !== undefined ? String(row[colMap.fullName] || '').trim() : '';
          const shiftName = colMap.shiftName !== undefined ? String(row[colMap.shiftName] || '').trim() : '';
          const present = colMap.present !== undefined ? String(row[colMap.present] || '').trim() : 'Yes';
          const firstDate = colMap.firstDate !== undefined ? String(row[colMap.firstDate] || '').trim() : extractedDateStr;
          const workHrsRaw = colMap.workHrs !== undefined ? row[colMap.workHrs] : 0;
          const workHrs = parseFloat(String(workHrsRaw).replace(',', '.')) || 0;
          const dept = colMap.department !== undefined ? String(row[colMap.department] || '').trim() : '';
          const unit = colMap.unit !== undefined ? String(row[colMap.unit] || '').trim() : '';
          const inTime = colMap.inTime !== undefined ? String(row[colMap.inTime] || '').trim() : '';
          const outTime = colMap.outTime !== undefined ? String(row[colMap.outTime] || '').trim() : '';

          if (firstDate && !fallbackDate) fallbackDate = firstDate;

          const isPresentYes = String(present || '').trim().toLowerCase() === 'yes';
          const isOffShift = shiftName.toLowerCase() === 'off';
          const isHighHours = workHrs >= 19;

          // Condition 1: Shift Name = 'off' AND Present = 'Yes' (Off day එකේ වැඩ කළ අය)
          // Condition 2: Work Hrs >= 19 (පැය 19 හෝ ඊට වැඩි කාලයක් වැඩ කළ අය)
          const isOffDayWorked = isOffShift && isPresentYes;

          // Double OT qualification
          if (isOffDayWorked || isHighHours) {
            let dotReason = '';
            if (isOffDayWorked && isHighHours) {
              dotReason = 'Off Day & Work Hrs >= 19h';
            } else if (isOffDayWorked) {
              dotReason = 'Shift = Off (Worked on Off Day)';
            } else {
              dotReason = `Work Hrs >= 19h (${workHrs}h)`;
            }

            extractedDotRecords.push({
              epfNo: rawNum,
              fullName: rawFullName,
              department: dept,
              unit: unit,
              shiftName: shiftName || 'Off',
              present: present || 'Yes',
              firstDate: firstDate || fallbackDate,
              workHrs: workHrs,
              inTime: inTime,
              outTime: outTime,
              dotReason: dotReason
            });
          }
        }

        if (extractedDotRecords.length === 0) {
          setMessage({
            type: 'error',
            text: `No Double OT incidents found in this file (Checked ${totalCount} employee attendance rows).`
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
          text: `Attendance for date ${effectiveReportDate} processed! Found ${extractedDotRecords.length} Double OT incidents from ${totalCount} attendance records.`
        });

        // Reload fresh audit data
        await loadAuditData(effectiveReportDate);
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
        department: newDepartment
      });
      setMessage({ type: 'success', text: `Employee #${newEpfNo} added to ${selectedDate} audit successfully!` });
      setShowAddModal(false);
      setNewEpfNo('');
      setNewFullName('');
      setNewWorkHrs(12);
      await loadAuditData(selectedDate);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add record' });
    }
  };

  // Filter dot records based on user search and filters
  const records = auditData?.dotRecords || [];
  const filteredRecords = records.filter(r => {
    // 1. Present filter
    if (presentOnly) {
      const isPresent = String(r.present || '').toLowerCase() === 'yes' || Number(r.workHrs || 0) > 0;
      if (!isPresent) return false;
    }

    // 2. Status / Condition filter
    if (statusFilter === 'APPROVED' && r.vinodStatus !== 'APPROVED') return false;
    if (statusFilter === 'NOT_APPROVED' && r.vinodStatus !== 'NOT_APPROVED') return false;
    if (statusFilter === 'PENDING' && r.vinodStatus !== 'PENDING') return false;
    if (statusFilter === 'OFF_SHIFT' && !(String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes')) return false;
    if (statusFilter === 'HIGH_HOURS' && Number(r.workHrs || 0) < 19) return false;

    // 3. Search query
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchEpf = String(r.epfNo || '').toLowerCase().includes(q);
      const matchName = String(r.fullName || '').toLowerCase().includes(q);
      const matchDept = String(r.department || '').toLowerCase().includes(q);
      const matchShift = String(r.shiftName || '').toLowerCase().includes(q);
      if (!matchEpf && !matchName && !matchDept && !matchShift) return false;
    }

    return true;
  });

  // Summary counts
  const totalIncidents = records.length;
  const approvedCount = records.filter(r => r.vinodStatus === 'APPROVED').length;
  const notApprovedCount = records.filter(r => r.vinodStatus === 'NOT_APPROVED').length;
  const pendingCount = records.filter(r => r.vinodStatus === 'PENDING').length;
  const offShiftCount = records.filter(r => String(r.shiftName).toLowerCase().includes('off') && String(r.present).toLowerCase() === 'yes').length;
  const highHoursCount = records.filter(r => Number(r.workHrs || 0) >= 19).length;

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
            onClick={() => loadAuditData(selectedDate)}
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

      {/* Date Selector & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Selector Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Select Attendance Date:
            </label>
            {availableDates.length > 0 ? (
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  loadAuditData(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {availableDates.map(d => (
                  <option key={d} value={d}>Report Date: {d}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-400 italic">No attendance files processed yet.</p>
            )}
          </div>
          {auditData && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              Uploaded by: <span className="font-semibold text-slate-700 dark:text-slate-200">{auditData.uploadedBy}</span>
              {auditData.totalReportRows > 0 && (
                <div>Total biometric rows: <span className="font-semibold">{auditData.totalReportRows}</span></div>
              )}
              {canManage && (
                <button
                  type="button"
                  onClick={handleDeleteReport}
                  className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                  title="Permanently delete this day's Double OT report for all users"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Day Report (For All)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* KPI: Total Detected DOT Incidents */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Detected DOT Incidents</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalIncidents}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Off Shift: {offShiftCount} • ≥19h: {highHoursCount}</p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </span>
        </div>

        {/* KPI: Approved by Mr. Vinod */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-4 shadow-2xs bg-emerald-50/20 dark:bg-emerald-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Approved by Mr. Vinod</p>
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{approvedCount}</h3>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
              {totalIncidents > 0 ? `${Math.round((approvedCount / totalIncidents) * 100)}% authorized` : '0%'}
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </span>
        </div>

        {/* KPI: Unauthorized / Not Approved Warning */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-4 shadow-2xs bg-rose-50/20 dark:bg-rose-950/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Not Approved / No Request
            </p>
            <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{notApprovedCount}</h3>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70 mt-0.5">
              {pendingCount > 0 ? `(${pendingCount} pending in portal)` : 'Requires management audit'}
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs transition-colors">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            All Incidents ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Vinod Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('NOT_APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === 'NOT_APPROVED'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" /> Not Approved ({notApprovedCount})
          </button>
          <button
            onClick={() => setStatusFilter('OFF_SHIFT')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              statusFilter === 'OFF_SHIFT'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
            }`}
          >
            Off Shift ({offShiftCount})
          </button>
          <button
            onClick={() => setStatusFilter('HIGH_HOURS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              statusFilter === 'HIGH_HOURS'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            ≥19 Hours ({highHoursCount})
          </button>
        </div>

        {/* Search & Present Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={presentOnly}
              onChange={(e) => setPresentOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Present Only (Attended)</span>
          </label>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search EPF, Name, Dept..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Double OT Reconciliation Table ({filteredRecords.length} records)
            </h3>
            <span className="text-[11px] text-slate-400">
              Conditions: (Shift Name = 'Off' and Present = 'Yes') OR (Work Hrs ≥ 19)
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
                  const ws = XLSX.utils.json_to_sheet(filteredRecords.map(r => ({
                    'EPF NO': r.epfNo,
                    'Full Name': r.fullName,
                    'Department': r.department,
                    'Shift Name': r.shiftName,
                    'Present': r.present,
                    'First Date': r.firstDate,
                    'Work Hrs': r.workHrs,
                    'DOT Reason': r.dotReason,
                    'Mr. Vinod Approval': r.vinodStatus,
                    'Req Number': r.vinodReqNumber || 'None'
                  })));
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'DOT_Audit');
                  XLSX.writeFile(wb, `DOT_Attendance_Audit_${selectedDate || 'Report'}.xlsx`);
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
            <p className="font-semibold text-slate-600 dark:text-slate-400">No attendance report loaded for this date.</p>
            {canUpload && (
              <p className="text-slate-400 mt-1">Please upload the biometric attendance CSV or Excel file above to begin reconciliation.</p>
            )}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No Double OT records matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Number (EPF NO)</th>
                  <th className="py-3 px-4">Full Name (Auto-Matched)</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Shift Name</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4">First Date</th>
                  <th className="py-3 px-4 text-center">Work Hrs</th>
                  <th className="py-3 px-4">DOT Reason</th>
                  <th className="py-3 px-4 text-right">Mr. Vinod Approval</th>
                  {canManage && <th className="py-3 px-4 text-center">Manage</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    {/* 1. EPF Number */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {r.epfNo}
                    </td>

                    {/* 2. Full Name (Auto-Matched) */}
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {r.fullName}
                    </td>

                    {/* Department & Unit */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{r.department || 'General'}</span>
                      {r.unit && <span className="text-[11px] text-slate-400 block">{r.unit}</span>}
                    </td>

                    {/* 3. Shift Name */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        String(r.shiftName).toLowerCase() === 'off'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {r.shiftName}
                      </span>
                    </td>

                    {/* 4. Present */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        String(r.present).toLowerCase() === 'yes'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      }`}>
                        {r.present}
                      </span>
                    </td>

                    {/* 5. First Date */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.firstDate}
                    </td>

                    {/* 6. Work Hrs */}
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        r.workHrs >= 19
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {r.workHrs}h
                      </span>
                    </td>

                    {/* DOT Reason */}
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {r.workHrs >= 19 && <Clock className="w-3 h-3 text-amber-500" />}
                        {String(r.shiftName).toLowerCase() === 'off' && <ShieldCheck className="w-3 h-3 text-purple-500" />}
                        {r.dotReason}
                      </span>
                    </td>

                    {/* Mr. Vinod Approval Status */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
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

                    {/* Management Action Buttons for Nimesh / Admin */}
                    {canManage && (
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(r);
                              setEditShiftName(r.shiftName || 'Off');
                              setEditPresent(r.present || 'Yes');
                              setEditWorkHrs(r.workHrs || 0);
                              setEditDotReason(r.dotReason || '');
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit this employee's Double OT record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r._id, r.epfNo, r.fullName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Remove this employee from Double OT audit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT RECORD MODAL */}
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
                    Shift Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editShiftName}
                    onChange={(e) => setEditShiftName(e.target.value)}
                    placeholder="e.g. Off, Day, Night"
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
                  DOT Reason
                </label>
                <input
                  type="text"
                  value={editDotReason}
                  onChange={(e) => setEditDotReason(e.target.value)}
                  placeholder="e.g. Shift = Off (Worked on Off Day)"
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

      {/* ADD MANUAL RECORD MODAL */}
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

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (Optional - auto-matched from EPF)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty to auto-match"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
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

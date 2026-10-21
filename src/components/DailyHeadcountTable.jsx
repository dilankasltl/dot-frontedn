import React from 'react';
import { Download, PlusCircle, Edit3, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export function DailyHeadcountTable({
  records,
  allRecordsCount,
  canManage,
  selectedDate,
  filterMode,
  selectedMonth,
  startDate,
  endDate,
  formatMonthName,
  parseMinutes,
  onEdit,
  onDelete,
  onAddNew
}) {
  const exportFullExcel = () => {
    const periodTag =
      filterMode === 'month'
        ? selectedMonth || 'Month'
        : filterMode === 'range'
        ? `${startDate}_to_${endDate}`
        : selectedDate || 'Report';

    const ws = XLSX.utils.json_to_sheet(
      records.map((r) => ({
        'Number (EPF)': r.epfNo,
        'Full Name': r.fullName,
        Date: r.firstDate || r.reportDate || selectedDate,
        Gender: r.gender,
        Department: r.department || 'General',
        Unit: r.unit || 'General',
        'Shift Name': r.shiftName,
        Present: r.present,
        Leave: r.leave,
        'In Time': r.inTime,
        'Out Time': r.outTime,
        Late: r.late,
        'Late > 15m': r.isLateOver15 ? 'Yes' : 'No',
        'Work Hrs': r.workHrs
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daily_Headcount');
    XLSX.writeFile(wb, `Daily_Headcount_${periodTag}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>Plant Attendance Registry</span>
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
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300">
                {selectedDate}
              </span>
            )}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({records.length} employees)
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Add Employee
            </button>
          )}

          {records.length > 0 && (
            <button
              onClick={exportFullExcel}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400">
          No employee records match the selected filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-3">Number (EPF)</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Gender</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Unit</th>
                <th className="py-3 px-3">Shift Name</th>
                <th className="py-3 px-3 text-center">Present</th>
                <th className="py-3 px-3 text-center">Leave</th>
                <th className="py-3 px-3">In Time</th>
                <th className="py-3 px-3">Out Time</th>
                <th className="py-3 px-3">Late</th>
                <th className="py-3 px-3 text-center">Work Hrs</th>
                {canManage && <th className="py-3 px-3 text-center">Manage</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {records.map((r, idx) => {
                const isPresentYes = String(r.present).toLowerCase() === 'yes';
                const isLeaveYes = String(r.leave).toLowerCase() === 'yes';
                const isLateOver = r.isLateOver15 || parseMinutes(r.late) > 15;

                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                      {r.epfNo}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.fullName}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {r.firstDate || r.reportDate || selectedDate}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        String(r.gender).toUpperCase() === 'FEMALE'
                          ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border border-pink-300 dark:border-pink-800'
                          : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                      }`}>
                        {r.gender || 'MALE'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {r.department || 'General'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {r.unit || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {r.shiftName}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isPresentYes
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {r.present}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isLeaveYes
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                          : 'text-slate-400'
                      }`}>
                        {r.leave}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {r.inTime || '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {r.outTime || '—'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                        isLateOver
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {r.late || '00:00'}
                        {isLateOver && <span className="ml-1 text-[10px] font-black text-rose-600">(&gt;15m)</span>}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {r.workHrs}h
                    </td>
                    {canManage && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(r)}
                            className="p-1 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit employee record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(r._id, r.epfNo, r.fullName)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete employee record"
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
  );
}

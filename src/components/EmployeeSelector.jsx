import React, { useState, useEffect } from 'react';
import { Search, UserCheck, X, Check, Users, Trash2 } from 'lucide-react';
import { api } from '../api';

export default function EmployeeSelector({ selectedEmployees, onSelectionChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const data = await api.getEmployees(searchTerm);
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEmployees, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const isSelected = (epfNo) => {
    return selectedEmployees.some((e) => e.epfNo === epfNo);
  };

  const toggleEmployee = (emp) => {
    if (isSelected(emp.epfNo)) {
      onSelectionChange(selectedEmployees.filter((e) => e.epfNo !== emp.epfNo));
    } else {
      onSelectionChange([...selectedEmployees, { epfNo: emp.epfNo, fullName: emp.fullName }]);
    }
  };

  const removeEmployee = (epfNo) => {
    onSelectionChange(selectedEmployees.filter((e) => e.epfNo !== epfNo));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className="relative">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Select Employees for Double OT (EPF Search)
          </span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            Type EPF number or Name (e.g. 5, 428, Sanjeewa)
          </span>
        </label>
        <div className="relative rounded-xl shadow-2xs">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type EPF Number or Name to filter candidates..."
            className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filtered Employees Dropdown/List */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 p-2 max-h-56 overflow-y-auto space-y-1">
        {loading ? (
          <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">Searching employees...</div>
        ) : employees.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
            No employees found matching "{searchTerm}".
          </div>
        ) : (
          employees.map((emp) => {
            const selected = isSelected(emp.epfNo);
            return (
              <div
                key={emp.epfNo}
                onClick={() => toggleEmployee(emp)}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  selected
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-950 dark:text-blue-200 font-semibold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-750'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold border transition-colors ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 mr-2">
                      EPF: {emp.epfNo}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{emp.fullName}</span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {selected ? 'Selected' : 'Click to add'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Employees Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Selected Employees for DOT ({selectedEmployees.length})
            </h4>
          </div>
          {selectedEmployees.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {selectedEmployees.length === 0 ? (
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-5 text-center text-xs text-slate-400 dark:text-slate-500">
            No employees selected yet. Use the search box above to choose employees by EPF or Name.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-48 overflow-y-auto">
            {selectedEmployees.map((emp, index) => (
              <div
                key={emp.epfNo}
                className="py-2 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-750 px-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 dark:text-slate-500 font-mono w-4">{index + 1}.</span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    EPF {emp.epfNo}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{emp.fullName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeEmployee(emp.epfNo)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                  title="Remove employee"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Database,
  BarChart3,
  KeyRound,
  Layers,
  ArrowRight,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  BadgePlus,
  Contact2,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Eye
} from 'lucide-react';
import AnalyticsCharts from './AnalyticsCharts';
import AttendanceAuditView from './AttendanceAuditView';
import DailyHeadcountView from './DailyHeadcountView';
import { api } from '../api';

export default function AdminView({ user, onUserUpdated }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'employees' | 'data' | 'charts'
  const [usersList, setUsersList] = useState([]);
  const [hodsList, setHodsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // User search & filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Employee search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpEpf, setNewEmpEpf] = useState('');
  const [newEmpName, setNewEmpName] = useState('');
  const [editingEmp, setEditingEmp] = useState(null);
  const [editEmpEpf, setEditEmpEpf] = useState('');
  const [editEmpName, setEditEmpName] = useState('');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newRole, setNewRole] = useState('requester'); // 'requester' | 'approver_l1' | 'viewer' | 'approver_final' | 'admin'
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [assignedL1, setAssignedL1] = useState('');
  const [approvedDeptsInput, setApprovedDeptsInput] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [newCanViewAllPending, setNewCanViewAllPending] = useState(false);
  const [newCanViewCharts, setNewCanViewCharts] = useState(false);
  const [newCanManageAttendance, setNewCanManageAttendance] = useState(false);
  const [newCanViewAttendance, setNewCanViewAttendance] = useState(false);
  // Inline HOD creation
  const [createHODInline, setCreateHODInline] = useState(false);
  const [newHODUsername, setNewHODUsername] = useState('');
  const [newHODPassword, setNewHODPassword] = useState('');
  const [newHODName, setNewHODName] = useState('');

  // Edit User State
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('requester');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAssignedL1, setEditAssignedL1] = useState('');
  const [editApprovedDepts, setEditApprovedDepts] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editCanViewAllPending, setEditCanViewAllPending] = useState(false);
  const [editCanViewCharts, setEditCanViewCharts] = useState(false);
  const [editCanManageAttendance, setEditCanManageAttendance] = useState(false);
  const [editCanViewAttendance, setEditCanViewAttendance] = useState(false);

  // Data Management Filters
  const [dataDeptFilter, setDataDeptFilter] = useState('ALL');
  const [dataUserFilter, setDataUserFilter] = useState('ALL');
  const [dataStatusFilter, setDataStatusFilter] = useState('ALL');
  const [dataReasonFilter, setDataReasonFilter] = useState('ALL');
  const [dataSearch, setDataSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await api.getAdminUsers();
      setUsersList(data || []);
      const hods = await api.getAdminHods();
      setHodsList(hods || []);
      if (hods && hods.length > 0 && !assignedL1) {
        setAssignedL1(hods[0].name);
      }
    } catch (err) {
      console.error('Failed to load admin users', err);
    }
  };

  const fetchEmployees = async (query = '') => {
    try {
      const res = await api.getAdminEmployees(query);
      if (res.employees) {
        setEmployeesList(res.employees);
        setTotalEmployeesCount(res.totalCount || res.employees.length);
      } else if (Array.isArray(res)) {
        setEmployeesList(res);
        setTotalEmployeesCount(res.length);
      }
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const data = await api.getAdminRequests();
      setRequestsList(data || []);
    } catch (err) {
      console.error('Failed to load admin requests', err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchEmployees(employeeSearch), fetchRequests()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Debounced search for employees
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees(employeeSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  // Handle Add Employee (EPF + Name)
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!newEmpEpf.trim() || !newEmpName.trim()) {
      setMessage({ type: 'error', text: 'Both EPF Number and Full Name are required.' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.createAdminEmployee({
        epfNo: newEmpEpf.trim(),
        fullName: newEmpName.trim()
      });
      setMessage({
        type: 'success',
        text: res.message || `Employee #${newEmpEpf} (${newEmpName}) added successfully! Now available in Double OT search.`
      });
      setShowAddEmpModal(false);
      setNewEmpEpf('');
      setNewEmpName('');
      await fetchEmployees(employeeSearch);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add employee.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit Employee
  const handleStartEditEmp = (emp) => {
    setEditingEmp(emp);
    setEditEmpEpf(emp.epfNo);
    setEditEmpName(emp.fullName);
  };

  const handleSaveEditEmp = async (e) => {
    e.preventDefault();
    if (!editingEmp) return;
    setLoading(true);
    setMessage(null);
    try {
      await api.updateAdminEmployee(editingEmp._id, {
        epfNo: editEmpEpf.trim(),
        fullName: editEmpName.trim()
      });
      setMessage({ type: 'success', text: `Employee #${editEmpEpf} updated successfully.` });
      setEditingEmp(null);
      await fetchEmployees(employeeSearch);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update employee.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Employee
  const handleDeleteEmp = async (emp) => {
    if (!confirm(`Are you sure you want to delete employee #${emp.epfNo} (${emp.fullName}) from the master list?`)) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api.deleteAdminEmployee(emp._id);
      setMessage({ type: 'success', text: `Employee #${emp.epfNo} removed successfully.` });
      await fetchEmployees(employeeSearch);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete employee.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setMessage({ type: 'error', text: 'Username, password, and full name are required.' });
      return;
    }

    if (newRole === 'requester') {
      if (!newDepartment.trim()) {
        setMessage({ type: 'error', text: 'Department name is required for Requesters.' });
        return;
      }
      if (createHODInline) {
        if (!newHODUsername.trim() || !newHODPassword.trim() || !newHODName.trim()) {
          setMessage({ type: 'error', text: 'Please fill in all details for the new HOD.' });
          return;
        }
      } else if (!assignedL1) {
        setMessage({ type: 'error', text: 'Please select an approving HOD for this Requester.' });
        return;
      }
    }

    setLoading(true);
    try {
      await api.createAdminUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        name: newName.trim(),
        role: newRole,
        department: newDepartment.trim(),
        assignedL1Approver: assignedL1,
        approvedDepartments: approvedDeptsInput ? approvedDeptsInput.split(',').map(d => d.trim()) : [],
        isActive: newIsActive,
        canViewAllPending: newCanViewAllPending,
        canViewCharts: newCanViewCharts,
        canManageAttendance: newCanManageAttendance,
        canViewAttendance: newCanViewAttendance,
        createHODInline,
        hodUsername: newHODUsername.trim(),
        hodPassword: newHODPassword.trim(),
        hodName: newHODName.trim()
      });

      setMessage({
        type: 'success',
        text: `User ${newName} created successfully! ${createHODInline ? `New HOD ${newHODName} was also created and linked.` : ''}`
      });

      // Reset form
      setShowAddUserModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewDepartment('');
      setApprovedDeptsInput('');
      setNewIsActive(true);
      setNewCanViewAllPending(false);
      setNewCanViewCharts(false);
      setNewCanManageAttendance(false);
      setNewCanViewAttendance(false);
      setCreateHODInline(false);
      setNewHODUsername('');
      setNewHODPassword('');
      setNewHODName('');

      await fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Edit User
  const handleStartEdit = (u) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditPassword('');
    setEditRole(u.role || 'requester');
    setEditDepartment(u.department || '');
    setEditAssignedL1(u.assignedL1Approver || '');
    setEditApprovedDepts(u.approvedDepartments ? u.approvedDepartments.join(', ') : '');
    setEditIsActive(u.isActive !== false);
    setEditCanViewAllPending(!!u.canViewAllPending);
    setEditCanViewCharts(!!u.canViewCharts);
    setEditCanManageAttendance(!!u.canManageAttendance);
    setEditCanViewAttendance(!!u.canViewAttendance);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.updateAdminUser(editingUser._id, {
        name: editName,
        password: editPassword || undefined,
        role: editRole,
        department: editDepartment,
        assignedL1Approver: editAssignedL1,
        approvedDepartments: editApprovedDepts ? editApprovedDepts.split(',').map(d => d.trim()) : [],
        isActive: editIsActive,
        canViewAllPending: editCanViewAllPending,
        canViewCharts: editCanViewCharts,
        canManageAttendance: editCanManageAttendance,
        canViewAttendance: editCanViewAttendance
      });

      if (res?.user && user?.username === editingUser.username && onUserUpdated) {
        onUserUpdated(res.user);
      }

      setMessage({ type: 'success', text: `User ${editName} access and permissions updated successfully.` });
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Toggle Access (Grant or Revoke)
  const handleToggleAccess = async (u) => {
    if (u.username === 'Admin') {
      alert('The Administrator account cannot have its access revoked.');
      return;
    }

    const isCurrentlyActive = u.isActive !== false;
    const actionLabel = isCurrentlyActive ? 'Revoke Access from' : 'Grant Access to';
    if (!confirm(`Are you sure you want to ${actionLabel} "${u.name}" (${u.username})?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.toggleUserAccess(u._id);
      if (res?.user && user?.username === u.username && onUserUpdated) {
        onUserUpdated(res.user);
      }
      setMessage({ type: 'success', text: res.message || 'Access status updated successfully.' });
      await fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user access.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (u) => {
    if (u.username === 'Admin') {
      alert('The Administrator account cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete user "${u.name}" (${u.username})?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await api.deleteAdminUser(u._id);
      setMessage({ type: 'success', text: `User "${u.name}" deleted successfully.` });
      await fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Single Request Delete
  const handleDeleteSingleRequest = async (id, reqNumber) => {
    if (!confirm(`Permanently delete request ${reqNumber}? This record will be completely removed from all tables, graphs, and the database.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await api.deleteAdminRequest(id);
      setMessage({ type: 'success', text: `Request ${reqNumber} deleted permanently.` });
      await fetchRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete request.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Bulk Delete: Clear ALL data
  const handleClearAllData = async () => {
    const confirmPrompt = prompt('⚠️ DANGER ZONE: This will delete ALL Double OT requests across the entire company. All tables and charts will be reset to 0.\n\nType "DELETE ALL" to confirm:');
    if (confirmPrompt !== 'DELETE ALL') {
      if (confirmPrompt !== null) {
        alert('Confirmation mismatch. Operation cancelled.');
      }
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.clearAdminRequests({ all: 'true' });
      setMessage({ type: 'success', text: res.message || 'All Double OT data deleted successfully.' });
      await fetchRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to clear requests.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle Department-specific clear
  const handleClearDeptData = async (dept) => {
    if (!confirm(`Are you sure you want to delete all Double OT requests for department "${dept}"?`)) {
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.clearAdminRequests({ department: dept });
      setMessage({ type: 'success', text: res.message });
      await fetchRequests();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete department data.' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(userSearch.toLowerCase()));

    const matchesRole =
      userRoleFilter === 'ALL' || u.role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Unique list of reasons extracted dynamically from requestsList
  const availableReasons = useMemo(() => {
    const map = new Map();
    requestsList.forEach((r) => {
      const trimmed = r?.reason?.trim();
      if (trimmed) {
        const key = trimmed.toLowerCase();
        if (!map.has(key)) {
          map.set(key, trimmed);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [requestsList]);

  // Filtered Requests
  const filteredRequests = requestsList.filter((r) => {
    const matchesDept = dataDeptFilter === 'ALL' || r.department === dataDeptFilter;
    const matchesUser = dataUserFilter === 'ALL' || r.requesterUsername === dataUserFilter;
    const matchesStatus = dataStatusFilter === 'ALL' || r.status === dataStatusFilter;
    const matchesReason =
      dataReasonFilter === 'ALL' ||
      (r.reason && r.reason.trim().toLowerCase() === dataReasonFilter.toLowerCase());
    const q = dataSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.reqNumber?.toLowerCase().includes(q) ||
      r.requesterName?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.shift?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q);

    return matchesDept && matchesUser && matchesStatus && matchesReason && matchesSearch;
  });

  // Unique departments for filter
  const allDepartments = Array.from(
    new Set(
      usersList
        .map((u) => u.department)
        .filter(Boolean)
        .concat(requestsList.map((r) => r.department))
    )
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-md font-black">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              System Administrator Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage Users • Add EPF Employees • Workflow Routing • Master Data Purge & Governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Alert Message */}
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

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manage Users ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'employees'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Contact2 className="w-4 h-4 text-emerald-500" />
            <span>Employees (EPF Master: {totalEmployeesCount || employeesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span>Manage Double OT Data ({requestsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>Overview Charts & Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance_audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'attendance_audit'
                ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-500" />
            <span>Attendance Audit (DOT Reconciliation)</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_headcount')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'daily_headcount'
                ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-500" />
            <span>Daily Headcount</span>
          </button>
        </div>

        {/* Header Action Buttons per Tab */}
        {activeTab === 'users' && (
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" /> Create New User
          </button>
        )}

        {activeTab === 'employees' && (
          <button
            onClick={() => setShowAddEmpModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <BadgePlus className="w-4 h-4" /> Add New Employee (EPF)
          </button>
        )}

        {activeTab === 'data' && (
          <button
            onClick={handleClearAllData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            title="Permanently clear all Double OT requests in the database"
          >
            <Trash2 className="w-4 h-4" /> Clear ALL Requests (Reset Data)
          </button>
        )}
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                System User Accounts & Approval Chains
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Requesters, Level 1 Approvers (HODs), and Executive Authorities
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user or department..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">All Roles</option>
                <option value="requester">Requesters</option>
                <option value="approver_l1">Level 1 HODs</option>
                <option value="viewer">Viewers & Auditors</option>
                <option value="approver_final">Final Approver</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Access Status</th>
                  <th className="py-3 px-4">Permissions</th>
                  <th className="py-3 px-4">Department / Scope</th>
                  <th className="py-3 px-4">Assigned HOD</th>
                  <th className="py-3 px-4 text-right">Access Controls & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        u.isActive === false ? 'opacity-70 bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          {u.isActive === false ? (
                            <UserX className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {u.username}
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'requester' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Requester
                          </span>
                        )}
                        {u.role === 'approver_l1' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            Level 1 (HOD)
                          </span>
                        )}
                        {u.role === 'viewer' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            Viewer / Auditor
                          </span>
                        )}
                        {u.role === 'approver_final' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            Final Approver
                          </span>
                        )}
                        {u.role === 'admin' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            System Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <X className="w-3 h-3 text-rose-600" /> Access Revoked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.canViewAllPending && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50" title="Can view all company requests">
                              All Requests
                            </span>
                          )}
                          {u.canViewCharts && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50" title="Can view analytics charts">
                              Charts
                            </span>
                          )}
                          {u.canManageAttendance && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50" title="Can upload & edit biometric Double OT data">
                              DOT Upload
                            </span>
                          )}
                          {u.canViewAttendance && !u.canManageAttendance && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50" title="Can view attendance reconciliation portal">
                              DOT View
                            </span>
                          )}
                          {!u.canViewAllPending && !u.canViewCharts && !u.canManageAttendance && !u.canViewAttendance && (
                            <span className="text-slate-400 text-[10px]">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {u.role === 'requester' && (u.department || '-')}
                        {u.role === 'approver_l1' && (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {u.approvedDepartments?.length > 0
                              ? u.approvedDepartments.join(', ')
                              : 'General'}
                          </span>
                        )}
                        {u.role === 'viewer' && 'Plant-wide Monitor (All Departments)'}
                        {u.role === 'approver_final' && 'Company-wide (All Departments)'}
                        {u.role === 'admin' && 'System Governance'}
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'requester' ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {u.assignedL1Approver || 'None'}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Toggle Access Button */}
                          {u.username !== 'Admin' && (
                            u.isActive !== false ? (
                              <button
                                onClick={() => handleToggleAccess(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                                title="Revoke this user's access (disable login)"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Revoke Access</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleAccess(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-900 transition-colors cursor-pointer"
                                title="Grant system access to this user (enable login)"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Grant Access</span>
                              </button>
                            )
                          )}
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit User & Permissions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== 'Admin' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEE MANAGEMENT (EPF MASTER) */}
      {activeTab === 'employees' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Contact2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Employee Master Directory (EPF Search List)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Employees added here appear instantly in "Select Employees for Double OT" across all departments
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by EPF # or Name..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Employees Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">EPF Number</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Department / Category</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {employeesList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-10 text-center text-slate-400">
                      No employees found matching "{employeeSearch}". Click "+ Add New Employee (EPF)" above to add one.
                    </td>
                  </tr>
                ) : (
                  employeesList.map((emp) => (
                    <tr key={emp._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                          #{emp.epfNo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {emp.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {emp.department || 'General'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartEditEmp(emp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit Employee"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmp(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                            title="Delete Employee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DATA & RECORDS MANAGEMENT */}
      {activeTab === 'data' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          {/* Header & Filter Controls */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Double OT Database Records & Delete Control
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Delete records individually or bulk purge by department, user, or all at once
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={dataSearch}
                  onChange={(e) => setDataSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
              </div>

              {allDepartments.length > 0 && (
                <select
                  value={dataDeptFilter}
                  onChange={(e) => setDataDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">All Departments</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={dataStatusFilter}
                onChange={(e) => setDataStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_L1">Pending HOD</option>
                <option value="PENDING_FINAL">Pending Final (Vinod / Niranjan)</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              {/* Reason / Justification Filter */}
              <select
                value={dataReasonFilter}
                onChange={(e) => setDataReasonFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden max-w-[200px] truncate cursor-pointer"
                title="Filter by Reason / Justification"
              >
                <option value="ALL">All Reasons ({availableReasons.length})</option>
                {availableReasons.map((resn) => (
                  <option key={resn} value={resn}>
                    {resn}
                  </option>
                ))}
              </select>

              {(dataDeptFilter !== 'ALL' || dataStatusFilter !== 'ALL' || dataReasonFilter !== 'ALL' || dataSearch) && (
                <button
                  onClick={() => {
                    setDataDeptFilter('ALL');
                    setDataStatusFilter('ALL');
                    setDataReasonFilter('ALL');
                    setDataSearch('');
                  }}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Quick Department Purge Bar */}
          {dataDeptFilter !== 'ALL' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Filtered by Department: <strong>{dataDeptFilter}</strong> ({filteredRequests.length} records)
              </span>
              <button
                onClick={() => handleClearDeptData(dataDeptFilter)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer"
              >
                Delete All from {dataDeptFilter}
              </button>
            </div>
          )}

          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Req #</th>
                  <th className="py-3 px-4">Date & Shift</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Headcount / EPFs</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Delete Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-slate-400">
                      No Double OT records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {r.reqNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {r.date} • <span className="font-semibold">{r.shift} ({r.hours}h)</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white">
                        {r.department}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {r.requesterName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {r.employeeCount || r.employees?.length} persons
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={r.reason}>
                        {r.reason || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {r.status === 'APPROVED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Approved
                          </span>
                        )}
                        {r.status === 'PENDING_L1' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            Pending ({r.l1Approver?.name || 'HOD'})
                          </span>
                        )}
                        {r.status === 'PENDING_FINAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            Pending Final (Mr. Vinod / Mr. Niranjan)
                          </span>
                        )}
                        {r.status === 'REJECTED' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSingleRequest(r._id, r.reqNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                          title="Permanently Delete this request"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: OVERVIEW CHARTS & TABLES */}
      {activeTab === 'charts' && (
        <AnalyticsCharts
          title="Company Operations — Double OT Live Analytics & EPF Number Summary"
          defaultSubTab="epf"
        />
      )}

      {/* TAB 5: ATTENDANCE AUDIT & DOT RECONCILIATION */}
      {activeTab === 'attendance_audit' && (
        <AttendanceAuditView user={user} />
      )}

      {/* TAB 6: DAILY HEADCOUNT & WORKFORCE DEMOGRAPHICS */}
      {activeTab === 'daily_headcount' && (
        <DailyHeadcountView user={user} />
      )}

      {/* ADD EMPLOYEE MODAL (EPF No + Full Name) */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BadgePlus className="w-5 h-5 text-emerald-600" />
                Add Employee to EPF Directory
              </h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  EPF Number (Employee Number) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1475"
                  value={newEmpEpf}
                  onChange={(e) => setNewEmpEpf(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Must be unique across the company.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kaluthanthiri Gayan Indika"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px]">
                💡 This employee will instantly appear in the <strong>"Select Employees for Double OT"</strong> search box for all Requesters.
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  {loading ? 'Adding...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Edit Employee #{editingEmp.epfNo}
              </h3>
              <button
                onClick={() => setEditingEmp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditEmp} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  EPF Number
                </label>
                <input
                  type="text"
                  required
                  value={editEmpEpf}
                  onChange={(e) => setEditEmpEpf(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-rose-600" />
                Create New System User
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              {/* Role Picker */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Type / Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewRole('requester');
                      setCreateHODInline(false);
                      setNewCanViewAllPending(false);
                      setNewCanViewCharts(false);
                      setNewCanManageAttendance(false);
                      setNewCanViewAttendance(false);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newRole === 'requester'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Department Requester
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRole('approver_l1');
                      setCreateHODInline(false);
                      setNewCanViewAllPending(false);
                      setNewCanViewCharts(true);
                      setNewCanManageAttendance(false);
                      setNewCanViewAttendance(false);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newRole === 'approver_l1'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Level 1 Approver (HOD)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRole('viewer');
                      setCreateHODInline(false);
                      setNewCanViewAllPending(true);
                      setNewCanViewCharts(true);
                      setNewCanManageAttendance(false);
                      setNewCanViewAttendance(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newRole === 'viewer'
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Plant Monitor (Viewer)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRole('approver_final');
                      setCreateHODInline(false);
                      setNewCanViewAllPending(true);
                      setNewCanViewCharts(true);
                      setNewCanManageAttendance(false);
                      setNewCanViewAttendance(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newRole === 'approver_final'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Final Authority (Vinod / Niranjan)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRole('admin');
                      setCreateHODInline(false);
                      setNewCanViewAllPending(true);
                      setNewCanViewCharts(true);
                      setNewCanManageAttendance(true);
                      setNewCanViewAttendance(true);
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    System Admin
                  </button>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ruwan(WIP)"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ruwan@123"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name (will be displayed with Mr. prefix)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ruwan Jayasekara"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Access Control & Permissions Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Account Access & Status
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={newIsActive}
                      onChange={(e) => setNewIsActive(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className={newIsActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}>
                      {newIsActive ? 'Access Granted (Active)' : 'Access Revoked (Disabled)'}
                    </span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    Feature Permissions:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanViewAllPending}
                        onChange={(e) => setNewCanViewAllPending(e.target.checked)}
                        className="rounded text-blue-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">View All Requests</span>
                        <span className="text-[10px] text-slate-400 block">Monitor all company departments</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanViewCharts}
                        onChange={(e) => setNewCanViewCharts(e.target.checked)}
                        className="rounded text-purple-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">View Analytics Charts</span>
                        <span className="text-[10px] text-slate-400 block">Double OT bar charts & metrics</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanViewAttendance}
                        onChange={(e) => setNewCanViewAttendance(e.target.checked)}
                        className="rounded text-teal-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">View Attendance Audit</span>
                        <span className="text-[10px] text-slate-400 block">Biometric reconciliation portal</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCanManageAttendance}
                        onChange={(e) => {
                          setNewCanManageAttendance(e.target.checked);
                          if (e.target.checked) setNewCanViewAttendance(true);
                        }}
                        className="rounded text-amber-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">Manage Attendance Data</span>
                        <span className="text-[10px] text-slate-400 block">Upload, edit & delete audit records</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Requester-specific: Department & Approver */}
              {newRole === 'requester' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cutting / Finishing"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Approver Selection */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        Level 1 Approval Routing (Who approves this Requester?)
                      </label>
                      <button
                        type="button"
                        onClick={() => setCreateHODInline(!createHODInline)}
                        className={`text-xs font-bold cursor-pointer ${
                          createHODInline ? 'text-blue-600 underline' : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                        }`}
                      >
                        {createHODInline ? '← Choose Existing HOD' : '+ Create New HOD Now'}
                      </button>
                    </div>

                    {!createHODInline ? (
                      <div>
                        <select
                          value={assignedL1}
                          onChange={(e) => setAssignedL1(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                        >
                          {hodsList.map((h) => (
                            <option key={h._id} value={h.name}>
                              {h.name} ({h.approvedDepartments?.join(', ') || 'General'})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* INLINE HOD CREATION */
                      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 space-y-2.5">
                        <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">
                          New HOD Credentials:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                              HOD Username
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sunil"
                              value={newHODUsername}
                              onChange={(e) => setNewHODUsername(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                              HOD Password
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Sunil@123"
                              value={newHODPassword}
                              onChange={(e) => setNewHODPassword(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-0.5">
                            HOD Full Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Sunil Shantha"
                            value={newHODName}
                            onChange={(e) => setNewHODName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {newRole === 'approver_l1' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approved Departments (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cutting, Finishing, Logistics"
                    value={approvedDeptsInput}
                    onChange={(e) => setApprovedDeptsInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {newRole === 'viewer' && (
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300">
                  <span className="font-bold block">Company Monitor & Auditor (Viewer):</span>
                  Has full read-only visibility into all company Double OT requests and attendance reconciliation across all departments without approving or creating requests (e.g. Mr. Nimesh & Mr. Niranjan style).
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                Edit User — {editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="text"
                  placeholder="Enter new password if changing"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User Role / System Responsibility
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingUser.username === 'Admin'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="requester">Department Requester</option>
                  <option value="approver_l1">Level 1 Approver (HOD)</option>
                  <option value="viewer">Plant Monitor & Auditor (Viewer)</option>
                  <option value="approver_final">Final Approver (Vinod / Niranjan)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              {/* Access Control & Permissions Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Login Access Status
                    </span>
                    <span className="text-[10px] text-slate-400">Controls portal login permission</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      disabled={editingUser.username === 'Admin'}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className={editIsActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}>
                      {editIsActive ? 'Access Granted (Active)' : 'Access Revoked (Blocked)'}
                    </span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                    Permissions & Access:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCanViewAllPending}
                        onChange={(e) => setEditCanViewAllPending(e.target.checked)}
                        className="rounded text-blue-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">View All Requests</span>
                        <span className="text-[10px] text-slate-400 block">Monitor all company departments</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCanViewCharts}
                        onChange={(e) => setEditCanViewCharts(e.target.checked)}
                        className="rounded text-purple-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">View Analytics Charts</span>
                        <span className="text-[10px] text-slate-400 block">Double OT bar charts & metrics</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCanViewAttendance}
                        onChange={(e) => setEditCanViewAttendance(e.target.checked)}
                        className="rounded text-teal-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">View Attendance Audit</span>
                        <span className="text-[10px] text-slate-400 block">Biometric Double OT reconciliation</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCanManageAttendance}
                        onChange={(e) => {
                          setEditCanManageAttendance(e.target.checked);
                          if (e.target.checked) setEditCanViewAttendance(true);
                        }}
                        className="rounded text-amber-600 w-4 h-4"
                      />
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">Manage Attendance Data</span>
                        <span className="text-[10px] text-slate-400 block">Upload, edit & delete audit records</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {editRole === 'requester' && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned HOD Approver
                    </label>
                    <select
                      value={editAssignedL1}
                      onChange={(e) => setEditAssignedL1(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                    >
                      {hodsList.map((h) => (
                        <option key={h._id} value={h.name}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {editRole === 'approver_l1' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Approved Departments (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editApprovedDepts}
                    onChange={(e) => setEditApprovedDepts(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {editRole === 'viewer' && (
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-300">
                  <span className="font-bold block">Company Monitor & Auditor (Viewer):</span>
                  Full plant-wide monitoring and Double OT attendance cross-audit visibility without creating or approving requests.
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

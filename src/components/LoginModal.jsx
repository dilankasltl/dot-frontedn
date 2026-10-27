import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Sun, Moon, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '../api';

const PRESET_USERS = {
  requesters: [
    { username: 'Production(Ravimal)', label: 'Mr. Ravimal', dept: 'Production', l1: 'Mr. Dhammika' },
    { username: 'Ravindra(WIP)', label: 'Mr. Ravindra', dept: 'WIP', l1: 'Mr. Dhammika' },
    { username: 'Nihal(RIM)', label: 'Mr. Nihal', dept: 'RIM', l1: 'Mr. Dhammika' },
    { username: 'Indika(RMS)', label: 'Mr. Indika', dept: 'RMS', l1: 'Mr. Karthika' },
    { username: 'Dimuthu(FGS)', label: 'Mr. Dimuthu', dept: 'FGS', l1: 'Mr. Dhammika' },
    { username: 'Hasula(LAB)', label: 'Mr. Hasula', dept: 'LAB', l1: 'Mr. Ekanayake' },
    { username: 'Dulan(Quality)', label: 'Mr. Dulan', dept: 'Quality', l1: 'Mr. Wickarama' },
    { username: 'Sanka(HR)', label: 'Mr. Sanka', dept: 'HR', l1: 'Mr. Rohitha' },
    { username: 'Vidura(Finance)', label: 'Mr. Vidura', dept: 'Finance', l1: 'Mr. Boopathi' },
    { username: 'Dilanka(ENGINEERING)', label: 'Mr. Dilanka', dept: 'ENGINEERING', l1: 'Mr. Shemba' },
    { username: 'Dissanayaka(Mixing/Bandroom)', label: 'Mr. Dissanayaka', dept: 'Mixing/Bandroom', l1: 'Mr. Dhammika' },
  ],
  approversL1: [
    { username: 'Dhammika', label: 'Mr. Dhammika', scope: 'Prod, WIP, RIM, FGS, Mixing' },
    { username: 'Karthika', label: 'Mr. Karthika', scope: 'RMS' },
    { username: 'Wickarama', label: 'Mr. Wickarama', scope: 'Quality' },
    { username: 'Rohitha', label: 'Mr. Rohitha', scope: 'HR Approvals + Company Monitor & Charts' },
    { username: 'Boopathi', label: 'Mr. Boopathi', scope: 'Finance' },
    { username: 'Ekanayake', label: 'Mr. Ekanayake', scope: 'LAB' },
    { username: 'Shemba', label: 'Mr. Shemba', scope: 'ENGINEERING' },
  ],
  approverFinal: [
    { username: 'Vinod', label: 'Mr. Vinod', scope: 'Final Approval (All Departments) + Executive Analytics' },
    { username: 'Niranjan', label: 'Mr. Niranjan', scope: 'Final Approval (All Departments) + Executive Analytics' }
  ],
  viewers: [
    { username: 'Nimesh', label: 'Mr. Nimesh', scope: 'Plant Monitor & Double OT Attendance Auditor' }
  ]
};

export default function LoginModal({ onLogin, theme, onToggleTheme }) {
  // Always blank by default as requested
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Live dynamic users list (auto-updated when admin creates users)
  const [liveUsers, setLiveUsers] = useState(PRESET_USERS);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const users = await api.getPublicUsers();
        if (users && users.length > 0) {
          const reqs = [];
          const hods = [];
          const finals = [];
          const viewers = [];

          users.forEach((u) => {
            // Keep Admin strictly hidden from the public selection list
            if (u.username === 'Admin' || u.role === 'admin') return;

            if (u.role === 'requester') {
              reqs.push({
                username: u.username,
                label: u.name,
                dept: u.department || 'General',
                l1: u.assignedL1Approver || 'HOD'
              });
            } else if (u.role === 'approver_l1') {
              hods.push({
                username: u.username,
                label: u.name,
                scope: (u.approvedDepartments && u.approvedDepartments.length > 0)
                  ? u.approvedDepartments.join(', ')
                  : 'Assigned Departments'
              });
            } else if (u.role === 'approver_final') {
              finals.push({
                username: u.username,
                label: u.name,
                scope: 'Final Authority (All Departments) + Analytics'
              });
            } else if (u.role === 'viewer') {
              viewers.push({
                username: u.username,
                label: u.name,
                scope: u.canManageAttendance ? 'Plant Monitor & Double OT Auditor' : 'Plant-wide Monitor'
              });
            }
          });

          setLiveUsers({
            requesters: reqs.length > 0 ? reqs : PRESET_USERS.requesters,
            approversL1: hods.length > 0 ? hods : PRESET_USERS.approversL1,
            approverFinal: finals.length > 0 ? finals : PRESET_USERS.approverFinal,
            viewers: viewers.length > 0 ? viewers : PRESET_USERS.viewers
          });
        }
      } catch (err) {
        console.error('Failed to load dynamic user list for login', err);
      }
    };

    loadUsers();
  }, []);
  
  // Forgot Password / Reset Password mode
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const [activeTab, setActiveTab] = useState('requesters');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username) {
      setError('Please select or enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password to continue.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(username.trim(), password.trim());
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setResetSuccessMessage('');

    if (!username) {
      setError('Please select or type your username first.');
      return;
    }
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(username.trim(), newPassword.trim());
      setResetSuccessMessage(res.message || 'Password changed successfully! You can also use your default password.');
      setPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsForgotMode(false);
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const selectUser = (u) => {
    setUsername(u);
    setPassword('');
    setError('');
    setResetSuccessMessage('');
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      
      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-600 dark:text-slate-300 hover:scale-105 transition-all cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Company Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-white px-5 py-2.5 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 inline-flex items-center justify-center">
            <img
              src="/logo.png"
              alt="TVS SUN-TWS Logo"
              className="h-12 sm:h-14 w-auto object-contain"
            />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Double OT Approval Portal
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to create, review, or authorize Double Overtime requests
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10 transition-colors">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{resetSuccessMessage}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {!isForgotMode ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Username
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Select below or type username (e.g. Production(Ravimal))"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(true);
                      setError('');
                      setResetSuccessMessage('');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Change / Forgot Password?
                  </button>
                </div>
                <div className="mt-1.5 relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter password..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* FORGOT / RESET PASSWORD FORM */
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" /> Reset / Change Password
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setError('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Production(Ravimal)"
                  className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="block w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300">
                Notice: Default password will also continue to function as a fallback even after setting a new password.
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Save New Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotMode(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Quick-switch username select helper */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Select Your Account Name
              </span>
              <span className="text-xs text-slate-400">Click to fill username</span>
            </div>

            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 mb-4 text-xs font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('requesters')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'requesters' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                1. Requesters ({liveUsers.requesters.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approversL1')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'approversL1' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                2. HOD Approvers ({liveUsers.approversL1.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('viewers')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'viewers' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                3. Monitors ({liveUsers.viewers?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approverFinal')}
                className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTab === 'approverFinal' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                4. Final
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {activeTab === 'requesters' &&
                liveUsers.requesters.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => selectUser(u.username)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      username === u.username
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{u.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                        {u.dept}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Approver: <span className="text-slate-700 dark:text-slate-300 font-medium">{u.l1}</span>
                    </div>
                  </button>
                ))}

              {activeTab === 'approversL1' &&
                liveUsers.approversL1.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => selectUser(u.username)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      username === u.username
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{u.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-medium">
                        HOD
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={u.scope}>
                      {u.scope}
                    </div>
                  </button>
                ))}

              {activeTab === 'viewers' &&
                (liveUsers.viewers || []).map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => selectUser(u.username)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      username === u.username
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{u.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-medium">
                        Monitor
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={u.scope}>
                      {u.scope}
                    </div>
                  </button>
                ))}

              {activeTab === 'approverFinal' &&
                liveUsers.approverFinal.map((u) => (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => selectUser(u.username)}
                    className="col-span-full text-left p-3 rounded-xl border-2 border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 font-medium cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                        <span className="font-bold text-base text-purple-950 dark:text-white">{u.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                        Final Authority
                      </span>
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      {u.scope}
                    </div>
                  </button>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

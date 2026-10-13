import React from 'react';
import { LogOut, Shield, Building2, CheckCircle2, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, onLogout, theme, onToggleTheme }) {
  if (!user) return null;

  const isDark = theme === 'dark';

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-700/60">
            <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> System Admin
          </span>
        );
      case 'approver_final':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60">
            <Shield className="w-3.5 h-3.5" /> Final Approver
          </span>
        );
      case 'approver_l1':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60">
            <CheckCircle2 className="w-3.5 h-3.5" /> Level 1 Approver (HOD)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60">
            <Building2 className="w-3.5 h-3.5" /> Department Requester
          </span>
        );
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              DOT
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Double OT (DOT) Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Authorization & Overtime Governance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.name.startsWith('Mr.') || user.role === 'admin' ? user.name : `Mr. ${user.name}`}
                </span>
                {getRoleBadge(user.role)}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user.role === 'admin' ? 'Master Admin' : (user.department ? `Dept: ${user.department}` : 'Executive Directorate')} • {user.username}
              </span>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

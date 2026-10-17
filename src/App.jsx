import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import RequesterView from './components/RequesterView';
import ApproverL1View from './components/ApproverL1View';
import RohithaView from './components/RohithaView';
import VinodView from './components/VinodView';
import AdminView from './components/AdminView';
import { api } from './api';

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dot_theme') || 'light';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dot_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogin = async (username, password) => {
    const res = await api.login(username, password);
    setCurrentUser(res.user);
    localStorage.setItem('dot_user', JSON.stringify(res.user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dot_user');
  };

  if (!currentUser) {
    return <LoginModal onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />;
  }

  const renderDashboard = () => {
    if (currentUser.role === 'admin') {
      return <AdminView user={currentUser} />;
    }

    if (currentUser.role === 'approver_final') {
      return <VinodView user={currentUser} />;
    }

    if (currentUser.username === 'Rohitha' || currentUser.role === 'viewer') {
      return <RohithaView user={currentUser} isViewerOnly={currentUser.role === 'viewer'} />;
    }

    if (currentUser.role === 'approver_l1') {
      return <ApproverL1View user={currentUser} />;
    }

    return <RequesterView user={currentUser} />;
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderDashboard()}
      </main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        Double OT (DOT) Authorization System &copy; {new Date().getFullYear()} • Plant Operations
      </footer>
    </div>
  );
}

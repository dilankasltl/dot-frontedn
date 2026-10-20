// Cloud backend hosted on Render (with optional override via VITE_API_URL)
const API_BASE = import.meta.env.VITE_API_URL || 'https://dot-backend-16ps.onrender.com/api';

export const api = {
  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  getMe: async (username) => {
    const res = await fetch(`${API_BASE}/auth/me?username=${encodeURIComponent(username)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error(err.error || 'Failed to sync user session');
      error.status = res.status;
      error.isActive = err.isActive;
      throw error;
    }
    return res.json();
  },

  resetPassword: async (username, newPassword) => {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to reset password');
    }
    return res.json();
  },

  getPublicUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`);
    if (!res.ok) throw new Error('Failed to fetch public users');
    return res.json();
  },

  getEmployees: async (search = '') => {
    const res = await fetch(`${API_BASE}/employees?search=${encodeURIComponent(search)}`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  createRequest: async (payload) => {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit request');
    }
    return res.json();
  },

  editRequest: async (id, payload) => {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update request');
    }
    return res.json();
  },

  // Delete/hide from this user's list (does not delete from other users' lists for approved/completed data)
  deleteRequest: async (id, username) => {
    const url = username
      ? `${API_BASE}/requests/${id}?username=${encodeURIComponent(username)}`
      : `${API_BASE}/requests/${id}`;
    const res = await fetch(url, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to remove request');
    }
    return res.json();
  },

  getRequests: async (username, filters = {}) => {
    const params = new URLSearchParams({ username, ...filters });
    const res = await fetch(`${API_BASE}/requests?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },

  l1Action: async (id, action, username, remarks = '') => {
    const res = await fetch(`${API_BASE}/requests/${id}/l1-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username, remarks })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update request');
    }
    return res.json();
  },

  finalAction: async (id, action, username, remarks = '') => {
    const res = await fetch(`${API_BASE}/requests/${id}/final-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username, remarks })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update request');
    }
    return res.json();
  },

  batchAction: async (ids, action, username, stage) => {
    const res = await fetch(`${API_BASE}/requests/batch-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, action, username, stage })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Batch action failed');
    }
    return res.json();
  },

  getAnalytics: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/analytics?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // --- Admin API Methods ---
  getAdminUsers: async () => {
    const res = await fetch(`${API_BASE}/admin/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  getAdminHods: async () => {
    const res = await fetch(`${API_BASE}/admin/hods`);
    if (!res.ok) throw new Error('Failed to fetch HODs');
    return res.json();
  },

  createAdminUser: async (userData) => {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create user');
    }
    return res.json();
  },

  updateAdminUser: async (id, userData) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user');
    }
    return res.json();
  },

  toggleUserAccess: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}/toggle-access`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to toggle user access');
    }
    return res.json();
  },

  deleteAdminUser: async (id) => {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }
    return res.json();
  },

  getAdminRequests: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/admin/requests?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },

  deleteAdminRequest: async (id) => {
    const res = await fetch(`${API_BASE}/admin/requests/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete request');
    }
    return res.json();
  },

  clearAdminRequests: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_BASE}/admin/requests?${searchParams.toString()}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to clear requests');
    }
    return res.json();
  },

  // --- Admin Employee Management Methods ---
  getAdminEmployees: async (search = '') => {
    const res = await fetch(`${API_BASE}/admin/employees?search=${encodeURIComponent(search)}`);
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  createAdminEmployee: async (empData) => {
    const res = await fetch(`${API_BASE}/admin/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add employee');
    }
    return res.json();
  },

  updateAdminEmployee: async (id, empData) => {
    const res = await fetch(`${API_BASE}/admin/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(empData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update employee');
    }
    return res.json();
  },

  deleteAdminEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/admin/employees/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete employee');
    }
    return res.json();
  },

  // --- Daily Attendance Audit & DOT Reconciliation ---
  saveAttendanceAudit: async (auditData) => {
    const res = await fetch(`${API_BASE}/attendance-audit/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save attendance audit');
    }
    return res.json();
  },

  getAttendanceAudit: async (params = {}) => {
    let queryString = '';
    if (typeof params === 'string') {
      queryString = params ? `?date=${encodeURIComponent(params)}` : '';
    } else if (params && typeof params === 'object') {
      const q = new URLSearchParams();
      if (params.mode) q.append('mode', params.mode);
      if (params.date) q.append('date', params.date);
      if (params.month) q.append('month', params.month);
      if (params.startDate) q.append('startDate', params.startDate);
      if (params.endDate) q.append('endDate', params.endDate);
      const str = q.toString();
      queryString = str ? `?${str}` : '';
    }
    const res = await fetch(`${API_BASE}/attendance-audit${queryString}`);
    if (!res.ok) {
      let msg = 'Failed to fetch attendance audit';
      try {
        const err = await res.json();
        if (err.error) msg = err.error;
      } catch {}
      throw new Error(msg);
    }
    return res.json();
  },

  deleteAttendanceAudit: async (reportDate) => {
    const res = await fetch(`${API_BASE}/attendance-audit/${encodeURIComponent(reportDate)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete attendance audit');
    }
    return res.json();
  },

  updateAttendanceAuditRecord: async (reportDate, recordId, updatedFields) => {
    const res = await fetch(`${API_BASE}/attendance-audit/${encodeURIComponent(reportDate)}/record/${encodeURIComponent(recordId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update record');
    }
    return res.json();
  },

  deleteAttendanceAuditRecord: async (reportDate, recordId) => {
    const res = await fetch(`${API_BASE}/attendance-audit/${encodeURIComponent(reportDate)}/record/${encodeURIComponent(recordId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete record from audit');
    }
    return res.json();
  },

  addAttendanceAuditRecord: async (reportDate, recordData) => {
    const res = await fetch(`${API_BASE}/attendance-audit/${encodeURIComponent(reportDate)}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add employee record');
    }
    return res.json();
  }
};

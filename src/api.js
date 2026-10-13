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
  }
};

// Dynamic API Base URL (Supports localhost proxy or cloud backend URL)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  }
};

/**
 * utils/api.js - REST API client for CONVO
 * Wraps fetch with automatic JWT Authorization header and error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('convo_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Session expired / not authorized: clear local storage, notify listeners,
  // and surface the error so the app can log the user out and redirect.
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('convo_token');
    localStorage.removeItem('convo_user');
    try {
      window.dispatchEvent(new CustomEvent('convo-session-expired'));
    } catch (_) {
      // dispatch only fails in non-browser contexts; ignore
    }
    throw new ApiError(res.status, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const body = await res.json();
      message = body.error || message;
    } catch (_) {
      // ignore JSON parse errors
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  // Users
  getUsers: (q = '') => request(`/users?q=${encodeURIComponent(q)}`),
  getUser: (id) => request(`/users/${id}`),

  // Conversations
  getConversations: () => request('/conversations'),
  createDirect: (participantId) => request('/conversations/direct', {
    method: 'POST',
    body: JSON.stringify({ participantId }),
  }),
  createGroup: (name, memberIds) => request('/conversations/group', {
    method: 'POST',
    body: JSON.stringify({ name, memberIds }),
  }),

  // Messages
  getMessages: (conversationId, limit, before) => {
    let url = `/messages/${conversationId}?limit=${limit || 50}`;
    if (before) url += `&before=${before}`;
    return request(url);
  },
  sendMessage: (conversationId, body) => request('/messages', {
    method: 'POST',
    body: JSON.stringify({ conversationId, body }),
  }),
};

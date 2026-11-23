/**
 * utils/api.js - REST API client for CONVO
 * Wraps fetch with automatic JWT Authorization header and error handling.
 */

const BASE_URL = '/api';

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

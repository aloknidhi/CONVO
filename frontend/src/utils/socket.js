// utils/socket.js - Socket.io client helper for CONVO
// Creates and exports a single socket instance connected to the backend.
// Provides connect/disconnect and auth token handling.
// SOCKET_URL defaults to the same origin (Vite proxies /socket.io to :5000 in dev).

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket = null;

export function getSocket(token) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { getSocket, disconnectSocket };

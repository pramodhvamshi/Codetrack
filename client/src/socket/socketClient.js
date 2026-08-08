import { io } from 'socket.io-client';

let socket = null;

export function getSocket(token) {
  if (!socket && token) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const serverUrl = isLocal
      ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001').replace(/\/$/, "").replace(/\/api$/, "")
      : window.location.origin;

    socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to Socket.IO Server:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket Connection Error:', err.message);
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

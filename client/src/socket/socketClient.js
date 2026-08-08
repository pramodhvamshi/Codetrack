import { io } from 'socket.io-client';

let socket = null;

export function getSocket(token) {
  if (!socket && token) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : 'https://medhacodetrack-api.vercel.app');
    const serverUrl = baseUrl.replace(/\/$/, "").replace(/\/api$/, "");

    socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      transports: ['polling', 'websocket']
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

import { api } from './client';

export const mockTestApi = {
  getQuota: (token) => api.getJson('/ai/mocktest/quota', token),
  
  generateTest: (payload, token) => api.postJson('/ai/mocktest/generate', payload, token),
  
  submitTest: (payload, token) => api.postJson('/ai/mocktest/submit', payload, token),
  
  getHistory: (token) => api.getJson('/ai/mocktest/history', token),
  
  getSessionDetails: (sessionId, token) => api.getJson(`/ai/mocktest/session/${sessionId}`, token),
};

import { api } from './client';

export const messageApi = {
  getConversations: () =>
    api.getJson('/v2/messages/conversations'),

  getMessageHistory: (userId, page = 1, limit = 30) =>
    api.getJson(`/v2/messages/history/${userId}?page=${page}&limit=${limit}`),

  sendMessage: (recipientId, text, mediaUrls = []) =>
    api.postJson('/v2/messages/send', { recipientId, text, mediaUrls }),

  markRead: (conversationId) =>
    api.postJson(`/v2/messages/read/${conversationId}`, {})
};

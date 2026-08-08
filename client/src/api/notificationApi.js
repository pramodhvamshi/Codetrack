import { api } from './client';

export const notificationApi = {
  getNotifications: (limit = 20) =>
    api.getJson(`/v2/notifications?limit=${limit}`),

  markAsRead: (notificationIds = [], markAll = false) =>
    api.patchJson('/v2/notifications/mark-read', { notificationIds, markAll })
};

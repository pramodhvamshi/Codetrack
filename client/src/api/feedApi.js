import { api } from './client';

export const feedApi = {
  getFeed: (page = 1, category = 'all', limit = 10) =>
    api.getJson(`/v2/feed?page=${page}&limit=${limit}&category=${category}`),

  createPost: (postData) =>
    api.postJson('/v2/feed/posts', postData),

  createAnnouncement: (announcementData) =>
    api.postJson('/v2/feed/announcements', announcementData),

  uploadMedia: (formData) =>
    api.postForm('/v2/feed/upload', formData),

  toggleLike: (postId) =>
    api.postJson('/v2/feed/like', { postId }),

  reactToPost: (postId, reactionType) =>
    api.postJson(`/v2/feed/posts/${postId}/react`, { reactionType }),

  getComments: (postId) =>
    api.getJson(`/v2/feed/posts/${postId}/comments`),

  addComment: (postId, content, parentCommentId = null) =>
    api.postJson(`/v2/feed/posts/${postId}/comments`, { content, parentCommentId }),

  likeComment: (commentId) =>
    api.postJson(`/v2/feed/comments/${commentId}/like`),

  globalSearch: (query, filter = 'all') =>
    api.getJson(`/v2/feed/search?q=${encodeURIComponent(query)}&filter=${filter}`)
};

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout on 401 and if we have a response (not network error)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// User API
export const userAPI = {
  getProfile: (username) => api.get(`/users/profile/${username}`),
  updateProfile: (data) => {
    // Check if data is FormData (has profilePicture file)
    if (data instanceof FormData) {
      return api.put('/users/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put('/users/profile', data);
  },
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  getSuggestedUsers: () => api.get('/users/suggested'),
  getSavedPosts: () => api.get('/users/saved-posts'),
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
  getUserPosts: (userId, page = 1) => api.get(`/users/${userId}/posts?page=${page}`),
  getUserReels: (userId, page = 1) => api.get(`/users/${userId}/reels?page=${page}`),
};

// Post API
export const postAPI = {
  createPost: (data) => {
    const formData = new FormData();
    if (data.image) formData.append('image', data.image);
    if (data.caption) formData.append('caption', data.caption);
    if (data.location) formData.append('location', data.location);
    return api.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFeedPosts: (page = 1) => api.get(`/posts/feed?page=${page}`),
  getExplorePosts: (page = 1) => api.get(`/posts/explore?page=${page}`),
  getPost: (postId) => api.get(`/posts/${postId}`),
  updatePost: (postId, data) => api.put(`/posts/${postId}`, data),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  savePost: (postId) => api.post(`/posts/${postId}/save`),
  addComment: (postId, text) => api.post(`/posts/${postId}/comment`, { text }),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comment/${commentId}`),
};

// Reel API
export const reelAPI = {
  createReel: (data) => {
    const formData = new FormData();
    if (data.video) formData.append('video', data.video);
    if (data.caption) formData.append('caption', data.caption);
    return api.post('/reels', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getReels: (page = 1) => api.get(`/reels?page=${page}`),
  getReel: (reelId) => api.get(`/reels/${reelId}`),
  deleteReel: (reelId) => api.delete(`/reels/${reelId}`),
  likeReel: (reelId) => api.post(`/reels/${reelId}/like`),
  addComment: (reelId, text) => api.post(`/reels/${reelId}/comment`, { text }),
  deleteComment: (reelId, commentId) => api.delete(`/reels/${reelId}/comment/${commentId}`),
};

// Story API
export const storyAPI = {
  createStory: (data) => {
    const formData = new FormData();
    if (data.media) formData.append('media', data.media);
    if (data.type) formData.append('type', data.type);
    if (data.caption) formData.append('caption', data.caption);
    return api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getStories: () => api.get('/stories'),
  getMyStories: () => api.get('/stories/my-stories'),
  getStory: (storyId) => api.get(`/stories/${storyId}`),
  viewStory: (storyId) => api.post(`/stories/${storyId}/view`),
  likeStory: (storyId) => api.post(`/stories/${storyId}/like`),
  deleteStory: (storyId) => api.delete(`/stories/${storyId}`),
};

// Chat API
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (userId) => api.post('/chat/conversations', { userId }),
  getMessages: (conversationId, page = 1) => api.get(`/chat/messages/${conversationId}?page=${page}`),
  sendMessage: (data) => {
    if (!data.media) {
      return api.post('/chat/messages', {
        conversationId: data.conversationId,
        receiverId: data.receiverId,
        message: data.message,
      });
    }
    const formData = new FormData();
    formData.append('conversationId', data.conversationId);
    formData.append('receiverId', data.receiverId);
    if (data.message) formData.append('message', data.message);
    if (data.media) formData.append('media', data.media);
    return api.post('/chat/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteMessage: (messageId) => api.delete(`/chat/messages/${messageId}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (page = 1) => api.get(`/notifications?page=${page}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

// Search API
export const searchAPI = {
  searchUsers: (query) => api.get(`/search/users?q=${encodeURIComponent(query)}`),
  searchPosts: (query) => api.get(`/search/posts?q=${encodeURIComponent(query)}`),
  searchReels: (query) => api.get(`/search/reels?q=${encodeURIComponent(query)}`),
  getTrending: () => api.get('/search/trending'),
};

export default api;

import axios from 'axios';

// VITE_API_URL is injected at build time via .env.production (Vercel) or .env.development (local)
// Production: https://suvidha-ws4v.onrender.com/api  |  Dev: http://localhost:5000/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

// Attach JWT automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — maps HTTP errors to clean user-facing messages
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 — session expired or invalid token → clear storage and redirect
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }

    // Map status codes to clean user-facing messages
    const friendlyMessage =
      !error.response                         ? 'Unable to connect to SUVIDHA server. Please check your connection.' :
      status === 401                          ? 'Session expired. Please login again.' :
      status === 403                          ? 'Access denied. You do not have permission for this action.' :
      status === 404                          ? 'The requested resource was not found.' :
      status >= 500                           ? 'Server issue. Please try again later.' :
      error.response?.data?.message          || 'An unexpected error occurred.';

    // Attach friendly message so components can use err.friendlyMessage
    error.friendlyMessage = friendlyMessage;

    return Promise.reject(error);
  }
);

// ---------------- AUTH API ----------------

export const authAPI = {
  requestOtp: async (mobile) => {
    return await API.post('/auth/login', { mobile });
  },

  verifyOtp: async (payload) => {
    return await API.post('/auth/verify-otp', payload);
  },

  staffLogin: async (payload) => {
    return await API.post('/auth/staff-login', payload);
  }
};

// ---------------- REQUEST API ----------------

export const requestAPI = {
  create: async (payload) => {
    return await API.post('/requests/create', payload);
  },

  getById: async (id) => {
    return await API.get(`/requests/${id}`);
  },

  myRequests: async () => {
    return await API.get('/requests/my-requests');
  },

  departmentRequests: async () => {
    return await API.get('/requests/department');
  },

  updateStatus: async (requestId, payload) => {
    return await API.put(
      `/requests/${requestId}/action`,
      payload
    );
  }
};

// ---------------- UPLOAD API ----------------

export const uploadAPI = {
  uploadDoc: async (formData) => {
    return await API.post('/upload/docs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// ---------------- ADMIN API ----------------

export const adminAPI = {
  dashboard: async () => {
    return await API.get('/admin/dashboard');
  },

  getOfficers: async () => {
    return await API.get('/admin/officers');
  },

  createOfficer: async (payload) => {
    return await API.post('/admin/officers', payload);
  },

  deleteOfficer: async (id) => {
    return await API.delete(`/admin/officers/${id}`);
  }
};

export default {
  auth: authAPI,
  requests: requestAPI,
  uploads: uploadAPI,
  admin: adminAPI
};
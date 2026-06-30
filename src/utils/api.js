import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 8000
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

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }

    console.error(
      '[SUVIDHA API ERROR]',
      error.response?.data || error.message
    );

    // IMPORTANT:
    // No mock fallback anymore.
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
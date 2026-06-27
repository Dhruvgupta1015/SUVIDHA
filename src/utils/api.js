import axios from 'axios';

// Initialize Axios with base endpoint matching the backend Port 5000
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000
});

// Interceptor to automatically attach JWT authorization headers if cached locally
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Define default retry counters and delays
  config.retry = config.retry !== undefined ? config.retry : 3;
  config.retryDelay = config.retryDelay !== undefined ? config.retryDelay : 1000;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to automatically retry requests upon network timeouts or server failures
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;

    // Check if configuration exists and is eligible for retry
    if (!config || !config.retry) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    // Abort if reached maximum limit
    if (config.__retryCount >= config.retry) {
      return Promise.reject(error);
    }

    config.__retryCount += 1;
    console.warn(`[Axios API] Retry attempt #${config.__retryCount} for URL: ${config.url}`);

    // Wait backoff interval
    await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    
    // Re-execute request
    return API(config);
  }
);

// Authentication endpoints
export const authAPI = {
  requestOtp: (mobile) => API.post('/auth/login', { mobile }),
  verifyOtp: (payload) => API.post('/auth/verify-otp', payload)
};

// Request management endpoints
export const requestAPI = {
  create: (payload) => API.post('/requests/create', payload),
  getById: (id) => API.get(`/requests/${id}`),
  updateStatus: (payload) => API.put('/requests/update-status', payload)
};

// Complaint specific endpoints
export const complaintAPI = {
  create: (payload) => API.post('/complaints/create', payload),
  all: () => API.get('/complaints/all')
};

// Document upload helper using Multer multipart/form-data
export const uploadAPI = {
  uploadDoc: (formData) => API.post('/upload/docs', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// Admin metrics & status dispatches
export const adminAPI = {
  dashboard: () => API.get('/admin/dashboard'),
  approve: (id) => API.put('/admin/approve', { id }),
  reject: (id, reason) => API.put('/admin/reject', { id, reason })
};

export default {
  auth: authAPI,
  requests: requestAPI,
  complaints: complaintAPI,
  uploads: uploadAPI,
  admin: adminAPI
};

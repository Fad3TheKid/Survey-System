import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging and injecting auth token
api.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);

    // Get token from localStorage or any auth storage you use
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to unwrap data or handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(message);
  }
);

export const formService = {
  // Form CRUD operations
  getForms: () => api.get('/forms'),
  getForm: (id) => api.get(`/forms/${id}`),
  createForm: (data) => api.post('/forms', data),
  updateForm: (id, data) => api.put(`/forms/${id}`, data),
  deleteForm: (id) => api.delete(`/forms/${id}`),
  publishForm: (id, isPublished) => api.patch(`/forms/${id}/publish`, { isPublished }),

  // Responses operations
  getResponses: (formId) => api.get(`/responses/form/${formId}`),
  submitResponse: (data) => api.post('/responses', data),
  getResponseStats: (formId) => api.get(`/responses/form/${formId}/stats`),

  // Delete individual response by ID
  deleteResponse: (responseId) => api.delete(`/responses/${responseId}`),
};

export default api;

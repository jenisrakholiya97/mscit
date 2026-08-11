import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inventory_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('inventory_token');
      localStorage.removeItem('inventory_user');
      if (window.location.pathname !== '/register' && window.location.pathname !== '/login') {
        window.location.href = '/register';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

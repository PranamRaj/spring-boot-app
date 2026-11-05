import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => {
  const d = e.response?.data;
  if (d?.fieldErrors) return Object.values(d.fieldErrors).join(', ');
  return d?.message || 'Something went wrong. Is the backend running?';
};

/** Local calendar date as YYYY-MM-DD (not UTC). */
export const todayStr = () => new Date().toLocaleDateString('en-CA');

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://estacionamento-rotativo-l65y.onrender.com',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('sp_user');
  if (raw) {
    try {
      const user = JSON.parse(raw);
      if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

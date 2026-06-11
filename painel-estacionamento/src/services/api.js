import axios from 'axios';

const api = axios.create({
  baseURL: 'https://estacionamento-rotativo-l65y.onrender.com',
  // 60s para acomodar o "cold start" do plano gratuito do Render, que pode
  // levar dezenas de segundos para responder à primeira requisição.
  timeout: 60000,
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
    const url = err.config?.url || '';
    // Login/registro retornam 401/400 para credenciais inválidas: isso não
    // significa que a sessão expirou, então não deve deslogar nem redirecionar.
    const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('sp_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

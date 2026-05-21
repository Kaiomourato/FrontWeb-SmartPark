import axios from 'axios';

const api = axios.create({
  baseURL: 'https://estacionamento-rotativo-l65y.onrender.com',
});

// Interceptor para adicionar o token em cada requisição
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('usuario'));
  
  // Se existir um token salvo para o usuário, adiciona no cabeçalho Authorization
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
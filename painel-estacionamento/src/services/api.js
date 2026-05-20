import axios from 'axios';

const api = axios.create({
  baseURL: 'https://estacionamento-rotativo-l65y.onrender.com', 
  headers: {
    'Content-Type': 'application/json',
  }
});

export default api;
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333',
});

// Interceptor para pegar o token do localStorage se ele existir ao recarregar
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('kuhaku_token');
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  }
}

export default api;

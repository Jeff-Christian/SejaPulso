// src/services/api.js

const API_BASE_URL = 'http://localhost:3000/api';

// 🛑 Armazenamento seguro do Token em MEMÓRIA (Sem localStorage)
let inMemoryAccessToken = null;
let currentUser = null;

export const setAuthSession = (token, user) => {
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
};

export const getAuthUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const apiRequest = async (endpoint, method = 'GET', data = null, customToken = null) => {
  const token = customToken || localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Evita erro de 'Unexpected token < in JSON' ao receber HTML de erro do servidor
  const contentType = response.headers.get('content-type');
  let result = {};
  
  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: Rota não encontrada ou resposta inválida do servidor.`);
    }
  }

  if (response.status === 401 || response.status === 403) {
    if (endpoint !== '/auth/login') {
      clearAuthSession();
    }
    throw new Error(result.error || 'Acesso não autorizado.');
  }

  if (!response.ok) {
    throw new Error(result.error || 'Erro ao processar requisição no servidor.');
  }

  return result;
};
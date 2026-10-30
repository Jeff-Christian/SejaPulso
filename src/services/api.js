// src/services/api.js
const API_BASE_URL = 'http://localhost:3000/api';

export const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
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

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const responseData = await response.json();

  if (!response.ok) {
    // 🚪 Se o token expirar (401 ou 403), limpa a sessão e força o re-login
    if (response.status === 401 || response.status === 403) {
      if (responseData.error && responseData.error.toLowerCase().includes('expirado')) {
        localStorage.clear();
        alert('Sua sessão expirou por tempo de inatividade. Por favor, faça login novamente.');
        window.location.href = '/login';
        return;
      }
    }

    throw new Error(responseData.error || `Erro na requisição (${response.status})`);
  }

  return responseData;
};
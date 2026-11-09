const API_BASE_URL = 'http://localhost:3000/api';

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
  // 🟢 Resgata o token (passado manualmente ou do localStorage)
  const savedToken = localStorage.getItem('token');
  const token = customToken || savedToken;

  const headers = {
    'Content-Type': 'application/json',
  };

  // Insere o cabeçalho apenas se houver token válido
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    config.body = JSON.stringify(data);
  }

  console.log(`📡 [API Request] ${method} -> ${API_BASE_URL}${endpoint}`);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  const contentType = response.headers.get('content-type');
  let result = {};

  if (contentType && contentType.includes('application/json')) {
    result = await response.json();
  }

  if (response.status === 401 || response.status === 403) {
    if (endpoint !== '/auth/login') {
      clearAuthSession();
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new Error(result.error || 'Acesso não autorizado. Token ausente ou expirado.');
  }

  if (!response.ok) {
    throw new Error(result.error || 'Erro ao processar requisição no servidor.');
  }

  return result;
};
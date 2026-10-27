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

  console.log(`📡 [API Request] Disparando ${method} para: ${API_BASE_URL}${endpoint}`);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const responseData = await response.json();

    console.log(`📥 [API Response] Status ${response.status}:`, responseData);

    if (!response.ok) {
      throw new Error(responseData.error || `Erro na requisição (${response.status})`);
    }

    return responseData;
  } catch (error) {
    console.error(`❌ [API Error] Falha na conexão com ${endpoint}:`, error.message);
    throw error;
  }
};
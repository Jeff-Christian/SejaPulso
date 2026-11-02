const API_BASE_URL = "http://localhost:3000/api";

let isNotifyingExpired = false;

export const apiRequest = async (
  endpoint,
  method = "GET",
  data = null,
  token = null,
) => {
  const headers = {
    "Content-Type": "application/json",
  };

  // Se o token não for passado explicitamente, tenta pegar do localStorage
  const activeToken = token || localStorage.getItem("token");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // 🔒 Tratamento unificado de expiração (Evita múltiplos alertas)
    if (response.status === 401 && endpoint !== "/auth/login") {
      if (!isNotifyingExpired) {
        isNotifyingExpired = true;

        // Limpa sessão imediatamente
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert("Sua sessão expirou. Por favor, faça login novamente.");
        window.location.href = "/login";
      }
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Erro ao processar requisição no servidor.",
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

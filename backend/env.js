const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
};

export const JWT_SECRET = required("JWT_SECRET");
export const REFRESH_SECRET = required("REFRESH_SECRET");

export const ASAAS_WEBHOOK_TOKEN = required("ASAAS_WEBHOOK_TOKEN");
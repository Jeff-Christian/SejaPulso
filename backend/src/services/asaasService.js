const getAsaasBaseUrl = () =>
  process.env.ASAAS_API_URL || "https://www.asaas.com/api/v3";

const getAsaasHeaders = () => {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chave ASAAS_API_KEY não configurada nas variáveis de ambiente.",
    );
  }
  return {
    "Content-Type": "application/json",
    access_token: apiKey.trim(),
  };
};

/**
 * Busca ou cria um Customer no Asaas pelo CNPJ/CPF
 */
export const findOrCreateAsaasCustomer = async ({
  cnpj,
  companyName,
  email,
  phone,
}) => {
  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();
  const cleanCnpj = cnpj ? cnpj.replace(/\D/g, "") : null;

  if (!cleanCnpj) {
    throw new Error("CNPJ do cliente não informado.");
  }

  // 1. Busca se o cliente já existe pelo CNPJ
  const searchRes = await fetch(`${baseUrl}/customers?cpfCnpj=${cleanCnpj}`, {
    method: "GET",
    headers,
  });
  const searchData = await searchRes.json();

  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0].id;
  }

  // 2. Se não existir, cria o Customer no Asaas
  const createRes = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: companyName || "Empresa Cliente",
      cpfCnpj: cleanCnpj,
      email: email || undefined,
      phone: phone || undefined,
    }),
  });

  const createData = await createRes.json();

  if (!createRes.ok) {
    const errorMsg =
      createData.errors?.[0]?.description ||
      "Erro ao cadastrar cliente no Asaas.";
    throw new Error(errorMsg);
  }

  return createData.id;
};

/**
 * Cria a cobrança do sinal no Asaas
 */
export const createAsaasPayment = async ({
  customerId,
  amount,
  description,
  externalReference,
}) => {
  const baseUrl = getAsaasBaseUrl();
  const headers = getAsaasHeaders();

  // Define data de vencimento (3 dias a partir de hoje)
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const paymentRes = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: customerId, // ID no formato 'cus_...'
      billingType: "UNDEFINED", // Permite o cliente escolher Pix, Boleto ou Cartão
      value: amount,
      dueDate,
      description,
      externalReference,
    }),
  });

  const paymentData = await paymentRes.json();

  if (!paymentRes.ok) {
    const errorMsg =
      paymentData.errors?.[0]?.description || "Erro ao gerar fatura no Asaas.";
    throw new Error(errorMsg);
  }

  return {
    paymentId: paymentData.id,
    paymentUrl: paymentData.invoiceUrl || paymentData.bankSlipUrl,
  };
};

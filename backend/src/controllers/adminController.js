import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import axios from "axios";

// Importações de serviços externos
import {
  findOrCreateAsaasCustomer,
  createAsaasPayment,
  getAsaasPaymentStatus,
} from "../services/asaasService.js";

// 1. Criar consultor diretamente via admin
export const createAffiliateDirectly = async (req, res) => {
  const {
    companyName,
    tradeName,
    cnpj,
    responsible,
    email,
    phone,
    password,
    role,
    tierId,
    pixKey,
  } = req.body;

  try {
    const formattedEmail = buildCorporativeEmail(email);

    // Valida se o CNPJ ou o e-mail já estão cadastrados
    const existing = await prisma.affiliate.findFirst({
      where: { OR: [{ email: formattedEmail }, { cnpj }] },
    });

    if (existing) {
      return res.status(400).json({
        error: "CNPJ ou E-mail corporativo já cadastrado na plataforma.",
      });
    }

    // 🔑 Criptografa a senha informada no formulário (ou usa 123456 como fallback)
    const passwordHash = await bcrypt.hash(password || "123456", 10);

    const newAffiliate = await prisma.affiliate.create({
      data: {
        companyName,
        tradeName: tradeName || companyName,
        cnpj,
        responsible,
        email: formattedEmail,
        phone,
        passwordHash,
        pixKey: pixKey || cnpj,
        role: role || "AFFILIATE",
        status: "APPROVED",
        contractSigned: false,
        tierId: tierId ? parseInt(tierId, 10) : 1,
      },
    });

    return res.status(201).json({
      message: "Consultor criado e aprovado com sucesso!",
      affiliate: newAffiliate,
    });
  } catch (error) {
    console.error("❌ [Backend Error] Falha ao criar consultor:", error);
    return res.status(500).json({ error: "Erro interno ao criar consultor." });
  }
};

// 2. Listar apenas consultores ativos (APPROVED)
export const getActiveAffiliates = async (req, res) => {
  try {
    const activeAffiliates = await prisma.affiliate.findMany({
      where: { status: "APPROVED" },
      include: {
        tier: true,
        _count: { select: { deals: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(activeAffiliates);
  } catch (error) {
    console.error("Erro ao buscar consultores ativos:", error);
    return res
      .status(500)
      .json({ error: "Erro ao buscar consultores ativos." });
  }
};

// Buscar detalhes completos de um consultor específico por ID
export const getAffiliateDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        tier: true,
        leads: true,
        deals: {
          include: {
            lead: true,
            commission: true,
          },
        },
        commissions: true,
      },
    });

    if (!affiliate) {
      return res.status(404).json({ error: "Consultor não encontrado." });
    }

    // Cálculo dinâmico de saldos liberados e pendentes
    const balanceAvailable = affiliate.commissions
      .filter((c) => c.status === "APPROVED" || c.status === "PAID")
      .reduce((acc, c) => acc + c.amount, 0);

    const balancePending = affiliate.commissions
      .filter(
        (c) =>
          c.status === "WAITING_INVOICE" || c.status === "INVOICE_SUBMITTED",
      )
      .reduce((acc, c) => acc + c.amount, 0);

    return res.json({
      ...affiliate,
      financialSummary: {
        balanceAvailable: `R$ ${balanceAvailable.toFixed(2)}`,
        balancePending: `R$ ${balancePending.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes do consultor:", error);
    return res
      .status(500)
      .json({ error: "Erro ao buscar detalhes do consultor." });
  }
};

// Função utilitária do e-mail corporativo
export const buildCorporativeEmail = (emailInput) => {
  if (!emailInput) return "";
  const username = emailInput.split("@")[0].trim().toLowerCase();
  return `${username}@pulsotech.com.br`;
};

export const updateAffiliateDetails = async (req, res) => {
  const { id } = req.params;
  const {
    companyName,
    tradeName,
    cnpj,
    responsible,
    email,
    phone,
    pixKey,
    tierId,
    status,
  } = req.body;

  try {
    // 1. Formata o e-mail garantindo a extensão @pulsotech.com.br
    const formattedEmail = buildCorporativeEmail(email);

    // 2. Valida e converte o tierId com fallback seguro
    const parsedTierId = tierId ? parseInt(tierId, 10) : undefined;

    // 3. Atualiza os dados no PostgreSQL via Prisma
    const updatedAffiliate = await prisma.affiliate.update({
      where: { id },
      data: {
        companyName,
        tradeName,
        cnpj,
        responsible,
        email: formattedEmail,
        phone,
        pixKey,
        ...(parsedTierId && !isNaN(parsedTierId)
          ? { tierId: parsedTierId }
          : {}),
        status,
      },
    });

    return res.json({
      message: "Dados do consultor atualizados com sucesso!",
      affiliate: updatedAffiliate,
    });
  } catch (error) {
    // Imprime o erro detalhado do Prisma/Node no terminal do backend para diagnosticar
    console.error("❌ [Backend Error] Falha ao atualizar consultor:", error);

    // Trata erro de duplicidade de chave única (CNPJ ou E-mail) do Prisma
    if (error.code === "P2002") {
      return res.status(400).json({
        error: "CNPJ ou E-mail corporativo já cadastrado para outro consultor.",
      });
    }

    return res
      .status(500)
      .json({ error: "Erro ao atualizar dados do consultor." });
  }
};

// 4. Excluir (remover) consultor
export const deleteAffiliate = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.affiliate.delete({ where: { id } });
    return res.json({ message: "Consultor removido com sucesso!" });
  } catch (error) {
    console.error("Erro ao remover consultor:", error);
    return res.status(500).json({ error: "Erro ao remover o consultor." });
  }
};

// Buscar todas as vendas/handovers enviados pelos consultores que aguardam validação do Admin/Financeiro
export const getPendingDeals = async (req, res) => {
  console.log(
    "🔥 [Admin Controller] Entrou no getPendingDeals e iniciando validação do Asaas...",
  );

  try {
    const deals = await prisma.deal.findMany({
      where: {
        status: {
          in: [
            "WAITING_FINANCIAL_VALIDATION",
            "WAITING_PRICING_SLA",
            "WAITING_INTERNAL_REVIEW",
          ],
        },
      },
      include: {
        affiliate: {
          select: {
            id: true,
            companyName: true,
            responsible: true,
            email: true,
            cnpj: true,
          },
        },
        lead: true,
        commission: true,
      },
      orderBy: { closedAt: "desc" },
    });

    const synchronizedDeals = await Promise.all(
      deals.map(async (deal) => {
        if (!deal.asaasPaymentId) {
          return deal;
        }

        console.log(
          `📡 Consultando status no Asaas para a cobrança: ${deal.asaasPaymentId}`,
        );

        try {
          const check = await getAsaasPaymentStatus(deal.asaasPaymentId);
          console.log(
            `📥 Status retornado do Asaas para ${deal.asaasPaymentId}:`,
            check,
          );

          // Se a cobrança não existe mais ou foi marcada como deletada/cancelada
          if (
            !check.exists ||
            check.deleted ||
            check.status === "DELETED" ||
            check.status === "CANCELLED"
          ) {
            console.log(
              `⚠️ Cobrança ${deal.asaasPaymentId} foi REMOVIDA/CANCELADA no Asaas. Limpando no Neon.tech...`,
            );

            await prisma.deal.update({
              where: { id: deal.id },
              data: {
                asaasPaymentId: null,
                paymentUrl: null,
              },
            });

            return { ...deal, asaasPaymentId: null, paymentUrl: null };
          }
        } catch (err) {
          console.error(
            `❌ Erro ao validar cobrança Asaas para deal ${deal.id}:`,
            err.message,
          );
        }

        return deal;
      }),
    );

    return res.json(synchronizedDeals);
  } catch (error) {
    console.error("❌ Erro ao buscar vendas no Admin:", error);
    return res.status(500).json({
      error: "Erro ao listar vendas.",
      details: error.message,
    });
  }
};

// Gerar Cobrança de Sinal 50% via Asaas (Acionado pelo EditDealModal.jsx)
export const createAsaasCharge = async (req, res) => {
  const { dealId } = req.params;

  console.log(
    `🚀 [Asaas Charge Controller] Iniciando geração de cobrança para Deal: ${dealId}`,
  );

  try {
    // 1. Busca os dados da venda no PostgreSQL via Prisma
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { lead: true, affiliate: true },
    });

    if (!deal) {
      return res.status(404).json({ error: "Venda/Deal não encontrada." });
    }

    // 2. TRATAMENTO ROBUSTO DO VALOR (Calcula rigorosamente 50% de sinal)
    // Converte de "R$ 1.500,00" ou "1500.00" para o número float real (ex: 1500.00)
    let rawValue = deal.finalValue || "0";

    // Remove símbolos R$, espaços e converte pontuação brasileira
    let cleanedString = rawValue
      .replace(/[^\d,-]/g, "") // Remove tudo que não for dígito, vírgula ou hífen
      .replace(".", "") // Remove ponto de milhar
      .replace(",", "."); // Converte vírgula decimal em ponto

    const numericValue = parseFloat(cleanedString);

    if (isNaN(numericValue) || numericValue <= 0) {
      return res.status(400).json({
        error: "Valor final da venda inválido para geração de cobrança.",
      });
    }

    // 🎯 SINAL DE 50% RIGOROSO:
    const downPaymentAmount = Number((numericValue * 0.5).toFixed(2));

    console.log(
      `💰 [Cálculo Asaas] Valor Total Negociado: R$ ${numericValue} | Valor do Sinal (50%): R$ ${downPaymentAmount}`,
    );

    // 3. Busca ou cria o Customer no Asaas pelo CNPJ limpo
    const asaasCustomerId = await findOrCreateAsaasCustomer({
      cnpj: deal.lead?.cnpj,
      companyName: deal.lead?.companyName,
      email: deal.lead?.contactEmail,
      phone: deal.lead?.contactPhone,
    });

    // 4. Chama o Serviço Isolado do Asaas para gerar a fatura do sinal (50%)
    const { paymentId, paymentUrl } = await createAsaasPayment({
      customerId: asaasCustomerId,
      amount: downPaymentAmount, // Envia exatamente os 50% calculados
      description: `Sinal (50%) - Projeto ${deal.selectedPackage} (Pulso Tech)`,
      externalReference: deal.id,
    });

    // 5. Atualiza o registro no PostgreSQL (Neon.tech)
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        asaasPaymentId: paymentId,
        paymentUrl: paymentUrl,
        status: "WAITING_FINANCIAL_VALIDATION",
      },
    });

    console.log(
      `✅ [Asaas Charge Controller] Cobrança de Sinal (R$ ${downPaymentAmount}) gerada com sucesso! ID: ${paymentId}`,
    );

    return res.json({
      message: `Cobrança de sinal (50% - R$ ${downPaymentAmount}) gerada com sucesso no Asaas!`,
      asaasPaymentId: paymentId,
      paymentUrl,
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("❌ [Asaas Charge Error]:", error.message);
    return res.status(500).json({
      error:
        error.message ||
        "Erro interno ao processar cobrança de sinal no Asaas.",
    });
  }
};

// Atualizar informações da venda/deal pelo Admin (botão "Salvar Alterações")
export const updateDealDetails = async (req, res) => {
  const { dealId } = req.params;
  const {
    selectedPackage,
    finalValue,
    offerDetails,
    leadCompanyName,
    leadCnpj,
  } = req.body;

  try {
    // 1. Atualiza os dados do contrato na tabela Deal
    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        selectedPackage,
        finalValue,
        offerDetails,
      },
      include: { lead: true, affiliate: true },
    });

    // 2. Atualiza os dados da Empresa Cliente na tabela Lead se informados
    if (updatedDeal.leadId && (leadCompanyName || leadCnpj)) {
      await prisma.lead.update({
        where: { id: updatedDeal.leadId },
        data: {
          companyName: leadCompanyName || undefined,
          cnpj: leadCnpj ? leadCnpj.replace(/\D/g, "") : undefined,
        },
      });
    }

    console.log(
      `✅ [Deal Update] Informações da venda ${dealId} atualizadas com sucesso.`,
    );

    return res.json({
      message: "Dados da venda atualizados com sucesso!",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar dados da venda no Admin:", error);
    return res.status(500).json({
      error: "Erro ao atualizar dados da venda.",
      details: error.message,
    });
  }
};

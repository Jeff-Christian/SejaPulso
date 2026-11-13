import fetch from "node-fetch";
import { prisma } from "../config/db.js";
import { getPackageByCode } from "../config/serviceCatalog.js";

import { getFreePitch } from "../services/pitchGateway.js";
import { toCompanyData } from "../services/brasilApiService.js";

import { isValidCnpj, onlyDigits } from "../utils/brDocs.js";
import { countActiveLeads, MAX_ACTIVE_LEADS } from "../services/leadPoolService.js";

// 1. Repassar Lead para Vendas / Pós-Vendas (Handover)
export const handoverLead = async (req, res) => {
  const { id: leadId } = req.params;
  const { selectedPackage, finalValue, offerDetails } = req.body;

  const affiliateId = req.user?.id || req.user?.affiliateId;

  console.log(
    `🚀 [API Call] POST /api/leads/${leadId}/handover iniciada pelo consultor ID: ${affiliateId}`,
  );
  console.log("📦 [Payload Recebido]:", {
    selectedPackage,
    finalValue,
    offerDetails,
  });

  if (!affiliateId) {
    console.error("❌ [Handover Error]: Usuário não identificado no Token JWT.");
    return res
      .status(401)
      .json({ error: "Sessão inválida. Usuário não identificado." });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead || lead.affiliateId !== affiliateId) {
    return res.status(404).json({ error: "Lead não encontrado na sua carteira." });
  }

  if (["WAITING_INTERNAL_REVIEW", "DEAL_CLOSED"].includes(lead.status)) {
    return res.status(409).json({ error: "Este lead já foi enviado para fechamento." });
  }

  const existingDeal = await prisma.deal.findUnique({ where: { leadId } });
  if (existingDeal?.asaasPaymentId) {
    return res.status(409).json({
      error: "Já existe uma cobrança emitida para esta venda. Fale com o financeiro para alterações.",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      console.log(
        `⏳ Atualizando status do Lead ${leadId} para WAITING_INTERNAL_REVIEW...`,
      );
      const updatedLead = await tx.lead.update({
        where: { id: leadId, affiliateId },
        data: { status: "WAITING_INTERNAL_REVIEW" },
      });

      console.log(`⏳ Gravando contrato na tabela Deal...`);
      const pkgInfo = getPackageByCode(selectedPackage);
      const isEnterprise =
        pkgInfo?.plan === "ENTERPRISE" || selectedPackage === "ENTERPRISE";
      const dealStatus = isEnterprise
        ? "WAITING_PRICING_SLA"
        : "WAITING_FINANCIAL_VALIDATION";

      const newDeal = await tx.deal.upsert({
        where: { leadId },
        update: {
          affiliateId,
          selectedPackage,
          finalValue: String(finalValue),
          offerDetails: String(offerDetails),
          status: dealStatus,
        },
        create: {
          leadId,
          affiliateId,
          selectedPackage,
          finalValue: String(finalValue),
          offerDetails: String(offerDetails),
          status: dealStatus,
        },
      });

      return { updatedLead, newDeal };
    });

    console.log(`✅ [Handover Sucesso]: Lead ${leadId} repassado para vendas!`);
    return res.status(200).json({
      message: "Venda repassada para validação interna com sucesso!",
      data: result,
    });
  } catch (error) {
    console.error(`❌ [Handover Exception Error]:`, error);
    return res.status(500).json({
      error: "Erro interno ao registrar handover de venda.",
      details: error.message,
    });
  }
};

// 2. Buscar agendamentos do consultor logado
export const getMyLeads = async (req, res) => {
  const affiliateId = req.user?.id;

  if (!affiliateId) {
    return res.status(401).json({ error: "Sessão inválida ou expirada." });
  }

  try {
    const myLeads = await prisma.lead.findMany({
      where: { affiliateId },
      orderBy: { claimedAt: "desc" },
    });

    return res.json(myLeads);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return res.status(500).json({ error: "Erro ao carregar agendamentos." });
  }
};

// 3. Reivindicar/Agendar Lead
export const claimLead = async (req, res) => {
  const { cnpj, companyName, contactName } = req.body;
  const affiliateId = req.user?.id;
  if (!affiliateId) {
    return res.status(401).json({ error: "Sessão inválida. Usuário não identificado." });
  }

  const cleanCnpj = onlyDigits(cnpj);
  if (!isValidCnpj(cleanCnpj)) {
    return res.status(400).json({ error: "CNPJ inválido." });
  }

  try {
    const active = await countActiveLeads(affiliateId);
    if (active >= MAX_ACTIVE_LEADS) {
      return res.status(409).json({
        error: `Você já tem ${MAX_ACTIVE_LEADS} leads em negociação. Finalize ou libere algum antes de reservar outro.`,
      });
    }

    // 1) Lead livre no pool → reserva atômica (só um consultor consegue)
    const taken = await prisma.lead.updateMany({
      where: {
        cnpj: cleanCnpj,
        affiliateId: null,
        status: "POOL",
        availableAt: { lte: new Date() },
      },
      data: { affiliateId, status: "COMMERCIAL_CONTACT", claimedAt: new Date() },
    });

    if (taken.count === 1) {
      const lead = await prisma.lead.findUnique({ where: { cnpj: cleanCnpj } });
      return res.json({ message: "Lead reservado com sucesso!", lead });
    }

    // 2) Não conseguiu: descobre o motivo
    const existing = await prisma.lead.findUnique({ where: { cnpj: cleanCnpj } });

    if (existing) {
      if (existing.affiliateId === affiliateId) {
        return res.json({ message: "Este lead já está na sua carteira.", lead: existing });
      }
      return res.status(409).json({
        error: existing.affiliateId
          ? "Este CNPJ já pertence a outro consultor."
          : "Este CNPJ está temporariamente indisponível.",
      });
    }

    // 3) Não existe na base: contato trazido pelo próprio consultor
    try {
      const lead = await prisma.lead.create({
        data: {
          cnpj: cleanCnpj,
          companyName: companyName || "Razão Social não informada",
          contactName: contactName || companyName || "Contato Principal",
          affiliateId,
          status: "COMMERCIAL_CONTACT",
          claimedAt: new Date(),
          source: "CONSULTOR",
        },
      });
      return res.json({ message: "Lead reservado com sucesso!", lead });
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(409).json({ error: "Este CNPJ acabou de ser reservado por outro consultor." });
      }
      throw e;
    }
  } catch (error) {
    console.error("❌ [claimLead]:", error);
    return res.status(500).json({ error: "Erro ao reservar lead." });
  }
};

// 4. Consultar CNPJ
export const consultCnpjAndCheckOwnership = async (req, res) => {
  const { cnpj } = req.params;
  const currentAffiliateId = req.user?.id || req.user?.affiliateId;

  const cleanCnpj = cnpj ? cnpj.replace(/\D/g, "") : "";

  console.log(
    `🔍 [API Call] GET /api/leads/consult/${cleanCnpj} pelo consultor: ${currentAffiliateId}`,
  );

  if (cleanCnpj.length !== 14) {
    return res
      .status(400)
      .json({ error: "CNPJ inválido. Digite os 14 dígitos." });
  }

  try {
    // 1. Verifica no banco se o lead já possui um consultor responsável
    const existingLead = await prisma.lead.findFirst({
      where: { cnpj: cleanCnpj },
    });

    // 2. Consulta os dados públicos da Receita Federal via BrasilAPI
    const apiResponse = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`,
      {
        headers: { "User-Agent": "SejaPulso-B2B-App/1.0" },
      },
    );

    if (apiResponse.status === 404) {
      return res
        .status(404)
        .json({ error: "CNPJ não encontrado na base da Receita Federal." });
    }

    if (!apiResponse.ok) {
      return res.status(502).json({
        error:
          "Serviço da Receita Federal/BrasilAPI temporariamente indisponível.",
      });
    }

    const brasilData = await apiResponse.json();

    // 3. Lógica de Paternidade/Exclusividade
    const isClaimedByAnother =
      existingLead &&
      existingLead.affiliateId &&
      existingLead.affiliateId !== currentAffiliateId;
    const isClaimedByMe =
      existingLead && existingLead.affiliateId === currentAffiliateId;

    // 4. Dados "crus" para a IA (sem placeholders do tipo "não informado")
    const companyData = toCompanyData(brasilData, cleanCnpj);

    // 5. Inteligência de vendas (custo zero: cache ou fallback do serviceCatalog)
    const intelligence = isClaimedByAnother ? null : await getFreePitch(companyData);

    return res.json({
      status: isClaimedByAnother ? "BLOCKED" : "AVAILABLE",
      isClaimed: !!existingLead?.affiliateId,
      isOwnedByMe: isClaimedByMe,
      claimedByConsultant: isClaimedByAnother ? "Outro consultor" : null,
      leadId: existingLead?.id || null,
      cnpj: cleanCnpj,
      companyName: brasilData.razao_social || "Razão Social não informada",
      tradeName:
        brasilData.nome_fantasia ||
        brasilData.razao_social ||
        "Nome Fantasia não informado",
      registrationStatus: brasilData.descricao_situacao_cadastral || "ATIVA",
      cnaeCode: brasilData.cnae_fiscal || "",
      cnaeDescription: brasilData.cnae_fiscal_descricao || "Atividade Geral",
      location: `${brasilData.municipio || "Cidade"} / ${brasilData.uf || "UF"}`,
      officialPhone:
        brasilData.ddd_telefone_1 || brasilData.telefone_1 || "Não informado",
      officialEmail: brasilData.email || "Não informado",
      intelligence,
    });
  } catch (error) {
    console.error("❌ [Backend Error - Consulta CNPJ]:", error);
    return res
      .status(500)
      .json({ error: "Erro interno ao consultar dados do CNPJ no servidor." });
  }
};

// 5. Listar todos os leads
export const listLeads = async (req, res) => {
  console.log(`🔍 [API Call] GET /api/leads/`);
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { claimedAt: "desc" },
    });
    return res.json(leads);
  } catch (error) {
    console.error("❌ [listLeads Exception Error]:", error);
    return res.status(500).json({
      error: "Erro ao buscar a base de leads.",
      details: error.message,
    });
  }
};

// 6. Retorna todas as vendas/handovers do consultor
export const getMyDeals = async (req, res) => {
  const affiliateId = req.user?.id || req.user?.affiliateId;

  console.log(`🔍 [getMyDeals] Buscando vendas/handovers para o consultor ID: ${affiliateId}`);

  if (!affiliateId) {
    return res.status(401).json({ error: "Sessão inválida. Usuário não identificado." });
  }

  try {
    const deals = await prisma.deal.findMany({
      where: { affiliateId },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            cnpj: true,
            contactPhone: true,
            contactEmail: true,
            status: true,
          },
        },
        commission: true,
      },
      orderBy: { closedAt: "desc" },
    });

    console.log(`✅ [getMyDeals] ${deals.length} vendas encontradas com sucesso para o consultor.`);
    return res.json(deals);
  } catch (error) {
    console.error("❌ [Backend Error] Falha ao buscar vendas do consultor:", error);
    return res.status(500).json({
      error: "Erro ao carregar vendas e comissões.",
      details: error.message,
    });
  }
};
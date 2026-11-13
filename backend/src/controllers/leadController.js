import fetch from "node-fetch";
import { prisma } from "../config/db.js";
import OpenAI from "openai";

import { getFreePitch } from "../services/pitchGateway.js";
import { toCompanyData } from "../services/brasilApiService.js";

import { isValidCnpj, onlyDigits } from "../utils/brDocs.js";
import { countActiveLeads, MAX_ACTIVE_LEADS } from "../services/leadPoolService.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// 1. Repassar Lead para Vendas / Pós-Vendas (Handover)
export const handoverLead = async (req, res) => {
  const { id: leadId } = req.params;
  const { selectedPackage, finalValue, offerDetails } = req.body;

  // Extrai o ID do consultor autenticado
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
    console.error(
      "❌ [Handover Error]: Usuário não identificado no Token JWT.",
    );
    return res
      .status(401)
      .json({ error: "Sessão inválida. Usuário não identificado." });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead || lead.affiliateId !== affiliateId) {
    // 404 para não revelar se o ID existe
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
      // Atualiza o status do Lead no pool do consultor
      console.log(
        `⏳ Atualizando status do Lead ${leadId} para WAITING_INTERNAL_REVIEW...`,
      );
      const updatedLead = await tx.lead.update({
        where: { id: leadId, affiliateId },
        data: { status: "WAITING_INTERNAL_REVIEW" },
      });

      // Salva o fechamento na tabela Deal
      console.log(`⏳ Gravando contrato na tabela Deal...`);
      const newDeal = await tx.deal.upsert({
        where: { leadId },
        update: {
          affiliateId,
          selectedPackage,
          finalValue: String(finalValue),
          offerDetails: String(offerDetails),
          status:
            selectedPackage === "ENTERPRISE"
              ? "WAITING_PRICING_SLA"
              : "WAITING_FINANCIAL_VALIDATION",
        },
        create: {
          leadId,
          affiliateId,
          selectedPackage,
          finalValue: String(finalValue),
          offerDetails: String(offerDetails),
          status:
            selectedPackage === "ENTERPRISE"
              ? "WAITING_PRICING_SLA"
              : "WAITING_FINANCIAL_VALIDATION",
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
    // 🔴 Exibe a causa exata no terminal do backend
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
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  try {
    const myLeads = await prisma.lead.findMany({
      where: { affiliateId },
      orderBy: { claimedAt: 'desc' }
    });

    return res.json(myLeads);
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    return res.status(500).json({ error: 'Erro ao carregar agendamentos.' });
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
// 6. Gera um direcionamento de venda inteligente para o consultor
// Substitui a função generateSmartPitch atual. Continua usando `openai` e
// `CNAE_PACKAGE_MAP` que já existem no seu arquivo.

const FREE_EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "bol.com.br",
  "uol.com.br",
  "icloud.com",
];

// Monta SINAIS reais sobre a empresa. Quanto mais fato verdadeiro a IA recebe,
// menos ela inventa e menos genérica fica.
const buildSignals = (c) => {
  const signals = [];

  const email = String(c.officialEmail || "").toLowerCase();
  const domain = email.split("@")[1];
  if (domain) {
    signals.push(
      FREE_EMAIL_DOMAINS.includes(domain)
        ? `Usa e-mail gratuito (${domain}): sinal forte de que NÃO tem domínio/site próprio`
        : `Usa e-mail com domínio próprio (@${domain}): pode já ter site, vale perguntar se está atualizado`,
    );
  }

  if (c.openingDate) {
    const years = Math.floor(
      (Date.now() - new Date(c.openingDate).getTime()) / 31557600000,
    );
    if (!Number.isNaN(years)) {
      signals.push(
        years < 2
          ? `Empresa nova (${years} ano(s)): precisa ser encontrada e passar credibilidade`
          : `Empresa com ${years} anos de mercado: já tem clientela, o ganho é organizar e captar mais`,
      );
    }
  }

  if (c.companySize) signals.push(`Porte: ${c.companySize}`);
  if (c.capitalSocial) signals.push(`Capital social: R$ ${c.capitalSocial}`);

  const phone = String(c.officialPhone || "").replace(/\D/g, "");
  if (phone.length === 11 && phone[2] === "9") {
    signals.push("Telefone oficial é celular (provável WhatsApp)");
  } else if (phone.length === 10) {
    signals.push(
      "Telefone oficial é fixo (WhatsApp talvez não seja o canal principal)",
    );
  }

  return signals;
};

const SYSTEM_PROMPT = `Você é um Diretor Comercial B2B sênior da SejaPulso / Pulso Tech. Você treina consultores de vendas que vão abordar pequenas e médias empresas locais, quase sempre pelo WhatsApp, para vender sites e presença digital.

O consultor recebe dados públicos do CNPJ. Ele NÃO conhece a empresa. Sua tarefa é dizer COMO ele deve conduzir a conversa, com a dor mais provável do SEGMENTO.

## Regras de honestidade (mais importantes)
- Você só tem dados públicos. NUNCA afirme ter visto o Instagram, o site, o trabalho ou os clientes da empresa. Proibido: "acompanho o trabalho de vocês", "vi que vocês...", "parabéns pelo trabalho".
- Trate dores como PROVÁVEIS do segmento, nunca como fatos sobre a empresa. Use "costuma", "em geral", "muito comum".
- Use os "signals" recebidos para personalizar. Se um signal indicar e-mail gratuito, a pergunta de abertura pode checar se já têm site. Se a empresa é antiga, valorize a clientela existente.
- Não invente números, estatísticas nem prazos.

## Tradução do segmento
- Converta o CNAE para como o dono fala no dia a dia (ex.: "mercadinho", "oficina mecânica", "clínica de estética"). Nunca copie a descrição da Receita.

## Estilo do script de WhatsApp
- 2 a 3 frases curtas, tom de conversa entre pessoas, sem emoji em excesso (no máximo 1).
- Começa com o nome da empresa de forma natural e termina com UMA pergunta simples e fácil de responder.
- Foca em um problema do segmento, não em vender o produto. NÃO mencione preço nem o nome do pacote.
- Proibido clichê: "estudo rápido de conversão", "carregamento abaixo de 2 segundos", "canal de atendimento instantâneo", "solução completa", "transformação digital", "presença digital" solto, "posso te enviar uma proposta".

## Qualidade
- Cada item precisa ser específico para ESTE segmento. Se serviria para qualquer empresa, reescreva.
- Objeções devem ser as que um dono desse segmento realmente faria, com respostas curtas e honestas, sem pressão.

## Formato
Responda APENAS com JSON válido neste formato exato:
{
  "segmentLabel": "string, nome popular do negócio (2 a 4 palavras)",
  "whyOffer": "string, 2 a 3 frases informais para o consultor: por que esse pacote faz sentido para esse segmento e o que o dono perde sem ele",
  "painPoints": ["string", "string", "string"],
  "pitchScript": "string, mensagem de WhatsApp",
  "openingQuestions": ["string", "string"],
  "objections": [
    { "objection": "string", "answer": "string" },
    { "objection": "string", "answer": "string" }
  ],
  "avoid": ["string", "string"],
  "nextStep": "string, o micro-passo que o consultor deve propor depois da resposta positiva (ex.: mandar exemplo, marcar 10 min de conversa)"
}

## Exemplo de qualidade (segmento diferente, só para calibrar o nível)
Entrada: oficina mecânica, e-mail gmail, 8 anos, celular.
Saída esperada (resumida):
{
  "segmentLabel": "Oficina mecânica",
  "whyOffer": "Oferta o site simples porque oficina vive de confiança e indicação. Quem não acha a oficina no Google ou não vê o que ela faz acaba indo na que aparece primeiro, mesmo sendo pior.",
  "painPoints": ["Cliente pesquisa 'mecânico perto de mim' e não encontra a oficina", "Orçamento por telefone toma tempo e muita gente desiste de esperar", "Sem lugar para mostrar serviços, horários e localização num só lugar"],
  "pitchScript": "Oi, pessoal da Auto Center Silva, tudo bem? Trabalho com sites para oficinas e vi que vocês estão em Santo André. Quando alguém busca mecânico na região, vocês já aparecem com endereço e botão de WhatsApp?",
  "openingQuestions": ["Hoje o cliente novo chega mais por indicação ou por busca na internet?", "Vocês já têm um lugar onde o cliente vê serviços e horário sem precisar ligar?"],
  "objections": [{"objection": "Meus clientes vêm por indicação", "answer": "Ótimo sinal. O site não substitui isso, ele ajuda quem foi indicado a confirmar que vocês são confiáveis antes de ir."}],
  "avoid": ["Falar de tecnologia ou SEO com termo técnico", "Mandar o preço antes de entender se ele quer o site"],
  "nextStep": "Oferecer enviar um exemplo de site de outra oficina e combinar 10 minutos para conversar."
}`;

const asStringArray = (v, max) =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim()).slice(0, max)
    : [];

// Garante que o frontend nunca quebre com resposta incompleta da IA
const normalizeAiContent = (raw) => {
  const pitchScript =
    typeof raw?.pitchScript === "string" ? raw.pitchScript.trim() : "";
  const whyOffer = typeof raw?.whyOffer === "string" ? raw.whyOffer.trim() : "";
  if (!pitchScript || !whyOffer) throw new Error("Resposta da IA incompleta");

  return {
    segmentLabel: String(raw.segmentLabel || "").trim(),
    whyOffer,
    painPoints: asStringArray(raw.painPoints, 3),
    pitchScript,
    openingQuestions: asStringArray(raw.openingQuestions, 2),
    objections: Array.isArray(raw.objections)
      ? raw.objections
          .filter((o) => o?.objection && o?.answer)
          .slice(0, 3)
          .map((o) => ({
            objection: String(o.objection),
            answer: String(o.answer),
          }))
      : [],
    avoid: asStringArray(raw.avoid, 3),
    nextStep: typeof raw?.nextStep === "string" ? raw.nextStep.trim() : "",
  };
};

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

    // 5. Inteligência de vendas (OpenAI). Não gasta chamada se o lead
    // já pertence a outro consultor. generateSmartPitch nunca lança erro:
    // em falha ele devolve um fallback.
    const intelligence = isClaimedByAnother ? null : await getFreePitch(companyData);
    
    // Retorna SEMPRE as informações da empresa, informando a situação da reserva
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

// 5. Retorna todas as vendas/handovers
export const getMyDeals = async (req, res) => {
  // Extrai o ID do consultor autenticado via token JWT
  const affiliateId = req.user?.id || req.user?.affiliateId;

  console.log(`🔍 [getMyDeals] Buscando vendas/handovers para o consultor ID: ${affiliateId}`);

  if (!affiliateId) {
    return res.status(401).json({ error: 'Sessão inválida. Usuário não identificado.' });
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
            status: true
          }
        },
        commission: true
      },
      orderBy: { closedAt: 'desc' } // 👈 Ordenação oficial por closedAt (existente no schema)
    });

    console.log(`✅ [getMyDeals] ${deals.length} vendas encontradas com sucesso para o consultor.`);
    return res.json(deals);
  } catch (error) {
    console.error('❌ [Backend Error] Falha ao buscar vendas do consultor:', error);
    return res.status(500).json({
      error: 'Erro ao carregar vendas e comissões.',
      details: error.message
    });
  }
};

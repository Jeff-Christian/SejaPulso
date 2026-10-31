import fetch from 'node-fetch';
import { prisma } from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Mapeamento Dinâmico de CNAE para Pacotes Reais do Cardápio Oficial
const CNAE_PACKAGE_MAP = {
  // Saúde, Estética, Odontologia e Clínicas -> Landing Page Start
  '86': { 
    package: 'Landing Page Start (R$ 1.500,00)', 
    focus: 'agendamento rápido de consultas e tráfego pago' 
  },
  // Comércio Varejista, Minimercados, Mercearias e Lojas de Bairro -> Catálogo Digital
  '47': { 
    package: 'Catálogo Digital Interativo (R$ 1.800,00)', 
    focus: 'exibir produtos/ofertas com pedido rápido no WhatsApp' 
  },
  // Advogados, Contadores, Consultorias e Serviços B2B -> Site Standard
  '69': { 
    package: 'Site Institucional Standard (R$ 2.500,00)', 
    focus: 'transmitir autoridade e posicionamento profissional' 
  },
  // Reparos, Manutenção, Oficinas e Serviços Locais -> Landing Page Start
  '95': { 
    package: 'Landing Page Start (R$ 1.500,00)', 
    focus: 'orçamentos ágeis via foto/mensagem no WhatsApp' 
  },
  // E-commerce, Distribuidoras e Comércio Atacadista -> Loja Virtual Pro
  '46': { 
    package: 'Loja Virtual Pro (R$ 5.500,00)', 
    focus: 'catálogo estruturado e vendas em escala' 
  }
};

// 2. Função Geradora de Inteligência com Gemini AI
export const generateSmartPitch = async (companyData) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada no arquivo .env');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Extrai o grupo principal do CNAE (primeiros 2 dígitos)
    const cnaeCode = String(companyData.cnaeCode || '').replace(/\D/g, '');
    const cnaeGroup = cnaeCode.substring(0, 2);

    // Mapeia o pacote dinâmico ou utiliza o fallback de R$ 2.500 para serviços gerais
    const mappedInfo = CNAE_PACKAGE_MAP[cnaeGroup] || {
      package: 'Site Institucional Standard (R$ 2.500,00)',
      focus: 'presença digital e validação de marca com clientes'
    };

    // Limpeza rigorosa do Nome Comercial (remove números, LTDA, MEI, ME, EPP, S/A)
    const cleanCompanyName = (companyData.tradeName || companyData.companyName)
      .replace(/\d+/g, '')
      .replace(/LTDA|MEI|ME|EPP|S\/A/gi, '')
      .replace(/[\.\-\/]/g, '')
      .trim();

    const prompt = `
      Você é um Diretor Comercial B2B pragmático, experiente e muito focado em conversão na SejaPulso / Pulso Tech.
      Forneça um direcionamento direto e um script de WhatsApp humanizado para um consultor abordar este cliente:

      - Nome da Empresa: ${cleanCompanyName}
      - Atividade do Cliente (CNAE): ${companyData.cnaeDescription}
      - Localização: ${companyData.location}
      - Pacote do Cardápio Recomendado: ${mappedInfo.package}
      - Foco Comercial da Solução: ${mappedInfo.focus}

      REGRAS RÍGIDAS E OBRIGATÓRIAS:
      1. PROIBIDO usar expressões engessadas ou repetitivas como "Vi o trabalho de vocês de... achei muito bacana" ou "Analisando o canal digital do setor...".
      2. PROIBIDO copiar a descrição formal e longa do CNAE. Traduza a atividade para o termo comum usado no dia a dia do negócio (ex: em vez de "Comércio varejista de mercadorias em geral...", use "minimercado/mercearia").
      3. A Dica do Consultor (whyOffer) deve ser uma orientação pragmática de negócios em 1 ou 2 frases: "Olha, oferta X para ele porque empresas desse ramo perdem dinheiro quando Y...".
      4. O Script do WhatsApp (pitchScript) deve ser uma mensagem curta de 2 a 3 frases, simpática, humanizada e natural, pronta para envio direto pelo consultor.

      Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
      {
        "suggestedPackage": "${mappedInfo.package}",
        "whyOffer": "Sua dica pragmática de vendas para o consultor",
        "pitchScript": "Sua mensagem curta e natural para WhatsApp"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedJson);

  } catch (error) {
    console.error('⚠️ [IA Pitch Warning] Usando fallback humanizado:', error.message);

    const cnaeCode = String(companyData.cnaeCode || '').replace(/\D/g, '');
    const cnaeGroup = cnaeCode.substring(0, 2);
    const mappedInfo = CNAE_PACKAGE_MAP[cnaeGroup] || {
      package: 'Site Institucional Standard (R$ 2.500,00)',
      focus: 'presença digital profissional'
    };

    const cleanName = (companyData.tradeName || companyData.companyName)
      .replace(/\d+/g, '')
      .replace(/LTDA|MEI|ME/gi, '')
      .trim();

    return {
      suggestedPackage: mappedInfo.package,
      whyOffer: `Para empresas atuando em ${companyData.cnaeDescription}, o maior ganho é facilitar o acesso rápido do cliente às informações e orçamentos direto pelo WhatsApp.`,
      pitchScript: `Olá, pessoal da ${cleanName}! Acompanho o trabalho de vocês aí em ${companyData.location}. Vocês já têm uma página rápida onde o cliente consegue ver os serviços e chamar direto no WhatsApp? Criamos modelos focados nisso para empresas da região. Posso te enviar um exemplo sem compromisso?`
    };
  }
};

// 3. Controller de Consulta de CNPJ
export const consultCnpjAndCheckOwnership = async (req, res) => {
  const { cnpj } = req.params;
  const affiliateId = req.user?.id || req.user?.affiliateId;

  const cleanCnpj = String(cnpj).replace(/\D/g, '');

  if (cleanCnpj.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido. Digite os 14 dígitos.' });
  }

  try {
    // A. Verifica se o lead já possui reservante no banco Neon.tech
    const existingLead = await prisma.lead.findFirst({
      where: { cnpj: cleanCnpj },
      include: { affiliate: true }
    });

    if (existingLead && existingLead.affiliateId) {
      if (existingLead.affiliateId !== affiliateId) {
        return res.json({
          status: 'BLOCKED',
          message: `Lead bloqueado pelo consultor ${existingLead.affiliate?.companyName || 'outro consultor parceiro'}.`,
          companyName: existingLead.companyName,
          cnpj: cleanCnpj
        });
      }
    }

    // B. Requisição para a BrasilAPI pública com User-Agent
    const apiResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
      headers: {
        'User-Agent': 'SejaPulso-B2B-App/1.0'
      }
    });

    if (apiResponse.status === 404) {
      return res.status(404).json({ error: 'CNPJ não encontrado na base da Receita Federal.' });
    }

    if (!apiResponse.ok) {
      return res.status(502).json({ error: 'Serviço da Receita Federal/BrasilAPI temporariamente indisponível.' });
    }

    const data = await apiResponse.json();

    const companyPayload = {
      cnpj: cleanCnpj,
      companyName: data.razao_social,
      tradeName: data.nome_fantasia || data.razao_social,
      cnaeCode: data.cnae_fiscal,
      cnaeDescription: data.cnae_fiscal_descricao,
      location: `${data.municipio} / ${data.uf}`,
      officialPhone: data.ddd_telefone_1 || 'Não informado',
      officialEmail: data.email || 'Não informado'
    };

    // C. Executa a inteligência de abordagem dinâmica via IA
    const intelligence = await generateSmartPitch(companyPayload);

    return res.json({
      status: 'AVAILABLE',
      ...companyPayload,
      registrationStatus: data.descricao_situacao_cadastral,
      intelligence
    });

  } catch (error) {
    console.error('❌ [Backend Error - Consulta CNPJ]:', error);
    return res.status(500).json({ error: 'Erro interno ao consultar dados do CNPJ.' });
  }
};

// 4. Controller de Listagem de Leads
export const listLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { claimedAt: 'desc' }
    });
    return res.json(leads);
  } catch (error) {
    console.error('Erro ao listar leads:', error);
    return res.status(500).json({ error: 'Erro ao buscar a base de leads.' });
  }
};

// 5. Controller de Agendamento/Claim de Lead
export const claimLead = async (req, res) => {
  const { cnpj, companyName, contactName, contactPhone, contactEmail, servicePlan } = req.body;
  const affiliateId = req.user?.id || req.user?.affiliateId;

  if (!affiliateId) {
    return res.status(401).json({ error: 'Sessão inválida. Usuário não identificado.' });
  }

  if (!cnpj) {
    return res.status(400).json({ error: 'O CNPJ é obrigatório para realizar a reserva.' });
  }

  try {
    const cleanCnpj = String(cnpj).replace(/\D/g, '');

    const existingLead = await prisma.lead.findFirst({
      where: { cnpj: cleanCnpj }
    });

    let lead;

    if (existingLead) {
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          affiliateId,
          status: 'COMMERCIAL_CONTACT',
          claimedAt: new Date()
        }
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          cnpj: cleanCnpj,
          companyName: companyName || 'Razão Social não informada',
          contactName: contactName || companyName || 'Contato Principal',
          contactPhone: contactPhone || 'Não informado',
          contactEmail: contactEmail || 'naoinformado@dominio.com',
          servicePlan: servicePlan || 'STANDARD',
          affiliateId,
          status: 'COMMERCIAL_CONTACT',
          claimedAt: new Date()
        }
      });
    }

    return res.json({
      message: 'Lead agendado e reservado com sucesso!',
      lead
    });

  } catch (error) {
    console.error('❌ [Backend Error] Falha ao agendar lead:', error);
    return res.status(500).json({ 
      error: 'Erro ao agendar lead para negociação.',
      details: error.message 
    });
  }
};

// 6. Controller para Buscar Carteira do Consultor
export const getMyLeads = async (req, res) => {
  const affiliateId = req.user?.id || req.user?.affiliateId;

  if (!affiliateId) {
    return res.status(401).json({ error: 'Sessão inválida. Usuário não identificado.' });
  }

  try {
    const myLeads = await prisma.lead.findMany({
      where: { affiliateId },
      orderBy: { claimedAt: 'desc' }
    });

    return res.json(myLeads);
  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos do consultor:', error);
    return res.status(500).json({ error: 'Erro ao carregar seus agendamentos.' });
  }
};

export const handoverLead = async (req, res) => {
  const { id: leadId } = req.params;
  const { selectedPackage, finalValue, offerDetails } = req.body;
  const affiliateId = req.user?.id || req.user?.affiliateId;

  try {
    // 1. Inicia uma transação para garantir que ambas as tabelas sejam atualizadas juntas
    const result = await prisma.$transaction(async (tx) => {
      // Atualiza o Lead para impedir que o consultor edite ou envie novamente
      const updatedLead = await tx.lead.update({
        where: { id: leadId, affiliateId }, // Garante que o lead pertence a ele
        data: { status: 'WAITING_INTERNAL_REVIEW' }
      });

      // 2. Cria o registro isolado na tabela de Vendas/Contratos para o Admin ver
      const newDeal = await tx.deal.create({
        data: {
          leadId,
          affiliateId,
          selectedPackage,
          finalValue,
          offerDetails
        }
      });

      return { updatedLead, newDeal };
    });

    return res.status(200).json({ message: 'Venda enviada para avaliação!', data: result });
  } catch (error) {
    console.error('Erro no handover:', error);
    return res.status(500).json({ error: 'Erro ao repassar a venda.' });
  }
};
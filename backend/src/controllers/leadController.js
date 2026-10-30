import fetch from 'node-fetch';
import { prisma } from '../config/db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Tabela estática de fallback para Dicas de Abordagem B2B por CNAE
// Tabela com mapeamento diversificado de pacotes do Cardápio por CNAE
const CNAE_PACKAGE_MAP = {
  // Comércio / Mercados / Lojas de Bairro -> Catálogo Digital
  '47': { package: 'Catálogo Digital Interativo (R$ 1.800,00)', focus: 'exibir produtos e ofertas direto no WhatsApp' },
  // Serviços Profissionais / Advogados / Contadores -> Site Standard
  '69': { package: 'Site Institucional Standard (R$ 2.500,00)', focus: 'transmitir autoridade e captar clientes qualificados' },
  // Saúde / Estética / Odontologia -> Landing Page Start
  '86': { package: 'Landing Page Start (R$ 1.500,00)', focus: 'agendamento rápido de consultas e procedimentos' },
  // Reparos / Oficinas / Serviços Locais -> Landing Page Start
  '95': { package: 'Landing Page Start (R$ 1.500,00)', focus: 'orçamentos ágeis via foto/mensagem no WhatsApp' },
  // E-commerce / Varejo de Grande Porte -> Loja Virtual Pro
  '479': { package: 'Loja Virtual Pro (R$ 5.500,00)', focus: 'vendas automatizadas com pagamento e frete integrados' }
};

// 2. Gerador de Abordagem via IA (Google Gemini)
// backend/src/controllers/leadController.js

export const generateSmartPitch = async (companyData) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY não configurada no .env');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 1. Identifica o pacote ideal com base nos primeiros dígitos do CNAE
    const cnaeCode = String(companyData.cnaeCode || '').replace(/\D/g, '');
    const cnaeGroup = cnaeCode.substring(0, 2);
    
    const mappedInfo = CNAE_PACKAGE_MAP[cnaeGroup] || {
      package: 'Site Institucional Standard (R$ 2.500,00)',
      focus: 'presença digital profissional para atrair novos clientes'
    };

    // 2. Limpa o nome da empresa retirando números, LTDA, MEI, etc.
    const cleanCompanyName = (companyData.tradeName || companyData.companyName)
      .replace(/\d+/g, '')
      .replace(/LTDA|MEI|ME|EPP|S\/A/gi, '')
      .trim();

    const prompt = `
      Você é um Diretor Comercial B2B experiente da SejaPulso / Pulso Tech.
      Forneça um direcionamento e um script de WhatsApp ÚNICO e HUMANIZADO para um consultor abordar esta empresa:

      - Nome da Empresa: ${cleanCompanyName}
      - Atividade do Cliente: ${companyData.cnaeDescription}
      - Cidade/UF: ${companyData.location}
      - Pacote do Cardápio Sugerido: ${mappedInfo.package}
      - Foco Comercial da Solução: ${mappedInfo.focus}

      REGRAS OBRIGATÓRIAS:
      1. PROIBIDO usar a frase genérica "Vi o trabalho de vocês da... e achei muito bacana".
      2. PROIBIDO repetir a descrição longa e formal do CNAE. Resuma a atividade para o termo popular usado no dia a dia.
      3. A "Dica pro Consultor" (whyOffer) deve ser uma orientação de negócios direta ao ponto (ex: "Como eles trabalham com X, o cliente quer ver Y antes de fechar...").
      4. O "Script do WhatsApp" (pitchScript) deve ser uma mensagem curta de 2 a 3 frases, amigável e natural, focada em resolver um problema do dia a dia do setor.

      Retorne estritamente este JSON:
      {
        "suggestedPackage": "${mappedInfo.package}",
        "whyOffer": "Sua dica de negócios para o consultor",
        "pitchScript": "Sua mensagem curta e natural para WhatsApp"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedJson);

  } catch (error) {
    console.error('⚠️ [IA Pitch Warning] Usando fallback inteligente:', error.message);
    
    return {
      suggestedPackage: 'Site Institucional Standard (R$ 2.500,00)',
      whyOffer: `Para empresas no ramo de ${companyData.cnaeDescription}, o maior ganho é transmitir autoridade e permitir que o cliente tire dúvidas e solicite orçamentos rapidamente.`,
      pitchScript: `Olá! Acompanho a atuação da ${companyData.tradeName || companyData.companyName} aí na região. Vocês já têm um canal digital direto onde o cliente consegue ver os serviços e solicitar atendimento rápido pelo WhatsApp? Criamos modelos focados exatamente nisso. Posso te enviar um exemplo sem compromisso?`
    };
  }
};

// 3. Controller da Rota de Consulta por CNPJ
export const consultCnpjAndCheckOwnership = async (req, res) => {
  const { cnpj } = req.params;

  try {
    const cleanCnpj = String(cnpj).replace(/\D/g, '');

    // 1. Verifica se o lead já está gravado/bloqueado no banco por algum consultor
    const existingLead = await prisma.lead.findFirst({
      where: { cnpj: cleanCnpj },
      include: { affiliate: true }
    });

    if (existingLead && existingLead.affiliateId) {
      return res.json({
        status: 'BLOCKED',
        cnpj: cleanCnpj,
        companyName: existingLead.companyName,
        message: `Esta oportunidade já está sendo trabalhada por outro consultor parceiro (${existingLead.affiliate?.companyName || 'Consultor Registrado'}).`
      });
    }

    // 2. Consulta de dados na BrasilAPI pública
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'CNPJ não encontrado na Receita Federal.' });
    }

    const brasilApiData = await response.json();

    const companyData = {
      cnpj: cleanCnpj,
      companyName: brasilApiData.razao_social,
      tradeName: brasilApiData.nome_fantasia || brasilApiData.razao_social,
      registrationStatus: brasilApiData.descricao_situacao_cadastral,
      cnaeCode: brasilApiData.cnae_fiscal,
      cnaeDescription: brasilApiData.cnae_fiscal_descricao,
      location: `${brasilApiData.municipio} / ${brasilApiData.uf}`,
      officialPhone: brasilApiData.ddd_telefone_1 || 'Não disponível',
      officialEmail: brasilApiData.email || 'Não disponível'
    };

    // 3. Mapeamento Dinâmico por CNAE (Usa CNAE_PACKAGE_MAP)
    const cnaeCode = String(companyData.cnaeCode || '').replace(/\D/g, '');
    const cnaeGroup = cnaeCode.substring(0, 2);

    // Substituído APPROACH_SCRIPTS por CNAE_PACKAGE_MAP
    const mappedInfo = CNAE_PACKAGE_MAP[cnaeGroup] || {
      package: 'Site Institucional Standard (R$ 2.500,00)',
      focus: 'presença digital profissional para atrair novos clientes'
    };

    companyData.suggestedPackage = mappedInfo.package;

    // 4. Gera o pitch/dica usando o Gemini AI
    const intelligence = await generateSmartPitch(companyData);

    return res.json({
      status: 'AVAILABLE',
      ...companyData,
      intelligence
    });

  } catch (error) {
    console.error('❌ Erro na consulta do CNPJ:', error);
    return res.status(500).json({ error: 'Erro ao processar consulta do CNPJ.' });
  }
};

// Listar todos os leads
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

// Reivindicar/Agendar fechamento do lead
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

    // 1. Busca se o lead já existe pelo CNPJ
    const existingLead = await prisma.lead.findFirst({
      where: { cnpj: cleanCnpj }
    });

    let lead;

    if (existingLead) {
      // Se já existir, atualiza a reserva para o consultor atual
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          affiliateId,
          status: 'COMMERCIAL_CONTACT',
          claimedAt: new Date()
        }
      });
    } else {
      // Se não existir, cria o novo registro preenchendo todos os campos com fallbacks seguros
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

// Buscar todos os leads agendados/reservados pelo consultor logado
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
    console.error('Erro ao buscar meus leads:', error);
    return res.status(500).json({ error: 'Erro ao carregar seus leads agendados.' });
  }
};
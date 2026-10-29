import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';

// 1. Criar consultor diretamente via admin
export const createAffiliateDirectly = async (req, res) => {
  const { companyName, tradeName, cnpj, responsible, email, phone, password, role, tierId } = req.body;

  try {
    const existing = await prisma.affiliate.findFirst({
      where: { OR: [{ email }, { cnpj }] }
    });

    if (existing) {
      return res.status(400).json({ error: 'CNPJ ou E-mail já cadastrado na plataforma.' });
    }

    const passwordHash = await bcrypt.hash(password || '123456', 10);

    const newAffiliate = await prisma.affiliate.create({
      data: {
        companyName,
        tradeName: tradeName || companyName,
        cnpj,
        responsible,
        email,
        phone,
        passwordHash,
        role: role || 'AFFILIATE',
        status: 'APPROVED',
        contractSigned: false,
        tierId: tierId ? parseInt(tierId) : 1
      }
    });

    return res.status(201).json({
      message: 'Consultor cadastrado com sucesso!',
      affiliate: newAffiliate
    });

  } catch (error) {
    console.error('Erro ao criar consultor via Admin:', error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar o consultor.' });
  }
};


// 2. Listar apenas consultores ativos (APPROVED)
export const getActiveAffiliates = async (req, res) => {
  try {
    const activeAffiliates = await prisma.affiliate.findMany({
      where: { status: 'APPROVED' },
      include: {
        tier: true,
        _count: { select: { deals: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(activeAffiliates);
  } catch (error) {
    console.error('Erro ao buscar consultores ativos:', error);
    return res.status(500).json({ error: 'Erro ao buscar consultores ativos.' });
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
            commission: true
          }
        },
        commissions: true
      }
    });

    if (!affiliate) {
      return res.status(404).json({ error: 'Consultor não encontrado.' });
    }

    // Cálculo dinâmico de saldos liberados e pendentes
    const balanceAvailable = affiliate.commissions
      .filter(c => c.status === 'APPROVED' || c.status === 'PAID')
      .reduce((acc, c) => acc + c.amount, 0);

    const balancePending = affiliate.commissions
      .filter(c => c.status === 'WAITING_INVOICE' || c.status === 'INVOICE_SUBMITTED')
      .reduce((acc, c) => acc + c.amount, 0);

    return res.json({
      ...affiliate,
      financialSummary: {
        balanceAvailable: `R$ ${balanceAvailable.toFixed(2)}`,
        balancePending: `R$ ${balancePending.toFixed(2)}`
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do consultor:', error);
    return res.status(500).json({ error: 'Erro ao buscar detalhes do consultor.' });
  }
};

// 3. Atualizar dados do consultor
export const updateAffiliateDetails = async (req, res) => {
  const { id } = req.params;
  const { companyName, tradeName, cnpj, responsible, email, phone, pixKey, tierId, status } = req.body;

  try {
    const updated = await prisma.affiliate.update({
      where: { id },
      data: {
        companyName,
        tradeName,
        cnpj,
        responsible,
        email,
        phone,
        pixKey, // 👈 Atualiza a Chave Pix cadastrada pelo Admin
        tierId: tierId ? parseInt(tierId) : undefined,
        status
      }
    });

    return res.json({ message: 'Dados do consultor atualizados com sucesso!', affiliate: updated });
  } catch (error) {
    console.error('Erro ao atualizar consultor:', error);
    return res.status(500).json({ error: 'Erro ao atualizar dados do consultor.' });
  }
};

// 4. Excluir (remover) consultor
export const deleteAffiliate = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.affiliate.delete({ where: { id } });
    return res.json({ message: 'Consultor removido com sucesso!' });
  } catch (error) {
    console.error('Erro ao remover consultor:', error);
    return res.status(500).json({ error: 'Erro ao remover o consultor.' });
  }
};
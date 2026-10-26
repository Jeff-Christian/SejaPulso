import { prisma } from '../config/db.js';

export const listLeads = async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { claimedAt: 'desc' }
    });
    return res.json(leads);
  } catch (error) {
    console.error("Erro ao listar leads:", error);
    return res.status(500).json({ error: "Erro ao buscar a base de leads." });
  }
};
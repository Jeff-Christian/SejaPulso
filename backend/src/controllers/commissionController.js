import { prisma } from '../config/db.js';

export const listCommissions = async (req, res) => {
  try {
    const commissions = await prisma.commission.findMany({
      include: { deal: true }
    });
    return res.json(commissions);
  } catch (error) {
    console.error("Erro ao listar comissões:", error);
    return res.status(500).json({ error: "Erro ao carregar o extrato de comissões." });
  }
};
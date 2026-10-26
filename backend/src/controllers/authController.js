import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { email },
      include: { tier: true }
    });

    if (!affiliate) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    if (affiliate.status !== 'APPROVED') {
      return res.status(403).json({ error: "Acesso pendente de aprovação pela equipe SejaPulso." });
    }

    const isValidPassword = await bcrypt.compare(password, affiliate.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      { id: affiliate.id, cnpj: affiliate.cnpj, role: 'AFFILIATE' },
      process.env.JWT_SECRET || 'sejapulso_secret_jwt_key_2026',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: affiliate.id,
        companyName: affiliate.companyName,
        cnpj: affiliate.cnpj,
        email: affiliate.email,
        tierName: affiliate.tier?.name || 'Tier 1 — Bronze',
        commissionRate: `${affiliate.tier?.commissionRate || 10}%`,
        contractSigned: affiliate.contractSigned
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor de autenticação." });
  }
};
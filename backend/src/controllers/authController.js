import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Busca o afiliado pelo e-mail
    const affiliate = await prisma.affiliate.findUnique({
      where: { email },
      include: { tier: true }
    });

    if (!affiliate) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // 2. Verifica o status da aprovação do CNPJ
    if (affiliate.status !== 'APPROVED') {
      return res.status(403).json({ error: "Acesso pendente de aprovação pela equipe Pulso Tech." });
    }

    // 3. Valida a senha hash
    const isValidPassword = await bcrypt.compare(password, affiliate.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // 4. Gera o Token JWT (Validade de 1 dia)
    const token = jwt.sign(
      { 
        id: affiliate.id, 
        cnpj: affiliate.cnpj, 
        role: 'AFFILIATE' 
      },
      process.env.JWT_SECRET || 'pulso_secret_key',
      { expiresIn: '24h' }
    );

    // 5. Retorna os dados do perfil autenticado
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
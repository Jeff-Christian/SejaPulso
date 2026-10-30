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

    // ⏱️ ALTERAÇÃO AQUI: Altera a validade do Token de '24h' para '2h' (ou '3h')
    const token = jwt.sign(
      { 
        id: affiliate.id, 
        cnpj: affiliate.cnpj, 
        role: affiliate.role 
      },
      process.env.JWT_SECRET || 'sejapulso_secret_jwt_key_2026',
      { expiresIn: '2h' } // 👈 Expira após 2 horas de inatividade/uso
    );

    return res.json({
      token,
      user: {
        id: affiliate.id,
        companyName: affiliate.companyName,
        email: affiliate.email,
        cnpj: affiliate.cnpj,
        role: affiliate.role,
        status: affiliate.status
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor de autenticação." });
  }
};
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "sejapulso_secret_jwt_key_2026";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "sejapulso_refresh_secret_2026";

// 1. ROTA DE LOGIN
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { email },
      include: { tier: true },
    });

    if (!affiliate) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    if (affiliate.status !== "APPROVED") {
      return res
        .status(403)
        .json({ error: "Acesso pendente de aprovação pela equipe SejaPulso." });
    }

    const isValidPassword = await bcrypt.compare(password, affiliate.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    // Access Token de 24h para garantir estabilidade sem deslogamentos abruptos
    const token = jwt.sign(
      {
        id: affiliate.id,
        cnpj: affiliate.cnpj,
        role: affiliate.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      user: {
        id: affiliate.id,
        companyName: affiliate.companyName,
        email: affiliate.email,
        cnpj: affiliate.cnpj,
        role: affiliate.role,
        status: affiliate.status,
      },
    });
  } catch (error) {
    console.error("❌ Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor de autenticação." });
  }
};

// 3. ROTA DE LOGOUT (Limpeza do Cookie)
export const logout = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.json({ message: "Sessão encerrada com sucesso." });
};

export const refreshToken = async (req, res) => {
  // Pega o token de refresh (via cookies ou body)
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token ausente.' });
  }

  try {
    // Valida o secret do refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.REFRESH_TOKEN_SECRET || 'sejapulso_refresh_secret_2026'
    );

    const affiliate = await prisma.affiliate.findUnique({
      where: { id: decoded.id }
    });

    if (!affiliate || affiliate.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Acesso negado ou conta inativa.' });
    }

    // Gera um novo Access Token curto
    const newToken = jwt.sign(
      { id: affiliate.id, cnpj: affiliate.cnpj, role: affiliate.role },
      process.env.JWT_SECRET || 'sejapulso_secret_jwt_key_2026',
      { expiresIn: '24h' }
    );

    return res.json({ token: newToken });
  } catch (err) {
    return res.status(403).json({ error: 'Refresh token inválido ou expirado.' });
  }
};
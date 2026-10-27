import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Acesso não autorizado. Token ausente." });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sejapulso_secret_jwt_key_2026', (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido ou expirado." });
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: "Acesso negado. Requer privilégios de Administrador." });
  }
  next();
};
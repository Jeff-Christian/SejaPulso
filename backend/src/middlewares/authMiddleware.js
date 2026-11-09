import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  // Pega o cabeçalho Authorization de forma insensível a maiúsculas/minúsculas
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  // O cabeçalho deve vir no formato: "Bearer eyJhbGci..."
  const token = authHeader && authHeader.split(' ')[1];

  // Se o token não existir, for nulo ou for a string "null"/"undefined"
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Acesso não autorizado. Token ausente.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'pulso_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido ou expirado.' });
    }
    
    // Injeta o payload do token na requisição
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Acesso negado. Requer privilégios de Administrador." });
  }
  next();
};
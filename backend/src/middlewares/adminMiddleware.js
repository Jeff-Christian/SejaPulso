import jwt from 'jsonwebtoken';

export const adminMiddleware = (req, res, next) => {
  // 1. Extrai o token do cabeçalho Authorization (Bearer <token>)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Decodifica o token com a chave secreta da aplicação
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua_chave_secreta_aqui');
    req.user = decoded;

    // 3. Verifica se o usuário tem privilégio de Administrador
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Acesso negado. Requer privilégios de Administrador.' 
      });
    }

    next(); // Permissão concedida
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};
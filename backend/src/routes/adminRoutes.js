import { Router } from 'express';
import { prisma } from '../config/db.js';
// Garanta que requireAdmin ou o middleware de verificação do ADMIN seja importado corretamente
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Proteção global do painel admin: 
// Exige token JWT válido (authenticateToken) E perfil de ADMIN (requireAdmin)
router.use(authenticateToken, requireAdmin);

// Listar cadastros pendentes
router.get('/affiliates/pending', async (req, res) => {
  try {
    const pending = await prisma.affiliate.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(pending);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar cadastros pendentes." });
  }
});

// Aprovar ou bloquear consultor
router.patch('/affiliates/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { status }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar status do afiliado." });
  }
});

export default router;
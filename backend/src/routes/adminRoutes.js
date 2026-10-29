import { Router } from 'express';
import { prisma } from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middlewares/authMiddleware.js';
import { 
  createAffiliateDirectly, 
  getActiveAffiliates,
  getAffiliateDetails,      
  updateAffiliateDetails,   
  deleteAffiliate          
} from '../controllers/adminController.js';

const router = Router();

// Proteção global do painel admin
router.use(authenticateToken, requireAdmin);

// Lista de afiliados ativos
router.get('/affiliates/active', getActiveAffiliates);

// Lista de cadastros pendentes
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

// 🚀 NOVAS ROTAS INDIVIDUAIS POR ID (Resolve o 404):
router.get('/affiliates/:id', getAffiliateDetails);     
router.put('/affiliates/:id', updateAffiliateDetails);   
router.delete('/affiliates/:id', deleteAffiliate);   

// Criação direta e alteração de status
router.post('/affiliates', createAffiliateDirectly);
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
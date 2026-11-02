import { Router } from "express";
import { prisma } from "../config/db.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middlewares/authMiddleware.js";
import {
  createAffiliateDirectly,
  getActiveAffiliates,
  getAffiliateDetails,
  updateAffiliateDetails,
  deleteAffiliate,
  getPendingDeals,
  createAsaasCharge,
  updateDealDetails,
} from "../controllers/adminController.js";

const router = Router();

// Proteção global do painel admin
router.use(authenticateToken, requireAdmin);

// Rotas de afiliados
router.get("/affiliates/active", getActiveAffiliates);
router.get("/affiliates/pending", async (req, res) => {
  try {
    const pending = await prisma.affiliate.findMany({
      where: { status: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
    });
    return res.json(pending);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro ao buscar cadastros pendentes." });
  }
});

// Rotas individuais por ID
router.get("/affiliates/:id", getAffiliateDetails);
router.put("/affiliates/:id", updateAffiliateDetails);
router.delete("/affiliates/:id", deleteAffiliate);

// Criação e alteração de status de afiliados
router.post("/affiliates", createAffiliateDirectly);
router.patch("/affiliates/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await prisma.affiliate.update({
      where: { id },
      data: { status },
    });
    return res.json(updated);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Erro ao atualizar status do afiliado." });
  }
});

// 🎯 ROTAS DE VENDAS E FINANCEIRO (ASAAS)
// Rota ÚNICA de Vendas Pendentes (executa o getPendingDeals do controller)
router.get("/deals/pending", getPendingDeals);

// Rotas de criação de cobrança e atualização de termos da venda
router.post("/deals/:dealId/create-charge", createAsaasCharge);
router.put("/deals/:dealId", updateDealDetails);

export default router;

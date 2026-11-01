import { Router } from "express";
import {
  consultCnpjAndCheckOwnership,
  listLeads,
  claimLead,
  getMyLeads,
  handoverLead,
  getMyDeals,
} from "../controllers/leadController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Proteção por autenticação JWT
router.use(authenticateToken);

// 1. Meus Leads Agendados (Novo)
router.get("/my-leads", getMyLeads);

// 2. Busca em tempo real via BrasilAPI
router.get("/consult/:cnpj", consultCnpjAndCheckOwnership);

// 3. Buscar todos os leads
router.get("/", listLeads);

// 4. Agendamento/Reivindicação
router.post("/claim", claimLead);

// 5. Repasse de venda / Handover (Resolve o erro 404)
router.post("/:id/handover", handoverLead);

// 6. Rota para o consultor ver suas vendas e comissões ativas
router.get("/my-deals", getMyDeals);

export default router;

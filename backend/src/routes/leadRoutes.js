import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  consultCnpjAndCheckOwnership,
  listLeads,
  claimLead,
  getMyLeads,
  handoverLead,
  getMyDeals,
} from "../controllers/leadController.js";
import {
  getPool, 
  getPoolFacets, 
  nextLead, 
  claimFromPool, 
  tabulateLead,
} from "../controllers/leadPoolController.js";

import { authenticateToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Limite por consultor (não por IP), já que a rota exige login
const consultLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15, // em versões antigas do pacote, o nome é "max"
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas consultas seguidas. Aguarde um minuto e tente de novo." },
});

const poolLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => req.user.id,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Aguarde um instante." },
});

router.get("/my-leads", getMyLeads);
router.get("/consult/:cnpj", consultLimiter, consultCnpjAndCheckOwnership);
router.get("/", requireAdmin, listLeads);
router.post("/claim", claimLead);
router.get("/my-deals", getMyDeals);
router.post("/:id/handover", handoverLead);

// Rotas do pool de leads
router.get("/pool", poolLimiter, getPool);
router.get("/pool/facets", poolLimiter, getPoolFacets);
router.post("/pool/next", poolLimiter, nextLead);
router.post("/pool/:id/claim", claimFromPool);
router.post("/:id/tabulate", tabulateLead);

export default router;
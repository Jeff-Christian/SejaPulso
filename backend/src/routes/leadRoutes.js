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

router.get("/my-leads", getMyLeads);
router.get("/consult/:cnpj", consultLimiter, consultCnpjAndCheckOwnership);
router.get("/", requireAdmin, listLeads); // ← só admin
router.post("/claim", claimLead);
router.get("/my-deals", getMyDeals);
router.post("/:id/handover", handoverLead);

export default router;
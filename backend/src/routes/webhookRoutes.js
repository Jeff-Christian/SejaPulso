import { Router } from "express";
import { asaasWebhook } from "../controllers/asaasWebhookController.js";

const router = Router();

// Sem JWT de propósito: quem chama é o Asaas, autenticado pelo token do webhook
router.post("/asaas", asaasWebhook);

export default router;

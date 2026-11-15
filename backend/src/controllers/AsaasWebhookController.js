import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { processAsaasEvent } from "../services/asaasWebhookService.js";

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// POST /api/webhooks/asaas
// O Asaas manda o token configurado no painel dele no header "asaas-access-token".
export const asaasWebhook = async (req, res) => {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) {
    console.error(
      "🚫 [Webhook] ASAAS_WEBHOOK_TOKEN não configurado no .env: recusando todas as chamadas.",
    );
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!safeEqual(req.get("asaas-access-token") || "", expected)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { id, event, payment } = req.body ?? {};
  if (!event) return res.status(400).json({ error: "evento ausente" });

  // Sem ID de evento no corpo, gera um estável para a idempotência continuar funcionando
  const eventId =
    id ||
    crypto
      .createHash("sha256")
      .update(
        `${event}:${payment?.id}:${payment?.status}:${req.body?.dateCreated}`,
      )
      .digest("hex");

  try {
    const existing = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });
    if (existing?.processedAt) return res.status(200).json({ duplicate: true });

    if (!existing) {
      await prisma.webhookEvent.create({
        data: {
          id: eventId,
          event,
          paymentId: payment?.id ?? null,
          payload: req.body,
        },
      });
    }
  } catch (err) {
    // duas entregas simultâneas do mesmo evento: a outra processa
    if (err.code === "P2002") return res.status(200).json({ duplicate: true });
    console.error("❌ [Webhook] falha ao registrar evento:", err);
    return res.status(500).json({ error: "erro ao registrar evento" });
  }

  // Responde rápido; o processamento segue em segundo plano
  res.status(200).json({ received: true });

  processAsaasEvent(eventId, event, payment).catch((err) =>
    console.error(
      `❌ [Webhook] evento ${eventId} (${event}) falhou:`,
      err.message,
    ),
  );
};

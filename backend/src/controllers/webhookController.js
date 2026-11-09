import crypto from "node:crypto";
import { prisma } from "../config/db.js";
import { ASAAS_WEBHOOK_TOKEN } from "../config/env.js";
import { processAsaasEvent } from "../services/asaasWebhookService.js";

const safeEqual = (received = "", expected) => {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const asaasWebhook = async (req, res) => {
  // 1. Autenticação: o Asaas envia o token configurado neste header
  if (!safeEqual(req.get("asaas-access-token"), ASAAS_WEBHOOK_TOKEN)) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id, event, payment } = req.body ?? {};

  // Payload fora do formato esperado: responde 200 para não travar a fila do Asaas
  if (!event || !payment?.id) {
    return res.status(200).json({ ignored: true });
  }

  const eventId = id ?? `${event}:${payment.id}`;

  // 2. Idempotência: grava o evento antes de qualquer outra coisa
  try {
    await prisma.webhookEvent.create({
      data: { id: eventId, event, paymentId: payment.id, payload: req.body },
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(200).json({ duplicate: true });
    }
    console.error("❌ Falha ao gravar evento do webhook:", err);
    return res.status(500).json({ error: "Erro interno." }); // o Asaas tentará de novo
  }

  // 3. Responde rápido e processa em seguida
  res.status(200).json({ received: true });

  processAsaasEvent(eventId, event, payment).catch((err) =>
    console.error("❌ Falha ao processar evento:", eventId, err)
  );
};
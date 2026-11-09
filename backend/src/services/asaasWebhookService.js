import { prisma } from "../config/db.js";

// Estados em que o deal ainda aguarda o sinal
const AWAITING_DEPOSIT = ["WAITING_FINANCIAL_VALIDATION", "WAITING_PRICING_SLA"];

// Acha o deal pelo ID da cobrança ou, se ainda não foi gravado, pelo externalReference
const dealWhere = (payment) => ({
  OR: [
    { asaasPaymentId: payment.id },
    ...(payment.externalReference ? [{ id: payment.externalReference }] : []),
  ],
});

export const processAsaasEvent = async (eventId, event, payment) => {
  let note = null;

  try {
    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED": {
        const result = await prisma.deal.updateMany({
          where: { ...dealWhere(payment), status: { in: AWAITING_DEPOSIT } },
          data: {
            status: "WAITING_INVOICE",
            asaasPaymentId: payment.id,
            paidAt: new Date(),
          },
        });
        if (result.count === 0) note = "nenhum deal elegível (já processado ou não encontrado)";
        break;
      }

      case "PAYMENT_DELETED": {
        const result = await prisma.deal.updateMany({
          where: { asaasPaymentId: payment.id, status: { in: AWAITING_DEPOSIT } },
          data: { asaasPaymentId: null, paymentUrl: null },
        });
        if (result.count === 0) note = "nenhum deal elegível para liberar";
        break;
      }

      default:
        break; // outros eventos ficam só registrados
    }

    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { processedAt: new Date(), error: note },
    });
  } catch (err) {
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { error: String(err.message).slice(0, 500) },
    });
    throw err;
  }
};
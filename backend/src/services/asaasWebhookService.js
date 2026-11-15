import { prisma } from "../config/db.js";
import { parseBRLToCents, splitDeposit } from "../utils/money.js";
import { createCommissionForPayment } from "./commissionService.js";

// Estados em que o deal ainda aguarda o sinal (inclui os antigos, de antes da cobrança emitida)
const AWAITING_DEPOSIT = [
  "AWAITING_DEPOSIT",
  "WAITING_FINANCIAL_VALIDATION",
  "WAITING_PRICING_SLA",
];

// Comissão que ainda não foi paga ao consultor
const OPEN_COMMISSION = [
  "HELD",
  "WAITING_INVOICE",
  "INVOICE_SUBMITTED",
  "APPROVED",
];

// Confira os nomes na documentação de webhooks do Asaas ao homologar
const REFUND_EVENTS = {
  PAYMENT_REFUNDED: "REFUND",
  PAYMENT_CHARGEBACK_REQUESTED: "CHARGEBACK",
};

// Descobre o deal e se o pagamento é o sinal ou o saldo.
// Primeiro pelo ID da cobrança; senão pelo externalReference ("dealId" = sinal, "dealId:BALANCE" = saldo).
const resolveDeal = async (tx, payment) => {
  const byId = await tx.deal.findFirst({
    where: {
      OR: [{ asaasPaymentId: payment.id }, { balancePaymentId: payment.id }],
    },
  });
  if (byId)
    return {
      deal: byId,
      kind: byId.balancePaymentId === payment.id ? "BALANCE" : "DEPOSIT",
    };

  const [dealId, suffix] = String(payment.externalReference || "").split(":");
  if (!dealId) return null;
  const deal = await tx.deal.findUnique({ where: { id: dealId } });
  return deal
    ? { deal, kind: suffix === "BALANCE" ? "BALANCE" : "DEPOSIT" }
    : null;
};

// ---------- Pagamento recebido ou confirmado ----------
const onPaid = (payment) =>
  prisma.$transaction(async (tx) => {
    const found = await resolveDeal(tx, payment);
    if (!found) return "nenhum deal encontrado para este pagamento";
    const { deal, kind } = found;
    const now = new Date();

    const rawPaid = Math.round(Number(payment.value) * 100);
    const paidCents = Number.isFinite(rawPaid) && rawPaid > 0 ? rawPaid : null;
    const totalCents =
      deal.totalCents ??
      parseBRLToCents(deal.finalValue) ??
      (paidCents ? paidCents * 2 : null);
    if (!totalCents) throw new Error("valor da venda indisponível");

    const { deposit, balance } = splitDeposit(totalCents);
    const expected = kind === "DEPOSIT" ? deposit : balance;
    const baseCents = paidCents ?? expected;

    // A troca de estado é o que impede processar o mesmo pagamento duas vezes
    // (cartão dispara CONFIRMED e depois RECEIVED).
    const moved =
      kind === "DEPOSIT"
        ? await tx.deal.updateMany({
            where: { id: deal.id, status: { in: AWAITING_DEPOSIT } },
            data: {
              status: "DEPOSIT_PAID",
              asaasPaymentId: payment.id,
              depositPaidAt: now,
            },
          })
        : await tx.deal.updateMany({
            where: { id: deal.id, status: "AWAITING_BALANCE" },
            data: {
              status: "PAID_IN_FULL",
              balancePaymentId: payment.id,
              balancePaidAt: now,
              paidAt: now,
            },
          });
    if (moved.count === 0)
      return "pagamento já processado ou deal em estado inesperado";

    await createCommissionForPayment(tx, {
      deal,
      kind,
      paymentId: payment.id,
      baseCents,
      totalCents,
      now,
    });

    return paidCents !== null && Math.abs(paidCents - expected) > 1
      ? `valor pago (${paidCents}) diverge do esperado (${expected}) em centavos`
      : null;
  });

// ---------- Estorno ou chargeback ----------
const onRefund = (payment, reason) =>
  prisma.$transaction(async (tx) => {
    const found = await resolveDeal(tx, payment);
    if (!found) return "nenhum deal encontrado para este pagamento";
    let note = null;

    const commission = await tx.commission.findFirst({
      where: { paymentId: payment.id },
    });
    if (commission) {
      if (OPEN_COMMISSION.includes(commission.status)) {
        await tx.commission.updateMany({
          where: { id: commission.id, status: { in: OPEN_COMMISSION } },
          data: { status: "CANCELLED", cancelReason: reason },
        });
      } else if (commission.status === "PAID") {
        await tx.commission.update({
          where: { id: commission.id },
          data: { status: "REVERSED", cancelReason: reason },
        });
        note =
          "ATENÇÃO: estorno depois de a comissão ser paga ao consultor. Tratar manualmente.";
      }
    }

    // Estorno do SALDO não desfaz a venda: o sinal continua pago e contando no tier.
    // Só a comissão do saldo é cancelada; o resto fica para tratamento manual.
    if (found.kind === "BALANCE") {
      return (
        note ??
        "estorno do saldo: comissão do saldo cancelada, venda mantida. Tratar manualmente."
      );
    }

    // Estorno do SINAL: REFUNDED trava a segunda cobrança e tira a venda do contador do tier
    await tx.deal.updateMany({
      where: {
        id: found.deal.id,
        status: { notIn: ["REFUNDED", "CANCELLED"] },
      },
      data: { status: "REFUNDED" },
    });
    return note;
  });

// ---------- Cobrança excluída no Asaas ----------
const onDeleted = (payment) =>
  prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findFirst({
      where: {
        OR: [{ asaasPaymentId: payment.id }, { balancePaymentId: payment.id }],
      },
    });
    if (!deal) return "nenhum deal para liberar";

    if (
      deal.asaasPaymentId === payment.id &&
      AWAITING_DEPOSIT.includes(deal.status)
    ) {
      await tx.deal.updateMany({
        where: { id: deal.id, status: { in: AWAITING_DEPOSIT } },
        data: {
          asaasPaymentId: null,
          paymentUrl: null,
          status: "WAITING_FINANCIAL_VALIDATION",
        },
      });
      return null;
    }
    if (
      deal.balancePaymentId === payment.id &&
      deal.status === "AWAITING_BALANCE"
    ) {
      await tx.deal.updateMany({
        where: { id: deal.id, status: "AWAITING_BALANCE" },
        data: {
          balancePaymentId: null,
          balancePaymentUrl: null,
          status: "DEPOSIT_PAID",
        },
      });
      return null;
    }
    return "cobrança removida em um estado que não permite liberar o deal";
  });

// ---------- Entrada ----------
export const processAsaasEvent = async (eventId, event, payment) => {
  try {
    let note = null;

    if (payment?.id) {
      if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        note = await onPaid(payment);
      } else if (REFUND_EVENTS[event]) {
        note = await onRefund(payment, REFUND_EVENTS[event]);
      } else if (event === "PAYMENT_DELETED") {
        note = await onDeleted(payment);
      }
      // outros eventos ficam só registrados
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

// Eventos recebidos que falharam no meio (processedAt vazio) são tentados de novo.
// É seguro repetir: cada passo é protegido pelo estado do deal.
export const reprocessPendingWebhooks = async ({
  olderThanMs = 2 * 60 * 1000,
  limit = 20,
} = {}) => {
  const rows = await prisma.webhookEvent.findMany({
    where: {
      processedAt: null,
      receivedAt: {
        lt: new Date(Date.now() - olderThanMs),
        gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { receivedAt: "asc" },
    take: limit,
  });

  for (const row of rows) {
    try {
      await processAsaasEvent(row.id, row.event, row.payload?.payment);
    } catch (err) {
      console.error(
        `❌ [Webhook] reprocesso do evento ${row.id} falhou:`,
        err.message,
      );
    }
  }
  return rows.length;
};

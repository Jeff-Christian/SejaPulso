import { prisma } from "../config/db.js";
import {
  TIERS,
  tierIndexForSales,
  bandForTotalCents,
  rateFor,
  commissionCents,
  monthRangeSP,
} from "../utils/commissionRules.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Prazo de desistência do cliente antes de a comissão poder ser paga (em dias).
// Ainda indefinido no contrato (2, 3 ou 7): ajuste no .env sem mexer no código.
export const holdDays = () => {
  const n = parseInt(process.env.COMMISSION_HOLD_DAYS, 10);
  return Number.isFinite(n) && n >= 0 ? n : 7;
};

// Depois do prazo, a comissão espera a NF do consultor (padrão) ou vai direto para pagamento.
export const requireInvoice = () =>
  process.env.COMMISSION_REQUIRE_INVOICE !== "false";

// Venda estornada ou cancelada não conta para o tier
const NOT_A_SALE = ["REFUNDED", "CANCELLED"];

// Venda = sinal pago dentro do período. A segunda parcela nunca conta.
export const countSalesInRange = (client, affiliateId, start, end) =>
  client.deal.count({
    where: {
      affiliateId,
      depositPaidAt: { gte: start, lt: end },
      status: { notIn: NOT_A_SALE },
    },
  });

// Tier do mês corrente = vendas do mês anterior
export const tierIndexFor = async (client, affiliateId, ref = new Date()) => {
  const { start, end } = monthRangeSP(ref, 1);
  return tierIndexForSales(
    await countSalesInRange(client, affiliateId, start, end),
  );
};

// Uma comissão por pagamento do cliente. O percentual fica travado no sinal:
// o saldo da mesma venda reaproveita faixa, tier e percentual do sinal.
export const createCommissionForPayment = async (
  tx,
  { deal, kind, paymentId, baseCents, totalCents, now = new Date() },
) => {
  let band;
  let tierIndex;
  let appliedRate;

  if (kind === "BALANCE") {
    const deposit = await tx.commission.findFirst({
      where: { dealId: deal.id, kind: "DEPOSIT" },
    });
    if (deposit) {
      ({ band, tierIndex, appliedRate } = deposit);
    }
  }

  if (appliedRate === undefined) {
    band = bandForTotalCents(totalCents);
    tierIndex = await tierIndexFor(tx, deal.affiliateId, now);
    appliedRate = rateFor(totalCents, tierIndex);
  }

  return tx.commission.create({
    data: {
      dealId: deal.id,
      affiliateId: deal.affiliateId,
      kind,
      paymentId,
      band,
      tierIndex,
      baseCents,
      appliedRate,
      amountCents: commissionCents(baseCents, appliedRate),
      status: "HELD",
      releaseAt: new Date(now.getTime() + holdDays() * DAY_MS),
    },
  });
};

// Fim do prazo de desistência: a comissão sai de HELD
export const releaseHeldCommissions = async (now = new Date()) => {
  const r = await prisma.commission.updateMany({
    where: { status: "HELD", releaseAt: { lte: now } },
    data: { status: requireInvoice() ? "WAITING_INVOICE" : "APPROVED" },
  });
  if (r.count)
    console.log(
      `💸 [Comissões] ${r.count} comissão(ões) saíram do prazo de desistência.`,
    );
  return r.count;
};

// Mantém Affiliate.tierId igual ao tier calculado (idempotente; roda várias vezes ao dia).
// Atenção: ajuste manual de tier pelo Admin é sobrescrito, porque a regra agora é automática.
export const syncAffiliateTiers = async (now = new Date()) => {
  const tiers = await prisma.commissionTier.findMany({
    orderBy: { id: "asc" },
  });
  if (tiers.length < TIERS.length) {
    console.warn(
      "⚠️ [Tiers] Cadastre os 3 tiers (Bronze, Prata, Ouro): node scripts/seedCommissionTiers.js",
    );
    return 0;
  }

  const affiliates = await prisma.affiliate.findMany({
    where: { role: "AFFILIATE", status: "APPROVED" },
    select: { id: true, tierId: true },
  });

  let changed = 0;
  for (const a of affiliates) {
    const target = tiers[(await tierIndexFor(prisma, a.id, now)) - 1].id;
    if (a.tierId !== target) {
      await prisma.affiliate.update({
        where: { id: a.id },
        data: { tierId: target },
      });
      changed++;
    }
  }
  if (changed)
    console.log(`🏅 [Tiers] ${changed} consultor(es) mudaram de tier.`);
  return changed;
};

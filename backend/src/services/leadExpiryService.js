import { prisma } from "../config/db.js";

// Dias sem nenhuma tabulação até a reserva voltar ao pool (ajustável por env)
export const RESERVATION_EXPIRY_DAYS =
  Number(process.env.RESERVATION_EXPIRY_DAYS) || 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Reservas da base central que passaram do prazo sem NENHUMA tabulação
 * desde que o consultor atual reservou.
 *
 * Fica de fora de propósito:
 *  - leads trazidos pelo próprio consultor (source = CONSULTOR): são dele;
 *  - leads que já viraram venda (status diferente de COMMERCIAL_CONTACT ou com Deal).
 */
export const findStaleReservations = async (days = RESERVATION_EXPIRY_DAYS) => {
  const cutoff = new Date(Date.now() - days * DAY_MS);

  const candidates = await prisma.lead.findMany({
    where: {
      status: "COMMERCIAL_CONTACT",
      source: "BASE_CENTRAL",
      affiliateId: { not: null },
      claimedAt: { lt: cutoff },
      deal: { is: null },
    },
    select: {
      id: true,
      companyName: true,
      cnpj: true,
      affiliateId: true,
      claimedAt: true,
      lastActivityAt: true,
    },
  });

  if (candidates.length === 0) return [];

  // Atividades de verdade (LeadActivity), para não depender só de lastActivityAt
  const activities = await prisma.leadActivity.findMany({
    where: { leadId: { in: candidates.map((c) => c.id) } },
    select: { leadId: true, affiliateId: true, createdAt: true },
  });

  const activeLeadIds = new Set(
    activities
      .filter((a) => {
        const lead = candidates.find((c) => c.id === a.leadId);
        return lead && a.affiliateId === lead.affiliateId && a.createdAt >= lead.claimedAt;
      })
      .map((a) => a.leadId),
  );

  return candidates.filter((l) => {
    if (activeLeadIds.has(l.id)) return false;
    // lastActivityAt de um consultor anterior não conta; só o da reserva atual
    if (l.lastActivityAt && l.lastActivityAt >= l.claimedAt) return false;
    return true;
  });
};

export const expireStaleReservations = async ({ days = RESERVATION_EXPIRY_DAYS, dryRun = false } = {}) => {
  const stale = await findStaleReservations(days);
  const preview = stale.slice(0, 50);

  if (dryRun || stale.length === 0) {
    return { dryRun, days, found: stale.length, released: 0, preview };
  }

  let released = 0;
  for (const lead of stale) {
    // Condição repetida no update: se algo mudou desde a busca, não libera
    const r = await prisma.lead.updateMany({
      where: {
        id: lead.id,
        affiliateId: lead.affiliateId,
        status: "COMMERCIAL_CONTACT",
        claimedAt: lead.claimedAt,
      },
      data: {
        affiliateId: null,
        status: "POOL",
        claimedAt: null,
        lastOutcome: null,
        nextActionAt: null,
        availableAt: new Date(), // livre na hora, sem carência
      },
    });
    released += r.count;
  }

  console.log(`⏱️ [Expiração] ${released} reserva(s) sem tabulação há ${days}+ dias voltaram ao pool.`);
  return { dryRun: false, days, found: stale.length, released, preview };
};

let timer = null;

// Chame uma vez no server.js. Roda 30s após subir e depois a cada hora.
export const startReservationExpiryJob = ({ everyMs = 60 * 60 * 1000 } = {}) => {
  if (timer) return;

  const run = async () => {
    try {
      await expireStaleReservations();
    } catch (err) {
      console.error("❌ [Expiração] Falha no job:", err);
    }
  };

  const first = setTimeout(run, 30 * 1000);
  first.unref?.();
  timer = setInterval(run, everyMs);
  timer.unref?.();
};
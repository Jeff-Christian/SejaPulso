import { prisma } from "../config/db.js";
import {
  buildPoolWhere,
  claimById,
  countActiveLeads,
  MAX_ACTIVE_LEADS,
  COOLDOWN_DAYS,
} from "../services/leadPoolService.js";

const POOL_FIELDS = {
  id: true, companyName: true, tradeName: true,
  city: true, state: true, cnaeCode: true, cnaeDescription: true,
};

const limitReached = (res) =>
  res.status(409).json({
    error: `Você já tem ${MAX_ACTIVE_LEADS} leads em negociação. Finalize ou libere algum antes de reservar outro.`,
  });

// GET /leads/pool?state=&city=&cnae=&page=&limit=
export const getPool = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const where = buildPoolWhere(req.query);

  try {
    const [total, items] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        select: POOL_FIELDS,
        orderBy: [{ availableAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error("❌ [getPool]:", error);
    return res.status(500).json({ error: "Erro ao carregar a fila de leads." });
  }
};

// GET /leads/pool/facets?state=SP → opções dos filtros, com contagem
export const getPoolFacets = async (req, res) => {
  const base = { status: "POOL", affiliateId: null, availableAt: { lte: new Date() } };
  const state = req.query.state ? String(req.query.state).toUpperCase().slice(0, 2) : null;
  const scope = state ? { ...base, state } : base;
  const byCount = (a, b) => b._count._all - a._count._all;

  try {
    const states = await prisma.lead.groupBy({
      by: ["state"], where: { ...base, state: { not: null } }, _count: { _all: true },
    });
    const cities = state
      ? await prisma.lead.groupBy({
          by: ["city"], where: { ...scope, city: { not: null } }, _count: { _all: true },
        })
      : [];
    const cnaes = await prisma.lead.groupBy({
      by: ["cnaeCode", "cnaeDescription"],
      where: { ...scope, cnaeCode: { not: null } },
      _count: { _all: true },
    });

    return res.json({
      states: states
        .map((s) => ({ value: s.state, count: s._count._all }))
        .sort((a, b) => a.value.localeCompare(b.value)),
      cities: cities.sort(byCount).slice(0, 200).map((c) => ({ value: c.city, count: c._count._all })),
      cnaes: cnaes.sort(byCount).slice(0, 40).map((c) => ({
        value: c.cnaeCode,
        label: c.cnaeDescription || c.cnaeCode,
        count: c._count._all,
      })),
    });
  } catch (error) {
    console.error("❌ [getPoolFacets]:", error);
    return res.status(500).json({ error: "Erro ao carregar os filtros." });
  }
};

// POST /leads/pool/next  { state, city, cnae } → reserva o próximo lead do filtro
export const nextLead = async (req, res) => {
  const affiliateId = req.user.id;

  try {
    if ((await countActiveLeads(affiliateId)) >= MAX_ACTIVE_LEADS) return limitReached(res);

    const candidates = await prisma.lead.findMany({
      where: buildPoolWhere(req.body),
      select: { id: true },
      orderBy: { availableAt: "asc" },
      take: 8,
    });
    if (candidates.length === 0) {
      return res.status(404).json({ error: "Não há leads disponíveis com esses filtros." });
    }

    // Embaralha os candidatos para dois consultores clicando juntos não disputarem o mesmo
    const ids = candidates.map((c) => c.id).sort(() => Math.random() - 0.5);
    for (const id of ids) {
      if (await claimById(id, affiliateId)) {
        const lead = await prisma.lead.findUnique({ where: { id } });
        return res.json({ message: "Lead reservado! Ele já está na sua carteira.", lead });
      }
    }
    return res.status(409).json({ error: "Outros consultores reservaram esses leads agora. Tente de novo." });
  } catch (error) {
    console.error("❌ [nextLead]:", error);
    return res.status(500).json({ error: "Erro ao reservar o próximo lead." });
  }
};

// POST /leads/pool/:id/claim
export const claimFromPool = async (req, res) => {
  const affiliateId = req.user.id;
  const { id } = req.params;

  try {
    if ((await countActiveLeads(affiliateId)) >= MAX_ACTIVE_LEADS) return limitReached(res);

    if (!(await claimById(id, affiliateId))) {
      return res.status(409).json({ error: "Este lead não está mais disponível." });
    }
    const lead = await prisma.lead.findUnique({ where: { id } });
    return res.json({ message: "Lead reservado com sucesso!", lead });
  } catch (error) {
    console.error("❌ [claimFromPool]:", error);
    return res.status(500).json({ error: "Erro ao reservar o lead." });
  }
};

// ---------- Tabulação ----------
const OUTCOMES = ["NO_ANSWER", "INVALID_NUMBER", "CALL_BACK", "CONTACTED", "MEETING_SCHEDULED", "NOT_INTERESTED", "AWAITING_CLOSING"];
const NEEDS_DATE = ["CALL_BACK", "MEETING_SCHEDULED"];
const REASONS = ["HAS_PROVIDER", "NO_BUDGET", "NOT_DECISION_MAKER", "NO_NEED", "OTHER"];
const CLOSED = ["POOL", "WAITING_INTERNAL_REVIEW", "DEAL_CLOSED", "DISCARDED"];
const DAY = 24 * 60 * 60 * 1000;

// POST /leads/:id/tabulate  { outcome, reason?, nextActionAt?, note? }
export const tabulateLead = async (req, res) => {
  const affiliateId = req.user.id;
  const { id } = req.params;
  const { outcome, reason, nextActionAt } = req.body ?? {};
  const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, 500) : "";

  if (!OUTCOMES.includes(outcome)) return res.status(400).json({ error: "Resultado de contato inválido." });

  let nextDate = null;
  if (NEEDS_DATE.includes(outcome)) {
    nextDate = new Date(nextActionAt);
    const now = Date.now();
    if (isNaN(nextDate) || nextDate.getTime() < now - 5 * 60 * 1000 || nextDate.getTime() > now + 365 * DAY) {
      return res.status(400).json({ error: "Informe uma data futura válida." });
    }
  }
  if (outcome === "NOT_INTERESTED" && !REASONS.includes(reason)) {
    return res.status(400).json({ error: "Informe o motivo da recusa." });
  }

  try {
    // 404 para lead inexistente ou de outro consultor (não revela se o ID existe)
    const lead = await prisma.lead.findFirst({ where: { id, affiliateId } });
    if (!lead) return res.status(404).json({ error: "Lead não encontrado na sua carteira." });
    if (CLOSED.includes(lead.status)) {
      return res.status(409).json({ error: "Este lead não está mais em negociação." });
    }

    const now = new Date();
    const base = { lastOutcome: outcome, lastActivityAt: now, nextActionAt: nextDate };
    let data;
    let released = false;

    if (outcome === "NOT_INTERESTED") {
      released = true;
      data = {
        ...base, status: "POOL", affiliateId: null, claimedAt: null,
        availableAt: new Date(now.getTime() + COOLDOWN_DAYS * DAY), // carência
      };
    } else if (outcome === "INVALID_NUMBER") {
      released = true;
      data = { ...base, status: "DISCARDED", affiliateId: null, claimedAt: null };
    } else if (outcome === "AWAITING_CLOSING") {
      data = { ...base, status: "PROPOSAL_SENT" };
    } else {
      data = { ...base, status: "COMMERCIAL_CONTACT" };
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Update guardado: só passa se o lead continua sendo do consultor
      const r = await tx.lead.updateMany({
        where: { id, affiliateId, status: { notIn: CLOSED } },
        data,
      });
      if (r.count === 0) return null;

      await tx.leadActivity.create({
        data: {
          leadId: id, affiliateId, outcome,
          reason: outcome === "NOT_INTERESTED" ? reason : null,
          note: note || null,
          nextActionAt: nextDate,
        },
      });
      return tx.lead.findUnique({ where: { id } });
    });

    if (!updated) return res.status(409).json({ error: "Este lead mudou de situação. Atualize a página." });

    // Lead liberado deixa de ser do consultor: não devolve os dados dele
    return res.json(released ? { released: true } : { released: false, lead: updated });
  } catch (error) {
    console.error("❌ [tabulateLead]:", error);
    return res.status(500).json({ error: "Erro ao registrar o contato." });
  }
};
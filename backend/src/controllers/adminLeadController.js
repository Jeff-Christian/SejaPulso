import { prisma } from "../config/db.js";
import { onlyDigits } from "../utils/brDocs.js";
import { expireStaleReservations } from "../services/leadExpiryService.js";

const OUTCOMES = [
  "NO_ANSWER",
  "INVALID_NUMBER",
  "CALL_BACK",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "NOT_INTERESTED",
  "AWAITING_CLOSING",
];

const LEAD_STATUSES = [
  "LEAD_REGISTERED",
  "POOL",
  "COMMERCIAL_CONTACT",
  "WAITING_INTERNAL_REVIEW",
  "PROPOSAL_SENT",
  "DEAL_CLOSED",
  "DISCARDED",
];

const clampInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

// Monta o filtro do Prisma a partir da query string
const buildWhere = (query) => {
  const where = {};

  if (query.q) {
    const term = String(query.q).trim();
    const digits = onlyDigits(term);
    const or = [
      { companyName: { contains: term, mode: "insensitive" } },
      { tradeName: { contains: term, mode: "insensitive" } },
    ];
    // só busca por CNPJ quando o termo parece número (evita varrer à toa)
    if (digits.length >= 4) or.push({ cnpj: { contains: digits } });
    where.OR = or;
  }

  if (LEAD_STATUSES.includes(query.status)) where.status = query.status;

  if (query.outcome === "NONE") where.lastOutcome = null;
  else if (OUTCOMES.includes(query.outcome)) where.lastOutcome = query.outcome;

  if (query.affiliateId === "NONE") where.affiliateId = null;
  else if (query.affiliateId) where.affiliateId = String(query.affiliateId);

  if (query.state) where.state = String(query.state).trim().toUpperCase();
  if (query.city) where.city = { equals: String(query.city).trim(), mode: "insensitive" };

  const cnae = onlyDigits(query.cnae || "");
  if (cnae) where.cnaeCode = { startsWith: cnae };

  if (query.source) where.source = String(query.source);
  if (query.batchId) where.importBatchId = String(query.batchId);

  return where;
};

// GET /admin/leads  (paginado no servidor)
export const getAdminLeads = async (req, res) => {
  try {
    const page = clampInt(req.query.page, 1, 1, 100000);
    const pageSize = clampInt(req.query.pageSize, 25, 1, 100);
    const where = buildWhere(req.query);

    const [total, items] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: [
          { lastActivityAt: { sort: "desc", nulls: "last" } },
          { companyName: "asc" },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          companyName: true,
          tradeName: true,
          cnpj: true,
          contactPhone: true,
          city: true,
          state: true,
          cnaeCode: true,
          cnaeDescription: true,
          status: true,
          source: true,
          lastOutcome: true,
          lastActivityAt: true,
          nextActionAt: true,
          claimedAt: true,
          availableAt: true,
          affiliate: { select: { id: true, companyName: true, responsible: true } },
        },
      }),
    ]);

    return res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("❌ Erro ao listar leads no Admin:", error);
    return res.status(500).json({ error: "Erro ao listar leads." });
  }
};

// GET /admin/leads/stats  (contadores para os chips do topo)
export const getAdminLeadStats = async (req, res) => {
  try {
    const [byOutcome, byStatus, total, free, cooldown, invalid] = await Promise.all([
      prisma.lead.groupBy({ by: ["lastOutcome"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.lead.count(),
      // livres de verdade: no pool e fora da carência
      prisma.lead.count({ where: { status: "POOL", affiliateId: null, availableAt: { lte: new Date() } } }),
      // no pool, mas ainda em carência (recusaram há menos de 90 dias)
      prisma.lead.count({ where: { status: "POOL", affiliateId: null, availableAt: { gt: new Date() } } }),
      prisma.lead.count({ where: { lastOutcome: "INVALID_NUMBER" } }),
    ]);

    const outcomes = {};
    for (const row of byOutcome) {
      outcomes[row.lastOutcome ?? "NONE"] = row._count._all;
    }
    const statuses = {};
    for (const row of byStatus) statuses[row.status] = row._count._all;

    return res.json({ total, free, cooldown, invalid, outcomes, statuses });
  } catch (error) {
    console.error("❌ Erro ao calcular stats de leads:", error);
    return res.status(500).json({ error: "Erro ao calcular estatísticas." });
  }
};

// GET /admin/leads/:id  (ficha 360°)
export const getAdminLeadDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        affiliate: {
          select: {
            id: true,
            companyName: true,
            responsible: true,
            email: true,
            phone: true,
          },
        },
        importBatch: { select: { id: true, filename: true, createdAt: true } },
        deal: {
          select: {
            id: true,
            status: true,
            selectedPackage: true,
            finalValue: true,
            asaasPaymentId: true,
            closedAt: true,
          },
        },
        activities: { orderBy: { createdAt: "desc" }, take: 200 },
      },
    });

    if (!lead) return res.status(404).json({ error: "Lead não encontrado." });

    // LeadActivity guarda só o affiliateId (sem relação): resolvemos os nomes aqui
    const ids = [...new Set(lead.activities.map((a) => a.affiliateId))];
    const people = ids.length
      ? await prisma.affiliate.findMany({
          where: { id: { in: ids } },
          select: { id: true, companyName: true, responsible: true },
        })
      : [];
    const nameById = Object.fromEntries(
      people.map((p) => [p.id, p.responsible || p.companyName]),
    );

    const activities = lead.activities.map((a) => ({
      ...a,
      affiliateName: nameById[a.affiliateId] || "Consultor removido",
    }));

    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const daysSince = (d) => (d ? Math.floor((now - new Date(d).getTime()) / DAY) : null);

    return res.json({
      ...lead,
      activities,
      insights: {
        totalActivities: activities.length,
        daysSinceClaim: daysSince(lead.claimedAt),
        daysSinceLastActivity: daysSince(lead.lastActivityAt),
        // reservado e sem nenhuma atividade registrada
        reservedWithoutActivity: Boolean(lead.affiliateId) && activities.length === 0,
        followUpOverdue: Boolean(lead.nextActionAt) && new Date(lead.nextActionAt) < new Date(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar ficha do lead:", error);
    return res.status(500).json({ error: "Erro ao buscar a ficha do lead." });
  }
};

// PATCH /admin/leads/:id/contact  (corrigir telefone da fila de números inválidos)
export const updateLeadContact = async (req, res) => {
  const { id } = req.params;

  try {
    let digits = onlyDigits(req.body?.contactPhone || "");
    if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);

    if (digits.length < 10 || digits.length > 11) {
      return res.status(400).json({
        error: "Telefone inválido. Informe DDD + número (10 ou 11 dígitos).",
      });
    }

    const current = await prisma.lead.findUnique({
      where: { id },
      select: { id: true, lastOutcome: true, status: true },
    });
    if (!current) return res.status(404).json({ error: "Lead não encontrado." });

    // A tabulação "número inválido" deixa o lead como DISCARDED, fora do pool.
    // Telefone corrigido pelo Admin: ele volta ao pool, livre na hora.
    const backToPool = current.status === "DISCARDED" && current.lastOutcome === "INVALID_NUMBER";

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        contactPhone: digits,
        ...(backToPool
          ? { status: "POOL", lastOutcome: null, availableAt: new Date() }
          : {}),
      },
      select: { id: true, contactPhone: true, lastOutcome: true, status: true },
    });

    return res.json({
      message: backToPool
        ? "Telefone atualizado e lead devolvido ao pool."
        : "Telefone atualizado.",
      backToPool,
      lead: updated,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar contato do lead:", error);
    return res.status(500).json({ error: "Erro ao atualizar o contato." });
  }
};

// POST /admin/leads/expire-stale?dryRun=true  (execução manual da expiração de reservas)
export const runLeadExpiry = async (req, res) => {
  try {
    const result = await expireStaleReservations({ dryRun: req.query.dryRun === "true" });
    return res.json(result);
  } catch (error) {
    console.error("❌ Erro ao expirar reservas:", error);
    return res.status(500).json({ error: "Erro ao expirar reservas." });
  }
};
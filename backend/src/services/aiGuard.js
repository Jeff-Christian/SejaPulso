import { prisma } from "../config/db.js";

// Mude este valor sempre que alterar o prompt: invalida o cache antigo
export const PROMPT_VERSION = "v1";
const CACHE_DAYS = 60;

const intEnv = (name, fallback) => {
  const n = parseInt(process.env[name], 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// Interruptor geral: AI_ENABLED=false desliga qualquer chamada paga
export const aiEnabled = () => process.env.AI_ENABLED !== "false";

// ---------- Disjuntor ----------
let breakerUntil = 0;
export const breakerOpen = () => Date.now() < breakerUntil;
export const tripBreaker = (minutes) => {
  breakerUntil = Date.now() + minutes * 60 * 1000;
  console.error(`🛑 [AI Guard] OpenAI pausada por ${minutes} min.`);
};
export const isQuotaError = (err) =>
  err?.status === 429 &&
  (err?.code === "insufficient_quota" || /credit|quota|billing/i.test(String(err?.message)));

// ---------- Cache por CNPJ ----------
export const getCachedPitch = async (cnpj) => {
  const row = await prisma.pitchCache.findUnique({ where: { cnpj } });
  if (!row || row.promptVersion !== PROMPT_VERSION) return null;
  const fresh = Date.now() - row.createdAt.getTime() < CACHE_DAYS * 24 * 60 * 60 * 1000;
  return fresh ? row.content : null;
};

export const saveCachedPitch = (cnpj, content) =>
  prisma.pitchCache.upsert({
    where: { cnpj },
    create: { cnpj, content, promptVersion: PROMPT_VERSION },
    update: { content, promptVersion: PROMPT_VERSION, createdAt: new Date() },
  });

// ---------- Cota diária (atômica) ----------
const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const reserve = async (day, scope, limit) => {
  try {
    await prisma.aiUsage.upsert({
      where: { day_scope: { day, scope } },
      create: { day, scope },
      update: {},
    });
  } catch (e) {
    if (e.code !== "P2002") throw e;
  }
  const r = await prisma.aiUsage.updateMany({
    where: { day, scope, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  return r.count === 1;
};

const release = (day, scope) =>
  prisma.aiUsage.updateMany({
    where: { day, scope, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });

export const reserveAiCall = async (affiliateId) => {
  const day = today();
  if (!(await reserve(day, "GLOBAL", intEnv("AI_DAILY_LIMIT_GLOBAL", 300)))) {
    return { ok: false, reason: "GLOBAL_LIMIT" };
  }
  if (!(await reserve(day, affiliateId, intEnv("AI_DAILY_LIMIT_PER_USER", 30)))) {
    await release(day, "GLOBAL");
    return { ok: false, reason: "USER_LIMIT" };
  }
  return {
    ok: true,
    release: async () => {
      await release(day, "GLOBAL");
      await release(day, affiliateId);
    },
  };
};

// Quanto ainda dá para gerar hoje
export const getAiQuota = async (affiliateId) => {
  const day = today();
  const [mine, global] = await Promise.all([
    prisma.aiUsage.findUnique({ where: { day_scope: { day, scope: affiliateId } } }),
    prisma.aiUsage.findUnique({ where: { day_scope: { day, scope: "GLOBAL" } } }),
  ]);

  const limit = intEnv("AI_DAILY_LIMIT_PER_USER", 30);
  const used = mine?.count ?? 0;
  const globalLeft = Math.max(0, intEnv("AI_DAILY_LIMIT_GLOBAL", 300) - (global?.count ?? 0));

  return {
    limit,
    used,
    remaining: Math.max(0, Math.min(limit - used, globalLeft)),
    available: aiEnabled() && !breakerOpen(), // false com o interruptor desligado ou o disjuntor aberto
  };
};
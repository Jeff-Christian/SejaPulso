import { prisma } from "../config/db.js";
import { onlyDigits } from "../utils/brDocs.js";

export const MAX_ACTIVE_LEADS = 20;
export const COOLDOWN_DAYS = 90;
const NOT_HOLDING = ["POOL", "WAITING_INTERNAL_REVIEW", "DEAL_CLOSED", "DISCARDED"];

// Leads que o consultor "segura" hoje
export const countActiveLeads = (affiliateId) =>
  prisma.lead.count({ where: { affiliateId, status: { notIn: NOT_HOLDING } } });

export const buildPoolWhere = ({ state, city, cnae } = {}) => {
  const where = { status: "POOL", affiliateId: null, availableAt: { lte: new Date() } };
  if (state) where.state = String(state).toUpperCase().slice(0, 2);
  if (city) where.city = { equals: String(city).trim(), mode: "insensitive" };
  const cnaeDigits = onlyDigits(cnae);
  if (cnaeDigits) where.cnaeCode = { startsWith: cnaeDigits }; // "47" pega o comércio varejista todo
  return where;
};

// Reserva atômica: só uma requisição consegue transformar o lead livre em "meu"
export const claimById = async (id, affiliateId) => {
  const r = await prisma.lead.updateMany({
    where: { id, status: "POOL", affiliateId: null, availableAt: { lte: new Date() } },
    data: {
      affiliateId,
      status: "COMMERCIAL_CONTACT",
      claimedAt: new Date(),
      lastOutcome: null,
      nextActionAt: null,
    },
  });
  return r.count === 1;
};
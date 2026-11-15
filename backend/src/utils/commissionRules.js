// Regras de comissão do contrato de afiliados (cláusula 3).
// Única fonte da verdade: se o contrato mudar, mude aqui.

// Tetos de cada faixa de venda, em centavos. Acima do último teto = ENTERPRISE.
const BAND_LIMITS = [
  { band: "START", maxCents: 150000 }, // R$ 600,00 a R$ 1.500,00
  { band: "STANDARD", maxCents: 350000 }, // até R$ 3.500,00
  { band: "PRO", maxCents: 700000 }, // até R$ 7.000,00
];

export const MIN_SALE_CENTS = 60000; // abaixo de R$ 600,00 o contrato não prevê faixa

export const bandForTotalCents = (totalCents) => {
  for (const { band, maxCents } of BAND_LIMITS) {
    if (totalCents <= maxCents) return band;
  }
  return "ENTERPRISE";
};

// Tier pelas vendas do mês: 1 Bronze (até 3), 2 Prata (4 a 8), 3 Ouro (9 ou mais)
export const TIERS = [
  { index: 1, name: "Bronze", minSales: 0 },
  { index: 2, name: "Prata", minSales: 4 },
  { index: 3, name: "Ouro", minSales: 9 },
];

export const tierIndexForSales = (sales) =>
  TIERS.reduce((acc, t) => (sales >= t.minSales ? t.index : acc), 1);

// Percentual por faixa da venda (linha) e tier (1 = Bronze, 2 = Prata, 3 = Ouro)
export const RATE_MATRIX = {
  START: { 1: 8, 2: 10, 3: 12 },
  STANDARD: { 1: 10, 2: 12, 3: 15 },
  PRO: { 1: 12, 2: 15, 3: 18 },
  ENTERPRISE: { 1: 15, 2: 18, 3: 20 },
};

export const rateFor = (totalCents, tierIndex) =>
  RATE_MATRIX[bandForTotalCents(totalCents)][tierIndex];

// Percentual inteiro sobre centavos inteiros: sem Float no dinheiro
export const commissionCents = (baseCents, ratePercent) =>
  Math.round((baseCents * ratePercent) / 100);

// ---- Meses no fuso de São Paulo (UTC-3 fixo: o Brasil não usa mais horário de verão) ----
const SP_OFFSET_MS = 3 * 60 * 60 * 1000;

// monthsBack = 0 é o mês de `ref`; 1 é o mês anterior, e assim por diante
export const monthRangeSP = (ref = new Date(), monthsBack = 0) => {
  const shifted = new Date(ref.getTime() - SP_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() - monthsBack;
  return {
    start: new Date(Date.UTC(y, m, 1) + SP_OFFSET_MS),
    end: new Date(Date.UTC(y, m + 1, 1) + SP_OFFSET_MS),
  };
};

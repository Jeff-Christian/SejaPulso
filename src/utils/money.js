export const parseBRLToCents = (input) => {
  if (typeof input === "number") return Math.round(input * 100);
  const raw = String(input ?? "").replace(/[^\d,.]/g, "");
  if (!raw) return null;

  const thousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(raw); // "1.500" = mil e quinhentos
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : thousandsOnly
      ? raw.replace(/\./g, "")
      : raw;

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
};

export const centsToReais = (cents) => cents / 100;

// O sinal é metade; a segunda parte leva o resto, então não se perde centavo
export const splitDeposit = (totalCents) => {
  const deposit = Math.floor(totalCents / 2);
  return { deposit, balance: totalCents - deposit };
};

export const formatBRL = (cents) =>
  (cents / 100)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00a0/g, " ");
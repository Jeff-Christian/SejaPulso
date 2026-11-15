// Estados da venda (Deal.status). Continuam como texto no banco; esta tabela é a referência.
//
//   WAITING_PRICING_SLA / WAITING_FINANCIAL_VALIDATION  repasse enviado pelo consultor
//   AWAITING_DEPOSIT   Admin emitiu a cobrança do sinal
//   DEPOSIT_PAID       sinal pago (conta 1 venda para o tier)
//   AWAITING_BALANCE   Admin emitiu a cobrança do saldo
//   PAID_IN_FULL       saldo pago
//   REFUNDED           estorno ou chargeback: trava a segunda cobrança
//   CANCELLED          venda cancelada
export const TRANSITIONS = {
  WAITING_PRICING_SLA: [
    "WAITING_FINANCIAL_VALIDATION",
    "AWAITING_DEPOSIT",
    "CANCELLED",
  ],
  WAITING_FINANCIAL_VALIDATION: ["AWAITING_DEPOSIT", "CANCELLED"],
  AWAITING_DEPOSIT: [
    "DEPOSIT_PAID",
    "WAITING_FINANCIAL_VALIDATION",
    "REFUNDED",
    "CANCELLED",
  ],
  DEPOSIT_PAID: ["AWAITING_BALANCE", "REFUNDED", "CANCELLED"],
  AWAITING_BALANCE: ["PAID_IN_FULL", "DEPOSIT_PAID", "REFUNDED", "CANCELLED"],
  PAID_IN_FULL: ["REFUNDED"],
  REFUNDED: [],
  CANCELLED: [],
};

export const canTransition = (from, to) =>
  (TRANSITIONS[from] || []).includes(to);

// Único lugar que decide se o botão da segunda cobrança pode estar liberado.
// Se mais uma condição entrar (entrega concluída, por exemplo), é aqui.
export const canIssueBalance = (deal) => {
  if (deal.status === "REFUNDED") {
    return {
      ok: false,
      reason: "Venda estornada: a segunda cobrança está bloqueada.",
    };
  }
  if (deal.status !== "DEPOSIT_PAID") {
    return {
      ok: false,
      reason:
        "A segunda cobrança só pode ser emitida depois que o sinal for pago.",
    };
  }
  if (deal.balancePaymentId) {
    return {
      ok: false,
      reason: "Já existe uma segunda cobrança para esta venda.",
    };
  }
  return { ok: true };
};

import { prisma } from "../config/db.js";
import {
  findOrCreateAsaasCustomer,
  createAsaasPayment,
} from "../services/asaasService.js";
import {
  parseBRLToCents,
  centsToReais,
  splitDeposit,
  formatBRL,
} from "../utils/money.js";
import { canIssueBalance } from "../services/dealStateMachine.js";

const CHARGE_LOCK = "CREATING";

// POST /admin/deals/:dealId/create-balance-charge  (segunda cobrança, 50% restante)
export const createBalanceCharge = async (req, res) => {
  const { dealId } = req.params;
  let locked = false;
  let createdPaymentId = null;

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { lead: true },
    });
    if (!deal) return res.status(404).json({ error: "Venda não encontrada." });

    const gate = canIssueBalance(deal);
    if (!gate.ok) return res.status(409).json({ error: gate.reason });

    const totalCents = deal.totalCents ?? parseBRLToCents(deal.finalValue);
    if (!totalCents)
      return res.status(400).json({ error: "Valor final da venda inválido." });
    const { balance } = splitDeposit(totalCents);

    // Trava atômica: só uma requisição consegue emitir a segunda cobrança
    const lock = await prisma.deal.updateMany({
      where: { id: dealId, status: "DEPOSIT_PAID", balancePaymentId: null },
      data: { balancePaymentId: CHARGE_LOCK },
    });
    if (lock.count === 0) {
      return res
        .status(409)
        .json({
          error: "Já existe uma cobrança sendo emitida para esta venda.",
        });
    }
    locked = true;

    const customerId = await findOrCreateAsaasCustomer({
      cnpj: deal.lead?.cnpj,
      companyName: deal.lead?.companyName,
      email: deal.lead?.contactEmail,
      phone: deal.lead?.contactPhone,
    });

    const { paymentId, paymentUrl } = await createAsaasPayment({
      customerId,
      amount: centsToReais(balance),
      description: `Saldo (50%) - Projeto ${deal.selectedPackage} (Pulso Tech)`,
      externalReference: `${deal.id}:BALANCE`, // o webhook usa o sufixo para distinguir do sinal
    });
    createdPaymentId = paymentId;

    const updated = await prisma.deal.update({
      where: { id: dealId },
      data: {
        balancePaymentId: paymentId,
        balancePaymentUrl: paymentUrl,
        status: "AWAITING_BALANCE",
      },
    });
    locked = false;

    return res.json({
      message: `Cobrança do saldo (${formatBRL(balance)}) gerada com sucesso no Asaas!`,
      balancePaymentId: paymentId,
      paymentUrl,
      deal: updated,
    });
  } catch (error) {
    if (createdPaymentId) {
      // Existe no Asaas mas não foi gravada: mantém a trava e avisa
      console.error(
        `🚨 Cobrança de saldo ${createdPaymentId} criada no Asaas, mas falhou ao gravar no deal ${dealId}:`,
        error,
      );
    } else if (locked) {
      await prisma.deal
        .updateMany({
          where: { id: dealId, balancePaymentId: CHARGE_LOCK },
          data: { balancePaymentId: null },
        })
        .catch(() => {});
    }
    console.error("❌ [Asaas Balance Charge Error]:", error.message);
    return res
      .status(500)
      .json({
        error: error.message || "Erro interno ao emitir a cobrança do saldo.",
      });
  }
};

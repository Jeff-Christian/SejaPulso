import { prisma } from "../config/db.js";

// Marcadores "já viu" guardados no próprio consultor
const SEEN_FIELDS = {
  pricing: "pricingViewedAt",
  materials: "materialsViewedAt",
};

// GET /leads/onboarding
// Os passos são calculados com dados reais (reservas, tabulações, vendas),
// então o checklist nunca fica "marcado" sem o consultor ter feito de verdade.
export const getOnboarding = async (req, res) => {
  const affiliateId = req.user.id;

  try {
    const [me, leadsHeld, activities, meetings, deals] = await Promise.all([
      prisma.affiliate.findUnique({
        where: { id: affiliateId },
        select: {
          pricingViewedAt: true,
          materialsViewedAt: true,
          onboardingDismissedAt: true,
        },
      }),
      prisma.lead.count({ where: { affiliateId } }),
      prisma.leadActivity.count({ where: { affiliateId } }),
      prisma.leadActivity.count({
        where: { affiliateId, outcome: "MEETING_SCHEDULED" },
      }),
      prisma.deal.count({ where: { affiliateId } }),
    ]);

    if (!me)
      return res.status(404).json({ error: "Consultor não encontrado." });

    const steps = [
      {
        id: "pricing",
        title: "Conheça o cardápio de serviços",
        hint: "Veja o que a Pulso Tech vende, para quem oferecer e como oferecer.",
        done: Boolean(me.pricingViewedAt),
        tab: "pricing",
      },
      {
        id: "materials",
        title: "Veja os materiais e o book de consulta",
        hint: "Tenha à mão o material de apoio antes da primeira abordagem.",
        done: Boolean(me.materialsViewedAt),
        tab: "materials",
      },
      {
        id: "first_claim",
        title: "Reserve seu primeiro lead",
        hint: "Em “Verificação & Pool B2B”, clique em “Próximo lead”.",
        done: leadsHeld > 0 || activities > 0,
        tab: "leads",
      },
      {
        id: "first_contact",
        title: "Registre seu primeiro contato",
        hint: "Em “Meus Agendamentos”, use os botões de tabulação depois de cada ligação ou mensagem.",
        done: activities > 0,
        tab: "my-leads",
      },
      {
        id: "first_meeting",
        title: "Agende sua primeira reunião",
        hint: "Marque “Reunião agendada” com a data e a hora combinadas com o cliente.",
        done: meetings > 0,
        tab: "my-leads",
      },
      {
        id: "first_sale",
        title: "Envie sua primeira venda",
        hint: "Quando o cliente aceitar, marque “Aguardando fechamento” e preencha o repasse.",
        done: deals > 0,
        tab: "my-leads",
      },
    ];

    return res.json({
      dismissed: Boolean(me.onboardingDismissedAt),
      steps,
      doneCount: steps.filter((s) => s.done).length,
      total: steps.length,
    });
  } catch (error) {
    console.error("❌ [getOnboarding]:", error);
    return res
      .status(500)
      .json({ error: "Erro ao carregar os primeiros passos." });
  }
};

// POST /leads/onboarding/seen  { item: "pricing" | "materials" }
export const markOnboardingSeen = async (req, res) => {
  const field = SEEN_FIELDS[req.body?.item];
  if (!field) return res.status(400).json({ error: "Item inválido." });

  try {
    // só grava na primeira vez; depois mantém a data original
    await prisma.affiliate.updateMany({
      where: { id: req.user.id, [field]: null },
      data: { [field]: new Date() },
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error("❌ [markOnboardingSeen]:", error);
    return res.status(500).json({ error: "Erro ao registrar." });
  }
};

// POST /leads/onboarding/dismiss
export const dismissOnboarding = async (req, res) => {
  try {
    await prisma.affiliate.updateMany({
      where: { id: req.user.id, onboardingDismissedAt: null },
      data: { onboardingDismissedAt: new Date() },
    });
    return res.json({ ok: true });
  } catch (error) {
    console.error("❌ [dismissOnboarding]:", error);
    return res.status(500).json({ error: "Erro ao ocultar o checklist." });
  }
};

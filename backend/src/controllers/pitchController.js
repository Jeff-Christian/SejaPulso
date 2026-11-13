import { prisma } from "../config/db.js";
import { onlyDigits, isValidCnpj } from "../utils/brDocs.js";
import { fetchBrasilApiCompany, toCompanyData } from "../services/brasilApiService.js";
import { getPitchGuarded, getFreePitch } from "../services/pitchGateway.js";
import { getAiQuota } from "../services/aiGuard.js";

// GET /leads/ai-quota
export const getQuota = async (req, res) => {
  try {
    return res.json(await getAiQuota(req.user.id));
  } catch (error) {
    console.error("❌ [getQuota]:", error);
    return res.status(500).json({ error: "Erro ao consultar o limite diário." });
  }
};

// GET /leads/:id/pitch  (sem custo: pitch salvo ou abordagem padrão)
export const getLeadPitch = async (req, res) => {
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, affiliateId: req.user.id },
    });
    if (!lead) return res.status(404).json({ error: "Lead não encontrado na sua carteira." });

    const intelligence = await getFreePitch({
      cnpj: lead.cnpj || "",
      companyName: lead.companyName,
      tradeName: lead.tradeName || lead.companyName,
      cnaeCode: lead.cnaeCode,
      cnaeDescription: lead.cnaeDescription,
      location: [lead.city, lead.state].filter(Boolean).join(" / "),
      officialPhone: lead.contactPhone,
      officialEmail: lead.contactEmail,
    });

    return res.json({ intelligence });
  } catch (error) {
    console.error("❌ [getLeadPitch]:", error);
    return res.status(500).json({ error: "Erro ao carregar a abordagem." });
  }
};

// POST /leads/consult/:cnpj/pitch  (com custo, passa por cache, cota e disjuntor)
export const generatePitch = async (req, res) => {
  const affiliateId = req.user.id;
  const cnpj = onlyDigits(req.params.cnpj);

  if (!isValidCnpj(cnpj)) return res.status(400).json({ error: "CNPJ inválido." });

  try {
    const lead = await prisma.lead.findUnique({ where: { cnpj }, select: { affiliateId: true } });
    if (lead?.affiliateId && lead.affiliateId !== affiliateId) {
      return res.status(403).json({ error: "Este lead pertence a outro consultor." });
    }

    const brasil = await fetchBrasilApiCompany(cnpj);
    if (brasil.status === 404) return res.status(404).json({ error: "CNPJ não encontrado na base da Receita Federal." });
    if (!brasil.ok) return res.status(502).json({ error: "Serviço da Receita Federal/BrasilAPI temporariamente indisponível." });

    const intelligence = await getPitchGuarded(toCompanyData(brasil.data, cnpj), affiliateId);
    const quota = await getAiQuota(affiliateId); // já com a cota depois desta geração

    return res.json({ intelligence, quota });
  } catch (error) {
    console.error("❌ [generatePitch]:", error);
    return res.status(500).json({ error: "Erro ao gerar a abordagem." });
  }
};
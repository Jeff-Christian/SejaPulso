import { prisma } from "../config/db.js";
import { onlyDigits, isValidCnpj } from "../utils/brDocs.js";
import { fetchBrasilApiCompany, toCompanyData } from "../services/brasilApiService.js";
import { getPitchGuarded } from "../services/pitchGateway.js";

// POST /leads/consult/:cnpj/pitch
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
    return res.json({ intelligence });
  } catch (error) {
    console.error("❌ [generatePitch]:", error);
    return res.status(500).json({ error: "Erro ao gerar a abordagem." });
  }
};
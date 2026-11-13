import {
  aiEnabled,
  breakerOpen,
  getCachedPitch,
  saveCachedPitch,
  reserveAiCall,
} from "./aiGuard.js";
import {
  generateSmartPitch,
  buildFallbackPitch,
  resolvePackage,
} from "./pitchService.js";

const fromCache = (cached, companyData) => ({
  ...cached,
  suggestedPackage: resolvePackage(companyData.cnaeCode).package, // preço sempre atual
  source: "cache",
});

// Sem custo: pitch salvo (se existir) ou abordagem padrão
export const getFreePitch = async (companyData) => {
  try {
    const cached = await getCachedPitch(companyData.cnpj);
    if (cached) return fromCache(cached, companyData);
  } catch (err) {
    console.error("⚠️ [pitchGateway] cache indisponível:", err.message);
  }
  return { ...buildFallbackPitch(companyData), source: "standard" };
};

// Com custo (só no clique): cache → travas → OpenAI
export const getPitchGuarded = async (companyData, affiliateId) => {
  const fallback = (notice) => ({
    ...buildFallbackPitch(companyData),
    source: "fallback",
    notice,
  });

  try {
    const cached = await getCachedPitch(companyData.cnpj);
    if (cached) return fromCache(cached, companyData);

    if (!aiEnabled()) {
      return fallback("As sugestões por IA estão desligadas no momento. Exibindo a abordagem padrão.");
    }
    if (breakerOpen()) {
      return fallback("A IA está temporariamente indisponível. Exibindo a abordagem padrão.");
    }

    const slot = await reserveAiCall(affiliateId);
    if (!slot.ok) {
      return fallback(
        slot.reason === "USER_LIMIT"
          ? "Você atingiu o limite diário de sugestões por IA. Exibindo a abordagem padrão."
          : "A plataforma atingiu o limite diário de sugestões por IA. Exibindo a abordagem padrão.",
      );
    }

    const result = await generateSmartPitch(companyData);

    if (result.source !== "ai") {
      const { charged, ...rest } = result;
      if (!charged) await slot.release(); // falhou antes de gastar: devolve a cota
      return { ...rest, notice: "Não foi possível gerar a versão da IA agora. Exibindo a abordagem padrão." };
    }

    const { source, notice, ...content } = result;
    await saveCachedPitch(companyData.cnpj, content);
    return { ...content, source: "ai" };
  } catch (err) {
    console.error("❌ [pitchGateway]:", err);
    return fallback("Não foi possível gerar a sugestão agora. Exibindo a abordagem padrão.");
  }
};
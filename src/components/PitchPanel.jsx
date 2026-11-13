import React, { useState, useEffect } from "react";
import {
  Sparkles, 
  Copy, 
  Check, 
  Lightbulb, 
  MessageSquare, 
  DollarSign, 
  Target,
  MessageCircleQuestion, 
  ShieldAlert, 
  Ban, 
  ChevronDown, 
  ArrowRightCircle,
} from "lucide-react";
import { apiRequest } from "../services/api";

const Section = ({ icon: Icon, title, color = "text-[#00F5D4]", children }) => (
  <div className="bg-[#0B132B] p-4 rounded-xl border border-[#1E2D50]">
    <span className={`text-[10px] uppercase font-mono font-bold mb-2 flex items-center gap-1.5 ${color}`}>
      <Icon className="w-3.5 h-3.5" /> {title}
    </span>
    {children}
  </div>
);

export const PitchPanel = ({ intelligence, cnpj, canGenerate = true }) => {
  const [ai, setAi] = useState(intelligence);
  const [quota, setQuota] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [openObjection, setOpenObjection] = useState(null);

  const isAiContent = ai?.source === "ai" || ai?.source === "cache";
  const mayGenerate = canGenerate && Boolean(cnpj) && !isAiContent;

  // Só consulta o contador quando o botão pode aparecer
  useEffect(() => {
    if (!mayGenerate) return;
    let active = true;
    apiRequest("/leads/ai-quota", "GET")
      .then((q) => active && setQuota(q))
      .catch(() => {});
    return () => { active = false; };
  }, [mayGenerate]);

  if (!ai) return null;

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const data = await apiRequest(`/leads/consult/${cnpj}/pitch`, "POST", null);
      setAi(data.intelligence);
      if (data.quota) setQuota(data.quota);
    } catch (err) {
      setError(err.message || "Não foi possível gerar agora.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyScript = async () => {
    if (!ai.pitchScript) return;
    try {
      await navigator.clipboard.writeText(ai.pitchScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const blocked = quota && !quota.available;
  const exhausted = quota && quota.available && quota.remaining <= 0;
  const buttonLabel = generating
    ? "Gerando..."
    : blocked
      ? "IA indisponível no momento"
      : exhausted
        ? "Limite de hoje atingido"
        : quota
          ? `Personalizar com IA · ${quota.remaining} restante${quota.remaining === 1 ? "" : "s"} hoje`
          : "Personalizar com IA";

  const painPoints = ai.painPoints || [];
  const openingQuestions = ai.openingQuestions || [];
  const objections = ai.objections || [];
  const avoid = ai.avoid || [];

  return (
    <div className="bg-[#111D3A]/90 border border-[#00F5D4]/40 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1E2D50] pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-[#00F5D4] font-bold text-xs">
          <Sparkles className="w-4 h-4" />
          <span>Co-piloto de Vendas{ai.segmentLabel ? ` · ${ai.segmentLabel}` : ""}</span>
        </div>
        {isAiContent ? (
          <span className="text-[10px] bg-[#00F5D4]/10 text-[#00F5D4] px-2.5 py-0.5 rounded font-mono border border-[#00F5D4]/30">
            Personalizado por IA · dados públicos
          </span>
        ) : (
          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded font-mono border border-amber-500/30">
            Abordagem padrão
          </span>
        )}
      </div>

      {!isAiContent && (
        <div className="bg-[#0B132B] border border-amber-500/30 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] text-amber-300 leading-relaxed">
              {ai.notice ||
                "Esta é a abordagem padrão do segmento. A versão personalizada por IA traz dores, objeções e perguntas específicas."}
            </p>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>

          {mayGenerate && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || blocked || exhausted}
              className="shrink-0 bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold px-4 py-2 rounded-xl text-[11px] transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{buttonLabel}</span>
            </button>
          )}
        </div>
      )}

      <Section icon={Lightbulb} title="Por que ofertar este serviço" color="text-amber-400">
        <p className="text-gray-200 text-xs leading-relaxed">{ai.whyOffer}</p>
      </Section>

      {painPoints.length > 0 && (
        <Section icon={Target} title="Dores comuns neste segmento">
          <ul className="space-y-1.5">
            {painPoints.map((p, i) => (
              <li key={i} className="text-gray-200 text-xs leading-relaxed flex gap-2">
                <span className="text-[#00F5D4] shrink-0">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">
            São padrões do segmento, confirme na conversa antes de afirmar.
          </p>
        </Section>
      )}

      <div className="bg-[#0B132B] p-4 rounded-xl border border-[#00F5D4]/30">
        <div className="flex justify-between items-center mb-2 gap-2">
          <span className="text-[10px] uppercase font-mono text-[#00F5D4] font-bold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Primeira mensagem (WhatsApp)
          </span>
          <button
            type="button"
            onClick={handleCopyScript}
            className="bg-[#1E2D50] hover:bg-[#00F5D4] hover:text-[#0B132B] text-white px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
        <p className="text-gray-100 text-xs leading-relaxed whitespace-pre-line bg-[#111D3A] rounded-lg p-3 border border-[#1E2D50]">
          {ai.pitchScript}
        </p>
      </div>

      {openingQuestions.length > 0 && (
        <Section icon={MessageCircleQuestion} title="Perguntas para puxar conversa">
          <ul className="space-y-1.5">
            {openingQuestions.map((q, i) => (
              <li key={i} className="text-gray-200 text-xs leading-relaxed">“{q}”</li>
            ))}
          </ul>
        </Section>
      )}

      {objections.length > 0 && (
        <Section icon={ShieldAlert} title="Se o cliente disser..." color="text-sky-400">
          <div className="space-y-2">
            {objections.map((o, i) => {
              const open = openObjection === i;
              return (
                <div key={i} className="border border-[#1E2D50] rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenObjection(open ? null : i)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs text-gray-200 font-semibold hover:bg-[#111D3A] cursor-pointer"
                  >
                    <span>“{o.objection}”</span>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && <p className="px-3 pb-3 text-xs text-gray-300 leading-relaxed">{o.answer}</p>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {avoid.length > 0 && (
        <Section icon={Ban} title="Evite" color="text-red-400">
          <ul className="space-y-1.5">
            {avoid.map((a, i) => (
              <li key={i} className="text-gray-200 text-xs leading-relaxed flex gap-2">
                <span className="text-red-400 shrink-0">✕</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {ai.nextStep && (
        <Section icon={ArrowRightCircle} title="Se ele responder, próximo passo" color="text-emerald-400">
          <p className="text-gray-200 text-xs leading-relaxed">{ai.nextStep}</p>
        </Section>
      )}

      <div className="flex items-center justify-between p-3.5 bg-[#0B132B] rounded-xl border border-[#1E2D50] text-xs gap-2">
        <span className="text-gray-400 font-mono text-[10px] uppercase flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-[#00F5D4]" /> Pacote sugerido do cardápio (uso interno)
        </span>
        <span className="font-bold text-[#00F5D4] font-mono text-right">{ai.suggestedPackage}</span>
      </div>
    </div>
  );
};
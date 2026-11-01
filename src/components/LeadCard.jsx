import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Lightbulb,
  MessageSquare,
  DollarSign,
  Target,
  MessageCircleQuestion,
  Ban,
  ChevronDown,
  ArrowRightCircle,
} from "lucide-react";
import { apiRequest } from "../services/api";

// Bloco pequeno reutilizável para as seções da inteligência
const Section = ({ icon: Icon, title, color = "text-[#00F5D4]", children }) => (
  <div className="bg-[#0B132B] p-4 rounded-xl border border-[#1E2D50]">
    <span
      className={`text-[10px] uppercase font-mono font-bold mb-2 flex items-center gap-1.5 ${color}`}
    >
      <Icon className="w-3.5 h-3.5" /> {title}
    </span>
    {children}
  </div>
);

export const LeadCard = ({ leadData, onLeadClaimed }) => {
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [openObjection, setOpenObjection] = useState(null);

  if (!leadData) return null;

  const ai = leadData.intelligence;
  const isBlocked =
    leadData.status === "BLOCKED" ||
    (leadData.isClaimed && !leadData.isOwnedByMe);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const token = localStorage.getItem("token");
      await apiRequest(
        "/leads/claim",
        "POST",
        {
          cnpj: leadData.cnpj,
          companyName: leadData.companyName,
          contactPhone: leadData.officialPhone,
        },
        token,
      );

      alert("Lead agendado e reservado no seu nome com sucesso!");
      if (onLeadClaimed) onLeadClaimed();
    } catch (err) {
      alert(err.message || "Erro ao agendar este lead.");
    } finally {
      setClaiming(false);
    }
  };

  const handleCopyScript = async () => {
    const scriptText = ai?.pitchScript || "";
    if (!scriptText) return;
    try {
      await navigator.clipboard.writeText(scriptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const painPoints = ai?.painPoints || [];
  const openingQuestions = ai?.openingQuestions || [];
  const objections = ai?.objections || [];
  const avoid = ai?.avoid || [];

  return (
    <div className="bg-[#0B132B] border border-[#1E2D50] rounded-2xl p-6 space-y-6 shadow-2xl font-sans">
      {/* 1. Header do Card & Status de Paternidade */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1E2D50] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white">
              {leadData.companyName}
            </h3>
            {leadData.tradeName &&
              leadData.tradeName !== leadData.companyName && (
                <span className="text-xs text-gray-400 font-mono">
                  ({leadData.tradeName})
                </span>
              )}
          </div>
          <p className="text-xs text-[#00F5D4] font-mono mt-0.5">
            CNPJ: {leadData.cnpj}
          </p>
        </div>

        <div>
          {isBlocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
              <Lock className="w-3.5 h-3.5" />
              <span>
                Reservado por:{" "}
                {leadData.claimedByConsultant || "Outro Consultor"}
              </span>
            </span>
          ) : leadData.isOwnedByMe ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reservado na Sua Carteira</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disponível no Pool</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Informações Cadastrais Públicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111D3A] p-4 rounded-xl border border-[#1E2D50]">
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">
            Ramo / CNAE Principal
          </span>
          <p className="font-semibold text-gray-200 mt-0.5 text-xs">
            {leadData.cnaeDescription || "Atividade Comercial"}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">
            Localização
          </span>
          <p className="font-semibold text-gray-200 flex items-center gap-1 mt-0.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#00F5D4]" />
            {leadData.location}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">
            Telefone Oficial
          </span>
          <p className="font-mono text-gray-300 flex items-center gap-1 mt-0.5 text-xs">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            {leadData.officialPhone}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">
            E-mail Oficial
          </span>
          <p className="font-mono text-gray-300 flex items-center gap-1 mt-0.5 text-xs break-all">
            <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            {leadData.officialEmail}
          </p>
        </div>
      </div>

      {/* 3. Co-piloto de vendas */}
      {ai && (
        <div className="bg-[#111D3A]/90 border border-[#00F5D4]/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E2D50] pb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-[#00F5D4] font-bold text-xs">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>
                Co-piloto de Vendas
                {ai.segmentLabel ? ` · ${ai.segmentLabel}` : ""}
              </span>
            </div>
            <span className="text-[10px] bg-[#00F5D4]/10 text-[#00F5D4] px-2.5 py-0.5 rounded font-mono border border-[#00F5D4]/30">
              Sugestão baseada em dados públicos
            </span>
          </div>

          {/* Por que ofertar */}
          <Section
            icon={Lightbulb}
            title="Por que ofertar este serviço"
            color="text-amber-400"
          >
            <p className="text-gray-200 text-xs leading-relaxed">
              {ai.whyOffer}
            </p>
          </Section>

          {/* Dores prováveis */}
          {painPoints.length > 0 && (
            <Section icon={Target} title="Dores comuns neste segmento">
              <ul className="space-y-1.5">
                {painPoints.map((p, i) => (
                  <li
                    key={i}
                    className="text-gray-200 text-xs leading-relaxed flex gap-2"
                  >
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

          {/* Script WhatsApp */}
          <div className="bg-[#0B132B] p-4 rounded-xl border border-[#00F5D4]/30">
            <div className="flex justify-between items-center mb-2 gap-2">
              <span className="text-[10px] uppercase font-mono text-[#00F5D4] font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Primeira mensagem
                (WhatsApp)
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

          {/* Perguntas de abertura (para ligação ou conversa) */}
          {openingQuestions.length > 0 && (
            <Section
              icon={MessageCircleQuestion}
              title="Perguntas para puxar conversa"
            >
              <ul className="space-y-1.5">
                {openingQuestions.map((q, i) => (
                  <li key={i} className="text-gray-200 text-xs leading-relaxed">
                    “{q}”
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Objeções */}
          {objections.length > 0 && (
            <Section
              icon={ShieldAlert}
              title="Se o cliente disser..."
              color="text-sky-400"
            >
              <div className="space-y-2">
                {objections.map((o, i) => {
                  const open = openObjection === i;
                  return (
                    <div
                      key={i}
                      className="border border-[#1E2D50] rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenObjection(open ? null : i)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs text-gray-200 font-semibold hover:bg-[#111D3A] cursor-pointer"
                      >
                        <span>“{o.objection}”</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open && (
                        <p className="px-3 pb-3 text-xs text-gray-300 leading-relaxed">
                          {o.answer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* O que evitar */}
          {avoid.length > 0 && (
            <Section icon={Ban} title="Evite" color="text-red-400">
              <ul className="space-y-1.5">
                {avoid.map((a, i) => (
                  <li
                    key={i}
                    className="text-gray-200 text-xs leading-relaxed flex gap-2"
                  >
                    <span className="text-red-400 shrink-0">✕</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Próximo passo */}
          {ai.nextStep && (
            <Section
              icon={ArrowRightCircle}
              title="Se ele responder, próximo passo"
              color="text-emerald-400"
            >
              <p className="text-gray-200 text-xs leading-relaxed">
                {ai.nextStep}
              </p>
            </Section>
          )}

          {/* Pacote Sugerido */}
          <div className="flex items-center justify-between p-3.5 bg-[#0B132B] rounded-xl border border-[#1E2D50] text-xs gap-2">
            <span className="text-gray-400 font-mono text-[10px] uppercase flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-[#00F5D4]" /> Pacote
              sugerido do cardápio (uso interno)
            </span>
            <span className="font-bold text-[#00F5D4] font-mono text-right">
              {ai.suggestedPackage}
            </span>
          </div>
        </div>
      )}

      {/* 4. Rodapé & Botão de Reserva */}
      <div className="pt-2 flex justify-end">
        {isBlocked ? (
          <div className="flex items-center gap-2 text-xs text-red-400 font-mono bg-red-500/5 border border-red-500/20 px-4 py-2 rounded-xl">
            <ShieldAlert className="w-4 h-4" />
            <span>Oportunidade reservada por outro consultor da rede.</span>
          </div>
        ) : leadData.isOwnedByMe ? (
          <span className="text-xs text-emerald-400 font-mono">
            Este lead já está na sua aba "Meus Agendamentos".
          </span>
        ) : (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {claiming ? "Reservando..." : "Reservar Lead no Meu Nome (Claim)"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

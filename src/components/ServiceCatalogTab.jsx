import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle2,
  Users,
  Compass,
  MessageSquare,
  ShieldQuestion,
  Copy,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import {
  COMMERCIAL_RULES,
  SERVICE_PLANS,
  SERVICE_PACKAGES,
} from "../config/serviceCatalog";

const PLAN_BADGE_STYLES = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cyan: "bg-[#00F5D4]/10 text-[#00F5D4] border-[#00F5D4]/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export const ServiceCatalogTab = () => {
  const [selectedPlan, setSelectedPlan] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [openObjections, setOpenObjections] = useState({});

  const filteredPackages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return SERVICE_PACKAGES.filter((pkg) => {
      const matchesPlan =
        selectedPlan === "ALL" || pkg.plan === selectedPlan;
      if (!matchesPlan) return false;
      if (!query) return true;

      return (
        pkg.name.toLowerCase().includes(query) ||
        pkg.salesPlaybook.targetAudience.toLowerCase().includes(query) ||
        pkg.salesPlaybook.howToPitch.toLowerCase().includes(query) ||
        pkg.deliverables.some((d) => d.toLowerCase().includes(query))
      );
    });
  }, [selectedPlan, searchTerm]);

  const handleCopyHook = (code, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleObjections = (code) => {
    setOpenObjections((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="space-y-6 font-sans text-white">
      {/* 1. Cabeçalho & Regras Comerciais Vigentes */}
      <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono text-[#00F5D4] uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Playbook & Tabela Oficial
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Cardápio de Serviços & Pacotes Padronizados
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Consulte escopo, prazos oficiais, público-alvo e respostas para
              objeções antes de enviar o fechamento.
            </p>
          </div>
        </div>

        {/* Faixa de Governança Comercial */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#00F5D4] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Cobrança & Recebimento
            </span>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {COMMERCIAL_RULES.paymentStructure}. Pagamento exclusivo na conta
              PJ da Pulso Tech.
            </p>
          </div>

          <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Política de Desconto
            </span>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {COMMERCIAL_RULES.discountPolicy}
            </p>
          </div>

          <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Comissão & NFS-e
            </span>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              {COMMERCIAL_RULES.invoiceRequirement}
            </p>
          </div>
        </div>

        {/* Barra de Filtros por Plano + Busca */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 pt-2 border-t border-[#1E2D50]">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedPlan("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedPlan === "ALL"
                  ? "bg-[#00F5D4] text-[#0B132B]"
                  : "bg-[#0B132B] text-gray-400 border border-[#1E2D50] hover:text-white"
              }`}
            >
              Todos ({SERVICE_PACKAGES.length})
            </button>

            {Object.values(SERVICE_PLANS).map((plan) => {
              const count = SERVICE_PACKAGES.filter(
                (p) => p.plan === plan.id,
              ).length;
              const isActive = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-[#00F5D4] text-[#0B132B]"
                      : "bg-[#0B132B] text-gray-400 border border-[#1E2D50] hover:text-white"
                  }`}
                >
                  {plan.id} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nicho, serviço ou entrega..."
              className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F5D4]"
            />
          </div>
        </div>
      </div>

      {/* 2. Grade de Pacotes Ampliados */}
      {filteredPackages.length === 0 ? (
        <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-10 text-center text-xs text-gray-400 font-mono">
          Nenhum pacote encontrado para o filtro selecionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPackages.map((pkg) => {
            const planMeta = SERVICE_PLANS[pkg.plan];
            const badgeClass =
              PLAN_BADGE_STYLES[planMeta?.badgeColor] ||
              PLAN_BADGE_STYLES.cyan;
            const isEnterprise = pkg.plan === "ENTERPRISE";
            const depositFormatted = !pkg.isStartingPrice
              ? (pkg.price / 2).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : null;
            const objectionsExpanded = !!openObjections[pkg.code];

            return (
              <div
                key={pkg.code}
                className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-xl hover:border-[#00F5D4]/40 transition"
              >
                <div className="space-y-4">
                  {/* Header do Pacote */}
                  <div className="flex justify-between items-start gap-3 border-b border-[#1E2D50] pb-4">
                    <div className="space-y-1.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeClass}`}
                      >
                        {planMeta?.label}
                      </span>
                      <h3 className="text-base font-bold text-white">
                        {pkg.name}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-[#00F5D4] font-mono">
                        {pkg.priceFormatted}
                      </p>
                      {depositFormatted ? (
                        <p className="text-[10px] text-gray-400 font-mono">
                          Sinal 50%: {depositFormatted}
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-400 font-mono">
                          Orçamento via Briefing
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prazo */}
                  <div className="flex items-center gap-2 text-xs text-gray-300 bg-[#0B132B] px-3 py-2 rounded-xl border border-[#1E2D50]">
                    <Clock className="w-3.5 h-3.5 text-[#00F5D4] shrink-0" />
                    <span>
                      Prazo de entrega: <strong>{pkg.deliveryTime}</strong>
                    </span>
                  </div>

                  {/* Entregáveis */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-mono uppercase text-gray-400">
                      O que está incluso na entrega
                    </p>
                    <ul className="space-y-1.5">
                      {pkg.deliverables.map((item, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-gray-200 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Playbook: A quem oferecer + Como oferecer */}
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-3.5 space-y-1">
                      <p className="text-[10px] font-mono uppercase text-[#00F5D4] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> A quem oferecer
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {pkg.salesPlaybook.targetAudience}
                      </p>
                    </div>

                    <div
                      className={`bg-[#0B132B] border rounded-xl p-3.5 space-y-1 ${
                        isEnterprise
                          ? "border-amber-500/30"
                          : "border-[#1E2D50]"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-mono uppercase flex items-center gap-1.5 ${
                          isEnterprise ? "text-amber-400" : "text-[#00F5D4]"
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" /> Como oferecer
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {pkg.salesPlaybook.howToPitch}
                      </p>
                    </div>
                  </div>

                  {/* Gancho de Abordagem */}
                  <div className="bg-[#0B132B] border border-[#00F5D4]/25 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#00F5D4] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Gancho de
                        Abordagem
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyHook(pkg.code, pkg.salesPlaybook.pitchHook)
                        }
                        className="text-[10px] font-mono text-gray-300 hover:text-[#00F5D4] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCode === pkg.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar pergunta</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-200 italic leading-relaxed">
                      “{pkg.salesPlaybook.pitchHook}”
                    </p>
                  </div>
                </div>

                {/* Quebra de Objeções por Pacote */}
                {pkg.salesPlaybook.objections?.length > 0 && (
                  <div className="pt-2 border-t border-[#1E2D50]">
                    <button
                      type="button"
                      onClick={() => toggleObjections(pkg.code)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-300 hover:text-white py-1 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <ShieldQuestion className="w-4 h-4 text-[#00F5D4]" />
                        Objeções Comuns ({pkg.salesPlaybook.objections.length})
                      </span>
                      {objectionsExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {objectionsExpanded && (
                      <div className="mt-3 space-y-2.5">
                        {pkg.salesPlaybook.objections.map((obj, idx) => (
                          <div
                            key={idx}
                            className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-3 space-y-1 text-xs"
                          >
                            <p className="font-bold text-amber-300">
                              {obj.objection}
                            </p>
                            <p className="text-gray-300 leading-relaxed">
                              {obj.response}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
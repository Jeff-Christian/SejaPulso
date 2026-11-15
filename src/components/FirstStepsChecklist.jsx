import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";
import { CheckCircle2, Circle, ArrowRight, X, Rocket } from "lucide-react";

// Uso (Visão Geral do consultor):
//   <FirstStepsChecklist onNavigate={setActiveTab} />
// onNavigate recebe o id da aba do Sidebar: "pricing", "materials", "leads" ou "my-leads".
export const FirstStepsChecklist = ({ onNavigate }) => {
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await apiRequest("/leads/onboarding", "GET"));
    } catch {
      setData(null); // se falhar, simplesmente não mostra o checklist
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data || data.dismissed) return null;

  const allDone = data.doneCount === data.total;
  const pct = Math.round((data.doneCount / data.total) * 100);
  const nextId = data.steps.find((s) => !s.done)?.id;

  const go = async (step) => {
    // abrir o cardápio ou os materiais já conta como "visto"
    if (step.id === "pricing" || step.id === "materials") {
      try {
        await apiRequest("/leads/onboarding/seen", "POST", { item: step.id });
      } catch {
        /* não bloqueia a navegação */
      }
    }
    onNavigate?.(step.tab);
  };

  const dismiss = async () => {
    try {
      await apiRequest("/leads/onboarding/dismiss", "POST", {});
    } catch {
      /* se falhar, só esconde nesta sessão */
    }
    setData((d) => ({ ...d, dismissed: true }));
  };

  return (
    <section className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-4 font-sans">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-[#00F5D4]" />
            {allDone ? "Primeiros passos concluídos" : "Seus primeiros passos"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {allDone
              ? "Você já percorreu todo o caminho até a primeira venda."
              : `${data.doneCount} de ${data.total} concluídos. Siga a ordem para chegar à primeira venda.`}
          </p>
        </div>
        <button
          onClick={dismiss}
          title="Ocultar"
          className="p-2 rounded-xl border border-[#1E2D50] bg-[#0B132B] text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="h-1.5 rounded-full bg-[#0B132B] overflow-hidden">
        <div
          className="h-full bg-[#00F5D4] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="space-y-2">
        {data.steps.map((step) => {
          const isNext = step.id === nextId;
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
                isNext
                  ? "bg-[#00F5D4]/5 border-[#00F5D4]/40"
                  : "bg-[#0B132B] border-[#1E2D50]"
              }`}
            >
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-[#00F5D4] shrink-0" />
              ) : (
                <Circle className={`w-5 h-5 shrink-0 ${isNext ? "text-[#00F5D4]" : "text-gray-600"}`} />
              )}

              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-bold ${
                    step.done ? "text-gray-500 line-through" : "text-white"
                  }`}
                >
                  {step.title}
                </p>
                {!step.done && <p className="text-[11px] text-gray-400 mt-0.5">{step.hint}</p>}
              </div>

              {!step.done && (
                <button
                  onClick={() => go(step)}
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                    isNext
                      ? "bg-[#00F5D4] text-[#0B132B] hover:opacity-90"
                      : "bg-[#1E2D50] text-gray-200 hover:bg-[#253760]"
                  }`}
                >
                  Ir <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

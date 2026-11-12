import { useState, useEffect, useCallback } from "react";
import { Zap, MapPin, RefreshCw } from "lucide-react";
import { apiRequest } from "../services/api";

const toQuery = (params) =>
  new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null)
  ).toString();

const selectCls =
  "bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F5D4]";

export const PoolQueue = ({ onGoToMyLeads }) => {
  const [filters, setFilters] = useState({ state: "", city: "", cnae: "" });
  const [facets, setFacets] = useState({ states: [], cities: [], cnaes: [] });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null); // id do lead ou "next"
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const loadFacets = useCallback(async () => {
    try {
      setFacets(await apiRequest(`/leads/pool/facets?${toQuery({ state: filters.state })}`));
    } catch {
      /* os filtros são opcionais */
    }
  }, [filters.state]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiRequest(`/leads/pool?${toQuery({ ...filters, page })}`));
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { loadFacets(); }, [loadFacets]);
  useEffect(() => { loadList(); }, [loadList]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value, ...(key === "state" ? { city: "" } : {}) }));
    setPage(1);
  };

  const takeNext = async () => {
    setBusy("next");
    setFeedback({ type: "", text: "" });
    try {
      await apiRequest("/leads/pool/next", "POST", filters);
      onGoToMyLeads?.(); // o lead novo já aparece no topo da carteira
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setBusy(null);
    }
  };

  const reserve = async (lead) => {
    setBusy(lead.id);
    setFeedback({ type: "", text: "" });
    try {
      await apiRequest(`/leads/pool/${lead.id}/claim`, "POST", null);
      setFeedback({ type: "ok", text: `${lead.companyName} reservado e já está na sua carteira.` });
      loadList();
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
      loadList();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Fila de Leads</h2>
          <p className="text-xs text-gray-400 mt-1">
            {data.total.toLocaleString("pt-BR")} leads disponíveis. O contato aparece depois de reservar.
          </p>
        </div>
        <button
          onClick={takeNext}
          disabled={busy !== null || data.total === 0}
          className="bg-[#00F5D4] text-[#0B132B] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 shadow-lg"
        >
          <Zap className="w-4 h-4" />
          {busy === "next" ? "Reservando..." : "Próximo lead"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <select value={filters.state} onChange={(e) => setFilter("state", e.target.value)} className={selectCls}>
          <option value="">Todos os estados</option>
          {facets.states.map((s) => (
            <option key={s.value} value={s.value}>{s.value} ({s.count})</option>
          ))}
        </select>

        <select
          value={filters.city}
          onChange={(e) => setFilter("city", e.target.value)}
          disabled={!filters.state}
          className={`${selectCls} disabled:opacity-40`}
        >
          <option value="">{filters.state ? "Todas as cidades" : "Escolha um estado"}</option>
          {facets.cities.map((c) => (
            <option key={c.value} value={c.value}>{c.value} ({c.count})</option>
          ))}
        </select>

        <select value={filters.cnae} onChange={(e) => setFilter("cnae", e.target.value)} className={`${selectCls} md:flex-1`}>
          <option value="">Todos os segmentos</option>
          {facets.cnaes.map((c) => (
            <option key={c.value} value={c.value}>{c.label} ({c.count})</option>
          ))}
        </select>

        <button
          onClick={loadList}
          className="p-2 bg-[#0B132B] border border-[#1E2D50] text-gray-300 hover:text-[#00F5D4] rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {feedback.text && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            feedback.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.text}
          {feedback.type === "ok" && (
            <button onClick={onGoToMyLeads} className="ml-3 underline font-bold">
              Ver minha carteira
            </button>
          )}
        </div>
      )}

      {data.items.length === 0 ? (
        <div className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-8 text-center text-xs text-gray-400">
          {loading ? "Carregando fila..." : "Nenhum lead disponível com esses filtros."}
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((lead) => (
            <div
              key={lead.id}
              className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[#00F5D4]/40 transition"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {lead.tradeName || lead.companyName}
                </p>
                <p className="text-[11px] text-gray-400 truncate">
                  {lead.cnaeDescription || "Atividade não informada"}
                </p>
                <p className="text-[11px] text-[#00F5D4] font-mono flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {[lead.city, lead.state].filter(Boolean).join(" / ") || "Local não informado"}
                </p>
              </div>
              <button
                onClick={() => reserve(lead)}
                disabled={busy !== null}
                className="shrink-0 bg-[#1E2D50] hover:bg-[#253760] text-white px-4 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {busy === lead.id ? "Reservando..." : "Reservar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-[#1E2D50] disabled:opacity-40"
          >
            Anterior
          </button>
          <span>Página {page} de {data.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            disabled={page >= data.pages}
            className="px-3 py-1.5 rounded-lg border border-[#1E2D50] disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};
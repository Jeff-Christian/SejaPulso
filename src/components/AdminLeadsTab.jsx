import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";
import {
  Search,
  RefreshCw,
  X,
  Phone,
  Building2,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { OUTCOME_LABEL } from "./LeadTabulation";

const STATUS_LABEL = {
  LEAD_REGISTERED: "Cadastrado",
  POOL: "No pool",
  COMMERCIAL_CONTACT: "Em contato",
  WAITING_INTERNAL_REVIEW: "Em análise interna",
  PROPOSAL_SENT: "Proposta enviada",
  DEAL_CLOSED: "Venda fechada",
  DISCARDED: "Descartado",
};

const OUTCOME_ORDER = [
  "NO_ANSWER",
  "INVALID_NUMBER",
  "CALL_BACK",
  "CONTACTED",
  "MEETING_SCHEDULED",
  "NOT_INTERESTED",
  "AWAITING_CLOSING",
];

const outcomeLabel = (o) => OUTCOME_LABEL?.[o] || o || "Sem contato";

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const inputCls =
  "bg-[#0B132B] border border-[#1E2D50] text-gray-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#00F5D4]/60";

/* ---------------------------- Ficha 360° ---------------------------- */

const LeadDetailDrawer = ({ leadId, onClose, onChanged }) => {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(`/admin/leads/${leadId}`, "GET");
      setLead(data);
      setPhone(data.contactPhone || "");
    } catch (err) {
      setError(err.message || "Erro ao carregar a ficha.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const savePhone = async () => {
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await apiRequest(`/admin/leads/${leadId}/contact`, "PATCH", { contactPhone: phone });
      setNotice("Telefone atualizado.");
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message || "Erro ao salvar telefone.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <aside
        className="w-full max-w-lg h-full overflow-y-auto bg-[#111D3A] border-l border-[#1E2D50] p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-gray-400 uppercase">Ficha 360°</p>
            <h3 className="text-base font-bold text-white truncate">
              {lead?.companyName || "Carregando..."}
            </h3>
            {lead?.tradeName && <p className="text-xs text-gray-400">{lead.tradeName}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[#1E2D50] text-gray-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}
        {notice && (
          <div className="p-3 bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] rounded-xl text-xs">
            {notice}
          </div>
        )}

        {loading && !lead ? (
          <p className="text-xs text-gray-400 font-mono">Carregando ficha...</p>
        ) : lead ? (
          <>
            {/* Alertas */}
            {(lead.insights.reservedWithoutActivity || lead.insights.followUpOverdue) && (
              <div className="space-y-2">
                {lead.insights.reservedWithoutActivity && (
                  <p className="text-[11px] flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Reservado há {lead.insights.daysSinceClaim ?? 0} dia(s) sem nenhum contato registrado.
                  </p>
                )}
                {lead.insights.followUpOverdue && (
                  <p className="text-[11px] flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
                    <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                    Retorno vencido desde {fmt(lead.nextActionAt)}.
                  </p>
                )}
              </div>
            )}

            {/* Dados da empresa */}
            <section className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-4 space-y-2 text-xs">
              <p className="font-mono text-[#00F5D4]">CNPJ: {lead.cnpj || "—"}</p>
              <p className="text-gray-300">
                {[lead.city, lead.state].filter(Boolean).join(" / ") || "Local não informado"}
              </p>
              <p className="text-gray-400">
                CNAE: {lead.cnaeCode || "—"}
                {lead.cnaeDescription ? ` · ${lead.cnaeDescription}` : ""}
              </p>
              <p className="text-gray-400">
                Origem: {lead.source || "—"}
                {lead.importBatch ? ` · lote "${lead.importBatch.filename}" (${fmt(lead.importBatch.createdAt)})` : ""}
              </p>
              <p className="text-gray-400">
                Status: <span className="text-gray-200">{STATUS_LABEL[lead.status] || lead.status}</span>
                {" · "}Último resultado:{" "}
                <span className="text-gray-200">{outcomeLabel(lead.lastOutcome)}</span>
              </p>
            </section>

            {/* Contato (com correção de telefone) */}
            <section className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-4 space-y-3 text-xs">
              <p className="text-[10px] font-mono text-gray-400 uppercase">Contato</p>
              {lead.contactName && <p className="text-gray-300">{lead.contactName}</p>}
              {lead.contactEmail && <p className="text-gray-400">{lead.contactEmail}</p>}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="DDD + número"
                    className={`${inputCls} w-full pl-9`}
                  />
                </div>
                <button
                  onClick={savePhone}
                  disabled={saving}
                  className="bg-[#00F5D4] text-[#0B132B] font-bold px-4 rounded-xl text-xs hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
              {lead.lastOutcome === "INVALID_NUMBER" && (
                <p className="text-[11px] text-amber-400">
                  Marcado como número inválido. Ao salvar um novo telefone, o lead sai dessa fila.
                </p>
              )}
            </section>

            {/* Consultor e venda */}
            <section className="bg-[#0B132B] border border-[#1E2D50] rounded-xl p-4 space-y-2 text-xs">
              <p className="text-[10px] font-mono text-gray-400 uppercase">Responsável</p>
              {lead.affiliate ? (
                <>
                  <p className="text-white font-bold">
                    {lead.affiliate.responsible || lead.affiliate.companyName}
                  </p>
                  <p className="text-gray-400">{lead.affiliate.email}</p>
                  <p className="text-gray-400">
                    Reservado em {fmt(lead.claimedAt)} · {lead.insights.totalActivities} contato(s)
                  </p>
                </>
              ) : (
                <p className="text-gray-400 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" /> Livre no pool
                </p>
              )}
              {lead.deal && (
                <p className="text-emerald-400 pt-1">
                  Venda: {lead.deal.selectedPackage} · {lead.deal.finalValue} ({lead.deal.status})
                </p>
              )}
            </section>

            {/* Linha do tempo */}
            <section className="space-y-3">
              <p className="text-[10px] font-mono text-gray-400 uppercase">Linha do tempo</p>
              {lead.activities.length === 0 ? (
                <p className="text-xs text-gray-500 font-mono">Nenhum contato registrado ainda.</p>
              ) : (
                <ol className="space-y-3 border-l border-[#1E2D50] pl-4">
                  {lead.activities.map((a) => (
                    <li key={a.id} className="relative text-xs">
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#00F5D4]" />
                      <p className="text-white font-bold">{outcomeLabel(a.outcome)}</p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {fmt(a.createdAt)} · {a.affiliateName}
                      </p>
                      {a.reason && <p className="text-gray-300 mt-1">Motivo: {a.reason}</p>}
                      {a.note && <p className="text-gray-400 mt-1 whitespace-pre-wrap">{a.note}</p>}
                      {a.nextActionAt && (
                        <p className="text-purple-300 text-[11px] mt-1">
                          Próxima ação: {fmt(a.nextActionAt)}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : null}
      </aside>
    </div>
  );
};

/* ---------------------------- Aba de leads ---------------------------- */

export const AdminLeadsTab = () => {
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({
    outcome: "",
    status: "",
    affiliateId: "",
    state: "",
    cnae: "",
  });
  const [openId, setOpenId] = useState(null);

  // debounce da busca
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const fetchStats = useCallback(async () => {
    try {
      setStats(await apiRequest("/admin/leads/stats", "GET"));
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "25" });
      if (q) params.set("q", q);
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      setData(await apiRequest(`/admin/leads?${params.toString()}`, "GET"));
    } catch (err) {
      setError(err.message || "Erro ao carregar leads.");
    } finally {
      setLoading(false);
    }
  }, [page, q, filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchStats();
    apiRequest("/admin/affiliates/active", "GET")
      .then((list) => setAffiliates(list || []))
      .catch(() => {});
  }, [fetchStats]);

  const refreshAll = () => {
    fetchStats();
    fetchList();
  };

  const chip = (key, label, count) => {
    const active = filters.outcome === key;
    return (
      <button
        key={key || "all"}
        onClick={() => setFilter("outcome", active ? "" : key)}
        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${
          active
            ? "bg-[#00F5D4] text-[#0B132B] border-[#00F5D4]"
            : "bg-[#0B132B] text-gray-300 border-[#1E2D50] hover:border-[#00F5D4]/40"
        }`}
      >
        {label} <span className="font-mono opacity-80">{count ?? 0}</span>
      </button>
    );
  };

  return (
    <section className="bg-[#111D3A] rounded-2xl border border-[#1E2D50] p-6 shadow-xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00F5D4]" />
            Leads & Fichas
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {stats
              ? `${stats.total} leads · ${stats.free} livres no pool · ${stats.invalid} com número inválido`
              : "Carregando base..."}
          </p>
        </div>
        <button
          onClick={refreshAll}
          className="p-2 bg-[#0B132B] border border-[#1E2D50] text-gray-300 hover:text-[#00F5D4] rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Chips por resultado do último contato */}
      <div className="flex flex-wrap gap-2">
        {chip("NONE", "Sem contato", stats?.outcomes?.NONE)}
        {OUTCOME_ORDER.map((o) => chip(o, outcomeLabel(o), stats?.outcomes?.[o]))}
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="relative md:col-span-2">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por empresa ou CNPJ"
            className={`${inputCls} w-full pl-9`}
          />
        </div>
        <select
          value={filters.affiliateId}
          onChange={(e) => setFilter("affiliateId", e.target.value)}
          className={inputCls}
        >
          <option value="">Todos os consultores</option>
          <option value="NONE">Livres no pool</option>
          {affiliates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.responsible || a.companyName}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilter("status", e.target.value)}
          className={inputCls}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            value={filters.state}
            onChange={(e) => setFilter("state", e.target.value.slice(0, 2))}
            placeholder="UF"
            className={`${inputCls} w-16 uppercase`}
          />
          <input
            value={filters.cnae}
            onChange={(e) => setFilter("cnae", e.target.value)}
            placeholder="CNAE"
            className={`${inputCls} flex-1 min-w-0`}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Tabela */}
      {loading && data.items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 font-mono text-xs">Carregando leads...</div>
      ) : data.items.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-[#0B132B]/50 rounded-xl border border-[#1E2D50]/50 text-xs font-mono">
          Nenhum lead encontrado com esses filtros.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E2D50] text-gray-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-4">Empresa / CNPJ</th>
                <th className="py-3 px-4">Local</th>
                <th className="py-3 px-4">Consultor</th>
                <th className="py-3 px-4">Último resultado</th>
                <th className="py-3 px-4">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2D50]">
              {data.items.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setOpenId(l.id)}
                  className="hover:bg-[#0B132B]/50 transition cursor-pointer"
                >
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{l.companyName}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{l.cnpj || "—"}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {[l.city, l.state].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="py-3 px-4 text-gray-300">
                    {l.affiliate ? (
                      l.affiliate.responsible || l.affiliate.companyName
                    ) : (
                      <span className="text-gray-500">Livre</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1E2D50] text-gray-200">
                      {outcomeLabel(l.lastOutcome)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 font-mono">{fmt(l.lastActivityAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="font-mono">
          {data.total} resultado(s) · página {data.page || page} de {data.totalPages}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-xl border border-[#1E2D50] bg-[#0B132B] disabled:opacity-40 hover:text-[#00F5D4]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-xl border border-[#1E2D50] bg-[#0B132B] disabled:opacity-40 hover:text-[#00F5D4]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {openId && (
        <LeadDetailDrawer
          leadId={openId}
          onClose={() => setOpenId(null)}
          onChanged={refreshAll}
        />
      )}
    </section>
  );
};

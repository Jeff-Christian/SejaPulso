import { useState } from "react";
import { apiRequest } from "../services/api";

export const OUTCOME_LABEL = {
  NO_ANSWER: "Não atendeu",
  CALL_BACK: "Retornar depois",
  CONTACTED: "Contato realizado",
  MEETING_SCHEDULED: "Reunião agendada",
  AWAITING_CLOSING: "Aguardando fechamento",
};

const REASONS = [
  ["HAS_PROVIDER", "Já tem fornecedor ou estrutura própria"],
  ["NO_BUDGET", "Sem orçamento"],
  ["NOT_DECISION_MAKER", "Falei com quem não decide"],
  ["NO_NEED", "Não precisa do serviço"],
  ["OTHER", "Outro motivo"],
];

const ACTIONS = [
  { key: "NO_ANSWER", label: "Não atendeu", cls: "bg-gray-500/10 text-gray-300 border-gray-500/30 hover:bg-gray-500/20" },
  { key: "CALL_BACK", label: "Retornar depois", needsDate: true, cls: "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20" },
  { key: "CONTACTED", label: "Contato realizado", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" },
  { key: "MEETING_SCHEDULED", label: "Reunião agendada", needsDate: true, cls: "bg-purple-500/10 text-purple-300 border-purple-500/30 hover:bg-purple-500/20" },
  { key: "AWAITING_CLOSING", label: "Aguardando fechamento", cls: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/20" },
  { key: "NOT_INTERESTED", label: "Sem interesse", needsReason: true, warn: "O lead sai da sua carteira e volta ao pool, indisponível por 90 dias.", cls: "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20" },
  { key: "INVALID_NUMBER", label: "Número inválido", confirm: true, warn: "O lead sai da sua carteira e vai para revisão do time.", cls: "bg-orange-500/10 text-orange-300 border-orange-500/30 hover:bg-orange-500/20" },
];

const fieldCls =
  "w-full bg-[#111D3A] border border-[#1E2D50] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F5D4]";

export const LeadTabulation = ({ lead, onDone, onReadyToClose }) => {
  const [open, setOpen] = useState(null);
  const [when, setWhen] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setOpen(null); setWhen(""); setReason(""); setNote(""); setError("");
  };

  const submit = async (action) => {
    if (action.needsDate && !when) return setError("Escolha a data e a hora.");
    if (action.needsReason && !reason) return setError("Escolha o motivo.");

    setSaving(true);
    setError("");
    try {
      const body = { outcome: action.key };
      if (note.trim()) body.note = note.trim();
      if (action.needsDate) body.nextActionAt = new Date(when).toISOString();
      if (action.needsReason) body.reason = reason;

      const result = await apiRequest(`/leads/${lead.id}/tabulate`, "POST", body);
      reset();
      onDone?.(result);
      if (action.key === "AWAITING_CLOSING") onReadyToClose?.(result.lead);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const click = (action) => {
    if (action.needsDate || action.needsReason || action.confirm) {
      setOpen(action);
      setError("");
    } else {
      submit(action);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            onClick={() => click(a)}
            disabled={saving}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition disabled:opacity-50 ${a.cls}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="bg-[#111D3A] border border-[#1E2D50] rounded-xl p-3 space-y-2">
          <p className="text-[11px] font-bold text-white">{open.label}</p>

          {open.warn && <p className="text-[11px] text-amber-400">{open.warn}</p>}

          {open.needsDate && (
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={fieldCls}
            />
          )}

          {open.needsReason && (
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls}>
              <option value="">Motivo da recusa...</option>
              {REASONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}

          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            className={fieldCls}
          />

          {error && <p className="text-[11px] text-red-400">{error}</p>}

          <div className="flex justify-end gap-2">
            <button onClick={reset} className="px-3 py-1.5 rounded-lg text-[11px] text-gray-400 border border-[#1E2D50]">
              Cancelar
            </button>
            <button
              onClick={() => submit(open)}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#00F5D4] text-[#0B132B] disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {!open && error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
};
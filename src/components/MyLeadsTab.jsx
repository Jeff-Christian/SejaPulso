import React, { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";

import { 
  Building2, 
  Phone, 
  RefreshCw, 
  CalendarClock, 
  Sparkles 
} from "lucide-react"; 
import { PitchModal } from "./PitchModal";

import { SalesHandoverModal } from "./SalesHandoverModal";
import { LeadTabulation, OUTCOME_LABEL } from "./LeadTabulation";

const fmt = (d) =>
  new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });

const urgency = (l) => (l.nextActionAt ? new Date(l.nextActionAt).getTime() : Infinity);

export const MyLeadsTab = () => {
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [pitchLead, setPitchLead] = useState(null);

  const fetchMyLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/leads/my-leads", "GET");

      // Mantém só negociações ativas (o restante vive em "Vendas & Notas Fiscais")
      const active = (data || []).filter(
        (lead) => lead.status !== "WAITING_INTERNAL_REVIEW" && lead.status !== "DEAL_CLOSED",
      );

      // Retornos agendados primeiro (vencidos no topo); depois os mais recentes
      active.sort(
        (a, b) => urgency(a) - urgency(b) || new Date(b.claimedAt) - new Date(a.claimedAt),
      );
      setMyLeads(active);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyLeads();
  }, [fetchMyLeads]);

  const openHandover = (lead) => {
    setSelectedLead(lead);
    setIsHandoverModalOpen(true);
  };

  return (
    <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00F5D4]" />
            Meus Agendamentos & Carteira B2B
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Registre cada contato para manter a carteira organizada.
          </p>
        </div>
        <button
          onClick={fetchMyLeads}
          className="p-2 bg-[#0B132B] border border-[#1E2D50] text-gray-300 hover:text-[#00F5D4] rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && myLeads.length === 0 ? (
        <div className="p-8 text-center text-gray-400 font-mono text-xs">Carregando agendamentos...</div>
      ) : myLeads.length === 0 ? (
        <div className="bg-[#0B132B] border border-[#1E2D50] p-8 rounded-xl text-center space-y-2">
          <p className="text-xs text-gray-400">Sua carteira está vazia.</p>
          <p className="text-[11px] text-gray-500">
            Vá em "Verificação & Pool B2B" e clique em "Próximo lead" para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {myLeads.map((lead) => {
            const overdue = lead.nextActionAt && new Date(lead.nextActionAt) < new Date();
            const phoneDigits = (lead.contactPhone || "").replace(/\D/g, "");

            return (
              <div
                key={lead.id}
                className="bg-[#0B132B] border border-[#1E2D50] p-5 rounded-xl space-y-4 hover:border-[#00F5D4]/40 transition"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{lead.companyName}</h3>
                    <p className="text-[11px] font-mono text-[#00F5D4]">CNPJ: {lead.cnpj}</p>
                    {lead.contactPhone && (
                      <p className="text-[11px] font-mono text-gray-300 mt-0.5">{lead.contactPhone}</p>
                    )}
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1E2D50] text-gray-200 border border-[#1E2D50]">
                    {OUTCOME_LABEL[lead.lastOutcome] || "Novo na carteira"}
                  </span>
                </div>

                {lead.nextActionAt && (
                  <p
                    className={`text-[11px] font-mono flex items-center gap-1.5 ${
                      overdue ? "text-red-400" : "text-purple-300"
                    }`}
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    {overdue ? "Retorno vencido: " : "Próximo contato: "}
                    {fmt(lead.nextActionAt)}
                  </p>
                )}

                <div className="flex gap-2">
                  {phoneDigits && (
                    <a
                      href={`https://wa.me/55${phoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#1E2D50] hover:bg-[#253760] text-white py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#00F5D4]" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setPitchLead(lead)}
                    className="flex-1 bg-[#1E2D50] hover:bg-[#253760] text-white py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>Ver abordagem</span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#1E2D50]">
                  <LeadTabulation lead={lead} onDone={fetchMyLeads} onReadyToClose={openHandover} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SalesHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        lead={selectedLead}
        onSuccess={fetchMyLeads}
      />

      <PitchModal 
        lead={pitchLead} 
        isOpen={!!pitchLead} 
        onClose={() => setPitchLead(null)} 
      />

    </div>
  );
};
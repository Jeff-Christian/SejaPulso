import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { Building2, Phone, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { SalesHandoverModal } from "./SalesHandoverModal";

export const MyLeadsTab = () => {
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado de controle do Modal
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const fetchMyLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = await apiRequest("/leads/my-leads", "GET", null, token);

      // 🟢 FILTRO: Mantém em "Meus Agendamentos" APENAS leads que estão em negociação ativa
      const activeNegotiations = (data || []).filter(
        (lead) =>
          lead.status !== "WAITING_INTERNAL_REVIEW" &&
          lead.status !== "DEAL_CLOSED",
      );

      setMyLeads(activeNegotiations);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, []);

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
            Leads reservados em fase de negociação comercial.
          </p>
        </div>
        <button
          onClick={fetchMyLeads}
          className="p-2 bg-[#0B132B] border border-[#1E2D50] text-gray-300 hover:text-[#00F5D4] rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 font-mono text-xs">
          Carregando agendamentos...
        </div>
      ) : myLeads.length === 0 ? (
        <div className="bg-[#0B132B] border border-[#1E2D50] p-8 rounded-xl text-center space-y-2">
          <p className="text-xs text-gray-400">
            Nenhuma negociação em andamento nesta aba.
          </p>
          <p className="text-[11px] text-gray-500">
            Leads enviados para fechamento migraram para a aba "Vendas & Notas
            Fiscais".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-[#0B132B] border border-[#1E2D50] p-5 rounded-xl space-y-4 hover:border-[#00F5D4]/40 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {lead.companyName}
                  </h3>
                  <p className="text-[11px] font-mono text-[#00F5D4]">
                    CNPJ: {lead.cnpj}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Negociação Ativa
                </span>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 border-t border-[#1E2D50] flex items-center gap-2">
                {lead.contactPhone && (
                  <a
                    href={`https://wa.me/55${lead.contactPhone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#1E2D50] hover:bg-[#253760] text-white py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => openHandover(lead)}
                  className="flex-1 bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fechar Venda</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Fechamento */}
      <SalesHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        lead={selectedLead}
        onSuccess={() => {
          fetchMyLeads(); // Remove o card desta aba assim que o handover é enviado
        }}
      />
    </div>
  );
};

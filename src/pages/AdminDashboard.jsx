import React, { useState, useEffect, useCallback } from "react";
import { apiRequest, clearAuthSession } from '../services/api';
import { Sidebar } from "../components/Sidebar";
import { AddAffiliateModal } from "../components/AddAffiliateModal";
import { EditAffiliateModal } from "../components/EditAffiliateModal";
import { ImportLeadsTab } from "../components/ImportLeadsTab";
import {
  ShieldCheck,
  Users,
  RefreshCw,
  LogOut,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import { EditDealModal } from "../components/EditDealModal";

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("pending");

  // Estados para dados dos consultores e vendas
  const [pendingAffiliates, setPendingAffiliates] = useState([]);
  const [activeAffiliates, setActiveAffiliates] = useState([]);
  const [pendingDeals, setPendingDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDealToEdit, setSelectedDealToEdit] = useState(null);
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Token de autenticação não encontrado. Faça login novamente.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "pending") {
        const data = await apiRequest(
          "/admin/affiliates/pending",
          "GET",
          null,
          token,
        );
        setPendingAffiliates(data || []);
      } else if (activeTab === "affiliates_list") {
        const data = await apiRequest(
          "/admin/affiliates/active",
          "GET",
          null,
          token,
        );
        setActiveAffiliates(data || []);
      } else if (activeTab === "financial") {
        const data = await apiRequest(
          "/admin/deals/pending",
          "GET",
          null,
          token,
        );
        setPendingDeals(data || []);
      }
    } catch (err) {
      setError(err.message || "Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    clearAuthSession();
    window.location.replace("/login");
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setActionSuccess("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      await apiRequest(
        `/admin/affiliates/${id}/status`,
        "PATCH",
        { status: newStatus },
        token,
      );
      setActionSuccess(`Status alterado com sucesso!`);
      fetchData();
    } catch (err) {
      setError(err.message || "Erro ao atualizar status.");
    }
  };

  const handleDeleteAffiliate = async (id, companyName) => {
    if (
      window.confirm(
        `Deseja realmente remover o consultor "${companyName}" do sistema?`,
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        await apiRequest(`/admin/affiliates/${id}`, "DELETE", null, token);
        setActionSuccess("Consultor removido com sucesso!");
        fetchData();
      } catch (err) {
        setError(err.message || "Erro ao remover consultor.");
      }
    }
  };

  const handleOpenEditModal = (id) => {
    setSelectedAffiliateId(id);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B132B] text-white font-sans selection:bg-[#00F5D4] selection:text-black">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[#111D3A] border-b border-[#1E2D50] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold text-white">
              Painel de Gestão da Pulso Tech
            </h1>
            <p className="text-[11px] text-gray-400 font-mono">
              Ambiente Administrativo Central
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              className="flex items-center space-x-1.5 bg-[#0B132B] hover:bg-[#1E2D50] text-gray-300 text-xs px-3 py-2 rounded-xl border border-[#1E2D50] transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-red-400 px-3 py-2 rounded-xl border border-[#1E2D50] hover:border-red-500/30 transition bg-[#0B132B]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] rounded-xl text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* ABA 1: APROVAÇÕES PENDENTES DE CONSULTORES */}
          {activeTab === "pending" && (
            <section className="bg-[#111D3A] rounded-2xl border border-[#1E2D50] p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00F5D4]" />
                Cadastros Aguardando Análise (CNPJs Pendentes)
              </h2>

              {loading ? (
                <div className="text-center py-10 text-gray-400 font-mono text-xs">
                  Carregando do PostgreSQL...
                </div>
              ) : pendingAffiliates.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-[#0B132B]/50 rounded-xl border border-[#1E2D50]/50 text-xs font-mono">
                  Nenhum consultor aguardando aprovação no momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2D50] text-gray-400 uppercase font-mono text-[10px]">
                        <th className="py-3 px-4">Razão Social</th>
                        <th className="py-3 px-4">CNPJ</th>
                        <th className="py-3 px-4">Responsável / E-mail</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2D50]">
                      {pendingAffiliates.map((affiliate) => (
                        <tr
                          key={affiliate.id}
                          className="hover:bg-[#0B132B]/50 transition"
                        >
                          <td className="py-3.5 px-4 font-bold">
                            {affiliate.companyName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-gray-300">
                            {affiliate.cnpj}
                          </td>
                          <td className="py-3.5 px-4">
                            <div>{affiliate.responsible}</div>
                            <div className="text-[10px] text-gray-400">
                              {affiliate.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() =>
                                handleUpdateStatus(affiliate.id, "APPROVED")
                              }
                              className="bg-[#00F5D4] text-[#0B132B] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(affiliate.id, "BLOCKED")
                              }
                              className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition"
                            >
                              Bloquear
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ABA 2: CONSULTORES ATIVOS */}
          {activeTab === "affiliates_list" && (
            <section className="bg-[#111D3A] rounded-2xl border border-[#1E2D50] p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00F5D4]" />
                Lista de Consultores Ativos
              </h2>

              {loading ? (
                <div className="text-center py-10 text-gray-400 font-mono text-xs">
                  Carregando consultores ativos...
                </div>
              ) : activeAffiliates.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-[#0B132B]/50 rounded-xl border border-[#1E2D50]/50 text-xs font-mono">
                  Nenhum consultor ativo encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2D50] text-gray-400 uppercase font-mono text-[10px]">
                        <th className="py-3 px-4">Razão Social / CNPJ</th>
                        <th className="py-3 px-4">Responsável</th>
                        <th className="py-3 px-4">Tier Atual</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2D50]">
                      {activeAffiliates.map((affiliate) => (
                        <tr
                          key={affiliate.id}
                          className="hover:bg-[#0B132B]/50 transition"
                        >
                          <td className="py-3.5 px-4 font-bold">
                            {affiliate.companyName}
                            <span className="block text-[10px] text-gray-400 font-mono">
                              {affiliate.cnpj}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div>{affiliate.responsible}</div>
                            <div className="text-[10px] text-gray-400">
                              {affiliate.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                              {affiliate.tier?.name || "Tier 1"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(affiliate.id)}
                              className="bg-[#0B132B] hover:bg-[#1E2D50] text-white border border-[#1E2D50] px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 font-semibold"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#00F5D4]" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteAffiliate(
                                  affiliate.id,
                                  affiliate.companyName,
                                )
                              }
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 p-2 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ABA 3: VALIDAÇÃO DE VENDAS & COBRANÇA ASAAS */}
          {activeTab === "financial" && (
            <section className="bg-[#111D3A] rounded-2xl border border-[#1E2D50] p-6 shadow-xl space-y-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#00F5D4]" />
                  Validação Financeira & Emissão de Faturas
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Confira as vendas enviadas pelos consultores. Clique em
                  "Finalizar Venda" para alinhar os termos com o cliente e
                  emitir a cobrança do sinal (50%).
                </p>
              </div>

              {loading ? (
                <div className="text-center py-10 text-gray-400 font-mono text-xs">
                  Carregando vendas pendentes...
                </div>
              ) : pendingDeals.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-[#0B132B]/50 rounded-xl border border-[#1E2D50]/50 text-xs font-mono">
                  Nenhuma venda aguardando validação no momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#1E2D50] text-gray-400 uppercase font-mono text-[10px]">
                        <th className="py-3 px-4">Consultor (Origem)</th>
                        <th className="py-3 px-4">Cliente / Empresa</th>
                        <th className="py-3 px-4">Pacote</th>
                        <th className="py-3 px-4">Valor Negociado</th>
                        <th className="py-3 px-4">Briefing / Observações</th>
                        <th className="py-3 px-4 text-right">
                          Ação Operacional
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2D50]">
                      {pendingDeals.map((deal) => (
                        <tr
                          key={deal.id}
                          className="hover:bg-[#0B132B]/50 transition"
                        >
                          {/* Consultor de origem */}
                          <td className="py-3.5 px-4 font-medium text-white">
                            <p className="font-bold text-[#00F5D4]">
                              {deal.affiliate?.companyName ||
                                deal.affiliate?.responsible ||
                                "Consultor"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              E-mail: {deal.affiliate?.email}
                            </p>
                          </td>

                          {/* Cliente negociado */}
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white">
                              {deal.lead?.companyName || "Empresa Registrada"}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              CNPJ: {deal.lead?.cnpj}
                            </p>
                          </td>

                          {/* Pacote contratado */}
                          <td className="py-3.5 px-4 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                deal.selectedPackage === "ENTERPRISE"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                              }`}
                            >
                              {deal.selectedPackage}
                            </span>
                          </td>

                          {/* Valor final */}
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                            {deal.finalValue}
                          </td>

                          {/* Observações do briefing */}
                          <td
                            className="py-3.5 px-4 text-gray-300 max-w-xs truncate"
                            title={deal.offerDetails}
                          >
                            {deal.offerDetails || "Sem observações"}
                          </td>

                          {/* Coluna de Ações com Trava de Botão */}
                          <td className="py-3.5 px-4 text-right">
                            {deal.asaasPaymentId ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5 cursor-not-allowed opacity-80">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Cobrança Gerada</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedDealToEdit(deal);
                                  setIsEditDealModalOpen(true);
                                }}
                                className="bg-[#00F5D4] text-[#0B132B] font-bold px-3.5 py-1.5 rounded-lg text-xs hover:opacity-90 transition shadow-md"
                              >
                                Finalizar Venda
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Modal de Alinhamento e Disparo de Cobrança */}
              <EditDealModal
                deal={selectedDealToEdit}
                isOpen={isEditDealModalOpen}
                onClose={() => setIsEditDealModalOpen(false)}
                onSuccess={(msg) => {
                  setActionSuccess(msg);
                  fetchData();
                }}
              />
            </section>
          )}
          
          {/* ABA 4: IMPORTAÇÃO DE LEADS */}
          {activeTab === "admin_pool" && <ImportLeadsTab />}
        </main>
      </div>

      <AddAffiliateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setActionSuccess("Consultor criado com sucesso!");
          fetchData();
        }}
      />

      <EditAffiliateModal
        affiliateId={selectedAffiliateId}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setActionSuccess("Dados do consultor atualizados!");
          fetchData();
        }}
      />
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { AddAffiliateModal } from '../components/AddAffiliateModal';
import { EditAffiliateModal } from '../components/EditAffiliateModal';
import { 
  ShieldCheck, 
  Users, 
  RefreshCw, 
  LogOut, 
  Edit, 
  Trash2, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  
  // Estados para dados dos consultores
  const [pendingAffiliates, setPendingAffiliates] = useState([]);
  const [activeAffiliates, setActiveAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Estados dos Modais
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Função ÚNICA e Memorizada de Busca de Dados
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Token de autenticação não encontrado. Faça login novamente.');
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'pending') {
        const data = await apiRequest('/admin/affiliates/pending', 'GET', null, token);
        setPendingAffiliates(data);
      } else if (activeTab === 'affiliates_list') {
        const data = await apiRequest('/admin/affiliates/active', 'GET', null, token);
        setActiveAffiliates(data);
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar dados do servidor.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Executa o fetchData sempre que a aba selecionada na Sidebar mudar
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleUpdateStatus = async (id, newStatus) => {
    setActionSuccess('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      await apiRequest(`/admin/affiliates/${id}/status`, 'PATCH', { status: newStatus }, token);
      setActionSuccess(`Status alterado com sucesso!`);
      fetchData(); // Recarrega os dados atualizados
    } catch (err) {
      setError(err.message || 'Erro ao atualizar status.');
    }
  };

  const handleDeleteAffiliate = async (id, companyName) => {
    if (window.confirm(`Deseja realmente remover o consultor "${companyName}" do sistema?`)) {
      try {
        const token = localStorage.getItem('token');
        await apiRequest(`/admin/affiliates/${id}`, 'DELETE', null, token);
        setActionSuccess('Consultor removido com sucesso!');
        fetchData();
      } catch (err) {
        setError(err.message || 'Erro ao remover consultor.');
      }
    }
  };

  const handleOpenEditModal = (id) => {
    setSelectedAffiliateId(id);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B132B] text-white font-sans selection:bg-[#00F5D4] selection:text-black">
      
      {/* 1. Componente de Barra Lateral (Sidebar) */}
      <Sidebar 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onOpenAddModal={() => setIsAddModalOpen(true)} 
      />

      {/* 2. Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Superior do Painel Admin */}
        <header className="bg-[#111D3A] border-b border-[#1E2D50] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
          <div>
            <h1 className="text-base font-bold text-white">Painel de Gestão da Pulso Tech</h1>
            <p className="text-[11px] text-gray-400 font-mono">Ambiente Administrativo Central</p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              className="flex items-center space-x-1.5 bg-[#0B132B] hover:bg-[#1E2D50] text-gray-300 text-xs px-3 py-2 rounded-xl border border-[#1E2D50] transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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

        {/* Conteúdo Dinâmico das Abas */}
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

          {/* ABA 1: APROVAÇÕES PENDENTES */}
          {activeTab === 'pending' && (
            <section className="bg-[#111D3A] rounded-2xl border border-[#1E2D50] p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00F5D4]" />
                Cadastros Aguardando Análise (CNPJs Pendentes)
              </h2>

              {loading ? (
                <div className="text-center py-10 text-gray-400 font-mono text-xs">Carregando do PostgreSQL...</div>
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
                        <tr key={affiliate.id} className="hover:bg-[#0B132B]/50 transition">
                          <td className="py-3.5 px-4 font-bold">{affiliate.companyName}</td>
                          <td className="py-3.5 px-4 font-mono text-gray-300">{affiliate.cnpj}</td>
                          <td className="py-3.5 px-4">
                            <div>{affiliate.responsible}</div>
                            <div className="text-[10px] text-gray-400">{affiliate.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(affiliate.id, 'APPROVED')}
                              className="bg-[#00F5D4] text-[#0B132B] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(affiliate.id, 'BLOCKED')}
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
          {activeTab === 'affiliates_list' && (
            <section className="bg-[#111D3A] rounded-2xl border border-[#1E2D50] p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00F5D4]" />
                Lista de Consultores Ativos
              </h2>

              {loading ? (
                <div className="text-center py-10 text-gray-400 font-mono text-xs">Carregando consultores ativos...</div>
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
                        <tr key={affiliate.id} className="hover:bg-[#0B132B]/50 transition">
                          <td className="py-3.5 px-4 font-bold">
                            {affiliate.companyName}
                            <span className="block text-[10px] text-gray-400 font-mono">{affiliate.cnpj}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div>{affiliate.responsible}</div>
                            <div className="text-[10px] text-gray-400">{affiliate.email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-[#00F5D4]/10 text-[#00F5D4] border border-[#00F5D4]/30 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono">
                              {affiliate.tier?.name || 'Tier 1'}
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
                              onClick={() => handleDeleteAffiliate(affiliate.id, affiliate.companyName)}
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

        </main>
      </div>

      {/* Modal de Criação Direta */}
      <AddAffiliateModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => {
          setActionSuccess('Consultor criado com sucesso!');
          fetchData();
        }} 
      />

      {/* Modal de Edição Detalhada */}
      <EditAffiliateModal 
        affiliateId={selectedAffiliateId} 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={() => {
          setActionSuccess('Dados do consultor atualizados!');
          fetchData();
        }} 
      />

    </div>
  );
};
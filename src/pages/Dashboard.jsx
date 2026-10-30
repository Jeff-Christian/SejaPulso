import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Award, 
  Upload, 
  CheckCircle, 
  Clock,
  Search,
  FileText,
  Download
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { HeaderAffiliate } from '../components/HeaderAffiliate';
import { LeadCard } from '../components/LeadCard';
import { MyLeadsTab } from '../components/MyLeadsTab';
import { apiRequest } from '../services/api';

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Estados para busca de CNPJ e exibição do LeadCard
  const [searchCnpj, setSearchCnpj] = useState('');
  const [leadResult, setLeadResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const [commissions] = useState(user.commissions || []);

  const handleSearchCnpj = async (e) => {
  e.preventDefault();
  if (!searchCnpj.trim()) return;

  // 🔴 REMOVE PONTOS, BARRAS E TRAÇOS ANTES DO DISPARO
  const cleanCnpj = searchCnpj.replace(/\D/g, '');

    if (cleanCnpj.length !== 14) {
      setSearchError('Por favor, digite um CNPJ válido com 14 dígitos.');
      return;
    }

    setSearching(true);
    setSearchError('');
    setLeadResult(null);

    try {
      const token = localStorage.getItem('token');
      
      // 🟢 Dispara a requisição apenas com números na URL
      const data = await apiRequest(`/leads/consult/${cleanCnpj}`, 'GET', null, token);
      setLeadResult(data);
    } catch (err) {
      setSearchError(err.message || 'Erro ao consultar CNPJ na Receita Federal.');
    } finally {
      setSearching(false);
    }
  };

  const affiliateData = {
    tierName: user.tier?.name || 'Tier 1 — Bronze',
    commissionRate: user.tier?.commissionRate ? `${user.tier.commissionRate}%` : '10%',
    dealsCount: user.deals?.length || 0,
    nextTierTarget: 4,
    balanceAvailable: user.financialSummary?.balanceAvailable || 'R$ 0,00',
    balancePending: user.financialSummary?.balancePending || 'R$ 0,00'
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B132B] text-white font-sans selection:bg-[#00F5D4] selection:text-black">
      
      {/* 1. Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Superior */}
        <HeaderAffiliate />

        {/* Conteúdo Dinâmico */}
        <main className="p-6 space-y-8 flex-1 overflow-y-auto">

          {/* ================= TAB 1: VISÃO GERAL & KPIS ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-xs font-mono text-[#00F5D4] uppercase tracking-wider">Desempenho da Parceria</span>
                    <h2 className="text-2xl font-black text-white mt-1">Nível de Comissionamento Progressivo</h2>
                    <p className="text-xs text-gray-400">Aumente sua margem conforme fecha novos negócios no mês corrente.</p>
                  </div>
                  <div className="bg-[#0B132B] border border-[#1E2D50] px-4 py-3 rounded-xl flex items-center space-x-3">
                    <div className="p-2 bg-[#00F5D4]/10 rounded-lg text-[#00F5D4]">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono text-gray-400">Faixa Atual</p>
                      <p className="text-sm font-bold text-white">
                        {affiliateData.tierName} <span className="text-[#00F5D4] font-mono">({affiliateData.commissionRate})</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Vendas do Mês: <strong className="text-white">{affiliateData.dealsCount} Contratos</strong></span>
                    <span className="text-[#00F5D4]">
                      Faltam {Math.max(0, affiliateData.nextTierTarget - affiliateData.dealsCount)} vendas para subir de nível
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#0B132B] rounded-full border border-[#1E2D50] overflow-hidden p-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00F5D4] to-[#0EA5E9] rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (affiliateData.dealsCount / affiliateData.nextTierTarget) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-mono uppercase">Saldo Liberado (PIX)</span>
                    <DollarSign className="w-4 h-4 text-[#00F5D4]" />
                  </div>
                  <p className="text-3xl font-black text-[#00F5D4] font-mono">{affiliateData.balanceAvailable}</p>
                  <p className="text-[11px] text-gray-400">Sinal quitado pelo cliente e NF validada.</p>
                </div>

                <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-mono uppercase">Saldo Pendente</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-white font-mono">{affiliateData.balancePending}</p>
                  <p className="text-[11px] text-gray-400">Aguardando recebimento do sinal via Asaas.</p>
                </div>

                <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-mono uppercase">Vendas Fechadas</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white font-mono">{affiliateData.dealsCount} vendas</p>
                  <p className="text-[11px] text-gray-400">Histórico total acumulado no painel.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: POOL DE LEADS B2B ================= */}
          {activeTab === 'leads' && (
            <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Verificação de CNPJ Ativo & Reserva de Leads (Pool)</h2>
                <p className="text-xs text-gray-400 mt-1">Consulte a paternidade ou reserve CNPJs ativas da base central sem conflito de canal.</p>
              </div>

              {/* Form de Busca por CNPJ */}
              <form onSubmit={handleSearchCnpj} className="bg-[#0B132B] border border-[#1E2D50] p-4 rounded-xl flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                  <input 
                    type="text" 
                    value={searchCnpj}
                    onChange={(e) => setSearchCnpj(e.target.value)}
                    placeholder="Digite o CNPJ da empresa para consultar..." 
                    className="w-full bg-[#111D3A] border border-[#1E2D50] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#00F5D4]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={searching}
                  className="bg-[#00F5D4] text-[#0B132B] px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition shrink-0 disabled:opacity-50"
                >
                  {searching ? 'Consultando...' : 'Consultar Paternidade'}
                </button>
              </form>

              {/* Exibição de Erros de Busca */}
              {searchError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
                  {searchError}
                </div>
              )}

              {/* RENDERIZAÇÃO DO COMPONENTE LEAD CARD */}
              {leadResult && (
                <div className="pt-2">
                  <LeadCard 
                    leadData={leadResult} 
                    onLeadClaimed={() => {
                      // Opcional: Recarregar ou limpar estado após a reserva
                      setLeadResult(null);
                      setSearchCnpj('');
                    }} 
                  />
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: MEUS LEADS RESERVADOS ================= */}
            {activeTab === 'my-leads' && (
              <MyLeadsTab />
          )}

          {/* ================= TAB 4: VENDAS & NOTAS FISCAIS ================= */}
          {activeTab === 'sales' && (
            <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Minhas Comissões & Saques</h2>
                <p className="text-xs text-gray-400">Anexe sua Nota Fiscal (PDF/XML) para liberar o recebimento via Pix</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1E2D50] text-[11px] font-mono text-gray-400 uppercase">
                      <th className="py-3 px-4">Cliente / Contrato</th>
                      <th className="py-3 px-4">Valor Fechado</th>
                      <th className="py-3 px-4">Sua Comissão</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E2D50] text-xs">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                          Nenhuma comissão registrada para este consultor.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((item) => (
                        <tr key={item.id} className="hover:bg-[#0B132B]/50 transition-colors">
                          <td className="py-4 px-4">
                            <p className="font-bold text-white">{item.client || item.lead?.companyName || 'Cliente'}</p>
                            <p className="text-[10px] text-gray-400">{item.service || 'Serviço B2B'}</p>
                          </td>
                          <td className="py-4 px-4 font-mono text-gray-300">{item.dealValue || 'R$ 0,00'}</td>
                          <td className="py-4 px-4 font-mono font-bold text-[#00F5D4]">{item.commissionValue || 'R$ 0,00'}</td>
                          <td className="py-4 px-4">
                            {item.status === 'WAITING_INVOICE' ? (
                              <span className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[10px] border border-amber-500/20">
                                <Clock className="w-3 h-3" />
                                <span>Aguardando NF</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3" />
                                <span>Pago via Pix</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {item.status === 'WAITING_INVOICE' ? (
                              <label className="inline-flex items-center space-x-1.5 bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer">
                                <Upload className="w-3.5 h-3.5" />
                                <span>Anexar NF</span>
                                <input type="file" className="hidden" />
                              </label>
                            ) : (
                              <span className="text-[11px] text-gray-500 font-mono">Concluído</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 4: CARDÁPIO DE SERVIÇOS ================= */}
          {activeTab === 'pricing' && (
            <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Cardápio de Serviços & Pacotes Padronizados</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0B132B] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <span className="text-[10px] font-mono text-[#00F5D4] bg-[#00F5D4]/10 px-2.5 py-1 rounded">Landing Page Start</span>
                  <p className="text-2xl font-black font-mono text-white mt-2">R$ 1.500,00</p>
                  <p className="text-xs text-gray-400">Página única focada em conversão e otimizada para anúncios.</p>
                </div>
                <div className="bg-[#0B132B] border border-[#00F5D4]/40 p-6 rounded-2xl space-y-3">
                  <span className="text-[10px] font-mono text-[#0B132B] bg-[#00F5D4] font-bold px-2.5 py-1 rounded">Mais Vendido</span>
                  <p className="text-2xl font-black font-mono text-white mt-2">R$ 2.500,00</p>
                  <p className="text-xs text-gray-400">Site Institucional Standard até 5 páginas e otimização SEO.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: MATERIAIS DE APOIO ================= */}
          {activeTab === 'materials' && (
            <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Materiais de Apoio & Kit de Vendas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0B132B] border border-[#1E2D50] p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8 text-red-400" />
                    <div>
                      <h4 className="font-bold text-xs text-white">Book de Portfólio Conceitual 2026.pdf</h4>
                      <p className="text-[10px] text-gray-400">Cases conceituais e projetos de referência.</p>
                    </div>
                  </div>
                  <button onClick={() => alert('Download iniciado!')} className="text-xs font-bold text-[#00F5D4] flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
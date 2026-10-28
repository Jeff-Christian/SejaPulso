import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Award, 
  Upload, 
  LogOut, 
  CheckCircle, 
  Clock,
  Search,
  FileText,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar'; // Ajuste o caminho conforme sua estrutura

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Dados mockados do afiliado
  const [affiliate] = useState({
    name: "Jeff Christian",
    company: "Jeff Tech Consultoria LTDA",
    cnpj: "12.345.678/0001-99",
    tierName: "Tier 1 — Bronze",
    commissionRate: "10%",
    dealsCount: 2,
    nextTierTarget: 4,
    balanceAvailable: "R$ 1.500,00",
    balancePending: "R$ 600,00"
  });

  // Lista de comissões
  const [commissions] = useState([
    {
      id: "1",
      client: "Clínica Lumina Estética",
      service: "Site Institucional Standard",
      dealValue: "R$ 2.500,00",
      commissionValue: "R$ 250,00",
      status: "WAITING_INVOICE",
      date: "22/10/2026"
    },
    {
      id: "2",
      client: "Vance & Associates",
      service: "Branding Profissional Completo",
      dealValue: "R$ 2.200,00",
      commissionValue: "R$ 220,00",
      status: "PAID",
      date: "15/10/2026"
    }
  ]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleFileUpload = () => {
    alert('Nota Fiscal recebida! O setor financeiro validará o documento em até 2 horas úteis.');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B132B] text-white font-sans selection:bg-[#00F5D4] selection:text-black">
      
      {/* 1. Componente de Barra Lateral (Sidebar) */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Área de Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Superior da Conta */}
        <header className="bg-[#111D3A] border-b border-[#1E2D50] px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center text-[#00F5D4] font-bold">
              JP
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">{affiliate.company}</h1>
              <p className="text-[11px] font-mono text-gray-400">
                CNPJ: {affiliate.cnpj} • <span className="text-emerald-400 font-semibold">Conta Ativa</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] uppercase font-mono text-gray-400">Chave Pix Cadastrada</p>
              <p className="text-xs font-mono text-slate-200">{affiliate.cnpj} (CNPJ)</p>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-red-400 px-3 py-2 rounded-xl border border-[#1E2D50] hover:border-red-500/30 transition bg-[#0B132B]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico com base na Aba Selecionada */}
        <main className="p-6 space-y-8 flex-1 overflow-y-auto">

          {/* ================= TAB 1: VISÃO GERAL & KPIS ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Card de Faixa e Progressão de Tier */}
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
                      <p className="text-sm font-bold text-white">{affiliate.tierName} <span className="text-[#00F5D4] font-mono">({affiliate.commissionRate})</span></p>
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso Dinâmica */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Vendas do Mês: <strong class="text-white">{affiliate.dealsCount} Contratos</strong></span>
                    <span className="text-[#00F5D4]">Faltam {affiliate.nextTierTarget - affiliate.dealsCount} vendas para subir para o Tier 2 (12%)</span>
                  </div>
                  <div className="w-full h-3 bg-[#0B132B] rounded-full border border-[#1E2D50] overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-[#00F5D4] to-[#0EA5E9] rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
              </div>

              {/* Cards de Saldos e Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-mono uppercase">Saldo Liberado (PIX)</span>
                    <DollarSign className="w-4 h-4 text-[#00F5D4]" />
                  </div>
                  <p className="text-3xl font-black text-[#00F5D4] font-mono">{affiliate.balanceAvailable}</p>
                  <p className="text-[11px] text-gray-400">Sinal quitado pelo cliente e NF validada.</p>
                </div>

                <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-mono uppercase">Saldo Pendente</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-3xl font-black text-white font-mono">{affiliate.balancePending}</p>
                  <p className="text-[11px] text-gray-400">Aguardando recebimento do sinal via Asaas.</p>
                </div>

                <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-mono uppercase">Vendas Fechadas</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white font-mono">{affiliate.dealsCount} vendas</p>
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

              <div className="bg-[#0B132B] border border-[#1E2D50] p-4 rounded-xl flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Digite a Razão Social ou CNPJ para consultar..." 
                    className="w-full bg-[#111D3A] border border-[#1E2D50] rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#00F5D4]"
                  />
                </div>
                <button className="bg-[#00F5D4] text-[#0B132B] px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition shrink-0">
                  Consultar Paternidade
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 3: VENDAS & NOTAS FISCAIS ================= */}
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
                    {commissions.map((item) => (
                      <tr key={item.id} className="hover:bg-[#0B132B]/50 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-bold text-white">{item.client}</p>
                          <p className="text-[10px] text-gray-400">{item.service} • {item.date}</p>
                        </td>
                        <td className="py-4 px-4 font-mono text-gray-300">{item.dealValue}</td>
                        <td className="py-4 px-4 font-mono font-bold text-[#00F5D4]">{item.commissionValue}</td>
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
                              <input type="file" className="hidden" onChange={handleFileUpload} />
                            </label>
                          ) : (
                            <span className="text-[11px] text-gray-500 font-mono">Concluído</span>
                          )}
                        </td>
                      </tr>
                    ))}
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
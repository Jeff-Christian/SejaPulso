import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  Upload, 
  ExternalLink, 
  LogOut, 
  FileText,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage = () => {
  const navigate = useNavigate();

  // Dados mockados do afiliado autenticado
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

  // Lista de comissões/vendas
  const [commissions] = useState([
    {
      id: "1",
      client: "Clínica Lumina Estética",
      service: "Site Institucional Standard",
      dealValue: "R$ 2.500,00",
      commissionValue: "R$ 250,00",
      status: "WAITING_INVOICE", // Aguardando Nota Fiscal
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
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-white font-sans selection:bg-[#00F5D4] selection:text-black">
      
      {/* 1. Header do Dashboard */}
      <header className="w-full bg-[#111D3A] border-b border-[#1E2D50] px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center">
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase text-white">
              SEJA<span className="text-[#00F5D4]">PULSO</span>
            </span>
          </Link>
          <span className="hidden md:inline-block text-xs font-mono px-2.5 py-1 rounded bg-[#0B132B] border border-[#1E2D50] text-[#00F5D4]">
            PAINEL DO PARCEIRO
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{affiliate.company}</p>
            <p className="text-[10px] text-gray-400 font-mono">CNPJ: {affiliate.cnpj}</p>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1.5 text-gray-400 hover:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#1E2D50] hover:border-red-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* 2. Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Boas-vindas & Tier Atual */}
        <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div>
            <span className="text-xs font-mono text-[#00F5D4] uppercase tracking-wider">Bem-vindo ao SejaPulso</span>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-1">{affiliate.name}</h1>
            <p className="text-xs text-gray-400 mt-1">Sua rede de prospecção e aceleração de clientes B2B.</p>
          </div>

          {/* Card da Faixa de Comissão */}
          <div className="bg-[#0B132B] border border-[#1E2D50] p-4 rounded-xl flex items-center space-x-4 min-w-[260px]">
            <div className="p-3 bg-[#00F5D4]/10 rounded-lg text-[#00F5D4]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono text-gray-400">Faixa Atual</p>
              <p className="text-sm font-bold text-white">{affiliate.tierName}</p>
              <p className="text-xs text-[#00F5D4] font-semibold">Comissão: {affiliate.commissionRate}</p>
            </div>
          </div>
        </div>

        {/* 3. Cards de Métricas e Saldos */}
        <div className="grid grid-[#0B132B] grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-mono uppercase">Saldo Liberado (PIX)</span>
              <DollarSign className="w-4 h-4 text-[#00F5D4]" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-[#00F5D4]">{affiliate.balanceAvailable}</p>
            <p className="text-[10px] text-gray-400">Disponível para saque via Nota Fiscal</p>
          </div>

          <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-mono uppercase">Saldo Pendente</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-white">{affiliate.balancePending}</p>
            <p className="text-[10px] text-gray-400">Aguardando confirmação do sinal pelo cliente</p>
          </div>

          <div className="bg-[#111D3A] border border-[#1E2D50] p-6 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-mono uppercase">Vendas Fechadas</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-white">{affiliate.dealsCount} vendas</p>
            <p className="text-[10px] text-gray-400">Faltam {affiliate.nextTierTarget - affiliate.dealsCount} vendas para subir ao próximo Tier</p>
          </div>
        </div>

        {/* 4. Tabela de Comissões e Envio de Nota Fiscal */}
        <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Minhas Comissões & Saques</h2>
              <p className="text-xs text-gray-400">Anexe sua Nota Fiscal (PDF/XML) para liberar o recebimento via Pix</p>
            </div>
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
                        <button className="inline-flex items-center space-x-1.5 bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold px-3 py-1.5 rounded-lg text-xs transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Anexar NF</span>
                        </button>
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

      </main>

    </div>
  );
};
import React from 'react';
import { 
  PieChart, 
  Building2, 
  Receipt, 
  Layers, 
  FolderOpen, 
  CheckCircle2, 
  MessageCircle,
  ShieldCheck,
  Users,
  DollarSign,
  UserPlus
} from 'lucide-react';

// Import imagem do Logo
import LogoPulso from '../assets/SejaPulsoLogo.png'; 

export const Sidebar = ({ activeTab, onSelectTab, onOpenAddModal }) => {
  // Lê as informações do usuário logado no localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ADMIN';

  // Configuração dos itens de menu para o Perfil CONSULTOR / AFILIADO
  const affiliateMenuItems = [
    { id: 'overview', label: 'Visão Geral & KPIs', icon: PieChart },
    { id: 'my-leads', label: 'Meus Agendamentos', icon: Building2 }, // 👈 Adicionado a aba da Carteira de Leads
    { id: 'leads', label: 'Verificação & Pool B2B', icon: Building2 },
    { id: 'sales', label: 'Vendas & Notas Fiscais', icon: Receipt },
    { id: 'pricing', label: 'Cardápio de Serviços', icon: Layers },
    { id: 'materials', label: 'Materiais & Book', icon: FolderOpen },
  ];

  // Configuração dos itens de menu exclusivos para o Perfil ADMINISTRADOR
  const adminMenuItems = [
    { id: 'pending', label: 'Aprovações Pendentes', icon: ShieldCheck },
    { id: 'affiliates_list', label: 'Consultores Ativos', icon: Users },
    { id: 'admin_pool', label: 'Gestão Pool B2B', icon: Building2 },
    { id: 'admin_financial', label: 'Financeiro & Asaas', icon: DollarSign },
  ];

  const currentMenuItems = isAdmin ? adminMenuItems : affiliateMenuItems;

  return (
    <aside className="w-full md:w-64 bg-[#111D3A] border-r border-[#1E2D50] flex flex-col justify-between shrink-0 font-sans min-h-screen">
      <div>
        {/* Header do Menu / Branding */}
        <div className="p-6 border-b border-[#1E2D50] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={LogoPulso}
              alt="Logo SejaPulso"
              className="w-[180px] h-[180px] object-contain transition-transform hover:scale-105 -my-8 pointer-events-auto" 
            />
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isAdmin 
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
              : 'bg-[#0B132B] text-[#00F5D4] border-[#1E2D50]'
          }`}>
            {isAdmin ? 'ADMIN' : 'B2B'}
          </span>
        </div>

        {/* Botão de Ação Rápida Exclusivo para o Admin */}
        {isAdmin && onOpenAddModal && (
          <div className="p-4 pb-0">
            <button
              onClick={onOpenAddModal}
              className="w-full flex items-center justify-center space-x-2 bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Consultor Direto</span>
            </button>
          </div>
        )}

        {/* Links da Barra Lateral */}
        <nav className="p-4 space-y-1.5 font-medium text-xs">
          <p className="text-[10px] uppercase font-mono text-gray-500 px-3 pb-1">
            {isAdmin ? 'Módulos de Gestão' : 'Menu do Parceiro'}
          </p>
          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition text-left ${
                  isActive
                    ? 'text-[#00F5D4] bg-[#0B132B] border border-[#00F5D4]/30'
                    : 'text-gray-400 hover:text-white hover:bg-[#0B132B]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00F5D4]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-[#1E2D50] space-y-3">
        {!isAdmin ? (
          <>
            <div className="bg-[#0B132B] p-3 rounded-xl border border-[#1E2D50] text-xs">
              <div className="flex items-center justify-between text-gray-400 mb-1">
                <span>Contrato B2B:</span>
                <span className="text-[#00F5D4] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Assinado
                </span>
              </div>
              <p className="text-[10px] text-gray-500">Termo non-bypass e confidencialidade ativo.</p>
            </div>

            <a
              href="https://wa.me/5581999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition text-xs font-bold"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Suporte ao Afiliado</span>
            </a>
          </>
        ) : (
          <div className="bg-[#0B132B] p-3 rounded-xl border border-[#1E2D50] text-[11px] text-gray-400">
            <p className="font-bold text-white">Modo Administrador</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Conectado ao PostgreSQL (Neon.tech)</p>
          </div>
        )}
      </div>
    </aside>
  );
};
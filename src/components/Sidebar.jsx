import React from "react";
import { 
  PieChart, 
  Building2, 
  Receipt, 
  Layers, 
  FolderOpen, 
  ShieldCheck, 
  Users, 
  DollarSign, 
  UserPlus 
} from "lucide-react";
import LogoPulso from "../assets/SejaPulsoLogo.png";
import { getAuthUser } from "../services/api"; // 👈 Importa a busca segura em memória

export const Sidebar = ({ activeTab, onSelectTab, onOpenAddModal }) => {
  // 🔒 Lê o usuário autenticado em memória (sem localStorage)
  const user = getAuthUser() || {};
  const isAdmin = user.role === "ADMIN";

  // Menu para Afiliados/Consultores
  const affiliateMenuItems = [
    { id: "overview", label: "Visão Geral & KPIs", icon: PieChart },
    { id: "my-leads", label: "Meus Agendamentos", icon: Building2 },
    { id: "leads", label: "Verificação & Pool B2B", icon: Building2 },
    { id: "sales", label: "Vendas & Notas Fiscais", icon: Receipt },
    { id: "pricing", label: "Cardápio de Serviços", icon: Layers },
    { id: "materials", label: "Materiais & Book", icon: FolderOpen },
  ];

  // Menu exclusivo para o perfil Administrador
  const adminMenuItems = [
    { id: "pending", label: "Aprovações Pendentes", icon: ShieldCheck },
    { id: "affiliates_list", label: "Consultores Ativos", icon: Users },
    { id: "admin_pool", label: "Gestão Pool B2B", icon: Building2 },
    { id: "financial", label: "Financeiro & Asaas", icon: DollarSign },
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
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isAdmin
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-[#0B132B] text-[#00F5D4] border-[#1E2D50]"
            }`}
          >
            {isAdmin ? "ADMIN" : "B2B"}
          </span>
        </div>

        {/* Botão de Ação Rápida para o Admin */}
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
            {isAdmin ? "Módulos de Gestão" : "Menu do Parceiro"}
          </p>
          {currentMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${
                  isActive
                    ? "bg-[#00F5D4] text-[#0B132B] font-bold shadow-md shadow-[#00F5D4]/10"
                    : "text-gray-300 hover:bg-[#0B132B] hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#0B132B]" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
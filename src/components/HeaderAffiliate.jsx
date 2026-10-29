import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeaderAffiliate = () => {
  const navigate = useNavigate();

  // Lê os dados do usuário autenticado a partir do localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="w-full bg-[#111D3A] border-b border-[#1E2D50] px-6 md:px-12 py-4 flex items-center justify-between sticky top-0 z-30 font-sans">
      
      {/* 1. Nome / Dados do Consultor (Canto Esquerdo) */}
      <div className="flex items-center space-x-3">
        {/* Iniciais da Razão Social em Badge Ciano */}
        <div className="w-9 h-9 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/30 flex items-center justify-center font-bold text-[#00F5D4] text-xs font-mono shrink-0">
          {user.companyName ? user.companyName.substring(0, 2).toUpperCase() : 'CT'}
        </div>

        <div className="text-left">
          <h3 className="text-xs font-bold text-white uppercase tracking-wide">
            {user.companyName || 'CONSULTOR PARCEIRO'}
          </h3>
          <p className="text-[10px] text-gray-400 font-mono">
            {user.email || 'consultor@pulsotech.com.br'} • <span className="text-[#00F5D4]">Conta Ativa</span>
          </p>
        </div>
      </div>

      {/* 2. Chave Pix Cadastrada e Botão Clicável de Logout (Canto Direito) */}
      <div className="flex items-center space-x-6">
        
        {/* Informação da Chave Pix Cadastrada */}
        <div className="text-right hidden sm:block">
          <span className="text-[9px] uppercase font-mono text-gray-400 block">
            Chave Pix Cadastrada
          </span>
          <span className="text-xs font-mono text-gray-200">
            {user.pixKey || user.cnpj || 'Consultar Admin'}
          </span>
        </div>

        {/* Botão de Logout de Acesso (Com Cursor Pointer & Efeito Hover Clicável) */}
        <button 
          type="button"
          onClick={handleLogout}
          className="flex items-center space-x-1.5 text-gray-300 hover:text-red-400 text-xs font-semibold px-3 py-2 rounded-xl border border-[#1E2D50] hover:border-red-500/30 transition-all bg-[#0B132B] hover:bg-red-500/10 cursor-pointer select-none active:scale-95"
          title="Encerrar sessão"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>

      </div>

    </header>
  );
};
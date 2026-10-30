import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Lock, 
  Copy, 
  Sparkles 
} from 'lucide-react';
import { apiRequest } from '../services/api';

export const LeadCard = ({ leadData, onLeadClaimed }) => {
  const [claiming, setClaiming] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!leadData) return null;

  // Renderização se o Lead já estiver bloqueado por outro consultor
  if (leadData.status === 'BLOCKED') {
    return (
      <div className="bg-[#111D3A] border border-red-500/30 rounded-2xl p-6 space-y-4 font-sans text-xs text-white">
        <div className="flex items-center gap-2 text-red-400 font-bold">
          <Lock className="w-4 h-4" />
          <span>Oportunidade Indisponível</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{leadData.companyName}</h3>
          <p className="text-gray-400 font-mono text-[11px]">CNPJ: {leadData.cnpj}</p>
        </div>
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl">
          {leadData.message || 'Este lead já foi reservado por outro consultor da rede.'}
        </div>
      </div>
    );
  }

  // Função para Reivindicar / Reservar Lead
  const handleClaimLead = async () => {
    if (!leadData || !leadData.cnpj) return;

    setClaiming(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await apiRequest('/leads/claim', 'POST', {
        cnpj: leadData.cnpj,
        companyName: leadData.companyName
      }, token);

      alert(response.message || 'Lead reservado com sucesso!');
      
      // Marca como reservado localmente para desabilitar o botão
      setIsClaimed(true);

      // Notifica o componente pai se houver callback
      if (onLeadClaimed) {
        onLeadClaimed(response.lead);
      }
      
    } catch (err) {
      console.error('Erro ao reivindicar lead:', err);
      // Garante a extração da mensagem em string para evitar erro de objeto circular
      alert(err.message || 'Erro ao tentar reservar o lead.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6 font-sans text-xs text-white shadow-xl">
      
      {/* 1. Cabeçalho com Razão Social e Status da Receita */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#1E2D50] pb-4">
        <div>
          <span className="text-[10px] font-mono text-[#00F5D4] uppercase tracking-wider">Ficha do Lead B2B</span>
          <h3 className="text-lg font-bold text-white mt-0.5">{leadData.companyName}</h3>
          {leadData.tradeName && <p className="text-gray-400 text-[11px]">{leadData.tradeName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border ${
            leadData.registrationStatus === 'ATIVA' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            ● {leadData.registrationStatus || 'ATIVA'} (Receita Federal)
          </span>
        </div>
      </div>

      {/* 2. Informações Gerais de Cadastro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0B132B] p-4 rounded-xl border border-[#1E2D50]">
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">Ramo / CNAE Principal</span>
          <p className="font-semibold text-gray-200 mt-0.5">{leadData.cnaeDescription || 'Não informado'}</p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">Localização</span>
          <p className="font-semibold text-gray-200 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#00F5D4]" />
            {leadData.location || 'Brasil'}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">Telefone Oficial</span>
          <p className="font-mono text-gray-300 flex items-center gap-1 mt-0.5">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            {leadData.officialPhone || 'Não disponível'}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">E-mail Oficial</span>
          <p className="font-mono text-gray-300 flex items-center gap-1 mt-0.5">
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            {leadData.officialEmail || 'Não disponível'}
          </p>
        </div>
      </div>

      {/* 3. Inteligência de Abordagem Consultiva por IA */}
      {leadData.intelligence && (
        <div className="bg-[#0B132B]/90 border border-[#00F5D4]/40 rounded-2xl p-5 space-y-4 font-sans">
          
          <div className="flex items-center justify-between border-b border-[#1E2D50] pb-3">
            <div className="flex items-center gap-2 text-[#00F5D4] font-bold text-xs">
              <Sparkles className="w-4 h-4 text-[#00F5D4]" />
              <span>Direcionamento de Venda (Co-piloto B2B)</span>
            </div>
            <span className="text-[10px] bg-[#00F5D4]/10 text-[#00F5D4] px-2.5 py-0.5 rounded font-mono">
              Dica Prática
            </span>
          </div>

          {/* Dica Direta para o Consultor */}
          <div className="bg-[#111D3A] p-4 rounded-xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block mb-1">
              💡 Por que ofertar este serviço? (Onde está o dinheiro):
            </span>
            <p className="text-gray-200 text-xs leading-relaxed font-medium">
              {leadData.intelligence.whyOffer || leadData.intelligence.sectorPain}
            </p>
          </div>

          {/* Script para WhatsApp de Tom Natural */}
          {leadData.intelligence.pitchScript && (
            <div className="bg-[#111D3A] p-4 rounded-xl border border-[#00F5D4]/30 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-mono text-[#00F5D4] font-bold">
                  📱 Mensagem Amigável para WhatsApp:
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(leadData.intelligence.pitchScript);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-[#1E2D50] hover:bg-[#00F5D4] hover:text-[#0B132B] text-white px-2.5 py-1 rounded text-[10px] font-bold font-mono transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="italic text-gray-200 text-xs leading-relaxed">
                "{leadData.intelligence.pitchScript}"
              </p>
            </div>
          )}

          {/* Pacote Sugerido */}
          {leadData.intelligence.suggestedPackage && (
            <div className="flex items-center justify-between p-3 bg-[#0B132B] rounded-xl border border-[#1E2D50] text-xs">
              <span className="text-gray-400 font-mono text-[10px] uppercase">Pacote do Cardápio:</span>
              <span className="font-bold text-[#00F5D4]">{leadData.intelligence.suggestedPackage}</span>
            </div>
          )}

        </div>
      )}

      {/* 4. Ação: Reservar Lead (Claim) */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleClaimLead}
          disabled={claiming || isClaimed}
          className={`font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 text-xs shadow-lg disabled:opacity-50 ${
            isClaimed 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>
            {claiming 
              ? 'Reservando...' 
              : isClaimed 
                ? 'Lead Reservado no Seu Nome' 
                : 'Reservar Lead no meu Nome (Claiming)'}
          </span>
        </button>
      </div>

    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Building2, Phone, Calendar, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { apiRequest } from '../services/api';

export const MyLeadsTab = () => { // 👈 Exatamente assim (export const)
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await apiRequest('/leads/my-leads', 'GET', null, token);
      setMyLeads(data || []);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, []);

  return (
    <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00F5D4]" />
            Meus Agendamentos & Carteira B2B
          </h2>
          <p className="text-xs text-gray-400 mt-1">Leads reservados e negociações em andamento sob sua responsabilidade.</p>
        </div>
        <button 
          onClick={fetchMyLeads}
          className="p-2 bg-[#0B132B] border border-[#1E2D50] text-gray-300 hover:text-[#00F5D4] rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 font-mono text-xs">Carregando seus agendamentos...</div>
      ) : myLeads.length === 0 ? (
        <div className="bg-[#0B132B] border border-[#1E2D50] p-8 rounded-xl text-center space-y-2">
          <p className="text-xs text-gray-400">Você ainda não agendou nenhum lead.</p>
          <p className="text-[11px] text-gray-500">Utilize a aba "Verificação & Pool B2B" para pesquisar um CNPJ e realizar a reserva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myLeads.map((lead) => (
            <div key={lead.id} className="bg-[#0B132B] border border-[#1E2D50] p-5 rounded-xl space-y-3 hover:border-[#00F5D4]/40 transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{lead.companyName}</h3>
                  <p className="text-[11px] font-mono text-[#00F5D4]">CNPJ: {lead.cnpj}</p>
                </div>
                {lead.status === 'WAITING_INTERNAL_REVIEW' ? (
                  <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Em Análise / Pós-Vendas
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Em Negociação
                  </span>
                )}
              </div>

              {lead.contactPhone && (
                <div className="pt-2 border-t border-[#1E2D50]">
                  <a
                    href={`https://wa.me/55${lead.contactPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1E2D50] hover:bg-[#253760] text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#00F5D4]" />
                    <span>Chamar no WhatsApp</span>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
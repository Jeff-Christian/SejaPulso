import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Search,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../services/api';

export const MyLeadsTab = () => {
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMyLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await apiRequest('/leads/my-leads', 'GET', null, token);
      setMyLeads(data);
    } catch (err) {
      console.error('Erro ao buscar meus leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, []);

  // Filtro de busca na lista
  const filteredLeads = myLeads.filter(lead => 
    lead.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cnpj?.includes(searchTerm)
  );

  // Formata o número para link direto do WhatsApp (remove caracteres não numéricos)
  const openWhatsApp = (phone, companyName) => {
    if (!phone || phone === 'Não informado') {
      alert('Este lead não possui um telefone válido para contato.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Sou consultor da Pulso Tech e gostaria de conversar com o responsável pela ${companyName}.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full font-sans">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1E2D50] pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00F5D4]" />
            <span>Meus Leads Agendados & Reservados</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Garantia de exclusividade e histórico de contatos comerciais em andamento.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Busca na Carteira */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por razão social ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111D3A] border border-[#1E2D50] text-white text-xs pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-[#00F5D4]"
            />
          </div>

          <button
            onClick={fetchMyLeads}
            className="p-2 bg-[#111D3A] border border-[#1E2D50] hover:border-[#00F5D4] text-gray-300 hover:text-[#00F5D4] rounded-xl transition"
            title="Atualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabela de Leads Reservados */}
      {loading ? (
        <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-12 text-center text-gray-400 font-mono text-xs">
          Carregando seus agendamentos...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-[#111D3A] border border-[#1E2D50] rounded-2xl p-12 text-center text-gray-400 text-xs">
          <p className="font-semibold text-gray-300 mb-1">Nenhum lead reservado na sua carteira ainda.</p>
          <p className="text-gray-500 text-[11px]">Consulte um CNPJ na aba de busca e clique em "Reservar Lead no meu Nome" para garantir o atendimento exclusivo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id} 
              className="bg-[#111D3A] border border-[#1E2D50] hover:border-[#00F5D4]/40 rounded-2xl p-5 space-y-4 shadow-lg transition"
            >
              {/* Header do Card */}
              <div className="flex justify-between items-start border-b border-[#1E2D50] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#00F5D4] uppercase">Reservado</span>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{lead.companyName}</h3>
                  <p className="font-mono text-[11px] text-gray-400">CNPJ: {lead.cnpj}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Ativo
                </span>
              </div>

              {/* Detalhes de Contato */}
              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-mono text-gray-300">{lead.contactPhone || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  <span className="font-mono text-gray-300 truncate">{lead.contactEmail || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-[11px] pt-1">
                  <Calendar className="w-3.5 h-3.5 text-[#00F5D4]" />
                  <span>Reservado em: {new Date(lead.claimedAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Botão de Disparo WhatsApp */}
              <div className="pt-2 border-t border-[#1E2D50]">
                <button
                  onClick={() => openWhatsApp(lead.contactPhone, lead.companyName)}
                  className="w-full bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
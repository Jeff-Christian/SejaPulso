import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';

export const AdminDashboard = () => {
  const [pendingAffiliates, setPendingAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Envolva o fetch com useCallback para evitar a re-criação da função a cada renderização
  const fetchPendingAffiliates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await apiRequest('/admin/affiliates/pending', 'GET', null, token);
      setPendingAffiliates(data);
    } catch (err) {
      setError(err.message || 'Erro ao carregar afiliados pendentes.');
    } 
    finally {
      setLoading(false);
    }
  }, []); // Array de dependências vazio garante referência estável

  useEffect(() => {
    fetchPendingAffiliates();
  }, [fetchPendingAffiliates]);

  // Função para aprovar ou bloquear o cadastro do afiliado
  const handleUpdateStatus = async (id, newStatus) => {
    setActionSuccess('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      await apiRequest(`/admin/affiliates/${id}/status`, 'PATCH', { status: newStatus }, token);
      
      setActionSuccess(`Status atualizado para ${newStatus === 'APPROVED' ? 'APROVADO' : 'BLOQUEADO'} com sucesso!`);
      // Atualiza a lista removendo o item processado
      setPendingAffiliates((prev) => prev.filter((affiliate) => affiliate.id !== id));
    } catch (err) {
      setError(err.message || 'Erro ao atualizar o status do afiliado.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] text-white p-6 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto mb-8 flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel do Administrador <span className="text-[#00F5D4]">SejaPulso</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gestão de acessos, aprovação de CNPJs e controle da rede de afiliados
          </p>
        </div>
        <button
          onClick={fetchPendingAffiliates}
          className="bg-[#1C2541] hover:bg-slate-800 text-slate-200 text-sm py-2 px-4 rounded-lg border border-slate-700 transition"
        >
          Atualizar Lista
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* Mensagens de Alerta e Erro */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {actionSuccess && (
          <div className="bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] p-4 rounded-xl text-sm mb-6">
            {actionSuccess}
          </div>
        )}

        {/* Card de Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1C2541] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">Pendente de Análise</span>
            <h3 className="text-3xl font-bold text-amber-400 mt-2">{pendingAffiliates.length}</h3>
          </div>
          <div className="bg-[#1C2541] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">Rede Operacional</span>
            <h3 className="text-3xl font-bold text-[#00F5D4] mt-2">Pulso Tech</h3>
          </div>
          <div className="bg-[#1C2541] p-6 rounded-2xl border border-slate-800 shadow-lg">
            <span className="text-slate-400 text-xs font-mono tracking-widest uppercase">Banco de Dados</span>
            <h3 className="text-3xl font-bold text-sky-400 mt-2">Neon.tech</h3>
          </div>
        </div>

        {/* Tabela de Aprovação de Cadastros */}
        <section className="bg-[#1C2541] rounded-2xl border border-slate-800 p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-slate-100">
            Aprovações Pendentes (Novos CNPJs)
          </h2>

          {loading ? (
            <div className="text-center py-10 text-slate-400 font-mono">
              Carregando cadastros do PostgreSQL...
            </div>
          ) : pendingAffiliates.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-[#0B132B]/50 rounded-xl border border-slate-800/50">
              Nenhum afiliado aguardando aprovação no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Razão Social / Fantasia</th>
                    <th className="py-3 px-4">CNPJ</th>
                    <th className="py-3 px-4">Responsável / E-mail</th>
                    <th className="py-3 px-4">Telefone</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {pendingAffiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="hover:bg-[#0B132B]/30 transition">
                      <td className="py-4 px-4 font-medium text-white">
                        {affiliate.companyName}
                        {affiliate.tradeName && (
                          <span className="block text-xs text-slate-400 font-normal">{affiliate.tradeName}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300">{affiliate.cnpj}</td>
                      <td className="py-4 px-4">
                        <div className="text-slate-200">{affiliate.responsible}</div>
                        <div className="text-xs text-slate-400">{affiliate.email}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-mono">{affiliate.phone}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(affiliate.id, 'APPROVED')}
                          className="bg-[#00F5D4] text-[#0B132B] font-bold px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(affiliate.id, 'BLOCKED')}
                          className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs hover:bg-red-500/30 transition"
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
      </main>
    </div>
  );
};
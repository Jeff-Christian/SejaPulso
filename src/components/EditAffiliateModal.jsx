import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { 
  Building2, 
  Award, 
  FileText, 
  Receipt, 
  DollarSign, 
  CreditCard, 
  X, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Upload,
  FileCheck
} from 'lucide-react';

export const EditAffiliateModal = ({ affiliateId, isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('cadastral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  // Formulário completo incluindo Pix e dados bancários
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    responsible: '',
    email: '',
    phone: '',
    pixKey: '',
    tierId: 1,
    status: 'APPROVED'
  });

  useEffect(() => {
    if (isOpen && affiliateId) {
      fetchAffiliateDetails();
    }
  }, [isOpen, affiliateId]);

  const fetchAffiliateDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const data = await apiRequest(`/admin/affiliates/${affiliateId}`, 'GET', null, token);
      setDetails(data);
      setFormData({
        companyName: data.companyName || '',
        tradeName: data.tradeName || '',
        cnpj: data.cnpj || '',
        responsible: data.responsible || '',
        email: data.email || '',
        phone: data.phone || '',
        pixKey: data.pixKey || data.cnpj || '', // Chave Pix vinculada
        tierId: data.tierId || 1,
        status: data.status || 'APPROVED'
      });
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhes do consultor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await apiRequest(`/admin/affiliates/${affiliateId}`, 'PUT', formData, token);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao atualizar dados.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#111D3A] border border-[#1E2D50] w-full max-w-4xl rounded-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden font-sans">
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-[#1E2D50] flex justify-between items-center bg-[#0B132B]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00F5D4]" />
              {loading ? 'Carregando Consultor...' : details?.companyName}
            </h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">CNPJ: {details?.cnpj}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#111D3A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação por Abas */}
        <div className="flex border-b border-[#1E2D50] bg-[#0B132B]/50 px-6 space-x-2 overflow-x-auto text-xs font-medium">
          {[
            { id: 'cadastral', label: 'Dados Cadastrais', icon: Building2 },
            { id: 'bank', label: 'Dados Bancários & Pix', icon: CreditCard },
            { id: 'tier', label: 'Tier & Comissão', icon: Award },
            { id: 'financial', label: 'Saldos & Asaas', icon: DollarSign },
            { id: 'deals', label: 'Vendas Fechadas', icon: Receipt },
            { id: 'docs', label: 'NFs & Contrato', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-[#00F5D4] text-[#00F5D4]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-white">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400 font-mono">Carregando informações do banco...</div>
          ) : (
            <>
              {/* ABA 1: DADOS CADASTRAIS */}
              {activeTab === 'cadastral' && (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1">Razão Social *</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Nome Fantasia</label>
                      <input
                        type="text"
                        value={formData.tradeName}
                        onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1">CNPJ *</label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Responsável *</label>
                      <input
                        type="text"
                        value={formData.responsible}
                        onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1">E-mail *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>
                  </div>
                </form>
              )}

              {/* ABA 2: DADOS BANCÁRIOS & PIX (EDITÁVEL PELO ADMIN) */}
              {activeTab === 'bank' && (
                <div className="space-y-6">
                  <div className="bg-[#0B132B] p-4 rounded-xl border border-[#1E2D50] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#00F5D4]" />
                        Cadastro Interno da Chave Pix (Exclusivo do Admin)
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Estes dados ficam bloqueados para alteração no painel do consultor para garantir a segurança da transferência do Payout.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 mb-1 font-medium">Chave Pix do Consultor (CNPJ / E-mail / Celular) *</label>
                      <input
                        type="text"
                        value={formData.pixKey}
                        onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                        placeholder="Ex: 01.631.940/0001-41"
                        className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-1 font-medium">Titularidade Auditada</label>
                      <input
                        type="text"
                        disabled
                        value={formData.companyName}
                        className="w-full bg-[#0B132B]/50 border border-[#1E2D50] rounded-xl px-3 py-2 text-gray-400 font-mono cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Módulo Preparatório para Upload de Comprovante de Pagamento Pix */}
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-[#1E2D50] space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        Comprovantes de Transferência Pix (Auditoria de Saques)
                      </h5>
                      <button 
                        type="button" 
                        onClick={() => alert('Em breve: Anexo do comprovante Pix diretamente associado à liberação da comissão.')} 
                        className="bg-[#1E2D50] hover:bg-[#00F5D4] hover:text-[#0B132B] text-xs font-bold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Anexar Comprovante Pix</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      O envio do comprovante garante a conferência prévia e a notificação direta do repasse efetuado para o consultor.
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 3: TIER & PREMIAÇÕES */}
              {activeTab === 'tier' && (
                <div className="space-y-4">
                  <div className="bg-[#0B132B] p-4 rounded-xl border border-[#1E2D50] space-y-3">
                    <label className="block text-gray-400 font-medium">Faixa de Comissionamento Atual</label>
                    <select
                      value={formData.tierId}
                      onChange={(e) => setFormData({ ...formData, tierId: e.target.value })}
                      className="w-full bg-[#111D3A] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                    >
                      <option value={1}>Tier 1 — Bronze (10%)</option>
                      <option value={2}>Tier 2 — Prata (12%)</option>
                      <option value={3}>Tier 3 — Ouro (15%)</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-gray-400">Total de Vendas Confirmadas no Período: <strong className="text-white">{details?.deals?.length || 0} contratos</strong></p>
                </div>
              )}

              {/* ABA 4: SALDOS & ASAAS */}
              {activeTab === 'financial' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-[#1E2D50] space-y-2">
                    <span className="text-gray-400 font-mono text-[10px] uppercase">Saldo Liberado (Saque via Pix)</span>
                    <p className="text-2xl font-black text-[#00F5D4] font-mono">{details?.financialSummary?.balanceAvailable}</p>
                    <p className="text-[10px] text-gray-400">Origem: Sinal quitado no Asaas e NF aprovada pelo Admin.</p>
                  </div>
                  <div className="bg-[#0B132B] p-5 rounded-2xl border border-[#1E2D50] space-y-2">
                    <span className="text-gray-400 font-mono text-[10px] uppercase">Saldo Pendente</span>
                    <p className="text-2xl font-black text-amber-400 font-mono">{details?.financialSummary?.balancePending}</p>
                    <p className="text-[10px] text-gray-400">Aguardando recebimento do sinal via Asaas / Envio de NF.</p>
                  </div>
                </div>
              )}

              {/* ABA 5: VENDAS FECHADAS */}
              {activeTab === 'deals' && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white">Contratos Fechados pelo Consultor</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1E2D50] text-gray-400 text-[10px] uppercase font-mono">
                          <th className="py-2 px-3">Cliente</th>
                          <th className="py-2 px-3">Valor Total</th>
                          <th className="py-2 px-3">Comissão</th>
                          <th className="py-2 px-3">Sinal (Asaas)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E2D50]">
                        {details?.deals?.length === 0 ? (
                          <tr><td colSpan={4} className="py-4 text-center text-gray-500">Nenhuma venda registrada.</td></tr>
                        ) : (
                          details?.deals?.map((deal) => (
                            <tr key={deal.id}>
                              <td className="py-2.5 px-3 font-bold">{deal.lead?.companyName}</td>
                              <td className="py-2.5 px-3 font-mono">R$ {deal.totalAmount?.toFixed(2)}</td>
                              <td className="py-2.5 px-3 font-mono text-[#00F5D4]">R$ {deal.commission?.amount?.toFixed(2)}</td>
                              <td className="py-2.5 px-3 font-mono">
                                {deal.downPaymentPaid ? (
                                  <span className="text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5 inline" /> Quitado</span>
                                ) : (
                                  <span className="text-amber-400"><Clock className="w-3.5 h-3.5 inline" /> Pendente</span>
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

              {/* ABA 6: NFS ENVIADAS & CONTRATO */}
              {activeTab === 'docs' && (
                <div className="space-y-4">
                  <div className="bg-[#0B132B] p-4 rounded-xl border border-[#1E2D50] flex justify-between items-center">
                    <div>
                      <p className="font-bold">Contrato B2B (Termo Non-Bypass)</p>
                      <p className="text-[10px] text-gray-400">Exigência de aceite para liberação de comissão.</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      details?.contractSigned ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {details?.contractSigned ? 'Assinado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-4 border-t border-[#1E2D50] bg-[#0B132B] flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-[#111D3A] text-gray-400 hover:text-white border border-[#1E2D50]">
            Fechar
          </button>
          {activeTab === 'cadastral' || activeTab === 'tier' || activeTab === 'bank' ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#00F5D4] text-[#0B132B] font-bold hover:opacity-90 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          ) : null}
        </div>

      </div>
    </div>
  );
};
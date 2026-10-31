import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { X, CheckCircle2, DollarSign, FileText, AlertCircle, Send, Package, Clock } from 'lucide-react';
import { HoldToSubmitButton } from './HoldToSubmitButton';

export const SalesHandoverModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    selectedPackage: '',
    finalValue: '',
    offerDetails: ''
  });

  if (!isOpen || !lead) return null;

  const isCustomProject = formData.selectedPackage === 'ENTERPRISE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      // O backend identificará pelo payload se é pacote padrão ou briefing enterprise
      await apiRequest(`/leads/${lead.id}/handover`, 'POST', formData, token);
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao enviar dados de fechamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#111D3A] border border-[#1E2D50] w-full max-w-lg rounded-2xl flex flex-col shadow-2xl overflow-hidden font-sans">
        
        <div className="p-6 border-b border-[#1E2D50] flex justify-between items-center bg-[#0B132B]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00F5D4]" />
              {isCustomProject ? 'Briefing de Projeto' : 'Solicitar Fechamento'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Repasse os dados de <strong className="text-white">{lead.companyName}</strong> para o financeiro.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#111D3A]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-white">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Pacote ou Serviço *
              </label>
              <select
                required
                value={formData.selectedPackage}
                onChange={(e) => setFormData({ ...formData, selectedPackage: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00F5D4]"
              >
                <option value="" disabled>Selecione o serviço...</option>
                <option value="START">Landing Page Start</option>
                <option value="STANDARD">Site Institucional Standard</option>
                <option value="PRO">Plataforma Pro</option>
                <option value="ENTERPRISE">Projeto Sob Medida (Enterprise)</option>
              </select>
            </div>

            {/* Renderização Condicional do Alerta de SLA */}
            {isCustomProject && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-400">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Atenção ao SLA:</strong> Projetos customizados exigem análise técnica. O setor financeiro retornará com a precificação final em <strong>24h a 48h úteis</strong> após o envio deste briefing.
                </p>
              </div>
            )}

            <div>
              <label className="block text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> 
                {isCustomProject ? 'Budget / Orçamento Estimado do Cliente (R$) *' : 'Valor Final Negociado (R$) *'}
              </label>
              <input
                type="text"
                required
                placeholder={isCustomProject ? "Ex: A partir de R$ 8.500,00" : "Ex: 2500,00"}
                value={formData.finalValue}
                onChange={(e) => setFormData({ ...formData, finalValue: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> 
                {isCustomProject ? 'Briefing do Sistema (Telas, Integrações, Objetivo) *' : 'Detalhes da Oferta / Alinhamentos *'}
              </label>
              <textarea
                required
                rows={5}
                placeholder={isCustomProject 
                  ? "1. Qual o objetivo principal do sistema?\n2. Quais as integrações necessárias (Asaas, WhatsApp, etc)?\n3. Principais telas exigidas pelo cliente..." 
                  : "Descreva o que foi prometido, prazos especiais ou adicionais negociados..."}
                value={formData.offerDetails}
                onChange={(e) => setFormData({ ...formData, offerDetails: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00F5D4] resize-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E2D50] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#111D3A] text-gray-400 hover:text-white border border-[#1E2D50] transition"
            >
              Cancelar
            </button>
            <HoldToSubmitButton 
              onConfirm={handleSubmit} 
              isCustomProject={isCustomProject} 
              loading={loading} 
            />
          </div>
        </form>
      </div>
    </div>
  );
};
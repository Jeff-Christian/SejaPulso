import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { UserPlus, X, AlertCircle } from 'lucide-react';

export const AddAffiliateModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    responsible: '',
    emailUsername: '',
    phone: '',
    pixKey: '',
    password: '123456', // Senha padrão caso não alterada
    tierId: 1
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Monta o e-mail completo obrigatoriamente com @pulsotech.com.br
    const fullEmail = `${formData.emailUsername.trim().toLowerCase()}@pulsotech.com.br`;

    try {
      const token = localStorage.getItem('token');
      await apiRequest('/admin/affiliates', 'POST', {
        ...formData,
        email: fullEmail
      }, token);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao criar consultor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#111D3A] border border-[#1E2D50] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans text-xs text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1E2D50] flex justify-between items-center bg-[#0B132B]">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#00F5D4]" />
            Novo Consultor Direto
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-400 mb-1">Razão Social *</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1">CNPJ *</label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Responsável *</label>
              <input
                type="text"
                required
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
              />
            </div>
          </div>

          {/* E-mail Corporativo Fixado */}
          <div>
            <label className="block text-gray-400 mb-1">E-mail Corporativo *</label>
            <div className="flex items-center bg-[#0B132B] border border-[#1E2D50] rounded-xl overflow-hidden focus-within:border-[#00F5D4]">
              <input
                type="text"
                required
                placeholder="nome.sobrenome"
                value={formData.emailUsername}
                onChange={(e) => setFormData({ ...formData, emailUsername: e.target.value.replace(/[^a-zA-Z0-9._-]/g, '') })}
                className="w-full bg-transparent px-3 py-2 text-white focus:outline-none font-mono"
              />
              <span className="bg-[#1E2D50]/50 text-[#00F5D4] px-3 py-2 font-mono font-bold select-none border-l border-[#1E2D50]">
                @pulsotech.com.br
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Chave Pix</label>
              <input
                type="text"
                value={formData.pixKey}
                onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                placeholder="CNPJ ou Chave Pix"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
              />
            </div>
          </div>

          {/* 🔑 CAMPO DE SENHA INICIAL DE ACESSO */}
          <div>
            <label className="block text-gray-400 mb-1">Senha Inicial de Acesso *</label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-[#1E2D50]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0B132B] text-gray-400 hover:text-white border border-[#1E2D50]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#00F5D4] text-[#0B132B] font-bold hover:opacity-90"
            >
              {loading ? 'Cadastrando...' : 'Criar Consultor'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { UserPlus, AlertCircle, X } from 'lucide-react';

export const AddAffiliateModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    responsible: '',
    email: '',
    phone: '',
    password: '123456'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await apiRequest('/admin/affiliates', 'POST', formData, token);
      onSuccess();
      onClose();
      setFormData({
        companyName: '',
        tradeName: '',
        cnpj: '',
        responsible: '',
        email: '',
        phone: '',
        password: '123456'
      });
    } catch (err) {
      setError(err.message || 'Erro ao cadastrar consultor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#111D3A] border border-[#1E2D50] w-full max-w-lg rounded-2xl p-6 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-[#1E2D50] pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#00F5D4]" />
            Cadastrar Consultor Direto (Sem Aprovação)
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#0B132B] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-medium">Razão Social *</label>
            <input
              type="text"
              required
              placeholder="Ex: Tech Solutions LTDA"
              className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">CNPJ *</label>
              <input
                type="text"
                required
                placeholder="00.000.000/0001-00"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Responsável *</label>
              <input
                type="text"
                required
                placeholder="Nome do contato"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                value={formData.responsible}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">E-mail de Acesso *</label>
              <input
                type="email"
                required
                placeholder="consultor@empresa.com"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Telefone / WhatsApp</label>
              <input
                type="text"
                placeholder="(81) 99999-9999"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#1E2D50]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#0B132B] text-gray-400 hover:text-white border border-[#1E2D50] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#00F5D4] text-[#0B132B] font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar e Liberar (APPROVED)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
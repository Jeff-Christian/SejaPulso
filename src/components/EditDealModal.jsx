import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import { Edit3, Save, X, AlertCircle, CreditCard } from "lucide-react";

export const EditDealModal = ({ deal, isOpen, onClose, onSuccess }) => {
  const [selectedPackage, setSelectedPackage] = useState("START");
  const [finalValue, setFinalValue] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [leadCompanyName, setLeadCompanyName] = useState("");
  const [leadCnpj, setLeadCnpj] = useState("");

  const [saving, setSaving] = useState(false);
  const [generatingCharge, setGeneratingCharge] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (deal) {
      setSelectedPackage(deal.selectedPackage || "START");
      setFinalValue(deal.finalValue || "");
      setOfferDetails(deal.offerDetails || "");
      setLeadCompanyName(deal.lead?.companyName || "");
      setLeadCnpj(deal.lead?.cnpj || "");
      setError("");
    }
  }, [deal]);

  if (!isOpen || !deal) return null;

  // Ação 1: Apenas Salvar Dados do Contrato
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await apiRequest(
        `/admin/deals/${deal.id}`,
        "PUT",
        {
          selectedPackage,
          finalValue,
          offerDetails,
          leadCompanyName,
          leadCnpj,
        },
        token,
      );

      onSuccess("Termos da venda atualizados com sucesso!");
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao atualizar dados da venda.");
    } finally {
      setSaving(false);
    }
  };

  // Ação 2: Salvar Atualizações + Disparar Cobrança de Sinal no Asaas (50%)
  const handleConfirmAndCharge = async () => {
    setGeneratingCharge(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // 1. Salva/Atualiza os dados validados no banco PostgreSQL
      await apiRequest(
        `/admin/deals/${deal.id}`,
        "PUT",
        {
          selectedPackage,
          finalValue,
          offerDetails,
          leadCompanyName,
          leadCnpj,
        },
        token,
      );

      // 2. Dispara a criação do Customer e Cobrança no Asaas (via asaasService.js)
      const chargeResponse = await apiRequest(
        `/admin/deals/${deal.id}/create-charge`,
        "POST",
        null,
        token,
      );

      onSuccess(
        `Venda finalizada! Cobrança de sinal Asaas gerada para ${leadCompanyName}. ID: ${chargeResponse.asaasPaymentId}`,
      );

      // Se houver URL pública do Asaas, abre em nova aba
      if (chargeResponse.paymentUrl) {
        window.open(chargeResponse.paymentUrl, "_blank");
      }

      onClose();
    } catch (err) {
      setError(err.message || "Erro ao emitir cobrança via Asaas.");
    } finally {
      setGeneratingCharge(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#111D3A] border border-[#1E2D50] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#1E2D50] bg-[#0B132B] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#00F5D4]" />
            <h3 className="font-bold text-sm">
              Alinhamento & Finalização de Venda
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSaveChanges} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cliente / Empresa */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">
                Empresa Cliente *
              </label>
              <input
                type="text"
                value={leadCompanyName}
                onChange={(e) => setLeadCompanyName(e.target.value)}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">
                CNPJ do Cliente *
              </label>
              <input
                type="text"
                value={leadCnpj}
                onChange={(e) => setLeadCnpj(e.target.value)}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
                required
              />
            </div>
          </div>

          {/* Pacote e Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">
                Pacote Contratado *
              </label>
              <select
                value={selectedPackage}
                onChange={(e) => setSelectedPackage(e.target.value)}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
              >
                <option value="START">START</option>
                <option value="STANDARD">STANDARD</option>
                <option value="PRO">PRO</option>
                <option value="ENTERPRISE">ENTERPRISE (Sob Medida)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">
                Valor Final Negociado (R$) *
              </label>
              <input
                type="text"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                placeholder="Ex: 1500"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#00F5D4]"
                required
              />
            </div>
          </div>

          {/* Briefing / Observações */}
          <div>
            <label className="block text-gray-400 mb-1 font-medium">
              Briefing / Observações de Alinhamento
            </label>
            <textarea
              rows={3}
              value={offerDetails}
              onChange={(e) => setOfferDetails(e.target.value)}
              className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F5D4]"
              placeholder="Ajustes ou detalhes definidos diretamente com o cliente..."
            />
          </div>

          {/* Footer com Ações Duplas */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#1E2D50]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-[#0B132B] text-gray-400 border border-[#1E2D50] hover:text-white"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              {/* Botão Secundário: Apenas salvar */}
              <button
                type="submit"
                disabled={saving || generatingCharge}
                className="px-3 py-2 rounded-xl bg-[#1E2D50] text-white hover:bg-[#2A3E6D] transition flex items-center gap-1 font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
              </button>

              {/* Botão Primário: Confirmar & Gerar Cobrança (Sinal 50%) */}
              <button
                type="button"
                onClick={handleConfirmAndCharge}
                disabled={saving || generatingCharge}
                className="px-4 py-2 rounded-xl bg-[#00F5D4] text-[#0B132B] font-bold hover:opacity-90 transition flex items-center gap-1.5 shadow-lg shadow-[#00F5D4]/10"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {generatingCharge
                    ? "Gerando Sinal..."
                    : "Confirmar & Gerar Cobrança (Sinal 50%)"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

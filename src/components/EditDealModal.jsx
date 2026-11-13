import React, { useState, useEffect, useRef } from "react";
import { apiRequest } from "../services/api";
import { Edit3, Save, X, AlertCircle, CreditCard } from "lucide-react";
import { parseBRLToCents, formatBRL, splitDeposit } from "../utils/money";
import {
  getGroupedPackagesForSelect,
  getPackageByCode,
} from "../config/serviceCatalog";

export const EditDealModal = ({ deal, isOpen, onClose, onSuccess }) => {
  const [selectedPackage, setSelectedPackage] = useState("START_LP_EXPRESS");
  const [finalValue, setFinalValue] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [leadCompanyName, setLeadCompanyName] = useState("");
  const [leadCnpj, setLeadCnpj] = useState("");

  const [saving, setSaving] = useState(false);
  const [generatingCharge, setGeneratingCharge] = useState(false);
  const [error, setError] = useState("");

  const chargeLock = useRef(false);

  useEffect(() => {
    if (deal) {
      setSelectedPackage(deal.selectedPackage || "START_LP_EXPRESS");
      setFinalValue(deal.finalValue || "");
      setOfferDetails(deal.offerDetails || "");
      setLeadCompanyName(deal.lead?.companyName || "");
      setLeadCnpj(deal.lead?.cnpj || "");
      setError("");
    }
  }, [deal]);

  if (!isOpen || !deal) return null;

  const groupedPackages = getGroupedPackagesForSelect();
  const isLegacyPackageCode =
    selectedPackage &&
    !getPackageByCode(selectedPackage) &&
    ["START", "STANDARD", "PRO", "ENTERPRISE"].includes(selectedPackage);

  const handlePackageChange = (code) => {
    setSelectedPackage(code);
    const pkg = getPackageByCode(code);
    if (pkg) {
      setFinalValue(formatBRL(Math.round(pkg.price * 100)));
    }
  };

  const totalCents = parseBRLToCents(finalValue);
  const split = totalCents ? splitDeposit(totalCents) : null;

  const buildPayload = () => ({
    selectedPackage,
    finalValue: formatBRL(totalCents),
    offerDetails,
    leadCompanyName,
    leadCnpj,
  });

  // Ação 1: Apenas Salvar Dados do Contrato
  const handleSaveChanges = async (e) => {
    if (e) e.preventDefault();
    if (!totalCents) {
      setError("Informe um valor válido, por exemplo 1500 ou 1.500,00.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/admin/deals/${deal.id}`, "PUT", buildPayload(), token);
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
    if (chargeLock.current) return;
    if (!totalCents) {
      setError("Informe um valor válido, por exemplo 1500 ou 1.500,00.");
      return;
    }

    chargeLock.current = true;
    setGeneratingCharge(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      await apiRequest(`/admin/deals/${deal.id}`, "PUT", buildPayload(), token);

      const chargeResponse = await apiRequest(
        `/admin/deals/${deal.id}/create-charge`,
        "POST",
        null,
        token,
      );

      onSuccess(
        `Venda finalizada! Cobrança de sinal Asaas gerada para ${leadCompanyName}. ID: ${chargeResponse.asaasPaymentId}`,
      );

      if (chargeResponse.paymentUrl) {
        window.open(chargeResponse.paymentUrl, "_blank");
      }
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao emitir cobrança via Asaas.");
    } finally {
      chargeLock.current = false;
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
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#00F5D4]"
              >
                {isLegacyPackageCode && (
                  <option value={selectedPackage}>
                    {selectedPackage} (Legado — selecione abaixo para padronizar)
                  </option>
                )}
                {groupedPackages.map((group) => (
                  <optgroup key={group.planId} label={group.planLabel}>
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">
                Valor Final Negociado (R$) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={finalValue}
                onChange={(e) => setFinalValue(e.target.value)}
                onBlur={() => totalCents && setFinalValue(formatBRL(totalCents))}
                placeholder="Ex: 1.500,00"
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#00F5D4]"
                required
              />
              {finalValue && !totalCents ? (
                <p className="mt-1 text-[10px] text-red-400">
                  Valor não reconhecido.
                </p>
              ) : split ? (
                <p className="mt-1 text-[10px] text-gray-400 font-mono">
                  Sinal agora:{" "}
                  <span className="text-[#00F5D4]">
                    {formatBRL(split.deposit)}
                  </span>
                  {" · "}Restante: {formatBRL(split.balance)}
                </p>
              ) : null}
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
              <button
                type="submit"
                disabled={saving || generatingCharge || !totalCents}
                className="px-3 py-2 rounded-xl bg-[#1E2D50] text-white hover:bg-[#2A3E6D] transition flex items-center gap-1 font-medium"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndCharge}
                disabled={saving || generatingCharge || !totalCents}
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
import React, { useState, useEffect } from "react";
import { apiRequest } from "../services/api";
import {
  X,
  CheckCircle2,
  DollarSign,
  FileText,
  AlertCircle,
  Package,
  Clock,
  Lock,
} from "lucide-react";
import { HoldToSubmitButton } from "./HoldToSubmitButton";
import {
  getGroupedPackagesForSelect,
  getPackageByCode,
} from "../config/serviceCatalog";

export const SalesHandoverModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    selectedPackage: "",
    finalValue: "",
    offerDetails: "",
  });

  // Se o lead já tiver um pacote sugerido registrado, pré-seleciona ao abrir
  useEffect(() => {
    if (isOpen && lead) {
      const preselected = lead.suggestedPackageCode
        ? getPackageByCode(lead.suggestedPackageCode)
        : null;

      setFormData({
        selectedPackage: preselected ? preselected.code : "",
        finalValue: preselected
          ? preselected.price.toFixed(2).replace(".", ",")
          : "",
        offerDetails: "",
      });
      setError("");
    }
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const groupedPackages = getGroupedPackagesForSelect();
  const selectedPkgObj = getPackageByCode(formData.selectedPackage);
  const isCustomProject =
    selectedPkgObj?.plan === "ENTERPRISE" ||
    formData.selectedPackage === "ENTERPRISE";
  const isFixedPricePackage = Boolean(
    selectedPkgObj && !selectedPkgObj.isStartingPrice,
  );

  const handlePackageChange = (code) => {
    const pkg = getPackageByCode(code);
    setFormData((prev) => ({
      ...prev,
      selectedPackage: code,
      finalValue: pkg ? pkg.price.toFixed(2).replace(".", ",") : "",
    }));
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      await apiRequest(`/leads/${lead.id}/handover`, "POST", formData, token);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Erro ao enviar dados de fechamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-[#111D3A] border border-[#1E2D50] w-full max-w-lg rounded-2xl flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-6 border-b border-[#1E2D50] flex justify-between items-center bg-[#0B132B]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00F5D4]" />
              {isCustomProject
                ? "Briefing de Projeto (Enterprise)"
                : "Solicitar Fechamento de Venda"}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Empresa:{" "}
              <strong className="text-white">{lead.companyName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#111D3A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 text-xs text-white"
        >
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Pacote ou Serviço Vendido *
              </label>
              <select
                required
                value={formData.selectedPackage}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00F5D4]"
              >
                <option value="" disabled>
                  Selecione o serviço do cardápio...
                </option>
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

            {isCustomProject && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-amber-400">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Atenção ao SLA:</strong> Análise técnica exigida.
                  Não passe orçamento fechado ao cliente — retorno da Pulso
                  Tech em <strong>24h a 48h úteis</strong>.
                </p>
              </div>
            )}

            <div>
              <label className="block text-gray-400 mb-1.5 font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  {isCustomProject
                    ? "Expectativa de Orçamento (R$) *"
                    : "Valor Oficial do Pacote (R$) *"}
                </span>
                {isFixedPricePackage && (
                  <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#00F5D4]" /> Tabela fixa
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                readOnly={isFixedPricePackage}
                placeholder={
                  isCustomProject ? "Ex: A partir de 8.500,00" : "Ex: 1.500,00"
                }
                value={formData.finalValue}
                onChange={(e) =>
                  setFormData({ ...formData, finalValue: e.target.value })
                }
                className={`w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2.5 font-mono focus:outline-none ${
                  isFixedPricePackage
                    ? "text-emerald-400 font-bold cursor-not-allowed opacity-90"
                    : "text-white focus:border-[#00F5D4]"
                }`}
              />
              {isFixedPricePackage && (
                <p className="mt-1 text-[10px] text-gray-400">
                  Variações de escopo ou valor são avaliadas exclusivamente
                  pelo financeiro antes da cobrança de 50%.
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {isCustomProject
                  ? "Briefing do Sistema *"
                  : "Detalhes da Oferta / Alinhamentos *"}
              </label>
              <textarea
                required
                rows={4}
                placeholder={
                  isCustomProject
                    ? "Descreva os requisitos, integrações e regras de negócio..."
                    : "Descreva os alinhamentos combinados com o cliente..."
                }
                value={formData.offerDetails}
                onChange={(e) =>
                  setFormData({ ...formData, offerDetails: e.target.value })
                }
                className="w-full bg-[#0B132B] border border-[#1E2D50] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#00F5D4] resize-none"
              />
            </div>
          </div>

          {/* Footer & Botão de Envio (HoldToSubmitButton) */}
          <div className="pt-4 border-t border-[#1E2D50] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#111D3A] text-gray-400 hover:text-white border border-[#1E2D50] transition font-bold"
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
import React, { useState } from "react";
import { MapPin, Phone, Mail, Lock, CheckCircle2, ShieldAlert } from "lucide-react";
import { apiRequest } from "../services/api";
import { PitchPanel } from "./PitchPanel";

export const LeadCard = ({ leadData, onLeadClaimed }) => {
  const [claiming, setClaiming] = useState(false);

  if (!leadData) return null;

  const isBlocked =
    leadData.status === "BLOCKED" || (leadData.isClaimed && !leadData.isOwnedByMe);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await apiRequest("/leads/claim", "POST", {
        cnpj: leadData.cnpj,
        companyName: leadData.companyName,
        contactPhone: leadData.officialPhone,
      });
      alert("Lead agendado e reservado no seu nome com sucesso!");
      if (onLeadClaimed) onLeadClaimed();
    } catch (err) {
      alert(err.message || "Erro ao agendar este lead.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="bg-[#0B132B] border border-[#1E2D50] rounded-2xl p-6 space-y-6 shadow-2xl font-sans">
      {/* 1. Header do Card & Status de Paternidade */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#1E2D50] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-white">{leadData.companyName}</h3>
            {leadData.tradeName && leadData.tradeName !== leadData.companyName && (
              <span className="text-xs text-gray-400 font-mono">({leadData.tradeName})</span>
            )}
          </div>
          <p className="text-xs text-[#00F5D4] font-mono mt-0.5">CNPJ: {leadData.cnpj}</p>
        </div>

        <div>
          {isBlocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Reservado por: {leadData.claimedByConsultant || "Outro Consultor"}</span>
            </span>
          ) : leadData.isOwnedByMe ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Reservado na Sua Carteira</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Disponível no Pool</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Informações Cadastrais Públicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111D3A] p-4 rounded-xl border border-[#1E2D50]">
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">Ramo / CNAE Principal</span>
          <p className="font-semibold text-gray-200 mt-0.5 text-xs">
            {leadData.cnaeDescription || "Atividade Comercial"}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">Localização</span>
          <p className="font-semibold text-gray-200 flex items-center gap-1 mt-0.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#00F5D4]" />
            {leadData.location}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">Telefone Oficial</span>
          <p className="font-mono text-gray-300 flex items-center gap-1 mt-0.5 text-xs">
            <Phone className="w-3.5 h-3.5 text-gray-500" />
            {leadData.officialPhone}
          </p>
        </div>
        <div>
          <span className="text-gray-400 font-mono text-[10px] uppercase">E-mail Oficial</span>
          <p className="font-mono text-gray-300 flex items-center gap-1 mt-0.5 text-xs break-all">
            <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            {leadData.officialEmail}
          </p>
        </div>
      </div>

      {/* 3. Co-piloto de vendas */}
      {leadData.intelligence && (
        <PitchPanel
          key={leadData.cnpj}
          intelligence={leadData.intelligence}
          cnpj={leadData.cnpj}
          canGenerate={!isBlocked}
        />
      )}

      {/* 4. Rodapé & Botão de Reserva */}
      <div className="pt-2 flex justify-end">
        {isBlocked ? (
          <div className="flex items-center gap-2 text-xs text-red-400 font-mono bg-red-500/5 border border-red-500/20 px-4 py-2 rounded-xl">
            <ShieldAlert className="w-4 h-4" />
            <span>Oportunidade reservada por outro consultor da rede.</span>
          </div>
        ) : leadData.isOwnedByMe ? (
          <span className="text-xs text-emerald-400 font-mono">
            Este lead já está na sua aba "Meus Agendamentos".
          </span>
        ) : (
          <button
            type="button"
            onClick={handleClaim}
            disabled={claiming}
            className="bg-[#00F5D4] hover:bg-[#00d6b9] text-[#0B132B] font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{claiming ? "Reservando..." : "Reservar Lead no Meu Nome (Claim)"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
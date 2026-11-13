import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { apiRequest } from "../services/api";
import { PitchPanel } from "./PitchPanel";

export const PitchModal = ({ lead, isOpen, onClose }) => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const leadId = lead?.id;

  useEffect(() => {
    if (!isOpen || !leadId) return;
    let active = true;
    setIntelligence(null);
    setError("");
    setLoading(true);

    apiRequest(`/leads/${leadId}/pitch`, "GET")
      .then((d) => active && setIntelligence(d.intelligence))
      .catch((e) => active && setError(e.message || "Erro ao carregar a abordagem."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [isOpen, leadId]);

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-start p-4 overflow-y-auto">
      <div className="bg-[#0B132B] border border-[#1E2D50] w-full max-w-2xl rounded-2xl shadow-2xl my-8 font-sans text-white">
        <div className="p-5 border-b border-[#1E2D50] flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-[#00F5D4] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm truncate">Abordagem · {lead.companyName}</h3>
              <p className="text-[10px] text-gray-400 font-mono">CNPJ: {lead.cnpj}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <p className="text-center text-xs text-gray-400 font-mono py-8">Carregando abordagem...</p>
          )}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs">
              {error}
            </div>
          )}
          {intelligence && (
            <PitchPanel intelligence={intelligence} cnpj={lead.cnpj} canGenerate />
          )}
        </div>
      </div>
    </div>
  );
};
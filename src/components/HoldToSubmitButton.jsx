import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export const HoldToSubmitButton = ({ onConfirm, isCustomProject, loading }) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);
  const HOLD_DURATION = 2000; // 2 segundos

  useEffect(() => {
    if (isHolding) {
      const startTime = Date.now();
      holdTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const currentProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
        setProgress(currentProgress);

        if (currentProgress === 100) {
          clearInterval(holdTimerRef.current);
          setIsHolding(false);
          onConfirm(); // Dispara o envio do formulário
        }
      }, 50);
    } else {
      clearInterval(holdTimerRef.current);
      setProgress(0);
    }
    return () => clearInterval(holdTimerRef.current);
  }, [isHolding, onConfirm]);

  const buttonColor = isCustomProject ? 'bg-amber-400' : 'bg-[#00F5D4]';

  return (
    <button
      type="button"
      onMouseDown={() => setIsHolding(true)}
      onMouseUp={() => setIsHolding(false)}
      onMouseLeave={() => setIsHolding(false)}
      onTouchStart={() => setIsHolding(true)}
      onTouchEnd={() => setIsHolding(false)}
      disabled={loading}
      className={`relative overflow-hidden px-5 py-2 rounded-xl font-bold text-[#0B132B] transition select-none flex items-center gap-2 shadow-lg disabled:opacity-50 ${buttonColor}`}
    >
      {/* Barra de progresso preenchendo o fundo */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-white/40 transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10 flex items-center gap-2">
        <Send className="w-4 h-4" />
        {loading ? 'Enviando...' : (progress > 0 ? 'Segure para confirmar...' : 'Segure 2s para Enviar')}
      </span>
    </button>
  );
};
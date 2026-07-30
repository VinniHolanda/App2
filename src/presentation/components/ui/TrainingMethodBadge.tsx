import React, { useState } from 'react';
import { TRAINING_METHODS_CATALOG, evaluateMethodForClient } from '../../../domain/trainingMethods';
import { ClientLevel, TrainingGoal } from '../../../domain/types';
import { Zap, Info, AlertTriangle, X, Check, BookOpen, Target, Sparkles, ShieldCheck } from 'lucide-react';

interface TrainingMethodBadgeProps {
  methodKeyOrName?: string;
  clientLevel?: ClientLevel | string;
  periodizationPhase?: string;
  goal?: TrainingGoal | string;
  showDetailsOnClick?: boolean;
}

export const TrainingMethodBadge: React.FC<TrainingMethodBadgeProps> = ({
  methodKeyOrName,
  clientLevel = 'Intermediário',
  periodizationPhase = 'Base',
  goal = 'Ganho de massa (hipertrofia)',
  showDetailsOnClick = true
}) => {
  const [showModal, setShowModal] = useState(false);

  if (!methodKeyOrName) return null;

  const methodDef = TRAINING_METHODS_CATALOG.find(
    m => m.id === methodKeyOrName || m.name.toLowerCase().includes(methodKeyOrName.toLowerCase())
  );

  const displayName = methodDef ? methodDef.name : methodKeyOrName;
  const evaluation = methodDef ? evaluateMethodForClient(methodDef.id, clientLevel, periodizationPhase, goal) : null;

  const isWarning = evaluation && !evaluation.isAllowed;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (showDetailsOnClick) setShowModal(true);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer group ${
          isWarning
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
            : methodDef?.tier === 'elite'
            ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
            : methodDef?.tier === 'avancado'
            ? 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25'
            : 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20'
        }`}
        title={methodDef ? `Método: ${methodDef.name} | Objetivo: ${methodDef.goal}` : 'Método de treino'}
      >
        <Zap className="w-3 h-3 shrink-0" />
        <span className="truncate max-w-[150px]">{displayName}</span>
        {isWarning && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
      </button>

      {/* Method Info Popover / Modal */}
      {showModal && methodDef && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-[#0f172a] border-2 border-[#00f0ff]/40 rounded-3xl p-5 md:p-6 max-w-lg w-full shadow-2xl space-y-4 text-[#f1f5f9]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff] flex items-center gap-1">
                    <span>MÉTODO DE TREINAMENTO</span>
                    <span>•</span>
                    <span className="text-[#94a3b8]">{methodDef.tier.toUpperCase()}</span>
                  </div>
                  <h3 className="text-lg font-black font-display text-white">
                    {methodDef.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Highlight: Objetivo do Método & Alignment */}
            <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-[#00f0ff] uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#00f0ff]" />
                  <span>Objetivo do Método:</span>
                </div>
                {evaluation?.score && evaluation.score >= 80 && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Alinhado à Fase
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-white leading-snug">
                {methodDef.goal}
              </div>
              {evaluation?.reason && (
                <p className="text-[11px] text-[#00f0ff]/80 font-sans italic">
                  💡 {evaluation.reason}
                </p>
              )}
            </div>

            {/* Warning Alert if incompatible */}
            {isWarning && evaluation?.warning && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <div className="font-bold">Aviso de Compatibilidade</div>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
                    {evaluation.warning}
                  </p>
                </div>
              </div>
            )}

            {/* Practical Application Box */}
            <div className="bg-[#080b11] border border-[#1e293b] rounded-2xl p-4 space-y-2">
              <div className="text-xs font-bold text-[#00f0ff] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Aplicação Prática & Protocolo:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {methodDef.practicalApplication}
              </p>
            </div>

            {/* Context Tags Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#1e293b]/60 rounded-xl p-2.5 border border-[#334155]/50">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Fase da Periodização</span>
                <span className="font-bold text-[#f1f5f9]">{methodDef.periodizationPhase.join(', ')}</span>
              </div>
              <div className="bg-[#1e293b]/60 rounded-xl p-2.5 border border-[#334155]/50">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Nível Indicado</span>
                <span className="font-bold text-[#f1f5f9]">{methodDef.targetLevels.join(', ')}</span>
              </div>
              <div className="bg-[#1e293b]/60 rounded-xl p-2.5 border border-[#334155]/50">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Categoria</span>
                <span className="font-bold text-[#f1f5f9] capitalize">{methodDef.category}</span>
              </div>
              <div className="bg-[#1e293b]/60 rounded-xl p-2.5 border border-[#334155]/50">
                <span className="text-[10px] text-[#94a3b8] uppercase font-bold block">Fase Atual Aluno</span>
                <span className="font-bold text-[#00f0ff]">{periodizationPhase}</span>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs py-2.5 rounded-xl transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

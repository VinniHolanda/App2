import React, { useState } from 'react';
import { 
  TRAINING_METHODS_CATALOG, 
  TrainingMethodDefinition, 
  evaluateMethodForClient,
  MethodCategory 
} from '../../../domain/trainingMethods';
import { ClientLevel, TrainingGoal } from '../../../domain/types';
import { 
  Zap, 
  Search, 
  Filter, 
  X, 
  Check, 
  AlertTriangle, 
  BookOpen, 
  ShieldCheck, 
  Sliders, 
  Sparkles,
  Info
} from 'lucide-react';

interface TrainingMethodsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientLevel?: ClientLevel;
  periodizationPhase?: string;
  goal?: TrainingGoal;
  onSelectMethod?: (method: TrainingMethodDefinition) => void;
}

export const TrainingMethodsGuideModal: React.FC<TrainingMethodsGuideModalProps> = ({
  isOpen,
  onClose,
  clientLevel = 'Intermediário',
  periodizationPhase = 'Base',
  goal = 'Ganho de massa (hipertrofia)',
  onSelectMethod
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('todos');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('todos');
  const [selectedMethod, setSelectedMethod] = useState<TrainingMethodDefinition | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'todos', label: 'Todos os Métodos' },
    { id: 'hipertrofia', label: 'Hipertrofia' },
    { id: 'forca', label: 'Força' },
    { id: 'metabolico', label: 'Estresse Metabólico' },
    { id: 'potencia', label: 'Potência' },
    { id: 'reabilitacao', label: 'Reabilitação' },
    { id: 'geral', label: 'Gerais / Fundamentos' }
  ];

  const filteredMethods = TRAINING_METHODS_CATALOG.filter(m => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchApp = m.practicalApplication.toLowerCase().includes(q);
      const matchGoal = m.goal.toLowerCase().includes(q);
      const matchTags = m.tags.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchApp && !matchGoal && !matchTags) return false;
    }

    // Category
    if (selectedCategory !== 'todos' && m.category !== selectedCategory) {
      return false;
    }

    // Level
    if (selectedLevelFilter !== 'todos' && !m.targetLevels.some(l => l.toLowerCase().includes(selectedLevelFilter.toLowerCase()))) {
      return false;
    }

    // Phase
    if (selectedPhaseFilter !== 'todos' && !m.periodizationPhase.some(p => p.toLowerCase().includes(selectedPhaseFilter.toLowerCase()))) {
      return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-[#080b11] border-2 border-[#00f0ff]/40 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#f1f5f9]">
        {/* Modal Top Bar */}
        <div className="bg-[#0f172a] border-b border-[#1e293b] p-4 sm:p-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00f0ff] text-[#080b11] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SISTEMA DE MÉTODOS DE TREINAMENTO (28 MÉTODOS)
                </span>
                <span className="text-xs text-[#94a3b8] hidden sm:inline">
                  Matriz de Periodização Inteligente
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white mt-0.5">
                Guia Estratégico de Prescrição & Tabela de Métodos
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-[#94a3b8] hover:text-white hover:bg-[#1e293b] transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters Header */}
        <div className="bg-[#0f172a]/70 border-b border-[#1e293b] p-4 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Buscar método (ex: drop-set, SST, FST-7, 21...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#080b11] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#64748b] outline-none transition-all"
              />
            </div>

            {/* Context Pill */}
            <div className="flex items-center gap-2 text-xs bg-[#1e293b]/60 px-3 py-1.5 rounded-xl border border-[#334155]/50 w-full sm:w-auto overflow-x-auto">
              <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
              <span className="text-[#94a3b8]">Contexto Aluno:</span>
              <span className="font-bold text-[#00f0ff]">{clientLevel}</span>
              <span className="text-[#64748b]">•</span>
              <span className="font-bold text-white">{periodizationPhase}</span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#00f0ff] text-[#080b11] shadow-md shadow-[#00f0ff]/20'
                    : 'bg-[#1e293b] hover:bg-[#334155] text-[#94a3b8] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Grid of Methods */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMethods.map((m) => {
              const evaluation = evaluateMethodForClient(m.id, clientLevel, periodizationPhase, goal);
              const isAllowed = evaluation.isAllowed;
              const isRecommended = evaluation.score >= 80;

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMethod(m)}
                  className={`bg-[#0f172a] border rounded-2xl p-4 flex flex-col justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] ${
                    !isAllowed
                      ? 'border-amber-500/30 opacity-75 hover:border-amber-500/60'
                      : isRecommended
                      ? 'border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10'
                      : 'border-[#1e293b] hover:border-[#00f0ff]/40'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-white font-display flex items-center gap-1.5">
                        <Zap className={`w-3.5 h-3.5 shrink-0 ${isRecommended ? 'text-[#00f0ff]' : 'text-[#94a3b8]'}`} />
                        <span>{m.name}</span>
                      </div>

                      {/* Score or Warning badge */}
                      {!isAllowed ? (
                        <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          Restrito
                        </span>
                      ) : isRecommended ? (
                        <span className="bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-black px-2 py-0.5 rounded-full shrink-0">
                          ⭐ Recomendado
                        </span>
                      ) : null}
                    </div>

                    {/* Objective */}
                    <div className="text-[11px] text-[#00f0ff] font-semibold">
                      Objetivo: {m.goal}
                    </div>

                    {/* Practical Application */}
                    <p className="text-xs text-[#94a3b8] line-clamp-3 leading-relaxed">
                      {m.practicalApplication}
                    </p>
                  </div>

                  {/* Footer metadata */}
                  <div className="border-t border-[#1e293b] pt-2.5 flex items-center justify-between text-[10px] text-[#64748b]">
                    <div>
                      <span className="text-[#94a3b8] font-bold">Fase: </span>
                      <span>{m.periodizationPhase.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-[#94a3b8] font-bold">Para: </span>
                      <span>{m.targetLevels.join(', ')}</span>
                    </div>
                  </div>

                  {onSelectMethod && isAllowed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMethod(m);
                        onClose();
                      }}
                      className="w-full bg-[#00f0ff] hover:bg-[#00d0df] text-[#080b11] font-bold text-xs py-1.5 rounded-xl transition-all mt-1"
                    >
                      Aplicar no Exercício →
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {filteredMethods.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Info className="w-10 h-10 text-[#64748b] mx-auto" />
              <p className="text-sm text-[#94a3b8]">
                Nenhum método encontrado para os filtros selecionados.
              </p>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="bg-[#0f172a] border-t border-[#1e293b] p-4 text-xs text-[#94a3b8] flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
            <span>
              <strong>Insight Elite:</strong> Os métodos são ferramentas estratégicas dentro da periodização — evite usá-los como receitas fixas fora de fase.
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#1e293b] hover:bg-[#334155] text-white font-bold px-4 py-1.5 rounded-xl transition-all shrink-0"
          >
            Fechar Guia
          </button>
        </div>
      </div>

      {/* Method Detail Drawer / Popover when clicked */}
      {selectedMethod && (
        <div 
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMethod(null)}
        >
          <div 
            className="bg-[#0f172a] border-2 border-[#00f0ff] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-white animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff]">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg font-display">{selectedMethod.name}</h3>
              </div>
              <button
                onClick={() => setSelectedMethod(null)}
                className="p-1 rounded-lg text-[#94a3b8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#00f0ff] font-bold block mb-1">OBJETIVO PRINCIPAL</span>
                <p className="text-slate-200">{selectedMethod.goal}</p>
              </div>

              <div>
                <span className="text-[#00f0ff] font-bold block mb-1">APLICAÇÃO PRÁTICA</span>
                <div className="bg-[#080b11] p-3 rounded-xl border border-[#1e293b] text-slate-300 leading-relaxed font-sans">
                  {selectedMethod.practicalApplication}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-[#1e293b] p-2 rounded-lg">
                  <span className="text-[10px] text-[#94a3b8] font-bold block">Fase da Periodização</span>
                  <span className="font-bold text-white">{selectedMethod.periodizationPhase.join(', ')}</span>
                </div>
                <div className="bg-[#1e293b] p-2 rounded-lg">
                  <span className="text-[10px] text-[#94a3b8] font-bold block">Para quem</span>
                  <span className="font-bold text-white">{selectedMethod.targetLevels.join(', ')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {onSelectMethod && (
                <button
                  onClick={() => {
                    onSelectMethod(selectedMethod);
                    setSelectedMethod(null);
                    onClose();
                  }}
                  className="flex-1 bg-[#00f0ff] hover:bg-[#00d0df] text-[#080b11] font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  Usar Este Método
                </button>
              )}
              <button
                onClick={() => setSelectedMethod(null)}
                className="bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

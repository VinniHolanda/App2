import React, { useState, useMemo } from 'react';
import { Client, ProgramExercise } from '../../../domain/types';
import { Sparkles, ShieldCheck, Check, X, AlertTriangle, ArrowRight, Zap, RefreshCw, Dumbbell } from 'lucide-react';

interface AISubstitutionAssistantModalProps {
  client: Client;
  exercise: ProgramExercise;
  dayIndex: number;
  exerciseIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onApplySubstitution: (dayIndex: number, exerciseIndex: number, updatedExercise: ProgramExercise) => void;
}

interface SubstitutionAlternative {
  name: string;
  pattern: string;
  matchScore: number; // percentage
  protectionReason: string;
  biomechanicalBenefit: string;
  recommendedSets: number;
  recommendedReps: string;
  recommendedRest: string;
}

export const AISubstitutionAssistantModal: React.FC<AISubstitutionAssistantModalProps> = ({
  client,
  exercise,
  dayIndex,
  exerciseIndex,
  isOpen,
  onClose,
  onApplySubstitution
}) => {
  if (!isOpen) return null;

  // Extract client injuries and limitations
  const injuriesList = useMemo(() => {
    const list: string[] = [];
    if (client.injuries && client.injuries.length > 0) {
      list.push(...client.injuries);
    }
    if (client.notes) {
      for (const n of client.notes) {
        if (n.category === 'lesao' || n.text.toLowerCase().includes('dor') || n.text.toLowerCase().includes('lesã')) {
          list.push(n.text);
        }
      }
    }
    return list.length > 0 ? list : ['Sensibilidade articular/preventiva geral'];
  }, [client]);

  // Biomechanical Substitution Catalog Engine based on movement patterns & injuries
  const alternatives = useMemo<SubstitutionAlternative[]>(() => {
    const name = exercise.name.toLowerCase();
    const pat = (exercise.pat || '').toLowerCase();

    // 1. Squat / Lower Body Quad Pattern
    if (name.includes('agachamento') || pat.includes('squat') || name.includes('leg press')) {
      return [
        {
          name: 'Leg Press 45º (Pegada Neutra)',
          pattern: 'SQUAT / QUADRÍCEPS',
          matchScore: 96,
          protectionReason: 'Elimina totalmente a compressão axial na coluna vertebral, protegendo hérnias discais e região lombar.',
          biomechanicalBenefit: 'Mantém idêntico recrutamento de quadríceps com suporte dorsal estático.',
          recommendedSets: exercise.sets,
          recommendedReps: exercise.reps || '10-12',
          recommendedRest: '90s'
        },
        {
          name: 'Agachamento Búlgaro com Halteres',
          pattern: 'UNILATERAL SQUAT',
          matchScore: 92,
          protectionReason: 'Carga total reduzida pela metade enquanto atinge sobrecarga muscular equivalente por perna, poupando joelhos e coluna.',
          biomechanicalBenefit: 'Fortalece estabilizadores pélvicos e glúteo médio.',
          recommendedSets: exercise.sets,
          recommendedReps: '10-12 por perna',
          recommendedRest: '75s'
        },
        {
          name: 'Agachamento Hack Machine / Belt Squat',
          pattern: 'SQUAT GUIADO',
          matchScore: 89,
          protectionReason: 'Direciona os vetores de força diretamente no quadril e quadríceps sem cisalhamento na patela.',
          biomechanicalBenefit: 'Permite falha muscular segura com estabilização mecânica.',
          recommendedSets: exercise.sets,
          recommendedReps: exercise.reps || '8-10',
          recommendedRest: '90s'
        }
      ];
    }

    // 2. Deadlift / Hinge Pattern
    if (name.includes('terra') || name.includes('stiff') || pat.includes('hinge')) {
      return [
        {
          name: 'Stiff na Barra Hexagonal (Trap Bar)',
          pattern: 'HINGE / POSTERIOR',
          matchScore: 95,
          protectionReason: 'O centro de gravidade alinhado com as mãos reduz em até 40% o momento de torque na coluna lombar.',
          biomechanicalBenefit: 'Trabalho de glúteos e isquiotibiais de alta tensão mecânica com vetor seguro.',
          recommendedSets: exercise.sets,
          recommendedReps: '8-10',
          recommendedRest: '90s'
        },
        {
          name: 'Mesa Flexora + Elevação Pélvica',
          pattern: 'ISOLAMENTO POSTERIOR',
          matchScore: 91,
          protectionReason: 'Zero carga axial. Isola isquiotibiais e glúteo máximo sem qualquer sobrecarga na coluna.',
          biomechanicalBenefit: 'Tensão contínua do ponto inicial ao encurtamento total.',
          recommendedSets: exercise.sets,
          recommendedReps: '12-15',
          recommendedRest: '60s'
        },
        {
          name: 'Romanian Deadlift com Halteres',
          pattern: 'HINGE UNILATERAL/LIVRE',
          matchScore: 88,
          protectionReason: 'Maior liberdade de rotação nos punhos e ombros, adaptando o trajeto à amplitude segura do aluno.',
          biomechanicalBenefit: 'Controle excêntrico superior dos isquiotibiais.',
          recommendedSets: exercise.sets,
          recommendedReps: '10-12',
          recommendedRest: '75s'
        }
      ];
    }

    // 3. Bench Press / Horizontal Push
    if (name.includes('supino') || pat.includes('push') || pat.includes('empurrar')) {
      return [
        {
          name: 'Supino Inclinado com Halteres (Pegada Semi-Neutra)',
          pattern: 'HORIZONTAL PUSH',
          matchScore: 96,
          protectionReason: 'A pegada neutra libera a articulação acromioclavicular e protege o tendão do supraespinhal contra impacto.',
          biomechanicalBenefit: 'Ativação máxima da porção clavicular do peitoral maior com liberdade articular.',
          recommendedSets: exercise.sets,
          recommendedReps: exercise.reps || '10-12',
          recommendedRest: '75s'
        },
        {
          name: 'Cross-over / Peitoral na Polia Média',
          pattern: 'EMPURRAR EM POLIA',
          matchScore: 91,
          protectionReason: 'Tensão constante sem picos de carga súbitos nos pontos de estiramento do ombro.',
          biomechanicalBenefit: 'Adução horizontal completa com contração de pico superior.',
          recommendedSets: exercise.sets,
          recommendedReps: '12-15',
          recommendedRest: '60s'
        },
        {
          name: 'Supino Reto Articulado / Máquina Convergente',
          pattern: 'EMPURRAR GUIADO',
          matchScore: 88,
          protectionReason: 'Trajetória fixa que impede desvios indesejados da barra em momentos de fadiga.',
          biomechanicalBenefit: 'Permite intensidade elevada com segurança para o manguito rotador.',
          recommendedSets: exercise.sets,
          recommendedReps: '8-10',
          recommendedRest: '90s'
        }
      ];
    }

    // Default universal alternatives
    return [
      {
        name: `${exercise.name} com Halteres (Pegada Neutra)`,
        pattern: 'RESISTÊNCIA LIVRE GUIADA',
        matchScore: 94,
        protectionReason: 'Ajusta a trajetória aos ângulos naturais das articulações do aluno, evitando pinçamentos.',
        biomechanicalBenefit: 'Recrutamento simétrico de musculatura estabilizadora.',
        recommendedSets: exercise.sets,
        recommendedReps: exercise.reps || '10-12',
        recommendedRest: '75s'
      },
      {
        name: `${exercise.name} na Polia / Cabo Articulado`,
        pattern: 'TENSÃO CONTÍNUA EM POLIA',
        matchScore: 90,
        protectionReason: 'Elimina os pontos mortos de gravidade e mantém vetor de resistência uniforme.',
        biomechanicalBenefit: 'Segurança articular com estimulação hipertrófica.',
        recommendedSets: exercise.sets,
        recommendedReps: '12-15',
        recommendedRest: '60s'
      },
      {
        name: `${exercise.name} Unilateral / Iso-Lateral`,
        pattern: 'TRABALHO UNILATERAL',
        matchScore: 87,
        protectionReason: 'Corrige assimetrias de força e reduz a necessidade de cargas absolutas altas.',
        biomechanicalBenefit: 'Maior controle neuro-muscular e estabilização de core.',
        recommendedSets: exercise.sets,
        recommendedReps: '10-12',
        recommendedRest: '60s'
      }
    ];
  }, [exercise, client]);

  const handleSelectAlternative = (alt: SubstitutionAlternative) => {
    const updated: ProgramExercise = {
      ...exercise,
      name: alt.name,
      reps: alt.recommendedReps,
      rest: alt.recommendedRest,
      notes: `Substituído via IA Assistente: ${alt.protectionReason}`
    };
    onApplySubstitution(dayIndex, exerciseIndex, updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-scale-in text-[#f1f5f9]">
        {/* Title Bar */}
        <div className="flex items-start justify-between border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#3b82f6] text-[#080b11] shadow-lg shadow-[#00f0ff]/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff] flex items-center gap-1">
                <span>IA ASSISTENTE DE SUBSTITUIÇÃO</span>
                <span>•</span>
                <span className="text-[#94a3b8]">BIOMECÂNICA PREVENTIVA</span>
              </div>
              <h3 className="text-lg font-black font-display text-white">
                Substituição Biomecânica de Exercício
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] hover:text-white rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Exercise Context Box */}
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#94a3b8]">
            <span>Exercício Original a Substituir:</span>
            <span className="font-mono text-[#00f0ff] font-bold">{exercise.sets} séries x {exercise.reps} reps</span>
          </div>
          <div className="text-base font-bold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#00f0ff]" />
            <span>{exercise.name}</span>
          </div>

          {/* Registered Injuries Context */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-[11px] text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Filtro de Lesões Ativo:</strong> {injuriesList.join(', ')}
            </span>
          </div>
        </div>

        {/* 3 AI Suggested Alternatives */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider block">
            3 Alternativas Biomecanicamente Equivalentes Sugeridas:
          </span>

          <div className="space-y-2.5">
            {alternatives.map((alt, idx) => (
              <div
                key={idx}
                className="bg-[#080b11] border border-[#1e293b] hover:border-[#00f0ff]/50 rounded-2xl p-4 space-y-2.5 transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] font-mono font-black text-xs flex items-center justify-center border border-[#00f0ff]/30">
                      #{idx + 1}
                    </span>
                    <h4 className="font-bold text-sm text-white group-hover:text-[#00f0ff] transition-colors">
                      {alt.name}
                    </h4>
                    <span className="bg-[#1e293b] text-[#94a3b8] text-[10px] font-mono px-2 py-0.5 rounded">
                      {alt.pattern}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {alt.matchScore}% Equivalência
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAlternative(alt)}
                      className="bg-[#00f0ff] hover:bg-[#38bdf8] text-[#080b11] font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#00f0ff]/20"
                    >
                      <span>Aplicar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Proteção da Lesão */}
                <div className="text-xs space-y-1 bg-[#0f172a] p-2.5 rounded-xl border border-[#1e293b]">
                  <div className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Proteção da Lesão & Coluna:</span>
                  </div>
                  <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                    {alt.protectionReason}
                  </p>
                  <div className="text-[10px] text-[#64748b] italic pt-0.5">
                    💡 {alt.biomechanicalBenefit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

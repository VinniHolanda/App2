import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, Flame, Zap, AlertTriangle, RefreshCw, Sparkles, 
  Clock, Timer, Check, ArrowUpRight, TrendingUp, HelpCircle, 
  Volume2, VolumeX, ShieldAlert, Play, Pause, X
} from 'lucide-react';
import { Button, Modal, Badge } from '../ui/Primitives';
import { 
  getExerciseSubstitutes, 
  get4WeekExerciseHistory, 
  ExerciseSubstitute, 
  ExerciseTrendData, 
  PRCheckResult, 
  FatigueCheckResult, 
  AutoRegulateResult 
} from '../../../domain/exerciseSubstitutes';
import { Client } from '../../../domain/types';

/* ==================================================================== */
/* 1. SPARKLINE MICRO-CHART FOR 4-WEEK EXERCISE LOAD TREND             */
/* ==================================================================== */
export interface ExerciseSparklineCardProps {
  client: Client | null;
  exerciseName: string;
  currentTargetKg: number | null;
}

export const ExerciseSparklineCard: React.FC<ExerciseSparklineCardProps> = ({
  client,
  exerciseName,
  currentTargetKg
}) => {
  const trendData: ExerciseTrendData = get4WeekExerciseHistory(client, exerciseName, currentTargetKg);
  const { points, trendPct, lastWeekKg, targetTodayKg } = trendData;

  // SVG Sparkline Math
  const maxVal = Math.max(...points.map(p => p.maxKg), 10);
  const minVal = Math.min(...points.map(p => p.maxKg), 0);
  const range = Math.max(1, maxVal - minVal);

  const svgWidth = 140;
  const svgHeight = 36;
  const padding = 6;

  const coords = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((p.maxKg - minVal) / range) * (svgHeight - padding * 2);
    return { x, y, val: p.maxKg, isTarget: p.isTarget, label: p.label };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 flex items-center justify-between text-xs space-x-2">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">
          <TrendingUp className="w-3 h-3 text-[#00f0ff]" />
          <span>Tendência 4 Semanas</span>
          {trendPct !== 0 && (
            <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
              trendPct > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {trendPct > 0 ? `↑ +${trendPct}%` : `${trendPct}%`}
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          {lastWeekKg !== null && (
            <span className="text-[11px] text-[#cbd5e1]">
              Ant: <strong className="text-[#f1f5f9] font-mono">{lastWeekKg}kg</strong>
            </span>
          )}
          {targetTodayKg !== null && (
            <span className="text-[11px] text-[#00f0ff]">
              Meta Hoje: <strong className="text-[#00f0ff] font-mono font-black">{targetTodayKg}kg</strong>
            </span>
          )}
        </div>
      </div>

      {/* Micro SVG Sparkline Chart */}
      <div className="relative shrink-0">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible">
          {/* Gradient area under sparkline */}
          <defs>
            <linearGradient id={`grad-${exerciseName.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path
            d={`${pathD} L ${coords[coords.length - 1].x} ${svgHeight} L ${coords[0].x} ${svgHeight} Z`}
            fill={`url(#grad-${exerciseName.replace(/\s+/g, '')})`}
          />

          <path
            d={pathD}
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {coords.map((c, i) => (
            <g key={i}>
              <circle
                cx={c.x}
                cy={c.y}
                r={c.isTarget ? 4 : 2.5}
                className={c.isTarget ? 'fill-[#00f0ff] stroke-[#080b11] stroke-2 animate-ping' : 'fill-[#00f0ff]'}
              />
              <circle
                cx={c.x}
                cy={c.y}
                r={c.isTarget ? 3.5 : 2.5}
                className={c.isTarget ? 'fill-[#00f0ff] stroke-[#080b11] stroke-2' : 'fill-[#38bdf8]'}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

/* ==================================================================== */
/* 2. PERSONAL RECORD (PR) CONFETTI CELEBRATION MODAL & TOAST           */
/* ==================================================================== */
export interface PRCelebrationModalProps {
  prResult: PRCheckResult | null;
  exerciseName: string;
  onClose: () => void;
}

export const PRCelebrationModal: React.FC<PRCelebrationModalProps> = ({
  prResult,
  exerciseName,
  onClose
}) => {
  useEffect(() => {
    if (prResult?.isPR) {
      // Trigger golden & cyan confetti cannon!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#f59e0b', '#10b981', '#38bdf8', '#ffffff']
      });
    }
  }, [prResult]);

  if (!prResult || !prResult.isPR) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-gradient-to-b from-[#0f172a] via-[#080b11] to-[#0f172a] border-2 border-amber-400 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-5 shadow-2xl shadow-amber-500/30 relative overflow-hidden"
        >
          {/* Animated Background Rays */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0,transparent_70%)] pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 text-[#080b11] mx-auto flex items-center justify-center shadow-lg shadow-amber-500/40 animate-bounce">
            <Trophy className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full">
              🏆 Novo Recorde Pessoal Desbloqueado!
            </span>
            <h3 className="font-display font-black text-2xl text-[#f1f5f9] tracking-tight pt-2">
              PERSONAL RECORD (PR)!
            </h3>
            <p className="text-sm font-semibold text-[#00f0ff]">
              {exerciseName}
            </p>
          </div>

          <div className="bg-[#080b11] border border-amber-500/30 rounded-2xl p-4 flex items-center justify-around font-mono">
            <div>
              <div className="text-[10px] text-[#94a3b8] uppercase font-bold">PR Anterior (1RM)</div>
              <div className="text-base text-[#94a3b8] line-through font-bold">{prResult.previousPR} kg</div>
            </div>

            <div className="text-[#00f0ff] font-bold text-xl">→</div>

            <div>
              <div className="text-[10px] text-amber-400 uppercase font-bold">Novo Recorde (1RM)</div>
              <div className="text-2xl text-amber-400 font-black tracking-tight">{prResult.newPR} kg</div>
              <div className="text-[10px] text-emerald-400 font-bold">(+{prResult.diffKg} kg)</div>
            </div>
          </div>

          <p className="text-xs text-[#cbd5e1] leading-relaxed">
            Parabéns! Sua sobrecarga progressiva e dedicação biológica continuam gerando supercompensação no tecido muscular.
          </p>

          <Button
            variant="primary"
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-[#080b11] font-black text-sm shadow-xl shadow-amber-500/30 border-0 hover:brightness-110"
          >
            🔥 CONTINUAR ESMAGANDO O TREINO!
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/* ==================================================================== */
/* 3. EXERCISE SUBSTITUTION MODAL ("Aparelho Ocupado?")                */
/* ==================================================================== */
export interface ExerciseSubstituteModalProps {
  isOpen: boolean;
  exerciseName: string;
  onSelectSubstitute: (newSubstituteName: string) => void;
  onClose: () => void;
}

export const ExerciseSubstituteModal: React.FC<ExerciseSubstituteModalProps> = ({
  isOpen,
  exerciseName,
  onSelectSubstitute,
  onClose
}) => {
  if (!isOpen) return null;

  const substitutes = getExerciseSubstitutes(exerciseName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚠️ Aparelho Ocupado? Substitutos Biomecânicos">
      <div className="space-y-4 pt-1">
        <div className="bg-[#0f172a] border border-[#00f0ff]/30 rounded-xl p-3 text-xs text-[#cbd5e1]">
          <span>Exercício Prescrito Original: </span>
          <strong className="text-[#00f0ff] font-bold">{exerciseName}</strong>
          <p className="text-[11px] text-[#94a3b8] mt-1">
            Selecione uma alternativa com equivalência muscular direta para manter a prescrição do treino intacta.
          </p>
        </div>

        <div className="space-y-2.5">
          {substitutes.map((sub, idx) => (
            <motion.div
              key={sub.name + idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                onSelectSubstitute(sub.name);
                onClose();
              }}
              className="bg-[#080b11] border border-[#1e293b] hover:border-[#00f0ff] p-3.5 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#f1f5f9] group-hover:text-[#00f0ff] transition-colors flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#00f0ff]" />
                  <span>{sub.name}</span>
                </h4>
                <Badge variant="accent" className="text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30">
                  {sub.equipment}
                </Badge>
              </div>

              <div className="text-xs text-[#94a3b8] flex items-center gap-1.5">
                <span className="font-semibold text-[#cbd5e1]">{sub.muscleGroup}</span>
              </div>

              <p className="text-[11px] text-[#94a3b8] italic bg-[#0f172a] p-2 rounded-lg border border-[#1e293b]">
                💡 {sub.benefitNote}
              </p>

              <div className="text-right pt-1">
                <span className="text-[11px] font-bold text-[#00f0ff] group-hover:underline inline-flex items-center gap-1">
                  Substituir por Este Exercício →
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-2">
          <Button variant="ghost" onClick={onClose} className="w-full text-xs text-[#94a3b8]">
            Cancelar / Manter {exerciseName}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

/* ==================================================================== */
/* 4. TEMPO / CADENCE GUIDED TIMER & METRONOME (Ex: 3-0-1-0)           */
/* ==================================================================== */
export interface TempoCadenceGuideProps {
  tempoPattern?: string; // e.g. "3-0-1-0" or "4-1-1-0"
}

export const TempoCadenceGuide: React.FC<TempoCadenceGuideProps> = ({ tempoPattern = '3-0-1-0' }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [phaseSeconds, setPhaseSeconds] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Parse pattern string "3-0-1-0" => [eccentric, pause, concentric, pause]
  const parsedPhases = useMemo(() => {
    const parts = tempoPattern.split('-').map(p => Math.max(0, parseInt(p, 10) || 0));
    if (parts.length === 4) {
      return [
        { name: 'Excêntrica (Descida)', duration: parts[0] || 3, color: 'text-emerald-400', bg: 'bg-emerald-500' },
        { name: 'Pausa Baixa', duration: parts[1] || 0, color: 'text-amber-400', bg: 'bg-amber-500' },
        { name: 'Concêntrica (Subida)', duration: parts[2] || 1, color: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]' },
        { name: 'Pausa Topo', duration: parts[3] || 0, color: 'text-[#38bdf8]', bg: 'bg-[#38bdf8]' }
      ];
    }
    return [
      { name: 'Excêntrica (Descida)', duration: 3, color: 'text-emerald-400', bg: 'bg-emerald-500' },
      { name: 'Pausa Baixa', duration: 0, color: 'text-amber-400', bg: 'bg-amber-500' },
      { name: 'Concêntrica (Subida)', duration: 1, color: 'text-[#00f0ff]', bg: 'bg-[#00f0ff]' },
      { name: 'Pausa Topo', duration: 0, color: 'text-[#38bdf8]', bg: 'bg-[#38bdf8]' }
    ];
  }, [tempoPattern]);

  useEffect(() => {
    let timer: any = null;
    if (isActive) {
      timer = setInterval(() => {
        setPhaseSeconds(prev => {
          const currentPhase = parsedPhases[phaseIndex];
          if (prev + 1 >= (currentPhase.duration || 1)) {
            // Advance to next phase that has duration > 0
            let nextIdx = (phaseIndex + 1) % 4;
            while (parsedPhases[nextIdx].duration === 0) {
              nextIdx = (nextIdx + 1) % 4;
            }
            setPhaseIndex(nextIdx);

            if (soundEnabled && typeof window !== 'undefined' && window.AudioContext) {
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(nextIdx === 0 ? 880 : 440, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
              } catch (e) {
                // Ignore audio context errors
              }
            }

            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phaseIndex, parsedPhases, soundEnabled]);

  const activePhase = parsedPhases[phaseIndex];

  return (
    <div className="bg-[#080b11] border border-[#1e293b] rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-bold text-[#f1f5f9]">Guia de Cadência e Tempo sob Tensão (TUT)</span>
          <span className="font-mono text-xs bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded font-extrabold">
            {tempoPattern}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-[#94a3b8] hover:text-[#00f0ff] p-1 transition-colors"
            title={soundEnabled ? 'Som do Metrônomo Ativado' : 'Som Desativado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00f0ff]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsActive(!isActive)}
            className={`text-xs font-bold py-1 px-3 ${isActive ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40'}`}
          >
            {isActive ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
            {isActive ? 'Pausar Metrônomo' : 'Iniciar Metrônomo'}
          </Button>
        </div>
      </div>

      {isActive && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${activePhase.bg} text-[#080b11] font-black font-mono flex items-center justify-center animate-pulse text-sm`}>
              {phaseSeconds + 1}s
            </div>
            <div>
              <div className={`text-xs font-black uppercase ${activePhase.color}`}>
                {activePhase.name}
              </div>
              <div className="text-[10px] text-[#94a3b8]">
                Mantenha velocidade constante para maximizar recrutamento de fibras
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {parsedPhases.map((p, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border transition-all ${
                  phaseIndex === i ? `${p.bg} border-white scale-125` : 'bg-[#1e293b] border-[#334155]'
                }`}
                title={p.name}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ==================================================================== */
/* 5. FATIGUE DROP WARNING BANNER                                       */
/* ==================================================================== */
export interface FatigueWarningBannerProps {
  fatigueResult: FatigueCheckResult;
  onExtendRest: (seconds: number) => void;
}

export const FatigueWarningBanner: React.FC<FatigueWarningBannerProps> = ({
  fatigueResult,
  onExtendRest
}) => {
  if (!fatigueResult.hasHighFatigue) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-500/20 via-[#0f172a] to-amber-500/20 border-2 border-amber-500 p-4 rounded-2xl space-y-3 shadow-xl shadow-amber-500/20"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>FADIGA ACENTUADA DO SNC (QUEDA DE REPS: -{fatigueResult.dropPct}%)</span>
        </div>
        <Badge variant="accent" className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
          Série 1: {fatigueResult.set1Reps} reps → Última: {fatigueResult.lastReps} reps
        </Badge>
      </div>

      <p className="text-xs text-[#cbd5e1] leading-relaxed">
        Detectada uma redução de <strong className="text-amber-400">-{fatigueResult.dropPct}% nas repetições</strong>. Isso indica depleção rápida de ATP-CP e fadiga neuromuscular acentuada.
      </p>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[#94a3b8]">
          Recomendado: Estender o descanso para 2,5 minutos para restauração fosfagênica.
        </span>

        <Button
          size="sm"
          variant="primary"
          onClick={() => onExtendRest(fatigueResult.suggestedRestSecs)}
          className="text-xs py-1.5 px-3 bg-amber-500 text-[#080b11] font-bold shadow-md shadow-amber-500/20 hover:brightness-110"
        >
          <Timer className="w-3.5 h-3.5 mr-1" />
          <span>⏱️ Estender Descanso (2m 30s)</span>
        </Button>
      </div>
    </motion.div>
  );
};

/* ==================================================================== */
/* 6. RPE 10 AUTO-REGULATION BANNER                                    */
/* ==================================================================== */
export interface AutoRegulateRPE10BannerProps {
  autoResult: AutoRegulateResult;
  onApplyAutoReduce: (reducedKg: number) => void;
}

export const AutoRegulateRPE10Banner: React.FC<AutoRegulateRPE10BannerProps> = ({
  autoResult,
  onApplyAutoReduce
}) => {
  if (!autoResult.needsAutoReduce) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-500/20 via-[#0f172a] to-amber-500/20 border-2 border-red-500/80 p-4 rounded-2xl space-y-3 shadow-xl shadow-red-500/20"
    >
      <div className="flex items-center justify-between gap-2 border-b border-red-500/30 pb-2">
        <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase tracking-wider">
          <Zap className="w-4 h-4 text-red-400 fill-red-400" />
          <span>AUTO-REGULAÇÃO ATIVADA (RPE 10 / FALHA PRECOCE)</span>
        </div>
        <span className="bg-red-500/20 text-red-300 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-red-500/40">
          Carga Atual: {autoResult.originalKg} kg
        </span>
      </div>

      <p className="text-xs text-[#cbd5e1] leading-relaxed">
        Como a Série 1 atingiu a falha total no RPE 10, o motor de prescrição recomenda uma redução biomecânica de -10% para as séries 2 e 3 (<strong>{autoResult.suggestedKg} kg</strong>) para preservar a integridade articular e manter o volume total.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-mono font-bold text-emerald-400">
          Carga Sugerida para Séries Restantes: {autoResult.suggestedKg} kg (-10%)
        </span>

        <Button
          size="sm"
          variant="primary"
          onClick={() => onApplyAutoReduce(autoResult.suggestedKg)}
          className="text-xs py-2 px-4 bg-gradient-to-r from-red-500 to-amber-500 text-white font-black shadow-lg shadow-red-500/30 border-0 hover:brightness-110 flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span>Ajustar Séries 2 & 3 para {autoResult.suggestedKg} kg</span>
        </Button>
      </div>
    </motion.div>
  );
};

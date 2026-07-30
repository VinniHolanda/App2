import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveExerciseState } from '../../viewmodels/useStudentViewModel';
import { Client, WellnessData, PersonalRecord } from '../../../domain/types';
import { Button, Modal, Badge } from '../ui/Primitives';
import { TonnageGauge } from '../ui/Gauges';
import { TrainingMethodBadge } from '../ui/TrainingMethodBadge';
import { 
  Dumbbell, Check, Flame, Trophy, Plus, Trash2, ArrowRight, Zap, Sparkles, 
  Clock, Timer, Bell, RotateCcw, ShieldCheck, Activity, AlertTriangle, 
  HeartPulse, Battery, Moon, TrendingDown, TrendingUp, CheckCircle2, RefreshCw
} from 'lucide-react';
import { calculate1RMEpley, calculateEpleyAdjustedLoad } from '../../../domain/calculators/loadCalculators';
import { 
  ExerciseSparklineCard, 
  PRCelebrationModal, 
  ExerciseSubstituteModal, 
  TempoCadenceGuide, 
  FatigueWarningBanner, 
  AutoRegulateRPE10Banner 
} from './WorkoutExecutionEnhancements';
import { 
  checkPersonalRecord, 
  checkFatigueDrop, 
  checkRPE10AutoRegulation, 
  PRCheckResult 
} from '../../../domain/exerciseSubstitutes';

export interface LiveWorkoutTrackerProps {
  exercises: ActiveExerciseState[];
  currentTonnage: number;
  targetLimit: number | null;
  wellnessData?: WellnessData | null;
  client?: Client | null;
  onAddSet: (exIndex: number, reps: number, kg: number, rpe?: number) => void;
  onRemoveSet: (exIndex: number, setIndex: number) => void;
  onApplyAll: (exIndex: number, reps: number, kg: number) => void;
  onReplaceExercise?: (exIndex: number, newName: string) => void;
  onGoFinish: () => void;
  onCancel: () => void;
  guidedMode: boolean;
  onToggleGuided: () => void;
  restTimerSeconds?: number | null;
  restTimerMax?: number;
  restTimerActive?: boolean;
  onStopRestTimer?: () => void;
  onAddRestSeconds?: (secs: number) => void;
  isTreinoAtivoFocus?: boolean;
  onToggleTreinoAtivoFocus?: () => void;
}

export const LiveWorkoutTracker: React.FC<LiveWorkoutTrackerProps> = ({
  exercises,
  currentTonnage,
  targetLimit,
  wellnessData,
  client,
  onAddSet,
  onRemoveSet,
  onApplyAll,
  onReplaceExercise,
  onGoFinish,
  onCancel,
  guidedMode,
  onToggleGuided,
  restTimerSeconds,
  restTimerMax = 90,
  restTimerActive,
  onStopRestTimer,
  onAddRestSeconds,
  isTreinoAtivoFocus = true,
  onToggleTreinoAtivoFocus
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeGuidedIndex, setActiveGuidedIndex] = useState(0);
  const [focusMode, setFocusMode] = useState<'ativo' | 'lista'>(isTreinoAtivoFocus ? 'ativo' : 'lista');
  const [selectedSetRpe, setSelectedSetRpe] = useState<number>(8);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // New enhancement states
  const [substituteModalOpenIdx, setSubstituteModalOpenIdx] = useState<number | null>(null);
  const [prCelebration, setPrCelebration] = useState<{ prResult: PRCheckResult; exerciseName: string } | null>(null);
  const [showTempoGuide, setShowTempoGuide] = useState<boolean>(false);

  // Online / Offline status listener for gym connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync focusMode state
  useEffect(() => {
    if (isTreinoAtivoFocus) {
      setFocusMode('ativo');
    }
  }, [isTreinoAtivoFocus]);

  // Live elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [inputStates, setInputStates] = useState<Record<number, { reps: number; kg: number }>>(() => {
    const initial: Record<number, { reps: number; kg: number }> = {};
    exercises.forEach((ex, idx) => {
      initial[idx] = {
        reps: ex.planned.reps || 10,
        kg: ex.suggestedKg || ex.refKg || 0
      };
    });
    return initial;
  });

  const handleInputChange = (exIndex: number, field: 'reps' | 'kg', val: number) => {
    setInputStates(prev => ({
      ...prev,
      [exIndex]: {
        ...prev[exIndex],
        [field]: Math.max(0, val)
      }
    }));
  };

  const adjustValue = (exIndex: number, field: 'reps' | 'kg', delta: number) => {
    const current = inputStates[exIndex]?.[field] || 0;
    const nextVal = Math.max(0, Math.round((current + delta) * 10) / 10);
    handleInputChange(exIndex, field, nextVal);
  };

  const completedCount = exercises.filter(e => e.sets.length >= e.planned.sets).length;
  const progressPercent = Math.round((completedCount / (exercises.length || 1)) * 100);

  const activeEx = exercises[activeGuidedIndex] || exercises[0];
  const activeExIsDone = activeEx ? activeEx.sets.length >= activeEx.planned.sets : false;
  const activeInput = inputStates[activeGuidedIndex] || { reps: activeEx?.planned?.reps || 10, kg: activeEx?.suggestedKg || 0 };
  const estimated1RM = activeInput.kg > 0 ? calculate1RMEpley(activeInput.kg, activeInput.reps) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* PR Celebration Cannon Modal */}
      <PRCelebrationModal
        prResult={prCelebration?.prResult || null}
        exerciseName={prCelebration?.exerciseName || ''}
        onClose={() => setPrCelebration(null)}
      />

      {/* Exercise Substitute Modal ("Aparelho Ocupado?") */}
      <ExerciseSubstituteModal
        isOpen={substituteModalOpenIdx !== null}
        exerciseName={substituteModalOpenIdx !== null && exercises[substituteModalOpenIdx] ? exercises[substituteModalOpenIdx].name : ''}
        onSelectSubstitute={(newName) => {
          if (substituteModalOpenIdx !== null && onReplaceExercise) {
            onReplaceExercise(substituteModalOpenIdx, newName);
          }
          setSubstituteModalOpenIdx(null);
        }}
        onClose={() => setSubstituteModalOpenIdx(null)}
      />
      {/* Mode Selector & Status Header */}
      <div className="bg-[#0f172a] border border-[#00f0ff]/40 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00f0ff]"></span>
            </span>
            <span className="font-display font-black text-sm text-[#f1f5f9] tracking-wider uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#00f0ff] fill-[#00f0ff]" /> Treino Ativo em Andamento
            </span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <div className="flex bg-[#080b11] p-1 rounded-xl border border-[#1e293b] text-xs">
              <button
                onClick={() => {
                  setFocusMode('ativo');
                  if (onToggleTreinoAtivoFocus && !isTreinoAtivoFocus) onToggleTreinoAtivoFocus();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  focusMode === 'ativo'
                    ? 'bg-[#00f0ff] text-[#080b11] shadow-md shadow-[#00f0ff]/20 font-black'
                    : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Modo Focado
              </button>
              <button
                onClick={() => {
                  setFocusMode('lista');
                  if (onToggleTreinoAtivoFocus && isTreinoAtivoFocus) onToggleTreinoAtivoFocus();
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  focusMode === 'lista'
                    ? 'bg-[#00f0ff] text-[#080b11] shadow-md shadow-[#00f0ff]/20 font-black'
                    : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" /> Lista Geral
              </button>
            </div>

            <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-[#64748b] hover:text-red-400">
              Sair
            </Button>
          </div>
        </div>

        {/* Real-time Session Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold text-[#f1f5f9] bg-[#080b11] px-3 py-1.5 rounded-xl border border-[#1e293b]">
            <Clock className="w-4 h-4 text-[#00f0ff]" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-[#94a3b8]">Progresso:</span>
            <span className="font-bold text-[#00f0ff]">{completedCount}/{exercises.length} blocos ({progressPercent}%)</span>
          </div>

          <Button
            size="sm"
            variant="primary"
            onClick={onGoFinish}
            className="font-bold text-xs py-1.5 px-4 shadow-lg shadow-[#00f0ff]/20"
          >
            ✓ Finalizar Treino
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#080b11] rounded-full overflow-hidden border border-[#1e293b]">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Gym Offline Banner Notice */}
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300 font-medium mt-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Offline Ativo (Academia):</strong> Conexão indisponível. O app continua funcionando 100% offline via Service Worker. Todos os registros de carga e repetições são salvos localmente e sincronizados ao reconectar.
            </span>
          </motion.div>
        )}
      </div>

      <TonnageGauge currentTonnage={currentTonnage} targetLimit={targetLimit} />

      {/* Auto-Regulation Readiness Banner */}
      {wellnessData && (wellnessData.autoRegulatedNote || wellnessData.loadAdjustmentFactor) && (
        <div className="bg-[#0f172a] border border-[#00f0ff]/30 rounded-2xl p-3.5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00f0ff]/15 text-[#00f0ff] flex items-center justify-center shrink-0 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
            </div>
            <div>
              <div className="font-bold text-[#f1f5f9] flex items-center gap-1.5">
                <span>Prontidão & Auto-Regulação Ativa</span>
                {wellnessData.recoveryScale && (
                  <span className="text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] px-2 py-0.5 rounded font-mono font-bold">
                    SRS: {wellnessData.recoveryScale}/10
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#94a3b8]">{wellnessData.autoRegulatedNote}</p>
            </div>
          </div>
          <span className="font-mono font-bold text-xs bg-[#00f0ff]/20 text-[#00f0ff] px-3 py-1 rounded-xl border border-[#00f0ff]/30 whitespace-nowrap self-end sm:self-auto">
            Fator Carga: {Math.round((wellnessData.loadAdjustmentFactor || 1) * 100)}%
          </span>
        </div>
      )}

      {/* REST TIMER ACTIVE BANNER (HIGH VISIBILITY IN GYM) */}
      {restTimerActive && restTimerSeconds !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#00f0ff]/20 via-[#0f172a] to-[#00f0ff]/20 border-2 border-[#00f0ff] rounded-2xl p-4 shadow-2xl shadow-[#00f0ff]/30 space-y-3 relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#00f0ff] text-[#080b11] flex items-center justify-center font-bold animate-pulse shadow-lg shadow-[#00f0ff]/40">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-black text-[#f1f5f9] uppercase tracking-wider flex items-center gap-2">
                  <span>TEMPORIZADOR DE DESCANSO</span>
                  {restTimerSeconds === 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce font-bold">
                      🔔 PRONTO PARA A PRÓXIMA SÉRIE!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#94a3b8]">Descanse e recupere seu fôlego antes da próxima carga</p>
              </div>
            </div>

            <div className="font-mono font-black text-3xl md:text-4xl text-[#00f0ff] tracking-tight">
              {formatTime(restTimerSeconds)}
            </div>
          </div>

          {/* Quick Rest Adjust Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#00f0ff]/30">
            {onAddRestSeconds && (
              <>
                <button
                  onClick={() => onAddRestSeconds(30)}
                  className="bg-[#1e293b] hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  +30 Seg
                </button>
                <button
                  onClick={() => onAddRestSeconds(-10)}
                  className="bg-[#1e293b] hover:bg-[#1e293b]/80 text-[#94a3b8] border border-[#1e293b] text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                >
                  -10 Seg
                </button>
              </>
            )}
            {onStopRestTimer && (
              <button
                onClick={onStopRestTimer}
                className="bg-[#00f0ff] text-[#080b11] hover:brightness-110 font-black text-xs px-4 py-1.5 rounded-xl shadow-md shadow-[#00f0ff]/20 transition-all"
              >
                Pular Descanso →
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* ==================================================================== */}
      {/* MODO TREINO ATIVO (FOCUSED SINGLE-EXERCISE VIEW FOR GYM USE) */}
      {/* ==================================================================== */}
      {focusMode === 'ativo' && activeEx && (
        <div className="space-y-4">
          {/* Horizontal Exercise Selector Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {exercises.map((ex, idx) => {
              const exDone = ex.sets.length >= ex.planned.sets;
              const isCurrent = idx === activeGuidedIndex;

              return (
                <button
                  key={ex.name + idx}
                  onClick={() => setActiveGuidedIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                    isCurrent
                      ? 'bg-[#00f0ff] text-[#080b11] border-[#00f0ff] shadow-lg shadow-[#00f0ff]/25 font-extrabold scale-105'
                      : exDone
                      ? 'bg-[#0f172a] text-[#00f0ff] border-[#00f0ff]/30 hover:border-[#00f0ff]'
                      : 'bg-[#080b11] text-[#94a3b8] border-[#1e293b] hover:text-[#f1f5f9]'
                  }`}
                >
                  {exDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#080b11]" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-[#1e293b] text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                  )}
                  <span>{ex.name}</span>
                  <span className="text-[10px] opacity-75">
                    ({ex.sets.length}/{ex.planned.sets})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Gym Focus Card */}
          <motion.div
            key={`gym-focus-${activeGuidedIndex}`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-b from-[#0f172a] to-[#080b11] border-2 border-[#1e293b] focus-within:border-[#00f0ff]/50 rounded-3xl p-5 md:p-6 space-y-6 shadow-2xl relative"
          >
            {/* Header / Meta */}
            {activeEx ? (
              <div className="space-y-2 border-b border-[#1e293b] pb-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-3 py-1 rounded-full">
                    EXERCÍCIO {activeGuidedIndex + 1} DE {exercises.length}
                  </span>
                  {activeExIsDone && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Blocos Concluídos
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <h3 className="font-display font-black text-xl md:text-2xl text-[#f1f5f9] tracking-tight">
                    {activeEx.name}
                  </h3>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSubstituteModalOpenIdx(activeGuidedIndex)}
                    className="text-[11px] py-1 px-2.5 bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Aparelho Ocupado?
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#94a3b8]">
                  <span className="bg-[#1e293b] px-2.5 py-1 rounded-lg text-[#f1f5f9]">
                    Meta: <strong>{activeEx.planned?.sets || 0} séries × {activeEx.planned?.reps || 0} reps</strong>
                  </span>
                  <span className="bg-[#1e293b] px-2.5 py-1 rounded-lg text-[#00f0ff]">
                    Descanso: <strong>{activeEx.planned?.rest || '60s'}</strong>
                  </span>
                  {activeEx.refKg && (
                    <span className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] px-2.5 py-1 rounded-lg">
                      Última Carga: <strong>{activeEx.refKg} kg</strong>
                    </span>
                  )}
                  {activeEx.method && (
                    <TrainingMethodBadge methodKeyOrName={activeEx.method} />
                  )}
                </div>

                {activeEx.notes && (
                  <div className="text-xs text-[#00f0ff] bg-[#00f0ff]/10 p-2.5 rounded-xl border border-[#00f0ff]/20 font-medium mt-2">
                    💡 Observação: {activeEx.notes}
                  </div>
                )}

                {/* SPARKLINE MICRO-CHART FOR 4-WEEK LOAD TREND */}
                <div className="pt-1">
                  <ExerciseSparklineCard
                    client={client || null}
                    exerciseName={activeEx.name}
                    currentTargetKg={activeEx.refKg || (activeEx.sets && activeEx.sets.length > 0 ? activeEx.sets[0].kg : null)}
                  />
                </div>

                {/* TEMPO & CADENCE METRONOME TIMER GUIDE */}
                <div className="pt-1">
                  <TempoCadenceGuide tempoPattern="3-0-1-0" />
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-[#94a3b8]">
                Nenhum exercício selecionado ou disponível.
              </div>
            )}

            {/* SET REGISTRATION CONTROLS (LARGE gym TOUCH TARGETS) */}
            {activeEx && !activeExIsDone ? (
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-5 space-y-5 shadow-lg">
                {/* FATIGUE DROP & RPE 10 AUTO-REGULATION BANNERS */}
                <FatigueWarningBanner
                  fatigueResult={activeEx.sets ? checkFatigueDrop(activeEx.sets) : { isFatigued: false, dropPercent: 0, setIndexDrop: null }}
                  onExtendRest={(secs) => onAddRestSeconds?.(secs - 90)}
                />

                <AutoRegulateRPE10Banner
                  autoResult={activeEx.sets ? checkRPE10AutoRegulation(activeEx.sets, activeInput.kg) : { shouldReduce: false, suggestedKg: activeInput.kg, reason: '' }}
                  onApplyAutoReduce={(reducedKg) => handleInputChange(activeGuidedIndex, 'kg', reducedKg)}
                />

                <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                  <div className="text-xs font-extrabold text-[#00f0ff] uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#00f0ff]" />
                    <span>REGISTRAR SÉRIE {(activeEx.sets?.length || 0) + 1} DE {activeEx.planned?.sets || 0}</span>
                  </div>
                  {estimated1RM !== null && (
                    <span className="text-[11px] font-mono font-bold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2.5 py-1 rounded-lg">
                      1RM Est: {estimated1RM} kg
                    </span>
                  )}
                </div>

                {/* EPLEY AUTO-ADJUSTMENT BANNER & BUTTON FOR LOW RPE (< 7) */}
                {activeEx.sets && activeEx.sets.length > 0 && activeEx.sets[activeEx.sets.length - 1].rpe !== undefined && activeEx.sets[activeEx.sets.length - 1].rpe! < 7 && (() => {
                  const lastSet = activeEx.sets[activeEx.sets.length - 1];
                  const epleyAdj = calculateEpleyAdjustedLoad(lastSet.kg, lastSet.reps, lastSet.rpe!, 8, activeEx.planned?.reps || 10);
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-r from-[#00f0ff]/15 via-[#0f172a] to-[#38bdf8]/15 border-2 border-[#00f0ff] p-4 rounded-2xl space-y-3 shadow-xl shadow-[#00f0ff]/20"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#00f0ff]/30 pb-2">
                        <div className="flex items-center gap-2 text-xs font-black text-[#00f0ff] uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-[#00f0ff] animate-bounce" />
                          <span>SUGESTÃO DE AJUSTE DE CARGA (EPLEY)</span>
                        </div>
                        <span className="bg-[#00f0ff]/20 text-[#00f0ff] font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-[#00f0ff]/40">
                          Série Anterior: RPE {lastSet.rpe}/10 (RIR: {10 - lastSet.rpe!})
                        </span>
                      </div>

                      <p className="text-xs text-[#f1f5f9] leading-relaxed font-medium">
                        Como a série anterior teve RPE abaixo de 7 (RPE {lastSet.rpe}), sua 1RM estimada é de <strong>{epleyAdj.est1RM} kg</strong>. Recomendamos ajustar a carga para atingir a zona ideal de hipertrofia/força (RPE 8).
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                        <div className="text-xs font-bold text-[#00f0ff] font-mono flex items-center gap-1.5">
                          <span>Incremento via Epley:</span>
                          <span className="bg-[#00f0ff] text-[#080b11] px-2.5 py-0.5 rounded-md font-black">
                            +{epleyAdj.increment} kg ({lastSet.kg} → {epleyAdj.suggestedKg} kg)
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => {
                            handleInputChange(activeGuidedIndex, 'kg', epleyAdj.suggestedKg);
                          }}
                          className="font-black text-xs py-2.5 px-4 shadow-lg shadow-[#00f0ff]/30 bg-[#00f0ff] text-[#080b11] hover:brightness-110 flex items-center justify-center gap-2 border-0"
                        >
                          <Zap className="w-4 h-4 fill-[#080b11]" />
                          <span>Ajustar Carga para {epleyAdj.suggestedKg} kg</span>
                        </Button>
                      </div>
                    </motion.div>
                  );
                })()}

                {/* Touch Stepper: CARGA (KG) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#94a3b8]">
                    <span>Carga de Treino (kg)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const lastSet = activeEx.sets.length > 0 ? activeEx.sets[activeEx.sets.length - 1] : null;
                        const baseKg = lastSet ? lastSet.kg : activeInput.kg;
                        const baseReps = lastSet ? lastSet.reps : activeInput.reps;
                        const baseRpe = lastSet && lastSet.rpe !== undefined ? lastSet.rpe : selectedSetRpe;
                        
                        const adj = calculateEpleyAdjustedLoad(baseKg, baseReps, baseRpe, 8, activeEx.planned.reps);
                        handleInputChange(activeGuidedIndex, 'kg', adj.suggestedKg);
                      }}
                      className="text-[10px] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 font-extrabold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
                      title="Calcular incremento automático de carga usando a equação de Epley"
                    >
                      <Zap className="w-3 h-3 fill-[#00f0ff]" /> Ajustar Carga
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Numeric Input */}
                    <div className="bg-[#080b11] border-2 border-[#00f0ff]/50 rounded-2xl p-2 flex items-center justify-center w-28 shrink-0">
                      <input
                        type="number"
                        step="0.5"
                        value={activeInput.kg}
                        onChange={e => handleInputChange(activeGuidedIndex, 'kg', Number(e.target.value))}
                        className="w-full bg-transparent text-center font-mono font-black text-2xl text-[#00f0ff] outline-none"
                      />
                      <span className="text-xs text-[#94a3b8] font-bold mr-1">kg</span>
                    </div>

                    {/* Touch Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                      {[-5, -2.5, -1, 1, 2.5, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => adjustValue(activeGuidedIndex, 'kg', val)}
                          className={`px-2.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                            val > 0
                              ? 'bg-[#1e293b] hover:bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/30'
                              : 'bg-[#1e293b] hover:bg-red-500/20 text-red-400 border-red-500/20'
                          }`}
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Touch Stepper: REPETIÇÕES */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#94a3b8]">
                    <span>Repetições Executadas</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustValue(activeGuidedIndex, 'reps', -1)}
                      className="w-12 h-12 rounded-2xl bg-[#1e293b] border border-[#334155] text-lg font-black text-[#f1f5f9] hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center justify-center shrink-0"
                    >
                      -1
                    </button>

                    <div className="bg-[#080b11] border-2 border-[#1e293b] rounded-2xl p-2 flex items-center justify-center flex-1 h-12">
                      <input
                        type="number"
                        value={activeInput.reps}
                        onChange={e => handleInputChange(activeGuidedIndex, 'reps', Number(e.target.value))}
                        className="w-full bg-transparent text-center font-mono font-black text-2xl text-[#f1f5f9] outline-none"
                      />
                      <span className="text-xs text-[#94a3b8] font-bold mr-2">reps</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustValue(activeGuidedIndex, 'reps', 1)}
                      className="w-12 h-12 rounded-2xl bg-[#1e293b] border border-[#00f0ff]/40 text-lg font-black text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all flex items-center justify-center shrink-0"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Per-Set RPE / Esforço Percebido */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-[#94a3b8]">
                    <span>Intensidade da Série (RPE)</span>
                    <span className="text-[#00f0ff] font-mono">RPE {selectedSetRpe}/10</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
                    {[
                      { rpe: 6, label: 'Leve' },
                      { rpe: 7, label: 'Moderado' },
                      { rpe: 8, label: 'Intenso' },
                      { rpe: 9, label: 'Quase Máx' },
                      { rpe: 10, label: 'Falha' }
                    ].map(item => (
                      <button
                        key={item.rpe}
                        type="button"
                        onClick={() => setSelectedSetRpe(item.rpe)}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          selectedSetRpe === item.rpe
                            ? 'bg-[#00f0ff] text-[#080b11] border-[#00f0ff] font-black shadow-md shadow-[#00f0ff]/20'
                            : 'bg-[#080b11] text-[#94a3b8] border-[#1e293b] hover:text-[#f1f5f9]'
                        }`}
                      >
                        <div className="font-bold">{item.rpe}</div>
                        <div className="text-[9px] opacity-80">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* BIG PRIMARY LOG BUTTON */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant="primary"
                    onClick={() => {
                      const exName = activeEx?.name || 'Exercício';
                      const prCheck = checkPersonalRecord(client || null, exName, activeInput.kg, activeInput.reps);
                      if (prCheck.isPR) {
                        setPrCelebration({ prResult: prCheck, exerciseName: exName });
                      }
                      onAddSet(activeGuidedIndex, activeInput.reps, activeInput.kg, selectedSetRpe);
                    }}
                    className="w-full py-4 text-base font-black tracking-wide flex items-center justify-center gap-2 shadow-2xl shadow-[#00f0ff]/30 rounded-2xl bg-gradient-to-r from-[#00f0ff] to-[#38bdf8] text-[#080b11] hover:brightness-110 border-0"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" /> CONFIRMAR & SALVAR SÉRIE
                  </Button>

                  {activeEx && activeEx.planned && activeEx.sets && (activeEx.planned.sets - activeEx.sets.length > 1) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onApplyAll(activeGuidedIndex, activeInput.reps, activeInput.kg)}
                      className="w-full text-xs text-[#94a3b8] hover:text-[#00f0ff] py-2"
                    >
                      Copiar Carga & Reps para Séries Restantes
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#00f0ff] mx-auto" />
                <h4 className="font-bold text-[#f1f5f9]">Todas as séries deste exercício concluídas!</h4>
                <p className="text-xs text-[#94a3b8]">Avançar para o próximo exercício prescrito</p>
              </div>
            )}

            {/* Logged Sets List for Active Exercise */}
            {activeEx.sets.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex justify-between items-center">
                  <span>Séries Registradas ({activeEx.sets.length})</span>
                  <span className="font-mono text-[#00f0ff]">{activeEx.tonnage.toLocaleString('pt-BR')} kg acumulados</span>
                </div>

                <div className="space-y-2">
                  {activeEx.sets.map((s, si) => (
                    <div
                      key={si}
                      className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#00f0ff] text-[#080b11] font-black flex items-center justify-center text-xs">
                          #{si + 1}
                        </span>
                        <span className="font-bold text-[#f1f5f9]">{s.reps} reps</span>
                        <span className="text-[#00f0ff] font-bold">@ {s.kg} kg</span>
                        {s.rpe && (
                          <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 px-2 py-0.5 rounded text-[10px]">
                            RPE {s.rpe}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveSet(activeGuidedIndex, si)}
                        className="text-[#64748b] hover:text-red-400 p-1.5 transition-colors"
                        title="Remover série"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1e293b]">
              <Button
                variant="ghost"
                size="sm"
                disabled={activeGuidedIndex === 0}
                onClick={() => setActiveGuidedIndex(prev => Math.max(0, prev - 1))}
                className="text-xs font-bold disabled:opacity-30"
              >
                ← Exercício Anterior
              </Button>

              <span className="text-xs font-bold text-[#94a3b8]">
                {activeGuidedIndex + 1} de {exercises.length}
              </span>

              {activeGuidedIndex < exercises.length - 1 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveGuidedIndex(prev => Math.min(exercises.length - 1, prev + 1))}
                  className="text-xs font-bold text-[#00f0ff]"
                >
                  Próximo Exercício →
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onGoFinish}
                  className="text-xs font-bold bg-[#00f0ff] text-[#080b11]"
                >
                  ✓ Concluir Treino
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODO LISTA GERAL (OVERVIEW ALL EXERCISES) */}
      {/* ==================================================================== */}
      {focusMode === 'lista' && (
        <AnimatePresence mode="wait">
          <div className="space-y-4">
            {exercises.map((ex, actualIdx) => {
              const isDone = ex.sets.length >= ex.planned.sets;
              const currentInput = inputStates[actualIdx] || { reps: ex.planned.reps, kg: ex.suggestedKg || 0 };
              const estimated1RM = currentInput.kg > 0 ? calculate1RMEpley(currentInput.kg, currentInput.reps) : null;

              return (
                <motion.div
                  key={ex.name + actualIdx}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  className={`bg-[#0f172a] border rounded-2xl p-4 transition-all ${
                    isDone 
                      ? 'border-[#00f0ff]/40 bg-[#00f0ff]/5 shadow-lg shadow-[#00f0ff]/10' 
                      : 'border-[#1e293b] hover:border-[#1e293b]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-base text-[#f1f5f9] flex items-center gap-2">
                        {ex.name}
                        {isDone && (
                          <motion.span 
                            initial={{ scale: 0.7 }}
                            animate={{ scale: [0.8, 1.2, 1] }}
                            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                            className="inline-flex items-center gap-1 bg-[#00f0ff] text-[#080b11] text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow-md shadow-[#00f0ff]/30"
                          >
                            <Check className="w-3 h-3" /> Bloco Concluído
                          </motion.span>
                        )}
                      </h4>
                      <div className="text-xs text-[#64748b] font-medium mt-0.5">
                        Meta: {ex.planned.sets}×{ex.planned.reps} reps · Descanso: {ex.planned.rest}
                      </div>
                    </div>
                    {ex.tonnage > 0 && (
                      <div className="font-mono text-sm font-bold text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2.5 py-1 rounded-xl">
                        {ex.tonnage.toLocaleString('pt-BR')} kg
                      </div>
                    )}
                  </div>

                  {/* Sets Log List */}
                  {ex.sets.length > 0 && (
                    <div className="space-y-2 my-3 bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
                      <AnimatePresence>
                        {ex.sets.map((set, si) => (
                          <motion.div 
                            key={si}
                            initial={{ opacity: 0, x: -15, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 15, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                            className="flex items-center justify-between text-xs font-mono bg-[#0f172a] px-3 py-2 rounded-lg border border-[#1e293b]"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-md bg-[#00f0ff] text-[#080b11] font-bold flex items-center justify-center text-[10px]">
                                {si + 1}
                              </span>
                              <span className="text-[#f1f5f9] font-bold">{set.reps} reps</span>
                              <span className="text-[#00f0ff] font-bold">{set.kg ? `@ ${set.kg} kg` : 'peso corp.'}</span>
                              {set.rpe && <span className="text-[#94a3b8] text-[10px]">RPE {set.rpe}</span>}
                            </div>
                            <button
                              onClick={() => onRemoveSet(actualIdx, si)}
                              className="text-[#64748b] hover:text-red-400 p-1 transition-colors"
                              title="Remover série"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Load Suggestion & Live 1RM Hint */}
                  {!isDone && (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#00f0ff]/10 text-[#00f0ff] px-3 py-2 rounded-xl border border-[#00f0ff]/20 mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {ex.refKg ? `Última carga: ${ex.refKg} kg` : ''} 
                          {ex.suggestedKg ? ` · Meta Epley (1RM): ${ex.suggestedKg} kg` : ''}
                        </span>
                      </div>
                      {estimated1RM !== null && (
                        <span className="font-mono text-[11px] font-bold bg-[#00f0ff]/20 px-2 py-0.5 rounded border border-[#00f0ff]/30">
                          1RM Est: {estimated1RM} kg
                        </span>
                      )}
                    </div>
                  )}

                  {/* Set Input Controls */}
                  {!isDone && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#1e293b]">
                      <span className="text-xs font-bold text-[#64748b]">Série {ex.sets.length + 1}:</span>
                      <div className="flex items-center gap-1.5 bg-[#080b11] p-1.5 rounded-xl border border-[#1e293b]">
                        <input
                          type="number"
                          value={currentInput.reps}
                          onChange={e => handleInputChange(actualIdx, 'reps', Number(e.target.value))}
                          className="w-14 bg-transparent text-center font-mono text-sm font-bold text-[#f1f5f9] outline-none focus:text-[#00f0ff]"
                          title="Repetições"
                        />
                        <span className="text-[10px] text-[#64748b] font-bold uppercase">reps</span>
                      </div>

                      <span className="text-xs text-[#64748b]">×</span>

                      <div className="flex items-center gap-1.5 bg-[#080b11] p-1.5 rounded-xl border border-[#1e293b]">
                        <input
                          type="number"
                          value={currentInput.kg}
                          onChange={e => handleInputChange(actualIdx, 'kg', Number(e.target.value))}
                          className="w-16 bg-transparent text-center font-mono text-sm font-bold text-[#00f0ff] outline-none"
                          placeholder="kg"
                          title="Carga kg"
                        />
                        <span className="text-[10px] text-[#64748b] font-bold uppercase">kg</span>
                      </div>

                      <div className="ml-auto flex gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onAddSet(actualIdx, currentInput.reps, currentInput.kg)}
                          className="font-bold flex items-center gap-1 py-2 px-3 shadow-md shadow-[#00f0ff]/10"
                        >
                          <Plus className="w-3.5 h-3.5" /> Registra Série
                        </Button>
                        {ex.planned.sets - ex.sets.length > 1 && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onApplyAll(actualIdx, currentInput.reps, currentInput.kg)}
                            title="Aplicar mesma carga nas séries restantes"
                            className="text-xs"
                          >
                            Repetir Restantes
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Footer Finish Actions */}
      <div className="flex gap-2 pt-4 border-t border-[#1e293b]">
        <Button variant="primary" className="flex-1 font-bold py-3.5 text-sm shadow-xl shadow-[#00f0ff]/15" onClick={onGoFinish}>
          ✓ Finalizar Sessão de Treino
        </Button>
        <Button variant="ghost" className="text-xs text-[#94a3b8]" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </motion.div>
  );
};

export interface DailyReadinessCardProps {
  onConfirm: (wellness: WellnessData) => void;
  onSkip?: () => void;
  compact?: boolean;
}

export const DailyReadinessCard: React.FC<DailyReadinessCardProps> = ({ onConfirm, onSkip, compact = false }) => {
  const [hasJointPain, setHasJointPain] = useState<boolean>(false);
  const [hasDizziness, setHasDizziness] = useState<boolean>(false);
  const [recoveryScale, setRecoveryScale] = useState<number>(7);
  const [sleep, setSleep] = useState<number>(4);
  const [soreness, setSoreness] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);

  const hasParqFlag = hasJointPain || hasDizziness;
  let factor = 1.0;
  let statusText = 'Normal (100% Carga)';
  let badgeColor = 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/30';
  let icon = <CheckCircle2 className="w-4 h-4 text-[#00f0ff]" />;
  let explanation = 'Recuperação adequada. Cargas e metas de repetições prescritas mantidas em 100%.';

  if (hasParqFlag) {
    factor = 0.85;
    statusText = 'Auto-regulação Preventiva (-15%)';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    icon = <AlertTriangle className="w-4 h-4 text-red-400" />;
    explanation = 'Atenção: Sintoma ou dor reportada no PAR-Q. Cargas reduzidas em -15% para preservação articular e segurança.';
  } else if (recoveryScale <= 4) {
    factor = 0.85;
    statusText = 'Auto-regulação Baixa Prontidão (-15%)';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    icon = <TrendingDown className="w-4 h-4 text-amber-400" />;
    explanation = `Recuperação subjetiva baixa (${recoveryScale}/10). Cargas reduzidas em -15% para evitar acúmulo de fadiga.`;
  } else if (recoveryScale >= 8) {
    factor = 1.025;
    statusText = 'Prontidão Máxima (+2.5% Carga)';
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    icon = <TrendingUp className="w-4 h-4 text-emerald-400" />;
    explanation = `Excelente nível de prontidão (${recoveryScale}/10). Leve incentivo de +2.5% em cargas para estimular hipertrofia/força.`;
  }

  const handleApply = () => {
    const score = Math.round(((sleep + soreness + energy - 3) / 12) * 100);
    onConfirm({
      sleep,
      soreness,
      energy,
      score,
      hasJointPain,
      hasDizzinessOrDyspnea: hasDizziness,
      recoveryScale,
      loadAdjustmentFactor: factor,
      autoRegulatedNote: explanation
    });
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#00f0ff]/5 rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="font-display font-bold text-base text-[#f1f5f9]">
              Prontidão Diária & Auto-Regulação
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            PAR-Q Simplificado + Escala de Recuperação Subjetiva (SRS)
          </p>
        </div>

        <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${badgeColor}`}>
          {icon}
          <span>{statusText}</span>
        </div>
      </div>

      {/* PAR-Q Simplificado */}
      <div className="space-y-2 bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
        <div className="text-xs font-bold text-[#f1f5f9] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-[#00f0ff]" />
            1. Triagem PAR-Q de Segurança (Hoje)
          </span>
          <span className="text-[10px] text-[#64748b]">2 perguntas de segurança</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setHasJointPain(!hasJointPain)}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              hasJointPain
                ? 'bg-red-500/15 border-red-500/50 text-red-200'
                : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <span>Dor articular/óssea/muscular aguda?</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasJointPain ? 'bg-red-500 text-white' : 'bg-[#1e293b] text-[#64748b]'}`}>
              {hasJointPain ? 'SIM' : 'NÃO'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setHasDizziness(!hasDizziness)}
            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
              hasDizziness
                ? 'bg-red-500/15 border-red-500/50 text-red-200'
                : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <span>Tontura, mal-estar ou falta de ar?</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${hasDizziness ? 'bg-red-500 text-white' : 'bg-[#1e293b] text-[#64748b]'}`}>
              {hasDizziness ? 'SIM' : 'NÃO'}
            </span>
          </button>
        </div>
      </div>

      {/* Subjective Recovery Scale */}
      <div className="space-y-2.5 bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#f1f5f9] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
            2. Escala Subjetiva de Recuperação (1 a 10)
          </span>
          <span className="font-mono font-bold text-sm text-[#00f0ff]">{recoveryScale}/10</span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          value={recoveryScale}
          onChange={e => setRecoveryScale(Number(e.target.value))}
          className="w-full accent-[#00f0ff] cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-[#64748b]">
          <span className={recoveryScale <= 4 ? 'text-amber-400 font-bold' : ''}>1-4: Baixa</span>
          <span className={recoveryScale >= 5 && recoveryScale <= 7 ? 'text-blue-400 font-bold' : ''}>5-7: Normal</span>
          <span className={recoveryScale >= 8 ? 'text-emerald-400 font-bold' : ''}>8-10: Excelente</span>
        </div>

        {/* Hooper breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1e293b]/50 text-[11px]">
          <div>
            <div className="text-[#94a3b8] flex items-center gap-1 mb-1">
              <Moon className="w-3 h-3 text-[#00f0ff]" /> Sono
            </div>
            <select
              value={sleep}
              onChange={e => setSleep(Number(e.target.value))}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-1 text-[#f1f5f9] text-xs"
            >
              <option value={1}>1 - Ruim</option>
              <option value={2}>2 - Regular</option>
              <option value={3}>3 - Ok</option>
              <option value={4}>4 - Bom</option>
              <option value={5}>5 - Ótimo</option>
            </select>
          </div>

          <div>
            <div className="text-[#94a3b8] flex items-center gap-1 mb-1">
              <Battery className="w-3 h-3 text-[#00f0ff]" /> Disposição
            </div>
            <select
              value={energy}
              onChange={e => setEnergy(Number(e.target.value))}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-1 text-[#f1f5f9] text-xs"
            >
              <option value={1}>1 - Cansado</option>
              <option value={2}>2 - Leve</option>
              <option value={3}>3 - Normal</option>
              <option value={4}>4 - Boa</option>
              <option value={5}>5 - Máxima</option>
            </select>
          </div>

          <div>
            <div className="text-[#94a3b8] flex items-center gap-1 mb-1">
              <Dumbbell className="w-3 h-3 text-[#00f0ff]" /> Dores
            </div>
            <select
              value={soreness}
              onChange={e => setSoreness(Number(e.target.value))}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg p-1 text-[#f1f5f9] text-xs"
            >
              <option value={1}>1 - Muita dor</option>
              <option value={2}>2 - Dor moderada</option>
              <option value={3}>3 - Leve</option>
              <option value={4}>4 - Recuperado</option>
              <option value={5}>5 - Sem dores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Adjustment Feedback Box */}
      <div className="p-3 rounded-xl bg-[#080b11] border border-[#1e293b] flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-[#f1f5f9]">Ajuste Dinâmico no Treino</div>
          <p className="text-[#94a3b8] leading-relaxed">{explanation}</p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-2 pt-1">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="text-xs">
            Pular Ajustes
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleApply}
          className="text-xs font-bold py-2.5 px-4 flex items-center gap-1.5 shadow-lg shadow-[#00f0ff]/15"
        >
          <span>Aplicar Auto-Regulação & Iniciar Treino</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export interface WellnessModalProps {
  isOpen: boolean;
  onSubmit: (wellness: WellnessData) => void;
  onSkip: () => void;
}

export const WellnessModal: React.FC<WellnessModalProps> = ({ isOpen, onSubmit, onSkip }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onSkip} title="Avaliação de Prontidão Diária">
      <DailyReadinessCard onConfirm={onSubmit} onSkip={onSkip} />
    </Modal>
  );
};

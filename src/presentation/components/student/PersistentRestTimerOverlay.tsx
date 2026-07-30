import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Play, Pause, RotateCcw, Plus, Minus, X, Bell, ChevronUp, ChevronDown, CheckCircle2, Zap } from 'lucide-react';

interface PersistentRestTimerOverlayProps {
  restTimerSeconds: number | null;
  restTimerMax: number;
  restTimerActive: boolean;
  onStopRestTimer: () => void;
  onAddRestSeconds: (secs: number) => void;
  onTogglePlayPause?: () => void;
}

export const PersistentRestTimerOverlay: React.FC<PersistentRestTimerOverlayProps> = ({
  restTimerSeconds,
  restTimerMax = 90,
  restTimerActive,
  onStopRestTimer,
  onAddRestSeconds,
  onTogglePlayPause
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // If timer is not active and seconds is null/undefined, don't show
  if (restTimerSeconds === null && !restTimerActive) {
    return null;
  }

  const secs = restTimerSeconds || 0;
  const minsStr = Math.floor(secs / 60).toString().padStart(2, '0');
  const secsStr = (secs % 60).toString().padStart(2, '0');

  const maxVal = Math.max(restTimerMax, 1);
  const progressPercent = Math.min(100, Math.max(0, Math.round((secs / maxVal) * 100)));
  const isDone = secs === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pointer-events-auto"
      >
        {isMinimized ? (
          /* Minimized Floating Pill */
          <div className="bg-[#080b11]/95 backdrop-blur-md border-2 border-[#00f0ff] rounded-full px-4 py-2.5 shadow-2xl shadow-[#00f0ff]/30 flex items-center justify-between gap-3 text-[#f1f5f9]">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-full ${isDone ? 'bg-emerald-500 text-white animate-bounce' : 'bg-[#00f0ff] text-[#080b11] animate-pulse'}`}>
                <Timer className="w-4 h-4" />
              </div>
              <span className={`font-mono font-black text-lg tracking-tight ${isDone ? 'text-emerald-400' : 'text-[#00f0ff]'}`}>
                {minsStr}:{secsStr}
              </span>
              <span className="text-[11px] text-[#94a3b8] font-bold hidden sm:inline">
                {isDone ? 'Concluído!' : 'Descanso'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {onTogglePlayPause && !isDone && (
                <button
                  onClick={onTogglePlayPause}
                  className="p-1.5 rounded-full bg-[#1e293b] hover:bg-[#00f0ff]/20 text-[#00f0ff] transition-all"
                  title={restTimerActive ? 'Pausar' : 'Iniciar'}
                >
                  {restTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-[#00f0ff]" />}
                </button>
              )}
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-full bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] transition-all"
                title="Expandir Cronômetro"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Expanded Overlay Card */
          <div className={`bg-[#080b11]/95 backdrop-blur-xl border-2 rounded-3xl p-4 md:p-5 shadow-2xl transition-all space-y-4 ${
            isDone 
              ? 'border-emerald-500 shadow-emerald-500/30' 
              : 'border-[#00f0ff] shadow-[#00f0ff]/30'
          }`}>
            {/* Top Bar Controls */}
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDone ? 'bg-emerald-500 text-white animate-bounce' : 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'}`}>
                  {isDone ? <Bell className="w-4 h-4" /> : <Timer className="w-4 h-4 animate-pulse" />}
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#f1f5f9] flex items-center gap-1.5">
                    <span>INTERVALO DE DESCANSO</span>
                    {isDone && (
                      <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        SÉRIE PRONTA!
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#94a3b8]">
                    {isDone ? 'Sua recuperação muscular foi atingida' : 'Mantenha a respiração ritmada'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-xl text-[#94a3b8] hover:text-[#00f0ff] hover:bg-[#1e293b] transition-all"
                  title="Minimizar"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={onStopRestTimer}
                  className="p-1.5 rounded-xl text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Fechar Cronômetro"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Clock Display & Radial Bar */}
            <div className="flex items-center justify-between gap-4 py-1">
              <div className="space-y-1">
                <div className={`font-mono font-black text-4xl md:text-5xl tracking-tight ${
                  isDone ? 'text-emerald-400 animate-pulse' : 'text-[#00f0ff]'
                }`}>
                  {minsStr}:{secsStr}
                </div>
                <div className="text-[11px] font-mono text-[#94a3b8] font-bold">
                  {isDone ? 'Recuperação 100%' : `Meta prescrita: ${restTimerMax}s`}
                </div>
              </div>

              {/* Progress Ring / Gauge */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="#1e293b"
                    strokeWidth="5"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke={isDone ? '#10b981' : '#00f0ff'}
                    strokeWidth="5"
                    strokeDasharray={163}
                    strokeDashoffset={163 - (163 * progressPercent) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute font-mono text-xs font-black text-[#f1f5f9]">
                  {progressPercent}%
                </span>
              </div>
            </div>

            {/* Progress Bar Line */}
            <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isDone ? 'bg-emerald-400' : 'bg-[#00f0ff]'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Quick Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onAddRestSeconds(-10)}
                  className="bg-[#1e293b] hover:bg-[#334155] text-[#f1f5f9] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border border-[#334155]"
                >
                  -10s
                </button>
                <button
                  onClick={() => onAddRestSeconds(30)}
                  className="bg-[#1e293b] hover:bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border border-[#00f0ff]/30"
                >
                  +30s
                </button>
                {onTogglePlayPause && !isDone && (
                  <button
                    onClick={onTogglePlayPause}
                    className="bg-[#1e293b] hover:bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold px-3 py-1.5 rounded-xl transition-all border border-[#00f0ff]/30 flex items-center gap-1"
                  >
                    {restTimerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-[#00f0ff]" />}
                    <span>{restTimerActive ? 'Pausar' : 'Retomar'}</span>
                  </button>
                )}
              </div>

              <button
                onClick={onStopRestTimer}
                className={`font-black text-xs px-4 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 ${
                  isDone 
                    ? 'bg-emerald-400 text-[#080b11] hover:brightness-110 shadow-emerald-400/20' 
                    : 'bg-[#00f0ff] text-[#080b11] hover:brightness-110 shadow-[#00f0ff]/20'
                }`}
              >
                <span>{isDone ? 'Iniciar Próxima Série →' : 'Pular Descanso →'}</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

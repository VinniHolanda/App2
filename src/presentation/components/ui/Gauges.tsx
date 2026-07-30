import React from 'react';

export interface RestTimerBarProps {
  seconds: number | null;
  maxSeconds: number;
  active: boolean;
  onSkip: () => void;
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
  seconds,
  maxSeconds,
  active,
  onSkip
}) => {
  if (!active || seconds === null) return null;

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const isWarn = seconds <= 10;

  const circumference = 94.2;
  const progress = Math.max(0, seconds) / (maxSeconds || 90);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] border border-[#1e293b] rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl animate-slide-up min-w-[260px]">
      <div className="relative w-9 h-9 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={isWarn ? '#ff6b6b' : '#00f0ff'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
      </div>

      <div className="flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Descanso</div>
        <div className={`font-display text-2xl font-extrabold tracking-tight ${isWarn ? 'text-red-400' : 'text-[#00f0ff]'}`}>
          {timeFormatted}
        </div>
      </div>

      <button
        onClick={onSkip}
        className="px-3 py-1.5 rounded-full border border-[#1e293b] text-xs font-bold text-[#94a3b8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-colors"
      >
        Pular ▶
      </button>
    </div>
  );
};

export interface TonnageGaugeProps {
  currentTonnage: number;
  targetLimit: number | null;
}

export const TonnageGauge: React.FC<TonnageGaugeProps> = ({ currentTonnage, targetLimit }) => {
  if (!currentTonnage && !targetLimit) return null;

  const pct = targetLimit ? Math.round((currentTonnage / targetLimit) * 100) : null;
  let statusText = '';
  let color = 'text-[#00f0ff]';
  let barBg = 'bg-[#00f0ff]';

  if (pct !== null) {
    if (pct < 85) {
      statusText = '⬇ Abaixo do estímulo mínimo (sub-MEV)';
      color = 'text-amber-400';
      barBg = 'bg-amber-400';
    } else if (pct <= 100) {
      statusText = 'Zona MEV — Estímulo efetivo mínimo';
      color = 'text-[#00f0ff]';
      barBg = 'bg-[#00f0ff]';
    } else if (pct <= 145) {
      statusText = 'Zona MAV — Volume ótimo ✓';
      color = 'text-[#00f0ff]';
      barBg = 'bg-[#00f0ff]';
    } else {
      statusText = '⚠ Zona MRV — Atenção ao excesso de fadiga';
      color = 'text-red-400';
      barBg = 'bg-red-400';
    }
  }

  const fillWidth = pct !== null ? Math.min(100, Math.round(pct / 1.45)) : 0;

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 mb-4">
      <div className="flex justify-between items-center text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-1.5">
        <span>Tonelagem Acumulada</span>
        {pct !== null && <span className={color}>{pct}% do alvo</span>}
      </div>

      {targetLimit && (
        <div className="h-2.5 bg-[#080b11] rounded-full overflow-hidden my-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barBg}`}
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      )}

      <div className="flex justify-between text-xs text-[#64748b] font-medium mt-1">
        <span><strong className="text-[#f1f5f9] text-sm">{currentTonnage.toLocaleString('pt-BR')}</strong> kg</span>
        {targetLimit && <span>MEV: {targetLimit.toLocaleString('pt-BR')} kg · MRV: {Math.round(targetLimit * 1.45).toLocaleString('pt-BR')} kg</span>}
      </div>

      {statusText && <div className={`text-xs font-semibold mt-2 ${color}`}>{statusText}</div>}
    </div>
  );
};

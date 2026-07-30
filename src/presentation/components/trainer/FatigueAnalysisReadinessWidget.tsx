import React, { useState, useMemo } from 'react';
import { Client, Session } from '../../../domain/types';
import { Activity, ShieldAlert, Zap, AlertTriangle, Check, RefreshCw, Flame, HeartPulse, Moon, Brain, Battery, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface FatigueAnalysisReadinessWidgetProps {
  client: Client;
  onApplyVolumeAdjust?: (adjustmentPct: number, reason: string) => void;
}

export const FatigueAnalysisReadinessWidget: React.FC<FatigueAnalysisReadinessWidgetProps> = ({
  client,
  onApplyVolumeAdjust
}) => {
  // Interactive inputs for simulated/current session wellness feedback
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sorenessLevel, setSorenessLevel] = useState<number>(3); // 1-10
  const [stressLevel, setStressLevel] = useState<number>(3); // 1-10
  const [energyLevel, setEnergyLevel] = useState<number>(8); // 1-10
  const [overrideSrpe, setOverrideSrpe] = useState<number>(7.5); // Recent sRPE

  // Historical sessions analysis
  const recentSessions = useMemo(() => {
    return client.sessions || client.rpeLog || [];
  }, [client]);

  // Calculate Acute-to-Chronic Workload Ratio (ACWR) and average sRPE
  const telemetry = useMemo(() => {
    if (recentSessions.length === 0) {
      return {
        avgSrpe: overrideSrpe,
        acuteLoad: 1200,
        chronicLoad: 1100,
        acwr: 1.09,
        totalSessionsCount: 0
      };
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    let acuteVol = 0;
    let chronicVol = 0;
    let totalSrpe = 0;
    let srpeCount = 0;

    for (const s of recentSessions) {
      const sDate = s.date ? new Date(s.date) : new Date();
      const load = (s.min || 60) * (s.srpe || 7);

      if (sDate >= sevenDaysAgo) {
        acuteVol += load;
      }
      if (sDate >= twentyEightDaysAgo) {
        chronicVol += load;
      }

      if (s.srpe) {
        totalSrpe += s.srpe;
        srpeCount++;
      }
    }

    const avgSrpe = srpeCount > 0 ? totalSrpe / srpeCount : overrideSrpe;
    const weeklyChronicAvg = (chronicVol / 28) * 7;
    const acwr = weeklyChronicAvg > 0 ? acuteVol / weeklyChronicAvg : 1.0;

    return {
      avgSrpe: Math.round(avgSrpe * 10) / 10,
      acuteLoad: Math.round(acuteVol),
      chronicLoad: Math.round(weeklyChronicAvg),
      acwr: Math.round(acwr * 100) / 100,
      totalSessionsCount: recentSessions.length
    };
  }, [recentSessions, overrideSrpe]);

  // Calculate Readiness Score (0 - 100%)
  const readiness = useMemo(() => {
    let score = 100;
    const deductions: { reason: string; penalty: number }[] = [];

    // 1. Sleep impact
    if (sleepHours < 5.5) {
      score -= 22;
      deductions.push({ reason: 'Sono Severamente Deprivado (< 5.5h)', penalty: 22 });
    } else if (sleepHours < 7.0) {
      score -= 10;
      deductions.push({ reason: 'Sono Abaixo do Ideal (< 7h)', penalty: 10 });
    }

    // 2. Muscle Soreness (DOMS)
    if (sorenessLevel >= 8) {
      score -= 25;
      deductions.push({ reason: 'Dor Muscular Tardia Intensa (DOMS ≥ 8)', penalty: 25 });
    } else if (sorenessLevel >= 6) {
      score -= 12;
      deductions.push({ reason: 'Dor Muscular Moderada (DOMS ≥ 6)', penalty: 12 });
    }

    // 3. Stress Level
    if (stressLevel >= 8) {
      score -= 18;
      deductions.push({ reason: 'Estresse Vital/Sistêmico Elevado', penalty: 18 });
    } else if (stressLevel >= 6) {
      score -= 8;
      deductions.push({ reason: 'Estresse Moderado', penalty: 8 });
    }

    // 4. Energy Level boost or penalty
    if (energyLevel <= 4) {
      score -= 15;
      deductions.push({ reason: 'Baixo Nível de Energia Percebida', penalty: 15 });
    } else if (energyLevel >= 9) {
      score += 5;
    }

    // 5. ACWR Workload Ratio
    if (telemetry.acwr > 1.45) {
      score -= 25;
      deductions.push({ reason: 'Pico Perigoso de Carga (ACWR > 1.45)', penalty: 25 });
    } else if (telemetry.acwr > 1.25) {
      score -= 10;
      deductions.push({ reason: 'Elevada Razão Aguda:Crônica (ACWR > 1.25)', penalty: 10 });
    } else if (telemetry.acwr >= 0.85 && telemetry.acwr <= 1.15) {
      score += 5;
    }

    // 6. Recent sRPE
    if (telemetry.avgSrpe >= 8.8) {
      score -= 15;
      deductions.push({ reason: 'Intensidade Recente Muito Alta (sRPE ≥ 8.8)', penalty: 15 });
    }

    const finalScore = Math.max(15, Math.min(100, Math.round(score)));

    // Categorization & Automatic Prescriptive Recommendation
    let statusCategory: 'excelente' | 'adequado' | 'fadiga_moderada' | 'critico';
    let statusLabel: string;
    let badgeBg: string;
    let recommendedVolumeAdjust: number; // percentage (-30, -15, 0, +5)
    let recommendationText: string;

    if (finalScore >= 85) {
      statusCategory = 'excelente';
      statusLabel = 'Prontidão Máxima (Supercompensação)';
      badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      recommendedVolumeAdjust = 5;
      recommendationText = 'Atleta em condições ideais de prontidão. Autorizada progressão de carga (+2.5% a +5%) ou manutenção de RPE alto (8.5 - 9.5).';
    } else if (finalScore >= 70) {
      statusCategory = 'adequado';
      statusLabel = 'Prontidão Adequada';
      badgeBg = 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/40';
      recommendedVolumeAdjust = 0;
      recommendationText = 'Nível de fadiga normal e controlado. Manter volume e cargas exatamente conforme prescritos no plano.';
    } else if (finalScore >= 50) {
      statusCategory = 'fadiga_moderada';
      statusLabel = 'Fadiga Moderada Acumulada';
      badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recommendedVolumeAdjust = -20;
      recommendationText = 'Recomendado auto-ajuste de volume: Reduzir 1 a 2 séries por exercício e limitar RPE máximo a 8.0 nesta sessão.';
    } else {
      statusCategory = 'critico';
      statusLabel = 'Alerta de Overreaching / Fadiga Severa';
      badgeBg = 'bg-red-500/25 text-red-300 border-red-500/50';
      recommendedVolumeAdjust = -40;
      recommendationText = '⚠️ Sinais de estresse sistêmico acentuado. Aplicar treino de regeneração ativa (-40% volume, RPE ≤ 6) ou sugerir dia de descanso total.';
    }

    return {
      score: finalScore,
      statusCategory,
      statusLabel,
      badgeBg,
      recommendedVolumeAdjust,
      recommendationText,
      deductions
    };
  }, [sleepHours, sorenessLevel, stressLevel, energyLevel, telemetry]);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl text-[#f1f5f9]">
      {/* Widget Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                MÓDULO DE FADIGA & BIOMETRIA
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${readiness.badgeBg}`}>
                {readiness.statusLabel}
              </span>
            </div>
            <h3 className="text-base font-black font-display text-white">
              Análise de Fadiga & Índice de Prontidão (Readiness)
            </h3>
          </div>
        </div>

        {/* Big Score Gauge Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-[#94a3b8] block">Readiness Score</span>
            <span className={`font-mono text-2xl font-black ${
              readiness.score >= 85 ? 'text-emerald-400' :
              readiness.score >= 70 ? 'text-[#00f0ff]' :
              readiness.score >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {readiness.score}%
            </span>
          </div>
          <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-mono font-bold text-xs ${
            readiness.score >= 85 ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40' :
            readiness.score >= 70 ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10' :
            readiness.score >= 50 ? 'border-amber-500 text-amber-400 bg-amber-950/40' : 'border-red-500 text-red-400 bg-red-950/40'
          }`}>
            {readiness.score}
          </div>
        </div>
      </div>

      {/* Interactive Biometric Inputs Grid */}
      <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#1e293b] pb-2">
          <span className="font-bold text-[#00f0ff] uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5" />
            Check-in Biométrico Pré-Treino (Parâmetros de Prontidão)
          </span>
          <span className="text-[10px] text-[#64748b]">Ajuste interativo para simulação</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Sono */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-[#94a3b8]">
              <span className="flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-400" /> Horas de Sono</span>
              <span className="font-mono text-white">{sleepHours}h</span>
            </div>
            <input
              type="range"
              min="3"
              max="11"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* Dores Musculares (DOMS) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-[#94a3b8]">
              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-amber-400" /> Dor Muscular (DOMS)</span>
              <span className="font-mono text-white">{sorenessLevel}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={sorenessLevel}
              onChange={(e) => setSorenessLevel(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Estresse Sistêmico */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-[#94a3b8]">
              <span className="flex items-center gap-1"><Brain className="w-3 h-3 text-purple-400" /> Estresse / Cansaço</span>
              <span className="font-mono text-white">{stressLevel}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Nível de Energia */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-[#94a3b8]">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#00f0ff]" /> Disposição Percebida</span>
              <span className="font-mono text-white">{energyLevel}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Telemetry Indicators Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#94a3b8] block">Razão Aguda:Crônica (ACWR)</span>
          <div className="font-mono text-base font-black text-white mt-0.5 flex items-center justify-between">
            <span>{telemetry.acwr}</span>
            <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${
              telemetry.acwr > 1.35 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {telemetry.acwr > 1.35 ? '⚠️ Alto Pico' : '✓ Sweet Spot'}
            </span>
          </div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#94a3b8] block">Média Recente sRPE</span>
          <div className="font-mono text-base font-black text-purple-300 mt-0.5">
            {telemetry.avgSrpe} <span className="text-[10px] text-[#64748b]">/ 10</span>
          </div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#94a3b8] block">Carga Aguda (7d)</span>
          <div className="font-mono text-base font-black text-[#00f0ff] mt-0.5">
            {telemetry.acuteLoad} <span className="text-[10px] text-[#64748b]">UA</span>
          </div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-[#94a3b8] block">Carga Crônica Semanal</span>
          <div className="font-mono text-base font-black text-slate-200 mt-0.5">
            {telemetry.chronicLoad} <span className="text-[10px] text-[#64748b]">UA</span>
          </div>
        </div>
      </div>

      {/* Automatic Volume Adjustment Recommendation Box */}
      <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
        readiness.recommendedVolumeAdjust < 0
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
          : readiness.recommendedVolumeAdjust > 0
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
          : 'bg-[#00f0ff]/10 border-[#00f0ff]/30 text-[#00f0ff]'
      }`}>
        <div className="flex items-center justify-between font-bold text-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Recomendação de Prescrição Automática:</span>
          </div>
          <span className="font-mono bg-black/40 px-2 py-0.5 rounded text-xs">
            Ajuste Sugerido: {readiness.recommendedVolumeAdjust > 0 ? `+${readiness.recommendedVolumeAdjust}%` : `${readiness.recommendedVolumeAdjust}%`} Volume
          </span>
        </div>

        <p className="text-xs opacity-90">{readiness.recommendationText}</p>

        {readiness.deductions.length > 0 && (
          <div className="border-t border-white/10 pt-2 text-[11px] space-y-1">
            <span className="font-bold block opacity-80">Fatores de Impacto na Fadiga:</span>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              {readiness.deductions.map((d, i) => (
                <li key={i}>
                  {d.reason} <span className="font-mono font-bold">(-{d.penalty}%)</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onApplyVolumeAdjust && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onApplyVolumeAdjust(readiness.recommendedVolumeAdjust, readiness.statusLabel)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Aplicar Ajuste Sugerido ao Treino Prescrito</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

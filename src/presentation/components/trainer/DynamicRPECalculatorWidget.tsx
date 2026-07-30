import React, { useState, useMemo } from 'react';
import { Client, ProgramExercise } from '../../../domain/types';
import { calculate1RMEpley, calculateEpleyAdjustedLoad, calculatePersonalRecords } from '../../../domain/calculators/loadCalculators';
import { Calculator, Gauge, Flame, AlertTriangle, Check, ArrowUpRight, Activity, Zap, RefreshCw } from 'lucide-react';

interface DynamicRPECalculatorWidgetProps {
  client: Client;
  onApplyPrescription?: (exerciseName: string, suggestedKg: number, targetRpe: number) => void;
}

export const DynamicRPECalculatorWidget: React.FC<DynamicRPECalculatorWidgetProps> = ({
  client,
  onApplyPrescription
}) => {
  // Extract exercise options from client program
  const clientExercises = useMemo(() => {
    const list: string[] = [];
    if (client.program?.days) {
      for (const d of client.program.days) {
        for (const ex of (d.exercises || [])) {
          if (ex.name && !list.includes(ex.name)) {
            list.push(ex.name);
          }
        }
      }
    }
    if (list.length === 0) {
      list.push('Agachamento Livre', 'Supino Reto', 'Levantamento Terra', 'Puxada Frontal', 'Desenvolvimento de Ombros');
    }
    return list;
  }, [client]);

  const [selectedExercise, setSelectedExercise] = useState<string>(clientExercises[0] || 'Agachamento Livre');
  const [prescribedKg, setPrescribedKg] = useState<number>(60);
  const [prescribedReps, setPrescribedReps] = useState<number>(10);
  const [targetRpe, setTargetRpe] = useState<number>(8);
  const [lastSessionRpe, setLastSessionRpe] = useState<number>(8);

  // Look up student's PRs or history for this exercise
  const studentPRs = useMemo(() => {
    return calculatePersonalRecords(client.sessions || []);
  }, [client.sessions]);

  const currentPR = studentPRs[selectedExercise] || null;

  // Real-time calculations
  const sim = useMemo(() => {
    const rir = Math.max(0, 10 - targetRpe);
    // Estimated 1RM if student performs targetReps @ targetRpe
    const effectiveReps = prescribedReps + rir;
    const est1RM = calculate1RMEpley(prescribedKg, effectiveReps);

    // Percentage of 1RM
    const pct1RM = est1RM > 0 ? Math.round((prescribedKg / est1RM) * 100) : 0;

    // Adjusted load suggestion using Epley
    const adjusted = calculateEpleyAdjustedLoad(
      prescribedKg,
      prescribedReps,
      lastSessionRpe,
      targetRpe,
      prescribedReps
    );

    // Historical comparison ratio
    let historicalRatio = 1.0;
    let comparisonStatus = 'normal';
    let comparisonMessage = '';

    if (currentPR && currentPR.est1RM > 0) {
      historicalRatio = est1RM / currentPR.est1RM;
      const pctDiff = Math.round((historicalRatio - 1) * 100);

      if (pctDiff > 15) {
        comparisonStatus = 'alert_high';
        comparisonMessage = `⚠️ Alerta de Intensidade: A simulação exige 1RM de ${Math.round(est1RM)}kg (${pctDiff}% acima do PR histórico do aluno de ${Math.round(currentPR.est1RM)}kg). Risco elevado de falha não planejada!`;
      } else if (pctDiff > 0) {
        comparisonStatus = 'progressive';
        comparisonMessage = `🔥 Sobrecarga Progressiva Adequada: A carga prescrita estimula +${pctDiff}% sobre o PR histórico (${Math.round(currentPR.est1RM)}kg). Perfeito para adaptação!`;
      } else if (pctDiff < -20) {
        comparisonStatus = 'sub_optimal';
        comparisonMessage = `💤 Sub-estimado: Carga ${Math.abs(pctDiff)}% abaixo da capacidade histórica do aluno. Considere aumentar a carga para atingir RPE ${targetRpe}.`;
      } else {
        comparisonStatus = 'maintenance';
        comparisonMessage = `✓ Carga Alinhada: Dentro da faixa de controle histórico do aluno (${Math.round(currentPR.est1RM)}kg 1RM).`;
      }
    } else {
      comparisonMessage = `ℹ️ Sem registros históricos prévios para "${selectedExercise}". Carga estimada para nível ${client.level}.`;
    }

    return {
      rir,
      est1RM: Math.round(est1RM * 10) / 10,
      pct1RM,
      suggestedKg: adjusted.suggestedKg,
      comparisonStatus,
      comparisonMessage,
      currentPR
    };
  }, [prescribedKg, prescribedReps, targetRpe, lastSessionRpe, currentPR, selectedExercise, client.level]);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl text-[#f1f5f9]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <Calculator className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff] flex items-center gap-1">
              <span>SIMULADOR FISIOLÓGICO</span>
              <span>•</span>
              <span className="text-[#94a3b8]">Epley & RIR Matrix</span>
            </div>
            <h3 className="text-base font-black font-display text-white">
              Calculadora de RPE Dinâmica & Intensidade
            </h3>
          </div>
        </div>

        <span className="bg-[#1e293b] text-[#00f0ff] text-xs font-mono font-bold px-2.5 py-1 rounded-lg border border-[#00f0ff]/20">
          RIR {sim.rir} ({10 - sim.rir} RPE)
        </span>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Exercício */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#94a3b8] uppercase">
            Exercício Prescrito
          </label>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="w-full bg-[#080b11] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-2.5 py-2 text-xs font-semibold text-white outline-none transition-all cursor-pointer"
          >
            {clientExercises.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>

        {/* Carga (kg) */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#94a3b8] uppercase">
            Carga Prescrita (kg)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="500"
              value={prescribedKg}
              onChange={(e) => setPrescribedKg(Number(e.target.value) || 0)}
              className="w-full bg-[#080b11] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[10px] font-mono">kg</span>
          </div>
        </div>

        {/* Repetições */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-[#94a3b8] uppercase">
            Repetições
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={prescribedReps}
            onChange={(e) => setPrescribedReps(Number(e.target.value) || 1)}
            className="w-full bg-[#080b11] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none transition-all"
          />
        </div>

        {/* RPE Alvo */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-[#94a3b8] uppercase">
              RPE Alvo: <span className="text-[#00f0ff] font-mono">{targetRpe}</span>
            </label>
            <span className="text-[10px] text-[#64748b] font-mono">({sim.rir} RIR)</span>
          </div>
          <input
            type="range"
            min="5"
            max="10"
            step="0.5"
            value={targetRpe}
            onChange={(e) => setTargetRpe(Number(e.target.value))}
            className="w-full accent-[#00f0ff] cursor-pointer mt-1"
          />
        </div>
      </div>

      {/* Outputs Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {/* Estimated 1RM */}
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">1RM Estimada</span>
          <div className="font-mono text-xl font-black text-[#00f0ff]">
            {sim.est1RM} <span className="text-xs font-normal text-[#64748b]">kg</span>
          </div>
          <span className="text-[10px] text-[#64748b] block">Fórmula de Epley</span>
        </div>

        {/* Intensity % 1RM */}
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">Intensidade (% 1RM)</span>
          <div className="font-mono text-xl font-black text-white">
            {sim.pct1RM}%
          </div>
          <span className="text-[10px] text-[#64748b] block">da carga máxima</span>
        </div>

        {/* Historical PR */}
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">PR Histórico Aluno</span>
          <div className="font-mono text-xl font-black text-emerald-400">
            {sim.currentPR ? `${Math.round(sim.currentPR.est1RM)} kg` : 'N/D'}
          </div>
          <span className="text-[10px] text-[#64748b] block">
            {sim.currentPR ? `${sim.currentPR.bestKg}kg x ${sim.currentPR.bestReps} reps` : 'Sem registros'}
          </span>
        </div>

        {/* Suggested Target Load */}
        <div className="bg-[#080b11] border border-[#00f0ff]/30 rounded-xl p-3 space-y-1">
          <span className="text-[10px] font-bold text-[#00f0ff] uppercase block">Carga Alvo Sugerida</span>
          <div className="font-mono text-xl font-black text-[#00f0ff]">
            {sim.suggestedKg} <span className="text-xs font-normal text-[#64748b]">kg</span>
          </div>
          <span className="text-[10px] text-[#00f0ff]/80 block">Ajuste fino RPE {targetRpe}</span>
        </div>
      </div>

      {/* Validation Status Box */}
      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
        sim.comparisonStatus === 'alert_high'
          ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
          : sim.comparisonStatus === 'progressive'
          ? 'bg-[#00f0ff]/10 border-[#00f0ff]/40 text-[#00f0ff]'
          : sim.comparisonStatus === 'sub_optimal'
          ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
          : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
      }`}>
        <Flame className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Análise de Adequação de Carga:</div>
          <p className="text-[11px] opacity-90">{sim.comparisonMessage}</p>
        </div>
      </div>
    </div>
  );
};

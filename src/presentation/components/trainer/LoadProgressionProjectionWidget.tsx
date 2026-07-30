import React, { useState, useMemo } from 'react';
import { Client } from '../../../domain/types';
import { TRAINING_METHODS_CATALOG } from '../../../domain/trainingMethods';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';
import { TrendingUp, Target, Calendar, Sparkles, Zap, ArrowUpRight, ShieldCheck, Dumbbell, ChevronRight } from 'lucide-react';

interface LoadProgressionProjectionWidgetProps {
  client: Client;
  initialExerciseName?: string;
  initial1RM?: number;
}

export const LoadProgressionProjectionWidget: React.FC<LoadProgressionProjectionWidgetProps> = ({
  client,
  initialExerciseName = 'Agachamento Livre',
  initial1RM = 100
}) => {
  // Configurable options
  const [selectedExercise, setSelectedExercise] = useState<string>(initialExerciseName);
  const [baseline1RM, setBaseline1RM] = useState<number>(initial1RM);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('onda_3_1');
  const [totalWeeks, setTotalWeeks] = useState<4 | 6 | 8>(6);

  // Available methods from catalog
  const availableMethods = useMemo(() => {
    return [
      { id: 'onda_3_1', name: 'Onda 3:1 (Acumulação, Intensificação, Pico, Deload)' },
      { id: 'dupla_progressao', name: 'Dupla Progressão (Volume para Intensidade)' },
      { id: 'top_set_backoff', name: 'Top Set + Back-off Sets' },
      { id: 'bloco_forca_hipertrofia', name: 'Bloco Hipertrofia → Força Pura' },
      { id: 'ondulatoria_semanal', name: 'Periodização Ondulatória Semanal' },
      { id: 'drop_set', name: 'Método Drop-Set / Rest-Pause (Densidade)' }
    ];
  }, []);

  // Projection engine generating week-by-week metrics
  const projection = useMemo(() => {
    const weeklyData: {
      week: string;
      weekNum: number;
      phase: string;
      projected1RM: number;
      workingWeight: number;
      targetReps: number;
      expectedRpe: number;
      gainPct: number;
      isDeload: boolean;
    }[] = [];

    // Rate of adaptation based on student level
    const levelFactor = client.level === 'Iniciante' ? 0.018 : client.level === 'Avançado' ? 0.006 : 0.012; // weekly gain rate

    let current1RM = baseline1RM;

    for (let w = 1; w <= totalWeeks; w++) {
      let phase = 'Carga Base';
      let isDeload = false;
      let loadRatio = 0.75; // percentage of 1RM for working sets
      let targetReps = 8;
      let expectedRpe = 8.0;
      let weekGain = levelFactor;

      if (selectedMethodId === 'onda_3_1') {
        const cycleWeek = ((w - 1) % 4) + 1;
        if (cycleWeek === 1) {
          phase = 'Acumulação (Volume)';
          loadRatio = 0.72;
          targetReps = 10;
          expectedRpe = 7.5;
          weekGain *= 1.0;
        } else if (cycleWeek === 2) {
          phase = 'Intensificação';
          loadRatio = 0.78;
          targetReps = 8;
          expectedRpe = 8.5;
          weekGain *= 1.3;
        } else if (cycleWeek === 3) {
          phase = 'Pico de Força (Overload)';
          loadRatio = 0.85;
          targetReps = 5;
          expectedRpe = 9.5;
          weekGain *= 1.6;
        } else {
          phase = 'Deload / Regeneração';
          loadRatio = 0.60;
          targetReps = 8;
          expectedRpe = 6.0;
          isDeload = true;
          weekGain = 0; // Supercompensation takes effect
        }
      } else if (selectedMethodId === 'dupla_progressao') {
        phase = w % 2 === 1 ? 'Aumento de Repetições' : 'Aumento de Carga';
        loadRatio = 0.75 + (w * 0.01);
        targetReps = w % 2 === 1 ? 10 : 8;
        expectedRpe = 8.5;
        if (w === totalWeeks && totalWeeks >= 6) {
          isDeload = true;
          phase = 'Deload Técnico';
          loadRatio = 0.62;
        }
      } else if (selectedMethodId === 'top_set_backoff') {
        phase = `Top Set @ ${Math.round(80 + w * 1.2)}% 1RM`;
        loadRatio = 0.82 + (w * 0.01);
        targetReps = 5;
        expectedRpe = 9.0;
        weekGain *= 1.4;
      } else if (selectedMethodId === 'bloco_forca_hipertrofia') {
        if (w <= Math.floor(totalWeeks / 2)) {
          phase = 'Bloco Hipertrofia (70-78%)';
          loadRatio = 0.74 + (w * 0.01);
          targetReps = 10;
          expectedRpe = 8.0;
        } else {
          phase = 'Bloco Força Pura (82-90%)';
          loadRatio = 0.82 + ((w - Math.floor(totalWeeks / 2)) * 0.02);
          targetReps = 4;
          expectedRpe = 9.0;
          weekGain *= 1.5;
        }
      } else {
        // Ondulatória
        const patterns = [
          { phase: 'Treino A (Hipertrofia)', ratio: 0.75, reps: 8, rpe: 8 },
          { phase: 'Treino B (Força)', ratio: 0.85, reps: 4, rpe: 9 },
          { phase: 'Treino C (Resistência)', ratio: 0.65, reps: 15, rpe: 7.5 }
        ];
        const p = patterns[(w - 1) % 3];
        phase = p.phase;
        loadRatio = p.ratio;
        targetReps = p.reps;
        expectedRpe = p.rpe;
      }

      // Update projected 1RM
      if (!isDeload) {
        current1RM = current1RM * (1 + weekGain);
      } else {
        // Post deload supercompensation jump
        current1RM = current1RM * 1.012;
      }

      const workingWeight = Math.round((current1RM * loadRatio) / 2) * 2;
      const gainPct = Math.round(((current1RM - baseline1RM) / baseline1RM) * 100 * 10) / 10;

      weeklyData.push({
        week: `Sem ${w}`,
        weekNum: w,
        phase,
        projected1RM: Math.round(current1RM * 10) / 10,
        workingWeight,
        targetReps,
        expectedRpe,
        gainPct,
        isDeload
      });
    }

    const final1RM = weeklyData[weeklyData.length - 1]?.projected1RM || baseline1RM;
    const totalGainKg = Math.round((final1RM - baseline1RM) * 10) / 10;
    const totalGainPct = Math.round(((final1RM - baseline1RM) / baseline1RM) * 100 * 10) / 10;

    return {
      weeklyData,
      final1RM,
      totalGainKg,
      totalGainPct
    };
  }, [baseline1RM, selectedMethodId, totalWeeks, client.level]);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl text-[#f1f5f9]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff]">
                MODELAGEM DE PROJEÇÃO DE CARGA
              </span>
              <span className="bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-bold px-2 py-0.5 rounded-full">
                {totalWeeks} Semanas
              </span>
            </div>
            <h3 className="text-base font-black font-display text-white">
              Calculadora de Progressão de Carga (Projeção de 1RM)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase block">Ganho Projetado</span>
            <span className="font-mono text-xl font-black text-emerald-400">
              +{projection.totalGainKg} kg <span className="text-xs font-normal text-[#94a3b8]">({projection.totalGainPct > 0 ? `+${projection.totalGainPct}%` : '0%'})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
        {/* Exercício */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase block">Exercício Alvo</label>
          <input
            type="text"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            placeholder="Ex: Agachamento Livre"
            className="w-full bg-[#0f172a] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold outline-none"
          />
        </div>

        {/* 1RM Atual */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase block">1RM Atual (kg)</label>
          <input
            type="number"
            min="10"
            max="600"
            value={baseline1RM}
            onChange={(e) => setBaseline1RM(Number(e.target.value) || 50)}
            className="w-full bg-[#0f172a] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-white outline-none"
          />
        </div>

        {/* Método de Treino */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase block">Modelo do Método</label>
          <select
            value={selectedMethodId}
            onChange={(e) => setSelectedMethodId(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-2 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer"
          >
            {availableMethods.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Duração Microciclo */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#94a3b8] uppercase block">Duração (Semanas)</label>
          <div className="flex gap-1.5">
            {[4, 6, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setTotalWeeks(w as 4 | 6 | 8)}
                className={`flex-1 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                  totalWeeks === w
                    ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]'
                    : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:text-white'
                }`}
              >
                {w}w
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Graphical Projection Chart */}
      <div className="bg-[#080b11] border border-[#1e293b] rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#00f0ff] flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            Curva de Evolução Esperada da 1RM & Carga de Trabalho
          </span>
          <span className="text-[#64748b] text-[11px]">Carga Inicial: {baseline1RM}kg → Final: {projection.final1RM}kg</span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection.weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#00f0ff', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value: any, name: any) => [
                  `${value} kg`,
                  name === 'projected1RM' ? '1RM Projetado' : 'Carga de Trabalho (Working Set)'
                ]}
              />
              <Area type="monotone" dataKey="projected1RM" stroke="#00f0ff" strokeWidth={3} fillOpacity={1} fill="url(#color1RM)" />
              <Area type="monotone" dataKey="workingWeight" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorWork)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Week-by-Week Breakdown Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1e293b] text-[10px] uppercase text-[#64748b] bg-[#080b11]">
              <th className="p-2.5 font-bold">Semana</th>
              <th className="p-2.5 font-bold">Fase da Metodologia</th>
              <th className="p-2.5 font-bold text-center">Carga Alvo (kg)</th>
              <th className="p-2.5 font-bold text-center">Reps Alvo</th>
              <th className="p-2.5 font-bold text-center">RPE Estimado</th>
              <th className="p-2.5 font-bold text-center text-[#00f0ff]">1RM Projetado</th>
              <th className="p-2.5 font-bold text-right">Evolução (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/50">
            {projection.weeklyData.map((w) => (
              <tr key={w.weekNum} className={`hover:bg-[#1e293b]/30 transition-colors ${w.isDeload ? 'bg-indigo-950/20 text-indigo-200' : ''}`}>
                <td className="p-2.5 font-bold text-white font-mono">{w.week}</td>
                <td className="p-2.5 font-medium">
                  {w.phase}
                  {w.isDeload && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-1.5 py-0.5 rounded">Deload</span>}
                </td>
                <td className="p-2.5 text-center font-mono font-bold text-purple-300">{w.workingWeight} kg</td>
                <td className="p-2.5 text-center font-mono">{w.targetReps} reps</td>
                <td className="p-2.5 text-center font-mono">RPE {w.expectedRpe}</td>
                <td className="p-2.5 text-center font-mono font-bold text-[#00f0ff]">{w.projected1RM} kg</td>
                <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                  {w.gainPct > 0 ? `+${w.gainPct}%` : '0%'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

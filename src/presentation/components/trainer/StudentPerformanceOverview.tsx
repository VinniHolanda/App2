import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line
} from 'recharts';
import { Client, MovementPattern } from '../../../domain/types';
import { Dumbbell, TrendingUp, Layers, BarChart3, Filter, ShieldCheck, Target, Award } from 'lucide-react';

export interface StudentPerformanceOverviewProps {
  client: Client;
}

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  'Peitoral': '#38bdf8',
  'Dorsal / Costas': '#00f0ff',
  'Quadríceps': '#a855f7',
  'Posterior / Glúteo': '#f59e0b',
  'Deltoides': '#ec4899',
  'Bíceps & Tríceps': '#10b981',
  'Core & Abdômen': '#6366f1'
};

const PATTERN_TO_MUSCLE_GROUP: Record<MovementPattern, string> = {
  push_h: 'Peitoral',
  pull_v: 'Dorsal / Costas',
  pull_h: 'Dorsal / Costas',
  rear: 'Dorsal / Costas',
  quad: 'Quadríceps',
  calf: 'Quadríceps',
  hinge: 'Posterior / Glúteo',
  push_v: 'Deltoides',
  shoulder_iso: 'Deltoides',
  arms_bi: 'Bíceps & Tríceps',
  arms_tri: 'Bíceps & Tríceps',
  core: 'Core & Abdômen',
  cond: 'Core & Abdômen',
};

export const StudentPerformanceOverview: React.FC<StudentPerformanceOverviewProps> = ({ client }) => {
  const [metricType, setMetricType] = useState<'tonnage' | 'sets'>('tonnage');
  const [chartStyle, setChartStyle] = useState<'stacked' | 'grouped'>('stacked');

  const { chartData, totalVolumeSum, avgWeeklyVolume, topMuscleGroup, maxWeekVolume } = useMemo(() => {
    const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'];
    
    // Structure per week
    const weekMap: Record<string, {
      semana: string;
      'Peitoral': number;
      'Dorsal / Costas': number;
      'Quadríceps': number;
      'Posterior / Glúteo': number;
      'Deltoides': number;
      'Bíceps & Tríceps': number;
      'Core & Abdômen': number;
      'Total Semanal': number;
    }> = {};

    weeks.forEach(w => {
      weekMap[w] = {
        semana: w,
        'Peitoral': 0,
        'Dorsal / Costas': 0,
        'Quadríceps': 0,
        'Posterior / Glúteo': 0,
        'Deltoides': 0,
        'Bíceps & Tríceps': 0,
        'Core & Abdômen': 0,
        'Total Semanal': 0
      };
    });

    let totalVolumeSum = 0;
    const muscleTotals: Record<string, number> = {
      'Peitoral': 0,
      'Dorsal / Costas': 0,
      'Quadríceps': 0,
      'Posterior / Glúteo': 0,
      'Deltoides': 0,
      'Bíceps & Tríceps': 0,
      'Core & Abdômen': 0,
    };

    // 1. Process actual logged sessions from rpeLog
    if (client.rpeLog && client.rpeLog.length > 0) {
      client.rpeLog.forEach(sess => {
        const wIdx = (sess.week != null && sess.week >= 0 && sess.week < 6) ? sess.week : 0;
        const weekKey = weeks[wIdx] || weeks[0];
        const wObj = weekMap[weekKey];

        if (sess.exercises && sess.exercises.length > 0) {
          sess.exercises.forEach(ex => {
            const mGroup = PATTERN_TO_MUSCLE_GROUP[ex.pat] || 'Peitoral';
            let exVol = 0;

            if (metricType === 'tonnage') {
              if (ex.tonnage && ex.tonnage > 0) {
                exVol = ex.tonnage;
              } else if (ex.sets && ex.sets.length > 0) {
                exVol = ex.sets.reduce((acc, s) => acc + ((s.kg || 0) * (s.reps || 0)), 0);
              }
              if (exVol === 0) {
                const numSets = ex.sets?.length || ex.planned?.sets || 3;
                exVol = numSets * 10 * 35; // Fallback estimate
              }
            } else {
              exVol = ex.sets?.length || ex.planned?.sets || 3;
            }

            (wObj as any)[mGroup] += exVol;
            wObj['Total Semanal'] += exVol;
            totalVolumeSum += exVol;
            muscleTotals[mGroup] += exVol;
          });
        }
      });
    }

    // 2. Fallback / complementary prescription engine volume projection if logged volume is empty/low
    if (client.program && client.program.days) {
      client.program.days.forEach(day => {
        day.exercises.forEach(ex => {
          const mGroup = PATTERN_TO_MUSCLE_GROUP[ex.pat] || 'Peitoral';
          const numSets = parseInt(ex.sets) || 3;
          const avgReps = parseInt(ex.reps) || 10;
          const baseKg = ex.pat.includes('quad') || ex.pat.includes('hinge') ? 60 : 35;

          // Mesocycle progressive overload factor: W1=1.0, W2=1.06, W3=1.12, W4=1.18, W5=1.24, W6=0.7 (Deload)
          const multipliers = [1.0, 1.06, 1.12, 1.18, 1.25, 0.70];

          multipliers.forEach((mult, idx) => {
            const weekKey = weeks[idx];
            const wObj = weekMap[weekKey];

            // Only add if week log has low volume
            if (wObj['Total Semanal'] < 500) {
              const val = metricType === 'tonnage'
                ? Math.round(numSets * avgReps * baseKg * mult)
                : Math.round(numSets * (idx === 5 ? 0.6 : 1));

              (wObj as any)[mGroup] += val;
              wObj['Total Semanal'] += val;
              totalVolumeSum += val;
              muscleTotals[mGroup] += val;
            }
          });
        });
      });
    }

    const formattedData = weeks.map(w => ({
      semana: w,
      'Peitoral': Math.round(weekMap[w]['Peitoral']),
      'Dorsal / Costas': Math.round(weekMap[w]['Dorsal / Costas']),
      'Quadríceps': Math.round(weekMap[w]['Quadríceps']),
      'Posterior / Glúteo': Math.round(weekMap[w]['Posterior / Glúteo']),
      'Deltoides': Math.round(weekMap[w]['Deltoides']),
      'Bíceps & Tríceps': Math.round(weekMap[w]['Bíceps & Tríceps']),
      'Core & Abdômen': Math.round(weekMap[w]['Core & Abdômen']),
      'Total Semanal': Math.round(weekMap[w]['Total Semanal'])
    }));

    let topGroup = 'Quadríceps';
    let maxGroupVal = 0;
    Object.entries(muscleTotals).forEach(([group, val]) => {
      if (val > maxGroupVal) {
        maxGroupVal = val;
        topGroup = group;
      }
    });

    const maxWeekVal = Math.max(...formattedData.map(d => d['Total Semanal']));

    return {
      chartData: formattedData,
      totalVolumeSum,
      avgWeeklyVolume: Math.round(totalVolumeSum / 6),
      topMuscleGroup: topGroup,
      maxWeekVolume: maxWeekVal
    };
  }, [client, metricType]);

  const formatValue = (val: number) => {
    if (metricType === 'tonnage') {
      return val >= 1000 ? `${(val / 1000).toFixed(1)}k kg` : `${val} kg`;
    }
    return `${val} séries`;
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f0ff]/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-[11px] font-bold uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Performance Overview · Recharts</span>
          </div>
          <h3 className="font-display text-xl font-black text-[#f1f5f9]">
            Volume de Treino Acumulado por Grupamento Muscular
          </h3>
          <p className="text-xs text-[#a3a3b0] mt-0.5">
            Distribuição semanal da sobrecarga acumulada para {client.name}
          </p>
        </div>

        {/* Metric & Layout Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#0f172a] border border-[#1e293b] p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setMetricType('tonnage')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                metricType === 'tonnage'
                  ? 'bg-[#00f0ff] text-[#080b11] shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Tonelagem (kg)
            </button>
            <button
              onClick={() => setMetricType('sets')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                metricType === 'sets'
                  ? 'bg-[#00f0ff] text-[#080b11] shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Séries (Sets)
            </button>
          </div>

          <div className="bg-[#0f172a] border border-[#1e293b] p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setChartStyle('stacked')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartStyle === 'stacked'
                  ? 'bg-[#2a2a35] text-[#00f0ff]'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Empilhado
            </button>
            <button
              onClick={() => setChartStyle('grouped')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                chartStyle === 'grouped'
                  ? 'bg-[#2a2a35] text-[#00f0ff]'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Lado a Lado
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        <div className="bg-[#0f172a] border border-[#1e293b] p-3.5 rounded-2xl">
          <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Volume Semanal Médio</span>
          <div className="font-display text-lg font-black text-[#00f0ff]">
            {formatValue(avgWeeklyVolume)}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-3.5 rounded-2xl">
          <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Pico do Mesociclo</span>
          <div className="font-display text-lg font-black text-[#f1f5f9]">
            {formatValue(maxWeekVolume)}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-3.5 rounded-2xl">
          <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Grupamento em Destaque</span>
          <div className="font-display text-lg font-black text-[#38bdf8] truncate">
            {topMuscleGroup}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-3.5 rounded-2xl">
          <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">Acumulado Total</span>
          <div className="font-display text-lg font-black text-purple-400">
            {formatValue(totalVolumeSum)}
          </div>
        </div>
      </div>

      {/* RECHARTS BAR CHART */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-6 space-y-2">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="semana" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => metricType === 'tonnage' && val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#1e293b', 
                  borderRadius: '12px',
                  color: '#f1f5f9',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}
                formatter={(value: any, name: any) => [
                  metricType === 'tonnage' ? `${Number(value).toLocaleString('pt-BR')} kg` : `${value} séries`,
                  name
                ]}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '12px', fontSize: '11px', color: '#94a3b8' }} 
              />
              {Object.entries(MUSCLE_GROUP_COLORS).map(([groupName, color]) => (
                <Bar 
                  key={groupName}
                  dataKey={groupName}
                  name={groupName}
                  fill={color}
                  stackId={chartStyle === 'stacked' ? 'a' : undefined}
                  radius={chartStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  maxBarSize={chartStyle === 'stacked' ? 45 : 18}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748b] border-t border-[#1e293b]">
          <span>Eixo Y: {metricType === 'tonnage' ? 'Volume total em kg (Séries × Reps × Carga)' : 'Total de séries diretas'}</span>
          <span className="text-[#00f0ff]">✦ Atualizado via FitConnect Engine</span>
        </div>
      </div>
    </div>
  );
};

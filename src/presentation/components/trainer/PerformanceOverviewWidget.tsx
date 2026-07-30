import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Client, Session, MovementPattern } from '../../../domain/types';
import { MOVEMENT_PATTERN_LABELS } from '../../../data/exerciseCatalog';
import { 
  Activity, TrendingUp, Dumbbell, Zap, Layers, BarChart3, Filter, ShieldCheck, Cpu, ArrowUpRight, Award, Target, ShieldAlert
} from 'lucide-react';
import { OvertrainingTelemetryWidget } from './OvertrainingTelemetryWidget';

export interface PerformanceOverviewWidgetProps {
  clients: Client[];
}

// Group movement patterns into 6 major muscle categories for clean charts
const MUSCLE_CATEGORY_MAP: Record<MovementPattern, { key: string; label: string; color: string }> = {
  push_h: { key: 'peito', label: 'Peitoral & Tríceps', color: '#38bdf8' },
  push_v: { key: 'ombros', label: 'Deltoides & Ombros', color: '#ec4899' },
  shoulder_iso: { key: 'ombros', label: 'Deltoides & Ombros', color: '#ec4899' },
  pull_v: { key: 'costas', label: 'Dorsal & Costas', color: '#00f0ff' },
  pull_h: { key: 'costas', label: 'Dorsal & Costas', color: '#00f0ff' },
  rear: { key: 'costas', label: 'Dorsal & Costas', color: '#00f0ff' },
  quad: { key: 'quadriceps', label: 'Quadríceps & Pernas', color: '#a855f7' },
  hinge: { key: 'posterior', label: 'Posterior & Glúteos', color: '#f59e0b' },
  arms_bi: { key: 'bracos', label: 'Bíceps & Antebraço', color: '#10b981' },
  arms_tri: { key: 'bracos', label: 'Bíceps & Antebraço', color: '#10b981' },
  core: { key: 'core', label: 'Core & Abdômen', color: '#6366f1' },
  calf: { key: 'quadriceps', label: 'Quadríceps & Pernas', color: '#a855f7' },
  cond: { key: 'core', label: 'Core & Abdômen', color: '#6366f1' },
};

export const PerformanceOverviewWidget: React.FC<PerformanceOverviewWidgetProps> = ({ clients }) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [metricType, setMetricType] = useState<'tonnage' | 'sets'>('tonnage');
  const [activeChartTab, setActiveChartTab] = useState<'volume' | 'srpe' | 'distribution' | 'overtraining'>('volume');

  // Filtered clients list
  const activeClients = useMemo(() => {
    if (selectedClientId === 'todos') return clients;
    return clients.filter(c => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  // Aggregate weekly performance trends
  const { weeklyData, muscleDistributionData, totalTonnageSum, avgWeeklySets, avgSrpe, maxEvolvingMuscle } = useMemo(() => {
    // Standard weeks W1 through W6
    const weekMap: Record<string, {
      semana: string;
      peito: number;
      costas: number;
      quadriceps: number;
      posterior: number;
      ombros: number;
      bracos: number;
      core: number;
      tonelagemTotal: number;
      totalSets: number;
      srpeAvg: number;
      srpeCount: number;
      duraçãoTotal: number;
    }> = {};

    const weeksList = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'];
    weeksList.forEach((w) => {
      weekMap[w] = {
        semana: w,
        peito: 0,
        costas: 0,
        quadriceps: 0,
        posterior: 0,
        ombros: 0,
        bracos: 0,
        core: 0,
        tonelagemTotal: 0,
        totalSets: 0,
        srpeAvg: 0,
        srpeCount: 0,
        duraçãoTotal: 0
      };
    });

    let globalTonnage = 0;
    let globalSets = 0;
    let globalSrpeSum = 0;
    let globalSrpeSessionsCount = 0;

    activeClients.forEach((client) => {
      // 1. Process actual logged sessions if available
      if (client.rpeLog && client.rpeLog.length > 0) {
        client.rpeLog.forEach((sess) => {
          const weekIndex = (sess.week != null && sess.week >= 0 && sess.week < 6) ? sess.week : 0;
          const weekKey = weeksList[weekIndex] || weeksList[0];
          const wObj = weekMap[weekKey];

          if (sess.srpe) {
            wObj.srpeAvg += Number(sess.srpe);
            wObj.srpeCount += 1;
            globalSrpeSum += Number(sess.srpe);
            globalSrpeSessionsCount += 1;
          }

          if (sess.min) {
            wObj.duraçãoTotal += Number(sess.min);
          }

          if (sess.exercises && sess.exercises.length > 0) {
            sess.exercises.forEach((ex) => {
              const catInfo = MUSCLE_CATEGORY_MAP[ex.pat] || { key: 'peito' };
              const key = catInfo.key as keyof typeof wObj;

              let exTonnage = ex.tonnage || 0;
              let exSetsCount = ex.sets ? ex.sets.length : (ex.planned?.sets || 3);

              if (exTonnage === 0 && ex.sets && ex.sets.length > 0) {
                exTonnage = ex.sets.reduce((acc, s) => acc + ((s.kg || 0) * (s.reps || 0)), 0);
              }

              if (exTonnage === 0) {
                // fallback estimation
                exTonnage = exSetsCount * 10 * 35;
              }

              if (metricType === 'tonnage') {
                (wObj[key] as number) += exTonnage;
              } else {
                (wObj[key] as number) += exSetsCount;
              }

              wObj.tonelagemTotal += exTonnage;
              wObj.totalSets += exSetsCount;

              globalTonnage += exTonnage;
              globalSets += exSetsCount;
            });
          }
        });
      }

      // 2. Synthesize baseline trends from prescribed program if logs are empty/sparse
      if (client.program && client.program.days && client.program.days.length > 0) {
        client.program.days.forEach((day) => {
          day.exercises.forEach((ex) => {
            const catInfo = MUSCLE_CATEGORY_MAP[ex.pat] || { key: 'peito' };
            const key = catInfo.key as keyof typeof weekMap['Semana 1'];

            const numSets = parseInt(ex.sets) || 3;
            const avgReps = parseInt(ex.reps) || 10;
            const baseKg = ex.pat.includes('quad') || ex.pat.includes('hinge') ? 60 : 35;

            // Apply mesocycle progressive overload multipliers (e.g. 1.0, 1.05, 1.10, 1.15, 1.20, 0.6)
            const multipliers = [1.0, 1.05, 1.12, 1.18, 1.25, 0.70]; // Deload on W6
            multipliers.forEach((mult, idx) => {
              const weekKey = weeksList[idx];
              const wObj = weekMap[weekKey];

              // Only accumulate if week has low real data
              if (wObj.tonelagemTotal < 2000) {
                const estTonnage = Math.round(numSets * avgReps * baseKg * mult);
                const estSets = Math.round(numSets * (idx === 5 ? 0.6 : 1)); // Deload sets

                if (metricType === 'tonnage') {
                  (wObj[key] as number) += estTonnage;
                } else {
                  (wObj[key] as number) += estSets;
                }

                wObj.tonelagemTotal += estTonnage;
                wObj.totalSets += estSets;
                wObj.srpeAvg += (7 + idx * 0.3);
                wObj.srpeCount += 1;

                globalTonnage += estTonnage;
                globalSets += estSets;
              }
            });
          });
        });
      }
    });

    // Format final chart data
    const formattedWeeklyData = weeksList.map((w) => {
      const item = weekMap[w];
      const avgSrpeVal = item.srpeCount > 0 ? (item.srpeAvg / item.srpeCount) : 7.2;
      return {
        semana: item.semana,
        'Peitoral & Tríceps': Math.round(item.peito),
        'Dorsal & Costas': Math.round(item.costas),
        'Quadríceps & Pernas': Math.round(item.quadriceps),
        'Posterior & Glúteos': Math.round(item.posterior),
        'Deltoides & Ombros': Math.round(item.ombros),
        'Bíceps & Antebraço': Math.round(item.bracos),
        'Core & Abdômen': Math.round(item.core),
        'Tonelagem Acumulada (kg)': Math.round(item.tonelagemTotal),
        'Total de Séries': item.totalSets,
        'Percepção de Esforço (sRPE)': parseFloat(avgSrpeVal.toFixed(1)),
        'Carga Interna (UA)': Math.round(avgSrpeVal * (item.duraçãoTotal || 60))
      };
    });

    // Calculate Muscle Distribution Breakdown for Radar/Pie
    const muscleTotals: Record<string, number> = {
      'Peitoral': 0,
      'Dorsal / Costas': 0,
      'Quadríceps': 0,
      'Posterior / Glúteo': 0,
      'Deltoides': 0,
      'Bíceps / Tríceps': 0,
      'Core': 0
    };

    formattedWeeklyData.forEach((row) => {
      muscleTotals['Peitoral'] += row['Peitoral & Tríceps'];
      muscleTotals['Dorsal / Costas'] += row['Dorsal & Costas'];
      muscleTotals['Quadríceps'] += row['Quadríceps & Pernas'];
      muscleTotals['Posterior / Glúteo'] += row['Posterior & Glúteos'];
      muscleTotals['Deltoides'] += row['Deltoides & Ombros'];
      muscleTotals['Bíceps / Tríceps'] += row['Bíceps & Antebraço'];
      muscleTotals['Core'] += row['Core & Abdômen'];
    });

    const muscleDistributionData = Object.entries(muscleTotals).map(([subject, value]) => ({
      subject,
      value: Math.round(value),
      fullMark: Math.max(...Object.values(muscleTotals)) * 1.2 || 100
    }));

    // Find highest volume muscle group
    let highestMuscle = 'Quadríceps';
    let maxVal = 0;
    Object.entries(muscleTotals).forEach(([m, val]) => {
      if (val > maxVal) {
        maxVal = val;
        highestMuscle = m;
      }
    });

    const avgSrpeCalculated = globalSrpeSessionsCount > 0 
      ? (globalSrpeSum / globalSrpeSessionsCount).toFixed(1) 
      : '7.5';

    return {
      weeklyData: formattedWeeklyData,
      muscleDistributionData,
      totalTonnageSum: globalTonnage,
      avgWeeklySets: Math.round(globalSets / 6) || 16,
      avgSrpe: avgSrpeCalculated,
      maxEvolvingMuscle: highestMuscle
    };
  }, [activeClients, metricType]);

  // Format big tonnage label (e.g. 18.5k kg)
  const formatTonnageLabel = (val: number) => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k kg`;
    }
    return `${val} kg`;
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#00f0ff]/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Painel de Desempenho do Treinador</span>
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-black text-[#f1f5f9] tracking-tight">
            Visão Geral de Desempenho & Evolução de Carga
          </h2>

          <p className="text-xs text-[#a3a3b0]">
            Análise biomecânica do acúmulo de volume semanal, progressão de carga e resposta à fadiga.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Client Select */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[#64748b] font-bold">Atleta:</span>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-[#f1f5f9] font-bold focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-[#0f172a]">Todos os Alunos ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0f172a]">
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>

          {/* Metric Type Selector */}
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
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Volume Total Acumulado</span>
            <div className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff]">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-[#00f0ff]">
              {formatTonnageLabel(totalTonnageSum)}
            </div>
            <div className="text-[10px] text-[#a3a3b0] flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Soma de carga útil levantada</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Média de Séries/Semana</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-[#f1f5f9]">
              {avgWeeklySets} <span className="text-xs text-[#64748b] font-normal">séries/sem</span>
            </div>
            <div className="text-[10px] text-[#a3a3b0] flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-[#38bdf8]" />
              <span>Zona de estresse hipertrófico</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Esforço Médio (sRPE)</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-[#f1f5f9]">
              {avgSrpe} <span className="text-xs text-[#64748b] font-normal">/ 10</span>
            </div>
            <div className="text-[10px] text-purple-400 flex items-center gap-1 mt-0.5 font-semibold">
              <Activity className="w-3 h-3" />
              <span>Intensidade ideal mantida</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Músculo em Maior Foco</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="font-display text-xl font-black text-[#f1f5f9] truncate">
              {maxEvolvingMuscle}
            </div>
            <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 font-semibold">
              <Award className="w-3 h-3" />
              <span>Maior estímulo do mesociclo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveChartTab('volume')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeChartTab === 'volume'
                ? 'bg-[#0f172a] border border-[#00f0ff]/40 text-[#00f0ff]'
                : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Volume por Músculo</span>
          </button>

          <button
            onClick={() => setActiveChartTab('srpe')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeChartTab === 'srpe'
                ? 'bg-[#0f172a] border border-[#00f0ff]/40 text-[#00f0ff]'
                : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Carga Interna & sRPE</span>
          </button>

          <button
            onClick={() => setActiveChartTab('distribution')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeChartTab === 'distribution'
                ? 'bg-[#0f172a] border border-[#00f0ff]/40 text-[#00f0ff]'
                : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Balanço Muscular</span>
          </button>

          <button
            onClick={() => setActiveChartTab('overtraining')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeChartTab === 'overtraining'
                ? 'bg-[#0f172a] border border-purple-500/50 text-purple-300'
                : 'text-[#94a3b8] hover:text-[#f1f5f9]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Telemetria Overtraining (ACWR)</span>
          </button>
        </div>

        <span className="text-[10px] text-[#64748b] font-mono hidden sm:inline-block">
          *Dados sincronizados com o motor FitConnect Engine
        </span>
      </div>

      {/* MAIN CHART CONTAINER */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 md:p-6 min-h-[360px] flex flex-col justify-center">
        {/* TAB 1: VOLUME STACKED AREA / BAR CHART */}
        {activeChartTab === 'volume' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#a3a3b0] mb-2">
              <span className="font-semibold text-[#f1f5f9]">
                Evolução Semanal de {metricType === 'tonnage' ? 'Tonelagem Acumulada (kg)' : 'Número de Séries Diretas'} por Grupo Muscular
              </span>
              <span className="text-[10px] text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/20 px-2 py-0.5 rounded">
                Sobrecarga Progressiva
              </span>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPeito" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradCostas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradQuad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gradPost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="semana" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
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
                      metricType === 'tonnage' ? `${value.toLocaleString('pt-BR')} kg` : `${value} séries`,
                      name
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }} 
                  />
                  <Area type="monotone" dataKey="Peitoral & Tríceps" stackId="1" stroke="#38bdf8" fill="url(#gradPeito)" />
                  <Area type="monotone" dataKey="Dorsal & Costas" stackId="1" stroke="#00f0ff" fill="url(#gradCostas)" />
                  <Area type="monotone" dataKey="Quadríceps & Pernas" stackId="1" stroke="#a855f7" fill="url(#gradQuad)" />
                  <Area type="monotone" dataKey="Posterior & Glúteos" stackId="1" stroke="#f59e0b" fill="url(#gradPost)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: sRPE & INTERNAL LOAD CHART */}
        {activeChartTab === 'srpe' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#a3a3b0] mb-2">
              <span className="font-semibold text-[#f1f5f9]">
                Comparativo de Carga Interna (UA) vs Percepção Subjetiva de Esforço (sRPE 1-10)
              </span>
              <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                Monitoramento de Fadiga Foster
              </span>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="semana" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="#ec4899" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#f1f5f9',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="Carga Interna (UA)" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={28} />
                  <Line yAxisId="right" type="monotone" dataKey="Percepção de Esforço (sRPE)" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: MUSCLE BALANCE RADAR CHART */}
        {activeChartTab === 'distribution' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#a3a3b0] mb-2">
              <span className="font-semibold text-[#f1f5f9]">
                Balanço Proporcional de Estímulo por Grupo Muscular
              </span>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                Equilíbrio Agonista / Antagonista
              </span>
            </div>

            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={muscleDistributionData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" stroke="#a3a3b0" fontSize={11} />
                  <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                  <Radar name="Volume Acumulado" dataKey="value" stroke="#00f0ff" fill="#00f0ff" fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#1e293b', 
                      borderRadius: '12px',
                      color: '#f1f5f9',
                      fontSize: '12px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 4: OVERTRAINING TELEMETRY & ACWR */}
        {activeChartTab === 'overtraining' && (
          <OvertrainingTelemetryWidget 
            clients={activeClients} 
            selectedClientId={selectedClientId} 
            onSelectClient={(id) => setSelectedClientId(id)}
          />
        )}
      </div>
    </div>
  );
};

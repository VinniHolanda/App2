import React, { useState, useMemo } from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, ReferenceLine, Area
} from 'recharts';
import { Client } from '../../../domain/types';
import { TrendingUp, Layers, Activity, Zap, ShieldAlert, Sparkles, Target, BarChart2, Maximize2, Minimize2 } from 'lucide-react';

export interface PeriodizationProgressChartProps {
  client: Client;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const PeriodizationProgressChart: React.FC<PeriodizationProgressChartProps> = ({ 
  client,
  isFocusMode = false,
  onToggleFocusMode
}) => {
  const [viewMode, setViewMode] = useState<'all' | 'srpe_series' | 'tonnage'>('all');

  // Compute weekly periodization metrics from client.program and client.rpeLog
  const { weeklyData, avgSrpe, totalSetsAvg, periodizationTrend, totalWeeksCount } = useMemo(() => {
    const weeksList = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'];
    
    // Initialize data map for up to 6 weeks
    const dataMap = weeksList.map((wName, idx) => {
      return {
        semana: wName,
        weekIndex: idx,
        srpe: 0,
        srpeCount: 0,
        totalSets: 0,
        tonnage: 0,
        durationMin: 0,
        loadUA: 0,
        isDeload: false,
        note: ''
      };
    });

    // 1. Calculate prescribed weekly sets from program
    if (client.program && client.program.days) {
      let baseWeeklySets = 0;
      client.program.days.forEach(day => {
        day.exercises.forEach(ex => {
          baseWeeklySets += (ex.sets || 3);
        });
      });

      // Apply week overrides if present
      dataMap.forEach(d => {
        const override = client.program?.weekOverrides?.[d.weekIndex];
        if (override) {
          const mult = override.vol || 1.0;
          d.totalSets = Math.round(baseWeeklySets * mult);
          if (mult < 1.0) d.isDeload = true;
          d.note = override.note || '';
        } else {
          d.totalSets = baseWeeklySets;
        }
      });
    }

    // 2. Aggregate logged sessions from client.rpeLog
    if (client.rpeLog && client.rpeLog.length > 0) {
      client.rpeLog.forEach(sess => {
        const wIdx = (sess.week != null && sess.week >= 0 && sess.week < 6) ? sess.week : 0;
        const target = dataMap[wIdx];
        if (target) {
          if (sess.srpe) {
            target.srpe += sess.srpe;
            target.srpeCount += 1;
          }
          if (sess.min) {
            target.durationMin += sess.min;
          }
          if (sess.tonnage) {
            target.tonnage += sess.tonnage;
          }

          // Count executed sets from logged exercises
          if (sess.exercises && sess.exercises.length > 0) {
            let executedSetsInSess = 0;
            sess.exercises.forEach(ex => {
              executedSetsInSess += (ex.sets ? ex.sets.length : (ex.targetSets || 3));
            });
            // Overwrite or accumulate executed sets
            target.totalSets = Math.max(target.totalSets, executedSetsInSess);
          }
        }
      });
    }

    // Final calculations per week
    let sumSrpe = 0;
    let srpeWeeksCount = 0;
    let sumSets = 0;

    const formattedData = dataMap.map(d => {
      const avgWeeklySrpe = d.srpeCount > 0 ? parseFloat((d.srpe / d.srpeCount).toFixed(1)) : (d.totalSets > 0 ? 7.5 : 0);
      if (avgWeeklySrpe > 0) {
        sumSrpe += avgWeeklySrpe;
        srpeWeeksCount += 1;
      }
      sumSets += d.totalSets;

      const totalUA = d.durationMin > 0 ? Math.round(avgWeeklySrpe * d.durationMin) : Math.round(avgWeeklySrpe * 60 * 3);

      return {
        ...d,
        srpeAvg: avgWeeklySrpe,
        totalUA,
        tonnageKg: Math.round(d.tonnage)
      };
    });

    const calculatedAvgSrpe = srpeWeeksCount > 0 ? parseFloat((sumSrpe / srpeWeeksCount).toFixed(1)) : 7.2;
    const calculatedAvgSets = Math.round(sumSets / 6) || 18;

    // Periodization trend analysis
    let trend = 'Ondulatória / Progressiva';
    const firstWeekSrpe = formattedData[0].srpeAvg;
    const lastWeekSrpe = formattedData[3].srpeAvg || formattedData[2].srpeAvg;
    if (lastWeekSrpe > firstWeekSrpe + 1.0) {
      trend = 'Intensificação Crescente (Ramp-up)';
    } else if (lastWeekSrpe < firstWeekSrpe - 1.0) {
      trend = 'Regeneração / Deload Programado';
    }

    return {
      weeklyData: formattedData,
      avgSrpe: calculatedAvgSrpe,
      totalSetsAvg: calculatedAvgSets,
      periodizationTrend: trend,
      totalWeeksCount: formattedData.filter(d => d.totalSets > 0 || d.srpeAvg > 0).length || 4
    };
  }, [client]);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-5 shadow-xl">
      {/* HEADER & METRIC SUMMARY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="font-display font-extrabold text-lg text-[#f1f5f9]">
              Progressão da Periodização & Variação de Carga
            </h3>
            {isFocusMode && (
              <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Modo Focus Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Acompanhe a relação entre o esforço percebido (sRPE) e o volume semanal de séries.
          </p>
        </div>

        {/* View Mode Filters & Focus Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-[#080b11] p-1 rounded-xl border border-[#1e293b]">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'all'
                  ? 'bg-[#00f0ff] text-[#080b11] shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              sRPE + Séries
            </button>
            <button
              onClick={() => setViewMode('srpe_series')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'srpe_series'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              Apenas sRPE
            </button>
            <button
              onClick={() => setViewMode('tonnage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'tonnage'
                  ? 'bg-emerald-400 text-[#080b11] shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              sRPE + Tonelagem (kg)
            </button>
          </div>

          {onToggleFocusMode && (
            <button
              onClick={onToggleFocusMode}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition-all ${
                isFocusMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-[#080b11] text-[#00f0ff] border-[#00f0ff]/30 hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]'
              }`}
              title={isFocusMode ? 'Sair do Modo Focus' : 'Expandir no Modo Focus'}
            >
              {isFocusMode ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Sair do Focus</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Modo Focus 🎯</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#00f0ff]" /> sRPE Médio
          </div>
          <div className="text-2xl font-black font-mono text-[#00f0ff]">{avgSrpe} <span className="text-xs text-[#64748b]">/10</span></div>
          <div className="text-[10px] text-[#94a3b8]">Percepção de esforço</div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> Séries / Semana
          </div>
          <div className="text-2xl font-black font-mono text-purple-300">{totalSetsAvg} <span className="text-xs text-[#64748b]">séries</span></div>
          <div className="text-[10px] text-[#94a3b8]">Volume médio prescrito</div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Perfil de Carga
          </div>
          <div className="text-xs font-bold text-amber-300 truncate mt-1">{periodizationTrend}</div>
          <div className="text-[10px] text-[#94a3b8]">Ondulação programada</div>
        </div>

        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Semanas Ativas
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">{totalWeeksCount} <span className="text-xs text-[#64748b]">semanas</span></div>
          <div className="text-[10px] text-[#94a3b8]">Duração do mesociclo</div>
        </div>
      </div>

      {/* RECHARTS COMPOSED LINE CHART */}
      <div className={`${isFocusMode ? 'h-[420px] md:h-[480px]' : 'h-72'} w-full pt-2 transition-all duration-300`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={weeklyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="srpeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="semana" stroke="#64748b" fontSize={11} tickLine={false} />

            {/* Left Axis: sRPE Scale (0-10) */}
            <YAxis 
              yAxisId="srpeAxis" 
              domain={[0, 10]} 
              stroke="#00f0ff" 
              fontSize={11} 
              tickLine={false} 
              label={{ value: 'sRPE (0-10)', angle: -90, position: 'insideLeft', fill: '#00f0ff', fontSize: 10 }}
            />

            {/* Right Axis: Sets / Volume */}
            {viewMode !== 'srpe_series' && (
              <YAxis 
                yAxisId="volumeAxis" 
                orientation="right" 
                stroke={viewMode === 'tonnage' ? '#10b981' : '#a855f7'} 
                fontSize={11} 
                tickLine={false} 
                label={{ 
                  value: viewMode === 'tonnage' ? 'Tonelagem (kg)' : 'Total Séries', 
                  angle: 90, 
                  position: 'insideRight', 
                  fill: viewMode === 'tonnage' ? '#10b981' : '#a855f7', 
                  fontSize: 10 
                }}
              />
            )}

            {/* Periodization Zones Reference Lines */}
            <ReferenceLine yAxisId="srpeAxis" y={8.5} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Pico / Risco (8.5)', fill: '#ef4444', fontSize: 9, position: 'insideTopLeft' }} />
            <ReferenceLine yAxisId="srpeAxis" y={6.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Deload / Regenerativo (6.0)', fill: '#10b981', fontSize: 9, position: 'insideBottomLeft' }} />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#1e293b',
                borderRadius: '12px',
                color: '#f1f5f9',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value: any, name: any) => {
                if (name === 'sRPE Média' || name === 'sRPE') return [`${value} / 10`, 'sRPE (Esforço)'];
                if (name === 'Total Séries' || name === 'Séries') return [`${value} séries`, 'Volume de Séries'];
                if (name === 'Tonelagem (kg)') return [`${Number(value).toLocaleString('pt-BR')} kg`, 'Tonelagem Total'];
                if (name === 'Carga Interna (UA)') return [`${value} UA`, 'Carga de Foster'];
                return [value, name];
              }}
              labelStyle={{ fontWeight: 'bold', color: '#00f0ff' }}
            />

            <Legend 
              wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }}
            />

            {/* BAR: Volume of Sets per week */}
            {(viewMode === 'all') && (
              <Bar 
                yAxisId="volumeAxis" 
                dataKey="totalSets" 
                name="Total Séries" 
                fill="#a855f7" 
                radius={[6, 6, 0, 0]} 
                barSize={20}
                opacity={0.7}
              />
            )}

            {(viewMode === 'tonnage') && (
              <Bar 
                yAxisId="volumeAxis" 
                dataKey="tonnageKg" 
                name="Tonelagem (kg)" 
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                barSize={22}
                opacity={0.65}
              />
            )}

            {/* AREA & LINE: sRPE Load Progression */}
            <Area 
              yAxisId="srpeAxis" 
              type="monotone" 
              dataKey="srpeAvg" 
              name="sRPE Média" 
              stroke="#00f0ff" 
              fill="url(#srpeGrad)" 
              strokeWidth={3}
              dot={{ r: 5, fill: '#00f0ff', stroke: '#080b11', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#00f0ff', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* PERIODIZATION NOTES FOOTER */}
      <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#94a3b8]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
          <span>
            <strong>Análise do Treinador:</strong> Alternância estratégica entre semanas de choque (sRPE 8.0-9.0) e semanas de consolidação/deload.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
          <span className="text-purple-400 font-bold">■ Séries Semanais</span>
          <span className="text-[#00f0ff] font-bold">● sRPE (Carga)</span>
        </div>
      </div>
    </div>
  );
};

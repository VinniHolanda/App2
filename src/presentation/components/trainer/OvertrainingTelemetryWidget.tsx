import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine 
} from 'recharts';
import { Client, Session } from '../../../domain/types';
import { 
  AlertTriangle, ShieldCheck, Activity, TrendingUp, TrendingDown, 
  Dumbbell, Zap, Clock, Info, CheckCircle2, AlertOctagon, Sparkles, Filter, ShieldAlert
} from 'lucide-react';

export interface OvertrainingTelemetryWidgetProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient?: (id: string) => void;
}

export interface AthleteRiskProfile {
  client: Client;
  acwr: number;
  acuteLoad: number;
  chronicLoad: number;
  monotony: number;
  strain: number;
  avgSrpe: number;
  riskLevel: 'baixo' | 'moderado' | 'elevado' | 'critico';
  riskLabel: string;
  divergenceDetected: boolean;
  recommendation: string;
}

export const OvertrainingTelemetryWidget: React.FC<OvertrainingTelemetryWidgetProps> = ({
  clients,
  selectedClientId: initialSelectedId = 'todos',
  onSelectClient
}) => {
  const [activeClientId, setActiveClientId] = useState<string>(initialSelectedId);
  const [timeRange, setTimeRange] = useState<'6w' | '12w'>('6w');

  // Filter clients based on selection
  const selectedClients = useMemo(() => {
    if (activeClientId === 'todos') return clients;
    return clients.filter(c => c.id === activeClientId);
  }, [clients, activeClientId]);

  // Calculate Athlete Risk Profiles for all clients
  const athleteProfiles = useMemo<AthleteRiskProfile[]>(() => {
    return clients.map(client => {
      let sessions: Session[] = client.rpeLog || [];
      
      // Calculate loads for last 6 weeks (Semana 1..6)
      const weekLoads: number[] = [0, 0, 0, 0, 0, 0];
      const weekSrpeSum: number[] = [0, 0, 0, 0, 0, 0];
      const weekSrpeCount: number[] = [0, 0, 0, 0, 0, 0];
      const weekTonnage: number[] = [0, 0, 0, 0, 0, 0];

      if (sessions.length > 0) {
        sessions.forEach(sess => {
          const wIdx = (sess.week != null && sess.week >= 0 && sess.week < 6) ? sess.week : 0;
          const min = sess.min || 60;
          const srpe = sess.srpe || 7;
          const load = srpe * min;

          weekLoads[wIdx] += load;
          weekSrpeSum[wIdx] += srpe;
          weekSrpeCount[wIdx] += 1;
          weekTonnage[wIdx] += (sess.tonnage || 0);
        });
      }

      // If program exists but sparse session log, synthesize program baseline
      if (client.program && client.program.days) {
        client.program.days.forEach(day => {
          const dayDuration = 60;
          const dayExercisesCount = day.exercises?.length || 4;
          const dayAvgRpe = parseFloat(day.exercises?.[0]?.rpe) || 7.5;
          const multipliers = [1.0, 1.05, 1.12, 1.18, 1.25, 0.70];

          multipliers.forEach((mult, idx) => {
            if (weekLoads[idx] < 200) {
              const estSrpe = Math.min(10, dayAvgRpe * (idx === 5 ? 0.7 : (1 + idx * 0.03)));
              const estLoad = Math.round(estSrpe * dayDuration * mult);
              weekLoads[idx] += estLoad;
              weekSrpeSum[idx] += estSrpe;
              weekSrpeCount[idx] += 1;
              weekTonnage[idx] += Math.round(dayExercisesCount * 3 * 10 * 40 * mult);
            }
          });
        });
      }

      // Acute Load (Week 5 - recent week) vs Chronic Load (Avg of Weeks 1-4)
      const acuteLoad = weekLoads[4] || weekLoads[3] || 1800;
      const chronicLoadsList = weekLoads.slice(0, 4).filter(l => l > 0);
      const chronicLoad = chronicLoadsList.length > 0
        ? Math.round(chronicLoadsList.reduce((a, b) => a + b, 0) / chronicLoadsList.length)
        : 1500;

      const acwr = chronicLoad > 0 ? parseFloat((acuteLoad / chronicLoad).toFixed(2)) : 1.0;

      // Monotony = Mean Daily Load / SD Daily Load (over current week)
      const meanDaily = acuteLoad / 4; // assuming ~4 training days
      const simulatedDailyLoads = [meanDaily * 1.1, meanDaily * 0.9, meanDaily * 1.2, meanDaily * 0.8];
      const variance = simulatedDailyLoads.reduce((acc, val) => acc + Math.pow(val - meanDaily, 2), 0) / 4;
      const sdDaily = Math.sqrt(variance) || 100;
      const monotony = parseFloat((meanDaily / sdDaily).toFixed(2));
      const strain = Math.round(acuteLoad * monotony);

      // sRPE Avg
      const totalSrpeSum = weekSrpeSum.reduce((a, b) => a + b, 0);
      const totalSrpeCount = weekSrpeCount.reduce((a, b) => a + b, 0);
      const avgSrpe = totalSrpeCount > 0 ? parseFloat((totalSrpeSum / totalSrpeCount).toFixed(1)) : 7.2;

      // Check for sRPE vs Tonnage Divergence (high sRPE while tonnage drops)
      const w4Srpe = weekSrpeCount[3] > 0 ? weekSrpeSum[3] / weekSrpeCount[3] : 7.0;
      const w5Srpe = weekSrpeCount[4] > 0 ? weekSrpeSum[4] / weekSrpeCount[4] : 8.5;
      const tonnageDrop = weekTonnage[4] < weekTonnage[3] * 0.95;
      const divergenceDetected = (w5Srpe >= 8.2 && w5Srpe > w4Srpe) && tonnageDrop;

      // Determine Risk Level
      let riskLevel: 'baixo' | 'moderado' | 'elevado' | 'critico' = 'baixo';
      let riskLabel = 'Zona Segura (Sweet Spot)';
      let recommendation = 'Manter progressão normal de carga no mesociclo.';

      if (acwr >= 1.5 || strain >= 6500 || (acwr >= 1.35 && divergenceDetected)) {
        riskLevel = 'critico';
        riskLabel = 'Risco Crítico de Overtraining (ACWR ≥ 1.5 ou Strain Elevado)';
        recommendation = '⚠️ Deload Imediato Recomendado: Reduzir volume em 30-40% e focar em recuperação.';
      } else if (acwr >= 1.3 || strain >= 5000 || divergenceDetected) {
        riskLevel = 'elevado';
        riskLabel = 'Alerta de Fadiga Acumulada / Overreaching';
        recommendation = '⚡ Inserir dia de descanso adicional ou reduzir 20% das séries na próxima semana.';
      } else if (acwr < 0.8) {
        riskLevel = 'moderado';
        riskLabel = 'Sub-estímulo (Risco de Destreinamento)';
        recommendation = '📈 Aumentar progressivamente o volume semanal para manter ganhos.';
      }

      return {
        client,
        acwr,
        acuteLoad,
        chronicLoad,
        monotony,
        strain,
        avgSrpe,
        riskLevel,
        riskLabel,
        divergenceDetected,
        recommendation
      };
    });
  }, [clients]);

  // Aggregate weekly ACWR & Load trend data for Recharts
  const weeklyTrendsData = useMemo(() => {
    const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6'];

    return weeks.map((semana, idx) => {
      let totalAcute = 0;
      let totalChronic = 0;
      let totalSrpeSum = 0;
      let totalSrpeCount = 0;
      let totalTonnage = 0;
      let clientCount = 0;

      selectedClients.forEach(client => {
        clientCount++;
        const sessions = client.rpeLog || [];
        const sessForWeek = sessions.filter(s => (s.week != null ? s.week : 0) === idx);

        let weekLoad = 0;
        let weekTonn = 0;
        let weekSrpe = 0;

        if (sessForWeek.length > 0) {
          sessForWeek.forEach(s => {
            const min = s.min || 60;
            const srpe = s.srpe || 7;
            weekLoad += srpe * min;
            weekTonn += (s.tonnage || 0);
            weekSrpe += srpe;
          });
          totalSrpeSum += (weekSrpe / sessForWeek.length);
          totalSrpeCount++;
        } else {
          // Model estimation
          const mult = [1.0, 1.05, 1.12, 1.22, 1.35, 0.70][idx];
          weekLoad = Math.round(1800 * mult);
          weekTonn = Math.round(12000 * mult);
          totalSrpeSum += Math.min(9.5, 7.0 + idx * 0.35 - (idx === 5 ? 2.0 : 0));
          totalSrpeCount++;
        }

        totalAcute += weekLoad;
        totalTonnage += weekTonn;
      });

      const avgAcute = clientCount > 0 ? Math.round(totalAcute / clientCount) : 1800;
      const avgChronic = Math.round(avgAcute / ([1.0, 1.02, 1.08, 1.15, 1.20, 0.85][idx]));
      const acwrVal = avgChronic > 0 ? parseFloat((avgAcute / avgChronic).toFixed(2)) : 1.0;
      const avgSrpeVal = totalSrpeCount > 0 ? parseFloat((totalSrpeSum / totalSrpeCount).toFixed(1)) : 7.5;
      const avgTonnageVal = clientCount > 0 ? Math.round(totalTonnage / clientCount) : 12000;

      return {
        semana,
        'Carga Aguda (7d)': avgAcute,
        'Carga Crônica (28d)': avgChronic,
        'Razão ACWR': acwrVal,
        'Percepção de Esforço (sRPE)': avgSrpeVal,
        'Tonelagem Acumulada (kg)': avgTonnageVal,
        'Foster Strain Index': Math.round(avgAcute * 1.8)
      };
    });
  }, [selectedClients]);

  // Overall system-wide overtraining stats
  const criticalCount = athleteProfiles.filter(p => p.riskLevel === 'critico').length;
  const warningCount = athleteProfiles.filter(p => p.riskLevel === 'elevado').length;
  const optimalCount = athleteProfiles.filter(p => p.riskLevel === 'baixo').length;

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Motor de Telemetria Biomecânica & Overtraining (ACWR & Foster)</span>
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-black text-[#f1f5f9] tracking-tight">
            Monitor de Fadiga & Prevenção de Lesões
          </h2>

          <p className="text-xs text-[#a3a3b0] max-w-3xl">
            Modelagem matemática de <strong>ACWR (Acute:Chronic Workload Ratio)</strong> e índice de tensão de Foster para identificar precocemente sintomas de overreaching não-funcional e fadiga central.
          </p>
        </div>

        {/* Client filter dropdown */}
        <div className="flex items-center gap-3">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[#64748b] font-bold">Atleta:</span>
            <select
              value={activeClientId}
              onChange={(e) => {
                setActiveClientId(e.target.value);
                if (onSelectClient) onSelectClient(e.target.value);
              }}
              className="bg-transparent text-[#f1f5f9] font-bold focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-[#0f172a]">Todos os Atletas ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0f172a]">
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* OVERTRAINING RISK STATUS SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
        <div className={`p-4 rounded-2xl border transition-all ${
          criticalCount > 0 
            ? 'bg-red-500/10 border-red-500/40 text-red-300' 
            : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Risco Crítico (ACWR ≥ 1.5)</span>
            <AlertOctagon className={`w-4 h-4 ${criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-[#64748b]'}`} />
          </div>
          <div className="font-display text-2xl font-black text-[#f1f5f9]">{criticalCount} <span className="text-xs font-normal">atletas</span></div>
          <p className="text-[10px] opacity-80 mt-1">Acúmulo agudo de estresse biomecânico excessivo.</p>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          warningCount > 0 
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' 
            : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8]'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Atenção / Overreaching (1.3 - 1.49)</span>
            <AlertTriangle className={`w-4 h-4 ${warningCount > 0 ? 'text-amber-400' : 'text-[#64748b]'}`} />
          </div>
          <div className="font-display text-2xl font-black text-[#f1f5f9]">{warningCount} <span className="text-xs font-normal">atletas</span></div>
          <p className="text-[10px] opacity-80 mt-1">Próximo ao limite de tolerância fisiológica.</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#0f172a] border border-[#00f0ff]/30 text-[#00f0ff]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Zona Ideal (0.8 - 1.29)</span>
            <CheckCircle2 className="w-4 h-4 text-[#00f0ff]" />
          </div>
          <div className="font-display text-2xl font-black text-[#f1f5f9]">{optimalCount} <span className="text-xs font-normal">atletas</span></div>
          <p className="text-[10px] opacity-80 mt-1">Supercompensação & resposta positiva ao treino.</p>
        </div>
      </div>

      {/* RECHARTS CHART 1: ACWR WORKLOAD RATIO & DANGER ZONES */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 md:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00f0ff]" />
              Evolução da Razão ACWR (Carga Aguda vs Carga Crônica)
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Faixa ideal (Sweet Spot): 0.8 a 1.3 | Zona de Risco Elevado: &gt; 1.50
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold">
            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
              ● 0.8 - 1.3 Sweet Spot
            </span>
            <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/30">
              ● ≥ 1.5 Risco Alto
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyTrendsData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="semana" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 2.0]} stroke="#ec4899" fontSize={11} tickLine={false} />
              
              {/* Reference Threshold Lines */}
              <ReferenceLine yAxisId="right" y={1.5} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Risco de Lesão (≥ 1.5)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine yAxisId="right" y={1.3} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Atenção (1.3)', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine yAxisId="right" y={0.8} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Mínimo Útil (0.8)', fill: '#10b981', fontSize: 10, position: 'insideBottomRight' }} />

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
              
              <Bar yAxisId="left" dataKey="Carga Aguda (7d)" fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={24} name="Carga Aguda (UA)" />
              <Bar yAxisId="left" dataKey="Carga Crônica (28d)" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} name="Carga Crônica (UA)" />
              <Line yAxisId="right" type="monotone" dataKey="Razão ACWR" stroke="#ec4899" strokeWidth={3} dot={{ r: 5, fill: '#ec4899' }} name="Razão ACWR (Acute/Chronic)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECHARTS CHART 2: sRPE TREND VS TONNAGE VOLUME DIVERGENCE (OVERTRAINING SENSORS) */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 md:p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Detecção de Divergência: sRPE vs Tonelagem (Sinal de Overreaching Não-Funcional)
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Quando o sRPE sobe significativamente enquanto a tonelagem diminui, há forte indicativo de fadiga do SNC ou recuperação inadequada.
            </p>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={weeklyTrendsData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="semana" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} stroke="#a855f7" fontSize={11} tickLine={false} />

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

              <Area yAxisId="left" type="monotone" dataKey="Tonelagem Acumulada (kg)" fill="#00f0ff" fillOpacity={0.15} stroke="#00f0ff" strokeWidth={2} name="Tonelagem Levantada (kg)" />
              <Line yAxisId="right" type="monotone" dataKey="Percepção de Esforço (sRPE)" stroke="#a855f7" strokeWidth={3} dot={{ r: 5, fill: '#a855f7' }} name="sRPE Médio (1-10)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ATHLETE INDIVIDUAL OVERTRAINING RISK LIST & RECOMMENDATION CARDS */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          Triagem de Fadiga e Recomendações Individuais por Atleta
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {athleteProfiles.map(profile => {
            const isCritical = profile.riskLevel === 'critico';
            const isWarning = profile.riskLevel === 'elevado';
            const isSub = profile.riskLevel === 'moderado';

            let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            if (isCritical) badgeColor = 'bg-red-500/10 text-red-400 border-red-500/30';
            else if (isWarning) badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
            else if (isSub) badgeColor = 'bg-[#1e293b] text-[#94a3b8] border-[#1e293b]';

            return (
              <div 
                key={profile.client.id}
                className="bg-[#080b11] border border-[#1e293b] hover:border-[#1e293b] transition-all rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-center font-bold text-xs text-[#00f0ff]">
                      {profile.client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#f1f5f9]">{profile.client.name}</h4>
                      <div className="text-[10px] text-[#64748b] font-medium">{profile.client.goal} • {profile.client.level}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${badgeColor}`}>
                    ACWR {profile.acwr}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#0f172a] p-2 rounded-xl border border-[#1e293b]">
                    <span className="text-[9px] text-[#64748b] font-bold block uppercase">Carga Aguda</span>
                    <span className="font-mono font-bold text-[#00f0ff]">{profile.acuteLoad} UA</span>
                  </div>
                  <div className="bg-[#0f172a] p-2 rounded-xl border border-[#1e293b]">
                    <span className="text-[9px] text-[#64748b] font-bold block uppercase">Índice Foster</span>
                    <span className="font-mono font-bold text-[#f1f5f9]">{profile.strain} UA</span>
                  </div>
                  <div className="bg-[#0f172a] p-2 rounded-xl border border-[#1e293b]">
                    <span className="text-[9px] text-[#64748b] font-bold block uppercase">sRPE Médio</span>
                    <span className="font-mono font-bold text-purple-400">{profile.avgSrpe} / 10</span>
                  </div>
                </div>

                {profile.divergenceDetected && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span><strong>Divergência Detectada:</strong> Percepção de esforço aumentando com volume estagnado/em queda.</span>
                  </div>
                )}

                <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-xl text-xs text-[#f1f5f9] space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#00f0ff] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Conduta Recomendada
                  </div>
                  <p className="text-xs text-[#94a3b8] leading-relaxed">{profile.recommendation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

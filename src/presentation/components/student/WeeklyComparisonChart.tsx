import React, { useMemo } from 'react';
import { Session } from '../../../domain/types';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export interface WeeklyComparisonChartProps {
  sessions: Session[];
}

export const WeeklyComparisonChart: React.FC<WeeklyComparisonChartProps> = ({ sessions }) => {
  const data = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const weeksMap = new Map<number, { week: number; totalTonnage: number; sumSrpe: number; count: number }>();

    sessions.forEach(s => {
      // Ignore checkins if you want, but week is there
      if (!weeksMap.has(s.week)) {
        weeksMap.set(s.week, { week: s.week, totalTonnage: 0, sumSrpe: 0, count: 0 });
      }
      const entry = weeksMap.get(s.week)!;
      entry.totalTonnage += s.tonnage || 0;
      entry.sumSrpe += s.srpe || 0;
      entry.count += 1;
    });

    const arr = Array.from(weeksMap.values()).sort((a, b) => a.week - b.week);
    
    return arr.map(a => ({
      name: `Sem ${a.week}`,
      tonnage: Math.round(a.totalTonnage),
      srpe: a.count > 0 ? Number((a.sumSrpe / a.count).toFixed(1)) : 0
    }));
  }, [sessions]);

  if (data.length < 2) {
    return (
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex flex-col items-center justify-center text-center h-64">
        <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center mb-3">
          <span className="text-xl">📊</span>
        </div>
        <h3 className="text-[#f1f5f9] font-bold text-lg">Evolução Semanal</h3>
        <p className="text-[#64748b] text-sm mt-1 max-w-xs">
          Registre pelo menos 2 semanas de treino para ver o gráfico comparativo da sua evolução.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col h-64">
      <h3 className="text-[#f1f5f9] font-bold text-sm mb-4">Volume e Intensidade (Por Semana)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              yAxisId="left" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#f59e0b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 10]}
              hide={true}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            <Bar yAxisId="left" dataKey="tonnage" name="Tonelagem (kg)" fill="#00f0ff" radius={[4, 4, 0, 0]} barSize={32} />
            <Line yAxisId="right" type="monotone" dataKey="srpe" name="sRPE Médio" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

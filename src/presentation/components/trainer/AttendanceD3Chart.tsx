import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Client, ClassBooking } from '../../../domain/types';
import { Calendar, TrendingUp, CheckCircle2, XCircle, Award, Target, Edit2, Save, Check } from 'lucide-react';
import { TrendAnalysisWidget } from './TrendAnalysisWidget';

interface AttendanceD3ChartProps {
  client: Client;
  onSaveClient?: (clientData: Partial<Client>) => void;
}

interface MonthlyData {
  monthKey: string; // e.g. "2026-05"
  monthLabel: string; // e.g. "Mai"
  completed: number;
  absences: number;
  total: number;
}

export const AttendanceD3Chart: React.FC<AttendanceD3ChartProps> = ({ client, onSaveClient }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  // Goal calculation
  const defaultGoal = useMemo(() => {
    if (client.targetMonthlyClasses && client.targetMonthlyClasses > 0) {
      return client.targetMonthlyClasses;
    }
    const daysNum = typeof client.days === 'number' ? client.days : (parseInt(String(client.days), 10) || 3);
    return daysNum * 4; // Default ~4 weeks/month
  }, [client.targetMonthlyClasses, client.days]);

  const [monthlyGoal, setMonthlyGoal] = useState<number>(defaultGoal);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [tempGoalInput, setTempGoalInput] = useState<string>(String(defaultGoal));
  const [savingGoal, setSavingGoal] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setMonthlyGoal(defaultGoal);
    setTempGoalInput(String(defaultGoal));
  }, [defaultGoal]);

  const handleSaveGoal = async () => {
    const val = parseInt(tempGoalInput, 10);
    if (isNaN(val) || val <= 0) return;

    setSavingGoal(true);
    setMonthlyGoal(val);
    if (onSaveClient) {
      try {
        await onSaveClient({
          ...client,
          targetMonthlyClasses: val
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      } catch (err) {
        console.error('Erro ao salvar meta mensal:', err);
      }
    }
    setSavingGoal(false);
    setIsEditingGoal(false);
  };

  // ResizeObserver for responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0] && entries[0].contentRect.width) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute monthly data for the last 6 months
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const bookings: ClassBooking[] = client.classBookings || [];
    
    // Generate last 6 months keys
    const monthsMap = new Map<string, MonthlyData>();
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const formattedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

      monthsMap.set(key, {
        monthKey: key,
        monthLabel: formattedLabel,
        completed: 0,
        absences: 0,
        total: 0
      });
    }

    // Populate with actual booking counts
    bookings.forEach(b => {
      if (!b.date) return;
      const key = b.date.slice(0, 7); // YYYY-MM
      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!;
        if (b.status === 'realizada') {
          item.completed += 1;
        } else if (b.status === 'falta') {
          item.absences += 1;
        }
        item.total += 1;
      }
    });

    // Also include completed workouts from rpeLog if student checked in/finished
    if (client.rpeLog) {
      client.rpeLog.forEach(s => {
        if (!s.date) return;
        const key = s.date.slice(0, 7);
        if (monthsMap.has(key)) {
          const item = monthsMap.get(key)!;
          // Avoid double counting if already present in bookings
          const hasBookingOnDate = bookings.some(b => b.date === s.date && b.status === 'realizada');
          if (!hasBookingOnDate) {
            item.completed += 1;
            item.total += 1;
          }
        }
      });
    }

    return Array.from(monthsMap.values());
  }, [client]);

  // Overall totals
  const totalCompleted = useMemo(() => monthlyData.reduce((acc, m) => acc + m.completed, 0), [monthlyData]);
  const totalAbsences = useMemo(() => monthlyData.reduce((acc, m) => acc + m.absences, 0), [monthlyData]);
  const avgMonthly = useMemo(() => {
    const activeMonths = monthlyData.filter(m => m.completed > 0 || m.absences > 0).length || 1;
    return (totalCompleted / activeMonths).toFixed(1);
  }, [monthlyData, totalCompleted]);

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    const margin = { top: 30, right: 25, bottom: 40, left: 35 };
    const width = Math.max(containerWidth, 300) - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Months)
    const x0 = d3.scaleBand()
      .domain(monthlyData.map(d => d.monthLabel))
      .rangeRound([0, width])
      .paddingInner(0.25);

    // Sub-X Scale (Grouped Bars: Completed vs Absences)
    const keys = ['completed', 'absences'];
    const x1 = d3.scaleBand()
      .domain(keys)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.1);

    // Y Scale (Class Count)
    const maxValFromData = d3.max(monthlyData, (d: MonthlyData) => Math.max(d.completed, d.absences)) || 4;
    const maxVal = Math.max(maxValFromData, monthlyGoal + 2, 5);
    
    const y = d3.scaleLinear()
      .domain([0, maxVal])
      .nice()
      .rangeRound([height, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid-lines')
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => '')
          .ticks(5)
      )
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3');

    // Remove domain line from grid
    g.selectAll('.grid-lines .domain').remove();

    // Color scale
    const colorMap: Record<string, string> = {
      completed: '#10b981', // Emerald green
      absences: '#f43f5e'   // Rose red
    };

    // Bars
    const monthGroup = g.append('g')
      .selectAll<SVGGElement, MonthlyData>('g')
      .data(monthlyData)
      .enter()
      .append('g')
      .attr('transform', (d: MonthlyData) => `translate(${x0(d.monthLabel)},0)`);

    monthGroup.selectAll('rect')
      .data((d: MonthlyData) => keys.map(key => ({ key, value: d[key as keyof MonthlyData] as number, label: d.monthLabel })))
      .enter()
      .append('rect')
      .attr('x', d => x1(d.key)!)
      .attr('y', height)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', d => colorMap[d.key])
      .attr('opacity', 0.9)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value));

    // Bar Labels (Numbers on top of bars)
    monthGroup.selectAll('text')
      .data((d: MonthlyData) => keys.map(key => ({ key, value: d[key as keyof MonthlyData] as number })))
      .enter()
      .append('text')
      .attr('x', d => (x1(d.key)! + x1.bandwidth() / 2))
      .attr('y', d => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.key === 'completed' ? '#34d399' : '#f87171')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(d => d.value > 0 ? d.value : '');

    // Threshold Reference Line (Meta Mensal)
    if (monthlyGoal > 0) {
      const goalY = y(monthlyGoal);

      // Dashed reference line
      g.append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', goalY)
        .attr('y2', goalY)
        .attr('stroke', '#00f0ff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,4')
        .attr('opacity', 0.9);

      // Badge on right edge
      const badgeWidth = 92;
      const badgeHeight = 20;

      const badgeGroup = g.append('g')
        .attr('transform', `translate(${width - badgeWidth}, ${goalY - 10})`);

      badgeGroup.append('rect')
        .attr('width', badgeWidth)
        .attr('height', badgeHeight)
        .attr('rx', 6)
        .attr('fill', '#080b11')
        .attr('stroke', '#00f0ff')
        .attr('stroke-width', 1.5);

      badgeGroup.append('text')
        .attr('x', badgeWidth / 2)
        .attr('y', 13)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00f0ff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text(`Meta: ${monthlyGoal} aulas`);
    }

    // X Axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x0));

    xAxis.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold');

    xAxis.select('.domain').attr('stroke', '#334155');
    xAxis.selectAll('.tick line').attr('stroke', '#334155');

    // Y Axis
    const yAxis = g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));

    yAxis.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    yAxis.select('.domain').attr('stroke', '#334155');
    yAxis.selectAll('.tick line').attr('stroke', '#334155');

  }, [monthlyData, containerWidth, monthlyGoal]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fade-in">
      {/* D3 Chart Box */}
      <div className="lg:col-span-7 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
            <div>
              <h3 className="font-display font-extrabold text-base text-[#f1f5f9] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00f0ff]" />
                <span>Estatísticas de Frequência (D3.js)</span>
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Aulas realizadas x faltas com linha de meta mensal
              </p>
            </div>

            {/* Target Goal Field & Legend */}
            <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
              {/* Target Goal Control */}
              <div className="bg-[#080b11] border border-[#00f0ff]/30 rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-[#00f0ff]">
                <Target className="w-4 h-4 shrink-0 text-[#00f0ff]" />
                {isEditingGoal ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={tempGoalInput}
                      onChange={(e) => setTempGoalInput(e.target.value)}
                      className="w-12 bg-[#0f172a] border border-[#00f0ff] rounded px-1.5 py-0.5 text-xs text-center font-mono text-white focus:outline-none"
                    />
                    <span className="text-[11px] text-[#94a3b8]">/mês</span>
                    <button
                      onClick={handleSaveGoal}
                      disabled={savingGoal}
                      className="bg-[#00f0ff] hover:bg-[#00d0df] text-[#080b11] p-1 rounded font-bold transition-all"
                      title="Salvar Meta"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#f1f5f9] font-mono font-bold text-xs">{monthlyGoal}</span>
                    <span className="text-[11px] text-[#94a3b8]">aulas/mês</span>
                    {savedSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <button
                        onClick={() => setIsEditingGoal(true)}
                        className="text-[#94a3b8] hover:text-[#00f0ff] p-0.5 transition-all"
                        title="Definir Meta de Aulas"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>
                  <span className="text-[#f1f5f9]">Aulas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block"></span>
                  <span className="text-[#f1f5f9]">Faltas</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Chips */}
          <div className="grid grid-cols-3 gap-2.5 text-center mt-4">
            <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#94a3b8] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Realizadas</span>
              </div>
              <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">{totalCompleted}</div>
            </div>

            <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#94a3b8] font-bold">
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>Faltas</span>
              </div>
              <div className="text-lg font-black font-mono text-rose-400 mt-0.5">{totalAbsences}</div>
            </div>

            <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#94a3b8] font-bold">
                <Award className="w-3 h-3 text-[#00f0ff]" />
                <span>Média/Mês</span>
              </div>
              <div className="text-lg font-black font-mono text-[#00f0ff] mt-0.5">{avgMonthly}</div>
            </div>
          </div>
        </div>

        {/* D3 SVG Chart Container */}
        <div ref={containerRef} className="w-full overflow-x-auto pt-2">
          <svg ref={svgRef} className="mx-auto block"></svg>
        </div>
      </div>

      {/* AI Trend Analysis Side Widget */}
      <div className="lg:col-span-5">
        <TrendAnalysisWidget
          client={client}
          monthlySummary={{
            completed: totalCompleted,
            absences: totalAbsences,
            avgMonthly,
            trend: totalCompleted >= totalAbsences ? 'alta' : 'queda',
          }}
        />
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Client, Program } from '../../../domain/types';
import { calculateWeeklyVolume, VOLUME_CONTRIBUTION_MAP } from '../../../domain/calculators/volumeCalculators';
import { Flame, Info, Sparkles, Filter, Layers, Zap, ChevronRight, LayoutGrid } from 'lucide-react';

interface WeeklyVolumeHeatmapWidgetProps {
  clients: Client[];
  selectedClientId?: string;
  onSelectClient?: (clientId: string) => void;
}

// Target muscle groups for the heatmap grid
const MUSCLE_GROUPS = [
  'Peito',
  'Costas',
  'Quadríceps',
  'Posterior de coxa',
  'Glúteo',
  'Ombro (lateral)',
  'Ombro (frontal)',
  'Ombro (posterior)',
  'Bíceps',
  'Tríceps',
  'Core',
  'Panturrilha'
];

interface CellData {
  muscle: string;
  weekNum: number;
  phaseName: string;
  volumeFactor: number;
  directSets: number;
  totalSets: number;
  mev: number; // Minimum Effective Volume
  mav: number; // Maximum Adaptive Volume
  mrv: number; // Maximum Recoverable Volume
  status: 'baixo' | 'manutencao' | 'otimo' | 'alto' | 'excessivo';
}

export const WeeklyVolumeHeatmapWidget: React.FC<WeeklyVolumeHeatmapWidgetProps> = ({
  clients,
  selectedClientId = 'todos',
  onSelectClient
}) => {
  const [activeClientFilter, setActiveClientFilter] = useState<string>(selectedClientId);
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);

  // Filter clients with active programs
  const clientsWithPrograms = useMemo(() => {
    return clients.filter(c => c.program && c.program.days && c.program.days.length > 0);
  }, [clients]);

  // Selected client or default first
  const currentClient = useMemo(() => {
    if (activeClientFilter === 'todos') {
      return clientsWithPrograms[0] || clients[0] || null;
    }
    return clients.find(c => c.id === activeClientFilter) || null;
  }, [clients, clientsWithPrograms, activeClientFilter]);

  // Extract mesocycle weeks from program or generate standard 4-week mesocycle
  const mesoWeeks = useMemo(() => {
    if (currentClient?.program?.meso?.weeks && currentClient.program.meso.weeks.length > 0) {
      return currentClient.program.meso.weeks.map((w, idx) => ({
        weekNum: idx + 1,
        phaseName: w.f || (idx === 3 ? 'Deload' : `Semana ${idx + 1}`),
        volumeFactor: w.v ?? (idx === 3 ? 0.6 : 1.0 + idx * 0.1)
      }));
    }
    // Standard 4-week microcycles
    return [
      { weekNum: 1, phaseName: 'Base', volumeFactor: 1.0 },
      { weekNum: 2, phaseName: 'Acumulação', volumeFactor: 1.1 },
      { weekNum: 3, phaseName: 'Intensificação', volumeFactor: 1.2 },
      { weekNum: 4, phaseName: 'Deload', volumeFactor: 0.6 }
    ];
  }, [currentClient]);

  // Base weekly volume for selected client or averaged across clients
  const baseVolumeMap = useMemo(() => {
    const map: Record<string, number> = {};

    if (activeClientFilter === 'todos' && clientsWithPrograms.length > 0) {
      // Aggregate average across all clients
      for (const m of MUSCLE_GROUPS) map[m] = 0;
      
      let count = 0;
      for (const client of clientsWithPrograms) {
        const vols = calculateWeeklyVolume(client.program);
        for (const v of vols) {
          if (map[v.muscle] !== undefined) {
            map[v.muscle] += v.total;
          } else {
            map[v.muscle] = v.total;
          }
        }
        count++;
      }
      if (count > 0) {
        for (const m of MUSCLE_GROUPS) map[m] = Math.round((map[m] / count) * 2) / 2;
      }
    } else if (currentClient?.program) {
      const vols = calculateWeeklyVolume(currentClient.program);
      for (const v of vols) {
        map[v.muscle] = v.total;
      }
    }

    return map;
  }, [activeClientFilter, clientsWithPrograms, currentClient]);

  // Calculate grid cell data
  const gridData = useMemo(() => {
    const rows: { muscle: string; cells: CellData[] }[] = [];

    // Client level thresholds
    const level = currentClient?.level || 'Intermediário';
    const levelFactor = level === 'Iniciante' ? 0.7 : level === 'Avançado' ? 1.3 : 1.0;

    for (const muscle of MUSCLE_GROUPS) {
      const baseVol = baseVolumeMap[muscle] || 0;
      const mev = Math.round(6 * levelFactor);
      const mav = Math.round(14 * levelFactor);
      const mrv = Math.round(22 * levelFactor);

      const cells: CellData[] = mesoWeeks.map(w => {
        const totalSets = Math.round(baseVol * w.volumeFactor * 2) / 2;
        const directSets = Math.round(totalSets * 0.7 * 2) / 2;

        let status: CellData['status'] = 'manutencao';
        if (totalSets === 0) status = 'baixo';
        else if (totalSets < mev) status = 'baixo';
        else if (totalSets <= mav - 2) status = 'manutencao';
        else if (totalSets <= mav + 3) status = 'otimo';
        else if (totalSets <= mrv) status = 'alto';
        else status = 'excessivo';

        return {
          muscle,
          weekNum: w.weekNum,
          phaseName: w.phaseName,
          volumeFactor: w.volumeFactor,
          directSets,
          totalSets,
          mev,
          mav,
          mrv,
          status
        };
      });

      rows.push({ muscle, cells });
    }

    return rows;
  }, [baseVolumeMap, mesoWeeks, currentClient]);

  // Cell background color styling based on status
  const getCellBgClass = (status: CellData['status'], totalSets: number) => {
    if (totalSets === 0) return 'bg-[#1e293b]/30 border-[#1e293b] text-[#64748b]';
    switch (status) {
      case 'baixo':
        return 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700/80';
      case 'manutencao':
        return 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/90';
      case 'otimo':
        return 'bg-[#00f0ff]/20 border-[#00f0ff]/50 text-[#00f0ff] font-bold hover:bg-[#00f0ff]/30 shadow-sm shadow-[#00f0ff]/20';
      case 'alto':
        return 'bg-purple-950/80 border-purple-800 text-purple-300 font-bold hover:bg-purple-900/90';
      case 'excessivo':
        return 'bg-amber-950/90 border-amber-600/80 text-amber-300 font-extrabold hover:bg-amber-900/90 animate-pulse';
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00f0ff]">
                PERIODIZAÇÃO & DENSIDADE DE CARGA
              </span>
              <span className="bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-bold px-2 py-0.5 rounded-full">
                Interactive Grid
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black font-display text-white">
              Mapa de Calor de Volume Semanal
            </h3>
          </div>
        </div>

        {/* Client Selector Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span className="text-[#94a3b8] font-bold hidden sm:inline">Aluno:</span>
          <select
            value={activeClientFilter}
            onChange={(e) => {
              setActiveClientFilter(e.target.value);
              if (onSelectClient && e.target.value !== 'todos') {
                onSelectClient(e.target.value);
              }
            }}
            className="bg-[#080b11] border border-[#1e293b] focus:border-[#00f0ff] rounded-xl px-3 py-1.5 text-xs text-white font-semibold outline-none transition-all cursor-pointer"
          >
            <option value="todos">📊 Média da Turma / Atletas ({clientsWithPrograms.length})</option>
            {clientsWithPrograms.map(c => (
              <option key={c.id} value={c.id}>
                👤 {c.name} ({c.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#080b11] p-2.5 rounded-xl border border-[#1e293b] text-[11px] text-[#94a3b8]">
        <span className="font-bold text-[#f1f5f9] flex items-center gap-1">
          <LayoutGrid className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>Legenda de Densidade:</span>
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
            <span>Sub-estímulo (&lt;6)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-800" />
            <span>Manutenção (6-11)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#00f0ff]/30 border border-[#00f0ff]" />
            <span className="font-bold text-[#00f0ff]">MAV Ótimo (12-17)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-950 border border-purple-800" />
            <span>Alta Intensidade (18-21)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-950 border border-amber-600" />
            <span className="text-amber-400 font-bold">Limite MRV (&ge;22)</span>
          </div>
        </div>
      </div>

      {/* Reactive Heatmap Grid */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-xs text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="border-b border-[#1e293b] text-[11px] uppercase text-[#64748b]">
              <th className="p-2.5 font-black text-[#94a3b8] w-40">Grupo Muscular</th>
              {mesoWeeks.map((w) => (
                <th key={w.weekNum} className="p-2.5 text-center font-bold text-[#f1f5f9] bg-[#080b11]/50">
                  <div className="text-[#00f0ff]">Semana {w.weekNum}</div>
                  <div className="text-[10px] text-[#94a3b8] font-normal">{w.phaseName} ({Math.round(w.volumeFactor * 100)}%)</div>
                </th>
              ))}
              <th className="p-2.5 text-center font-bold text-[#94a3b8] w-28">Meta MAV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]/60">
            {gridData.map((row) => {
              const mavTarget = row.cells[0]?.mav || 14;
              return (
                <tr key={row.muscle} className="hover:bg-[#1e293b]/20 transition-colors">
                  <td className="p-2.5 font-bold text-slate-200 flex items-center justify-between">
                    <span>{row.muscle}</span>
                  </td>

                  {row.cells.map((cell) => {
                    const bgStyle = getCellBgClass(cell.status, cell.totalSets);
                    return (
                      <td key={cell.weekNum} className="p-1.5 text-center">
                        <button
                          type="button"
                          onMouseEnter={() => setHoveredCell(cell)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => setHoveredCell(cell)}
                          className={`w-full py-2 px-1.5 rounded-xl border text-xs transition-all ${bgStyle}`}
                        >
                          <span className="font-mono text-sm">{cell.totalSets}</span>
                          <span className="text-[10px] block opacity-80 font-sans">séries/s</span>
                        </button>
                      </td>
                    );
                  })}

                  <td className="p-2.5 text-center font-mono font-bold text-[#94a3b8]">
                    ~{mavTarget} s/semana
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active Hover / Focus Detail Banner */}
      {hoveredCell && (
        <div className="bg-[#080b11] border border-[#00f0ff]/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white font-display text-sm">
                {hoveredCell.muscle} — Semana {hoveredCell.weekNum} ({hoveredCell.phaseName})
              </span>
              <div className="text-[#94a3b8] text-[11px] mt-0.5">
                Volume Total: <strong className="text-[#00f0ff]">{hoveredCell.totalSets} séries</strong> ({hoveredCell.directSets} diretas)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-[11px]">
              <span className="text-[#64748b] block">Zone status:</span>
              <span className={`font-bold uppercase ${
                hoveredCell.status === 'otimo' ? 'text-[#00f0ff]' :
                hoveredCell.status === 'excessivo' ? 'text-amber-400' :
                hoveredCell.status === 'alto' ? 'text-purple-300' : 'text-emerald-400'
              }`}>
                {hoveredCell.status === 'otimo' ? '⭐ MAV (Volume Adaptativo Ótimo)' :
                 hoveredCell.status === 'excessivo' ? '⚠️ Risco MRV (Superfaturado)' :
                 hoveredCell.status === 'alto' ? '🔥 Alta Sobrecarga' : '✓ Volume de Manutenção'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

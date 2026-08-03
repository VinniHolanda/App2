import React, { useMemo } from 'react';
import { Session, PersonalRecord } from '../../../domain/types';
import { calculatePersonalRecords } from '../../../domain/calculators/loadCalculators';
import { Trophy } from 'lucide-react';

export interface PersonalRecordsPanelProps {
  sessions: Session[];
}

export const PersonalRecordsPanel: React.FC<PersonalRecordsPanelProps> = ({ sessions }) => {
  const prs = useMemo(() => {
    const rawPrs = calculatePersonalRecords(sessions || []);
    
    // Convert to array and sort by date descending
    const arr = Object.entries(rawPrs).map(([name, data]) => ({
      name,
      ...data
    }));

    return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sessions]);

  if (prs.length === 0) {
    return (
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex flex-col items-center justify-center text-center h-64">
        <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center mb-3">
          <Trophy className="w-6 h-6 text-[#64748b]" />
        </div>
        <h3 className="text-[#f1f5f9] font-bold text-lg">Recordes Pessoais</h3>
        <p className="text-[#64748b] text-sm mt-1 max-w-xs">
          Continue treinando e registrando suas cargas para desbloquear seus recordes (PRs).
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 flex flex-col h-64">
      <h3 className="text-[#f1f5f9] font-bold text-sm mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        Recordes Pessoais (PRs)
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {prs.map((pr, idx) => {
          const isTop3 = idx < 3;
          
          return (
            <div 
              key={pr.name} 
              className={`flex items-center justify-between p-3 rounded-xl border ${isTop3 ? 'bg-[#020817] border-[#00f0ff]/30 shadow-[0_0_10px_rgba(0,240,255,0.05)]' : 'bg-[#0f172a] border-[#1e293b]'}`}
            >
              <div className="flex items-center gap-3">
                {isTop3 ? (
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4 text-amber-500" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#64748b]">{idx + 1}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-[#f1f5f9] font-bold text-sm truncate max-w-[140px]" title={pr.name}>{pr.name}</h4>
                  <div className="text-xs text-[#64748b]">
                    {new Date(pr.date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <div className="text-[#00f0ff] font-mono font-bold">
                  {pr.bestKg}kg <span className="text-[#94a3b8] font-sans text-xs font-normal">x {pr.bestReps}</span>
                </div>
                <div className="text-[10px] text-[#64748b]">
                  est 1RM: <span className="font-mono text-[#f1f5f9]">{Math.round(pr.est1RM)}kg</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, ClientLevel, TrainingGoal } from '../../domain/types';
import { ClientCard, AddClientModal } from '../components/trainer/TrainerComponents';
import { TrainerAlertsNotificationCenter } from '../components/trainer/TrainerAlertsNotificationCenter';
import { WeeklyVolumeHeatmapWidget } from '../components/trainer/WeeklyVolumeHeatmapWidget';
import { OvertrainingMonitoringService } from '../../domain/services/OvertrainingMonitoringService';
import { Button, Badge } from '../components/ui/Primitives';
import { Search, Filter, X, ArrowUpDown, SlidersHorizontal, UserCheck, AlertTriangle, AlertOctagon, RefreshCw, Activity, Sparkles, Dumbbell, Zap, Command, BookOpen, ShieldAlert } from 'lucide-react';

export interface TrainerDashboardViewProps {
  clients: Client[];
  onSelectClient: (id: string, tab?: string) => void;
  onSaveClient: (clientData: Partial<Client>) => void;
  onDeleteClient?: (id: string) => void;
  onOpenLibrary?: () => void;
  onApplyAutoDeload?: (clientId: string) => void;
}

const getLastUpdateTimestamp = (client: Client): number => {
  let latest = 0;
  if (client.rpeLog && client.rpeLog.length > 0) {
    for (const session of client.rpeLog) {
      if (session.date) {
        const t = new Date(session.date).getTime();
        if (!isNaN(t) && t > latest) latest = t;
      }
    }
  }
  if (client.programHistory && client.programHistory.length > 0) {
    for (const h of client.programHistory) {
      if (h.savedAt) {
        const t = new Date(h.savedAt).getTime();
        if (!isNaN(t) && t > latest) latest = t;
      }
    }
  }
  return latest;
};

export const TrainerDashboardView: React.FC<TrainerDashboardViewProps> = ({
  clients,
  onSelectClient,
  onSaveClient,
  onDeleteClient,
  onOpenLibrary,
  onApplyAutoDeload
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('todos');
  const [selectedGoal, setSelectedGoal] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'last_updated' | 'name' | 'level'>('last_updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const goalsList: TrainingGoal[] = [
    'Ganho de massa (hipertrofia)',
    'Perda de gordura',
    'Força',
    'Condicionamento / saúde',
    'Performance esportiva',
    'Reabilitação / volta ao treino'
  ];

  const filteredAndSortedClients = useMemo(() => {
    let result = clients.filter(c => {
      // Busca textual por Nome, Objetivo, Email, Whats, Observações
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchGoal = c.goal.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q) || false;
        const matchWhats = c.whats?.toLowerCase().includes(q) || false;
        const matchNotes = c.notes?.toLowerCase().includes(q) || false;
        if (!matchName && !matchGoal && !matchEmail && !matchWhats && !matchNotes) {
          return false;
        }
      }

      // Filtro por Nível
      if (selectedLevel !== 'todos' && c.level !== selectedLevel) {
        return false;
      }

      // Filtro por Objetivo
      if (selectedGoal !== 'todos' && c.goal !== selectedGoal) {
        return false;
      }

      // Filtro por Status
      if (selectedStatus === 'com_treino' && !c.program) return false;
      if (selectedStatus === 'sem_treino' && c.program) return false;
      if (selectedStatus === 'parq_alert') {
        const isParq = c.parq && Object.values(c.parq).some(v => v === 'sim');
        if (!isParq) return false;
      }
      if (selectedStatus === 'monotony_risk') {
        const isMonoRisk = OvertrainingMonitoringService.getClientMonotonyStatus(c).inRiskZone;
        if (!isMonoRisk) return false;
      }

      // Filtro por Tipo (Presencial / Consultoria)
      if (selectedTipo !== 'todos' && c.tipo !== selectedTipo) {
        return false;
      }

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'last_updated') {
        const timeA = getLastUpdateTimestamp(a);
        const timeB = getLastUpdateTimestamp(b);
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortBy === 'level') {
        const levelRank: Record<string, number> = { 'Iniciante': 1, 'Intermediário': 2, 'Avançado': 3 };
        const rankA = levelRank[a.level] || 0;
        const rankB = levelRank[b.level] || 0;
        return sortOrder === 'desc' ? rankB - rankA : rankA - rankB;
      }
      return 0;
    });

    return result;
  }, [clients, searchQuery, selectedLevel, selectedGoal, selectedStatus, selectedTipo, sortBy, sortOrder]);

  const hasActiveFilters = 
    searchQuery.trim() !== '' ||
    selectedLevel !== 'todos' ||
    selectedGoal !== 'todos' ||
    selectedStatus !== 'todos' ||
    selectedTipo !== 'todos';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedLevel('todos');
    setSelectedGoal('todos');
    setSelectedStatus('todos');
    setSelectedTipo('todos');
    setSortBy('last_updated');
    setSortOrder('desc');
  };

  const totalClients = clients.length;
  const withProgram = clients.filter(c => c.program).length;
  const parqAlerts = clients.filter(c => c.parq && Object.values(c.parq).some(v => v === 'sim')).length;
  const monotonyRiskCount = useMemo(() => {
    return clients.filter(c => OvertrainingMonitoringService.getClientMonotonyStatus(c).inRiskZone).length;
  }, [clients]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Clean Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-pulse" />
            <h1 className="font-display text-xl md:text-2xl font-extrabold text-[#f1f5f9] tracking-tight">
              Painel de Atletas
            </h1>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Gestão centralizada de alunos, prescrições de treino e monitoramento de segurança.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Central de Notificações Trigger */}
          <TrainerAlertsNotificationCenter 
            clients={clients} 
            onSelectClient={onSelectClient} 
            onApplyAutoDeload={onApplyAutoDeload} 
          />

          {onOpenLibrary && (
            <Button
              variant="outline"
              onClick={onOpenLibrary}
              className="border-[#1e293b] text-[#f1f5f9] hover:bg-[#1e293b] text-xs font-bold py-2 px-3 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-[#00f0ff]" />
              <span className="hidden sm:inline">Biblioteca</span>
            </Button>
          )}

          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#00f0ff] text-[#080b11] font-bold text-xs py-2 px-3.5 shadow-md shadow-[#00f0ff]/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Novo Aluno</span>
          </Button>
        </div>
      </div>

      {/* Sleek Quick Metrics Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Priority Action Center & Stats (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Action Center */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-lg relative overflow-hidden group">
             {/* decorative gradient */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00f0ff]/10 to-transparent blur-3xl rounded-full transition-opacity group-hover:opacity-75 opacity-40" />
             
             <div className="flex items-center justify-between mb-4 relative z-10">
               <h2 className="font-display font-bold text-[#f1f5f9] flex items-center gap-2">
                 <Command className="w-5 h-5 text-[#00f0ff]" />
                 Command Center <span className="text-[10px] bg-[#1e293b] px-2 py-0.5 rounded text-[#00f0ff] font-mono tracking-widest border border-[#00f0ff]/20 animate-pulse">AO VIVO</span>
               </h2>
               <div className="text-xs text-[#94a3b8] font-mono">
                 {totalClients} Atletas Monitorados
               </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                {/* Pending Workouts */}
                <div onClick={() => setSelectedStatus('sem_treino')} className="group/item cursor-pointer bg-[#080b11]/50 border border-[#1e293b] hover:border-[#00f0ff]/50 rounded-xl p-4 transition-all">
                   <div className="flex justify-between items-start mb-2">
                     <div className="w-8 h-8 rounded-full bg-[#1e293b] group-hover/item:bg-[#00f0ff]/20 flex items-center justify-center transition-colors">
                       <Zap className="w-4 h-4 text-[#94a3b8] group-hover/item:text-[#00f0ff]" />
                     </div>
                     <span className={`text-xl font-black ${totalClients - withProgram > 0 ? 'text-[#00f0ff]' : 'text-[#f1f5f9]'}`}>
                        {totalClients - withProgram}
                     </span>
                   </div>
                   <div className="text-xs font-bold text-[#94a3b8] group-hover/item:text-[#f1f5f9] uppercase tracking-wider transition-colors">Aguardando Treino</div>
                   <div className="text-[10px] text-[#64748b] mt-1">Alunos sem treino ativo</div>
                </div>

                {/* Monotony Risk */}
                <div onClick={() => setSelectedStatus('monotony_risk')} className="group/item cursor-pointer bg-[#080b11]/50 border border-[#1e293b] hover:border-red-500/50 rounded-xl p-4 transition-all">
                   <div className="flex justify-between items-start mb-2">
                     <div className="w-8 h-8 rounded-full bg-[#1e293b] group-hover/item:bg-red-500/20 flex items-center justify-center transition-colors">
                       <Activity className="w-4 h-4 text-[#94a3b8] group-hover/item:text-red-400" />
                     </div>
                     <span className={`text-xl font-black ${monotonyRiskCount > 0 ? 'text-red-400 animate-pulse' : 'text-[#f1f5f9]'}`}>
                        {monotonyRiskCount}
                     </span>
                   </div>
                   <div className="text-xs font-bold text-[#94a3b8] group-hover/item:text-red-300 uppercase tracking-wider transition-colors">Risco Overtraining</div>
                   <div className="text-[10px] text-[#64748b] mt-1">Alta fadiga/monotonia</div>
                </div>

                {/* Health Risk (PAR-Q) */}
                <div onClick={() => setSelectedStatus('parq_alert')} className="group/item cursor-pointer bg-[#080b11]/50 border border-[#1e293b] hover:border-amber-500/50 rounded-xl p-4 transition-all">
                   <div className="flex justify-between items-start mb-2">
                     <div className="w-8 h-8 rounded-full bg-[#1e293b] group-hover/item:bg-amber-500/20 flex items-center justify-center transition-colors">
                       <ShieldAlert className="w-4 h-4 text-[#94a3b8] group-hover/item:text-amber-400" />
                     </div>
                     <span className={`text-xl font-black ${parqAlerts > 0 ? 'text-amber-400' : 'text-[#f1f5f9]'}`}>
                        {parqAlerts}
                     </span>
                   </div>
                   <div className="text-xs font-bold text-[#94a3b8] group-hover/item:text-amber-300 uppercase tracking-wider transition-colors">Atenção Médica</div>
                   <div className="text-[10px] text-[#64748b] mt-1">Alertas críticos no PAR-Q</div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Search & Filters (1/3 width) */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-lg flex flex-col relative overflow-hidden">
           <h3 className="font-display font-bold text-[#f1f5f9] text-sm mb-4">Filtragem Dinâmica</h3>
           
           <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar atleta..."
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/30 transition-all placeholder:text-[#64748b]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f1f5f9]">
                  <X className="w-4 h-4" />
                </button>
              )}
           </div>

           <div className="space-y-3 flex-1 relative z-10">
             <div className="grid grid-cols-2 gap-3">
               <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#94a3b8] focus:outline-none focus:border-[#00f0ff] focus:text-[#f1f5f9]">
                  <option value="todos">Todos os Níveis</option>
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
               </select>

               <select value={selectedTipo} onChange={e => setSelectedTipo(e.target.value)} className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#94a3b8] focus:outline-none focus:border-[#00f0ff] focus:text-[#f1f5f9]">
                  <option value="todos">Modalidades</option>
                  <option value="Presencial">Presencial</option>
                  <option value="Consultoria online">Consultoria Online</option>
               </select>
             </div>

             <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#94a3b8] focus:outline-none focus:border-[#00f0ff] focus:text-[#f1f5f9]">
                <option value="todos">Todos os Objetivos</option>
                {goalsList.map(g => (
                  <option key={g} value={g}>{g.split('(')[0].trim()}</option>
                ))}
             </select>

             <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full bg-[#080b11] border border-[#1e293b] rounded-lg px-3 py-2 text-xs text-[#94a3b8] focus:outline-none focus:border-[#00f0ff] focus:text-[#f1f5f9]">
                <option value="todos">Status e Alertas</option>
                <option value="com_treino">✓ Com Treino Ativo</option>
                <option value="sem_treino">⚠ Sem Treino</option>
                <option value="monotony_risk">🚨 Risco de Monotonia</option>
                <option value="parq_alert">✚ Alerta Médico</option>
             </select>
           </div>
           
           {hasActiveFilters && (
             <button onClick={resetAllFilters} className="mt-4 text-xs font-bold text-[#00f0ff] hover:text-[#f1f5f9] transition-colors flex items-center justify-center gap-1.5 py-2 bg-[#00f0ff]/5 hover:bg-[#00f0ff]/10 rounded-lg">
               <RefreshCw className="w-3.5 h-3.5" /> Resetar Filtros
             </button>
           )}
        </div>
      </div>


      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-[#94a3b8] px-1">
        <div>
          Exibindo <strong className="text-[#f1f5f9] font-bold">{filteredAndSortedClients.length}</strong> de <strong className="text-[#f1f5f9] font-bold">{clients.length}</strong> alunos
          {hasActiveFilters && <span className="text-[#00f0ff] ml-1.5 font-medium">(filtros ativos)</span>}
        </div>
        <div className="text-[11px] text-[#64748b]">
          Ordenado por: {sortBy === 'last_updated' ? 'Última Atividade' : sortBy === 'name' ? 'Nome' : 'Nível'}
        </div>
      </div>

      {/* Clients Grid */}
      {filteredAndSortedClients.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredAndSortedClients.map((client, index) => (
              <motion.div
                key={client.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
              >
                <ClientCard
                  client={client}
                  onClick={() => onSelectClient(client.id)}
                  onDeleteClient={onDeleteClient}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="bg-[#0f172a] border border-dashed border-[#1e293b] rounded-2xl p-12 text-center text-[#64748b] space-y-3">
          <div className="text-4xl">🔍</div>
          <div className="font-semibold text-base text-[#94a3b8]">Nenhum aluno encontrado</div>
          <p className="text-xs max-w-md mx-auto">
            Nenhum aluno corresponde aos critérios de busca ou filtros aplicados. Tente ajustar a busca ou limpe os filtros.
          </p>
          {hasActiveFilters && (
            <div className="pt-2">
              <Button variant="ghost" size="sm" onClick={resetAllFilters} className="text-xs border border-[#1e293b] hover:border-[#00f0ff]">
                Limpar Todos os Filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onSaveClient}
      />
    </div>
  );
};

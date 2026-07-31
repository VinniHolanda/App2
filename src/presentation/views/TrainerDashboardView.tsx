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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="font-display text-2xl font-black text-[#00f0ff]">{totalClients}</div>
            <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider mt-0.5">Alunos Ativos</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center text-[#00f0ff]">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="font-display text-2xl font-black text-[#f1f5f9]">{withProgram}</div>
            <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider mt-0.5">Com Treino Prescrito</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#0f172a] border border-[#1e293b] flex items-center justify-center text-[#94a3b8]">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className={`font-display text-2xl font-black ${parqAlerts > 0 ? 'text-amber-400' : 'text-[#f1f5f9]'}`}>
              {parqAlerts}
            </div>
            <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider mt-0.5">Alertas PAR-Q</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className={`font-display text-2xl font-black ${monotonyRiskCount > 0 ? 'text-red-400' : 'text-[#f1f5f9]'}`}>
              {monotonyRiskCount}
            </div>
            <div className="text-[11px] text-[#64748b] font-bold uppercase tracking-wider mt-0.5">Risco Monotonia</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-4">
        {/* Search Bar + Sort */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Input field */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, objetivo, e-mail ou observações..."
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl pl-10 pr-20 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff]/30 placeholder:text-[#64748b] transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#64748b] hover:text-[#f1f5f9] transition-colors p-1"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-[#64748b] bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded">
                  <Command className="w-2.5 h-2.5" /> K
                </span>
              )}
            </div>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-[#94a3b8]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="hidden sm:inline font-semibold">Ordenar:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#f1f5f9] font-medium focus:outline-none cursor-pointer"
              >
                <option value="last_updated" className="bg-[#0f172a]">Última Atividade</option>
                <option value="name" className="bg-[#0f172a]">Nome do Aluno</option>
                <option value="level" className="bg-[#0f172a]">Nível de Treino</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="ml-1 p-1 hover:bg-[#1e293b] rounded text-[#00f0ff] transition-colors"
                title={sortOrder === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Selects Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 border-t border-[#1e293b]">
          {/* Nível */}
          <div>
            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
              Nível
            </label>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos" className="bg-[#0f172a]">Todos os Níveis</option>
              <option value="Iniciante" className="bg-[#0f172a]">Iniciante</option>
              <option value="Intermediário" className="bg-[#0f172a]">Intermediário</option>
              <option value="Avançado" className="bg-[#0f172a]">Avançado</option>
            </select>
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
              Objetivo
            </label>
            <select
              value={selectedGoal}
              onChange={e => setSelectedGoal(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] truncate"
            >
              <option value="todos" className="bg-[#0f172a]">Todos os Objetivos</option>
              {goalsList.map(g => (
                <option key={g} value={g} className="bg-[#0f172a]">
                  {g.split('(')[0].trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Status do Treino / Saúde */}
          <div>
            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
              Status & Saúde
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos" className="bg-[#0f172a]">Todos os Status</option>
              <option value="com_treino" className="bg-[#0f172a]">✓ Com Treino Prescrito</option>
              <option value="sem_treino" className="bg-[#0f172a]">Sem Treino Prescrito</option>
              <option value="monotony_risk" className="bg-[#0f172a]">🚨 Risco de Monotonia (≥1.8)</option>
              <option value="parq_alert" className="bg-[#0f172a]">⚠ Com Alerta PAR-Q</option>
            </select>
          </div>

          {/* Modalidade */}
          <div>
            <label className="block text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-1">
              Modalidade
            </label>
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg px-2.5 py-1.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos" className="bg-[#0f172a]">Todas as Modalidades</option>
              <option value="Presencial" className="bg-[#0f172a]">Presencial</option>
              <option value="Consultoria online" className="bg-[#0f172a]">Consultoria Online</option>
            </select>
          </div>
        </div>

        {/* Quick Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1e293b]">
          <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mr-1">Filtros Rápidos:</span>
          
          <button
            onClick={() => setSelectedLevel('todos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLevel === 'todos' && !hasActiveFilters
                ? 'bg-[#00f0ff] text-[#080b11]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
            }`}
          >
            Todos ({clients.length})
          </button>

          <button
            onClick={() => setSelectedLevel('Iniciante')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLevel === 'Iniciante'
                ? 'bg-[#00f0ff] text-[#080b11]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
            }`}
          >
            Iniciantes
          </button>

          <button
            onClick={() => setSelectedLevel('Intermediário')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLevel === 'Intermediário'
                ? 'bg-[#00f0ff] text-[#080b11]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
            }`}
          >
            Intermediários
          </button>

          <button
            onClick={() => setSelectedLevel('Avançado')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLevel === 'Avançado'
                ? 'bg-[#00f0ff] text-[#080b11]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
            }`}
          >
            Avançados
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'com_treino' ? 'todos' : 'com_treino')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedStatus === 'com_treino'
                ? 'bg-[#00f0ff] text-[#080b11]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
            }`}
          >
            ✓ Com Treino Prescrito ({withProgram})
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'monotony_risk' ? 'todos' : 'monotony_risk')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
              selectedStatus === 'monotony_risk'
                ? 'bg-red-500 text-white font-bold'
                : 'bg-[#0f172a] text-red-400 hover:text-red-300 border border-red-500/30'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>Risco Monotonia ({monotonyRiskCount})</span>
          </button>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'parq_alert' ? 'todos' : 'parq_alert')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedStatus === 'parq_alert'
                ? 'bg-amber-400 text-[#080b11]'
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
            }`}
          >
            ⚠ Alertas PAR-Q ({parqAlerts})
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="ml-auto text-xs text-[#00f0ff] hover:underline flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              Limpar Filtros
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

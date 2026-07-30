import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, ClassBooking } from '../../domain/types';
import { calculateStudentClassStats, getAllTrainerClassBookings } from '../../domain/calculators/classStatsCalculator';
import { Button, Badge, Modal } from '../components/ui/Primitives';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Filter, 
  Search, 
  Trash2, 
  FileText, 
  Users, 
  Award,
  Check,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export interface TrainerScheduleViewProps {
  clients: Client[];
  onSaveClassBooking: (clientId: string, booking: Partial<ClassBooking>) => void;
  onUpdateBookingStatus: (
    clientId: string, 
    bookingId: string, 
    status: ClassBooking['status'], 
    notice?: ClassBooking['absenceNotice'], 
    allowsRepl?: boolean, 
    notes?: string
  ) => void;
  onDeleteClassBooking: (clientId: string, bookingId: string) => void;
  onSelectClient?: (clientId: string) => void;
}

export const TrainerScheduleView: React.FC<TrainerScheduleViewProps> = ({
  clients,
  onSaveClassBooking,
  onUpdateBookingStatus,
  onDeleteClassBooking,
  onSelectClient
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD
  const [activeViewMode, setActiveViewMode] = useState<'agenda' | 'alunos_resumo'>('agenda');

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedBookingForAbsence, setSelectedBookingForAbsence] = useState<ClassBooking | null>(null);

  // Form State for Booking
  const [formClientId, setFormClientId] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState<string>('08:00');
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formWorkoutName, setFormWorkoutName] = useState<string>('');
  const [formIsMakeup, setFormIsMakeup] = useState<boolean>(false);
  const [formReplacedBookingId, setFormReplacedBookingId] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Form State for Absence
  const [absenceNotice, setAbsenceNotice] = useState<ClassBooking['absenceNotice']>('antecipada_24h');
  const [allowsReplacement, setAllowsReplacement] = useState<boolean>(true);
  const [absenceNotes, setAbsenceNotes] = useState<string>('');

  // Calculate aggregated bookings across all clients
  const allBookings = useMemo(() => getAllTrainerClassBookings(clients), [clients]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return allBookings.filter(b => {
      if (selectedClientId !== 'todos' && b.clientId !== selectedClientId) return false;
      if (filterStatus !== 'todos' && b.status !== filterStatus) return false;
      if (filterDate && b.date !== filterDate) return false;
      return true;
    });
  }, [allBookings, selectedClientId, filterStatus, filterDate]);

  // Aggregated Stats
  const globalStats = useMemo(() => {
    let total = 0;
    let realizadas = 0;
    let faltas = 0;
    let reposicoesPendentes = 0;

    clients.forEach(client => {
      const stats = calculateStudentClassStats(client);
      total += stats.totalClasses;
      realizadas += stats.completedClasses;
      faltas += stats.absencesCount;
      reposicoesPendentes += stats.replacementCreditsAvailable;
    });

    return { total, realizadas, faltas, reposicoesPendentes };
  }, [clients]);

  // Open schedule modal (preset for specific client if provided)
  const handleOpenScheduleModal = (clientIdPreset?: string, isMakeupPreset?: boolean, replacedIdPreset?: string) => {
    const targetClient = clientIdPreset || (clients.length > 0 ? clients[0].id : '');
    setFormClientId(targetClient);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormTime('08:00');
    setFormDuration(60);
    setFormWorkoutName('Aula de Personal / Treino Presencial');
    setFormIsMakeup(!!isMakeupPreset);
    setFormReplacedBookingId(replacedIdPreset || '');
    setFormNotes('');
    setIsScheduleModalOpen(true);
  };

  const handleSaveBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) return;

    onSaveClassBooking(formClientId, {
      date: formDate,
      time: formTime,
      durationMin: Number(formDuration),
      workoutName: formWorkoutName,
      isMakeupClass: formIsMakeup,
      replacedBookingId: formReplacedBookingId || undefined,
      notes: formNotes,
      status: formIsMakeup ? 'reposicao_agendada' : 'agendada'
    });

    setIsScheduleModalOpen(false);
  };

  // Open Absence Modal
  const handleOpenAbsenceModal = (booking: ClassBooking) => {
    setSelectedBookingForAbsence(booking);
    setAbsenceNotice('antecipada_24h');
    setAllowsReplacement(true);
    setAbsenceNotes('');
    setIsAbsenceModalOpen(true);
  };

  const handleAbsenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForAbsence) return;

    onUpdateBookingStatus(
      selectedBookingForAbsence.clientId,
      selectedBookingForAbsence.id,
      'falta',
      absenceNotice,
      allowsReplacement,
      absenceNotes
    );

    setIsAbsenceModalOpen(false);
    setSelectedBookingForAbsence(null);
  };

  // Student stats list for summary view
  const studentStatsList = useMemo(() => {
    return clients.map(client => {
      const stats = calculateStudentClassStats(client);
      return { client, stats };
    });
  }, [clients]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header Banner */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Agenda & Gestão de Aulas
            </span>
          </div>
          <h2 className="font-display text-2xl font-extrabold text-[#f1f5f9] mt-1">
            Agenda do Treinador
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Marque aulas, registre presença, gerencie faltas e verifique elegibilidade de reposições em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#080b11] p-1 rounded-xl border border-[#1e293b] text-xs font-bold">
            <button
              onClick={() => setActiveViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === 'agenda'
                  ? 'bg-[#00f0ff] text-[#080b11] font-black shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agenda de Aulas</span>
            </button>
            <button
              onClick={() => setActiveViewMode('alunos_resumo')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeViewMode === 'alunos_resumo'
                  ? 'bg-[#00f0ff] text-[#080b11] font-black shadow-md'
                  : 'text-[#94a3b8] hover:text-[#f1f5f9]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Métricas de Faltas por Aluno</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenScheduleModal()}
            className="flex items-center gap-1.5 font-bold text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agendar Aula</span>
          </Button>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#94a3b8] font-bold">Total de Aulas</div>
            <div className="text-2xl font-black font-mono text-[#f1f5f9] mt-0.5">{globalStats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#94a3b8] font-bold">Presenças Confirmadas</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">{globalStats.realizadas}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#94a3b8] font-bold">Faltas Registradas</div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">{globalStats.faltas}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#94a3b8] font-bold">Reposições Pendentes</div>
            <div className="text-2xl font-black font-mono text-[#00f0ff] mt-0.5">{globalStats.reposicoesPendentes}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 flex items-center justify-center">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* MODE 1: AGENDA DE AULAS */}
      {activeViewMode === 'agenda' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#00f0ff]" />
                <select
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                  className="bg-[#080b11] border border-[#1e293b] text-xs font-bold text-[#f1f5f9] p-2 rounded-xl focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="todos">Todos os Alunos ({clients.length})</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#94a3b8]" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-[#080b11] border border-[#1e293b] text-xs font-bold text-[#f1f5f9] p-2 rounded-xl focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="agendada">📅 Agendadas</option>
                  <option value="realizada">✅ Realizadas (Presença)</option>
                  <option value="falta">❌ Faltas</option>
                  <option value="reposicao_agendada">🔄 Reposições Agendadas</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#94a3b8]" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="bg-[#080b11] border border-[#1e293b] text-xs font-bold text-[#f1f5f9] p-2 rounded-xl focus:outline-none focus:border-[#00f0ff]"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-[10px] text-[#00f0ff] hover:underline"
                  >
                    Limpar Data
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs font-mono text-[#94a3b8]">
              Exibindo <span className="font-bold text-[#00f0ff]">{filteredBookings.length}</span> aula(s)
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBookings.map((b) => {
                const statusBadgeMap = {
                  agendada: <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Agendada</span>,
                  realizada: <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Presença Realizada</span>,
                  falta: b.allowsReplacement 
                    ? <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Falta (Permite Reposição)</span>
                    : <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Falta (Sem Reposição)</span>,
                  reposicao_agendada: <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Aula de Reposição</span>,
                  cancelada: <span className="bg-gray-500/10 text-gray-400 border border-gray-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Cancelada</span>
                };

                return (
                  <div 
                    key={b.id} 
                    className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3 relative hover:border-[#00f0ff]/30 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-[#1e293b] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-base text-[#f1f5f9]">
                            {b.clientName || 'Aluno'}
                          </h3>
                          {b.isMakeupClass && (
                            <span className="bg-purple-500/20 text-purple-300 text-[9px] font-black px-2 py-0.5 rounded uppercase border border-purple-500/40">
                              Reposição
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#00f0ff] font-medium mt-0.5">{b.workoutName || 'Aula de Personal'}</p>
                      </div>
                      <div>
                        {statusBadgeMap[b.status]}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-[#94a3b8] font-mono gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[#f1f5f9]">
                          <Calendar className="w-3.5 h-3.5 text-[#00f0ff]" />
                          {new Date(b.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1 text-[#f1f5f9]">
                          <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
                          {b.time} ({b.durationMin || 60} min)
                        </span>
                      </div>

                      {onSelectClient && (
                        <button
                          onClick={() => onSelectClient(b.clientId)}
                          className="text-[#00f0ff] hover:underline text-[11px] font-bold flex items-center gap-1"
                        >
                          Ver Aluno <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {b.notes && (
                      <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#94a3b8] italic">
                        "{b.notes}"
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-between border-t border-[#1e293b] gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {b.status !== 'realizada' && (
                          <button
                            onClick={() => onUpdateBookingStatus(b.clientId, b.id, 'realizada')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Presença
                          </button>
                        )}

                        {b.status !== 'falta' && (
                          <button
                            onClick={() => handleOpenAbsenceModal(b)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Marcar Falta
                          </button>
                        )}

                        {b.status === 'falta' && b.allowsReplacement && !b.replacementUsed && (
                          <button
                            onClick={() => handleOpenScheduleModal(b.clientId, true, b.id)}
                            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors animate-pulse"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Agendar Reposição
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteClassBooking(b.clientId, b.id)}
                        className="text-[#64748b] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Remover aula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-[#64748b] mx-auto" />
              <h3 className="font-display font-bold text-base text-[#f1f5f9]">Nenhuma aula encontrada</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                Não existem aulas marcadas com os filtros selecionados. Clique no botão de agendar para adicionar aulas para seus alunos.
              </p>
              <Button size="sm" variant="primary" onClick={() => handleOpenScheduleModal()}>
                + Agendar Primeira Aula
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: RÉSUMÉ DE FALTAS E ALUNOS */}
      {activeViewMode === 'alunos_resumo' && (
        <div className="space-y-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-1">
            <h3 className="font-display font-bold text-base text-[#f1f5f9]">
              Painel Geral de Frequência, Faltas & Direitos de Reposição
            </h3>
            <p className="text-xs text-[#94a3b8]">
              Acompanhe quantas aulas cada aluno participou, faltou e se a falta gera crédito para reposição conforme antecedência de aviso.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentStatsList.map(({ client, stats }) => {
              const isConsultoria = client.tipo === 'Consultoria Online' || client.tipo === 'Consultoria';

              return (
                <div 
                  key={client.id}
                  className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 hover:border-[#00f0ff]/30 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                    <div>
                      <h4 className="font-display font-extrabold text-base text-[#f1f5f9]">{client.name}</h4>
                      <span className="text-xs text-[#94a3b8] font-semibold">{client.tipo || 'Presencial'} · {client.goal}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-[#00f0ff]">{stats.frequencyPercentage}%</span>
                      <div className="text-[10px] text-[#64748b] font-bold">Taxa de Frequência</div>
                    </div>
                  </div>

                  {isConsultoria ? (
                    <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#94a3b8]">Treinos Realizados:</span>
                        <span className="font-bold text-[#00f0ff] font-mono">{client.rpeLog?.length || 0} treinos</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#94a3b8]">Frequência Prescrita:</span>
                        <span className="font-bold text-[#f1f5f9] font-mono">{client.days}x por semana</span>
                      </div>
                      <p className="text-[11px] text-[#64748b] pt-1 italic">
                        📱 Aluno de Consultoria Online: Não utiliza marcação de aulas ou faltas. Assiduidade acompanhada pelo histórico do app.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
                          <div className="text-lg font-bold font-mono text-emerald-400">{stats.completedClasses}</div>
                          <div className="text-[10px] text-[#94a3b8]">Aulas Realizadas</div>
                        </div>
                        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
                          <div className="text-lg font-bold font-mono text-rose-400">{stats.absencesCount}</div>
                          <div className="text-[10px] text-[#94a3b8]">Total de Faltas</div>
                        </div>
                        <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5">
                          <div className="text-lg font-bold font-mono text-[#00f0ff]">{stats.replacementCreditsAvailable}</div>
                          <div className="text-[10px] text-[#94a3b8]">Saldo de Reposição</div>
                        </div>
                      </div>

                      <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 text-xs space-y-2">
                        <div className="flex justify-between text-[#94a3b8]">
                          <span>Faltas com direito a reposição:</span>
                          <span className="font-bold text-[#f1f5f9]">{stats.replacementEligibleAbsences}</span>
                        </div>
                        <div className="flex justify-between text-[#94a3b8]">
                          <span>Reposições agendadas/feitas:</span>
                          <span className="font-bold text-[#f1f5f9]">{stats.replacementClassesDoneOrScheduled}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {stats.replacementCreditsAvailable > 0 ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenScheduleModal(client.id, true)}
                            className="w-full text-xs font-bold py-2 flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Agendar Reposição para {client.name.split(' ')[0]} ({stats.replacementCreditsAvailable} crédito)</span>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenScheduleModal(client.id, false)}
                            className="w-full text-xs font-bold py-2"
                          >
                            + Marcar Nova Aula
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: AGENDAR AULA */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={formIsMakeup ? "🔄 Agendar Aula de Reposição" : "📅 Agendar Nova Aula"}
      >
        <form onSubmit={handleSaveBookingSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Selecione o Aluno</label>
            <select
              value={formClientId}
              onChange={e => setFormClientId(e.target.value)}
              className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              required
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.tipo || 'Presencial'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Data da Aula</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Horário</label>
              <input
                type="time"
                value={formTime}
                onChange={e => setFormTime(e.target.value)}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Duração (minutos)</label>
              <input
                type="number"
                value={formDuration}
                onChange={e => setFormDuration(Number(e.target.value))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Nome/Foco da Aula</label>
              <input
                type="text"
                value={formWorkoutName}
                onChange={e => setFormWorkoutName(e.target.value)}
                placeholder="Ex.: Treino A — Inferiores"
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
          </div>

          <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-[#f1f5f9] cursor-pointer">
              <input
                type="checkbox"
                checked={formIsMakeup}
                onChange={e => setFormIsMakeup(e.target.checked)}
                className="rounded accent-[#00f0ff]"
              />
              <span>Esta aula é uma REPOSIÇÃO de falta anterior?</span>
            </label>

            {formIsMakeup && (
              <p className="text-[11px] text-purple-300">
                A reposição será contabilizada no saldo do aluno e vinculada ao histórico de faltas elegíveis.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Observações (Opcional)</label>
            <textarea
              value={formNotes}
              onChange={e => setFormNotes(e.target.value)}
              placeholder="Notas adicionais sobre o agendamento..."
              className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Agendamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: MARCAR FALTA */}
      <Modal
        isOpen={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        title="❌ Registrar Falta do Aluno"
      >
        <form onSubmit={handleAbsenceSubmit} className="space-y-4">
          <div className="bg-[#080b11] border border-[#1e293b] p-3 rounded-xl space-y-1">
            <div className="text-xs font-bold text-[#f1f5f9]">{selectedBookingForAbsence?.clientName}</div>
            <div className="text-xs text-[#94a3b8]">
              Aula em {selectedBookingForAbsence?.date} às {selectedBookingForAbsence?.time}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Motivo do Cancelamento / Falta</label>
            <select
              value={absenceNotice}
              onChange={e => {
                const val = e.target.value as ClassBooking['absenceNotice'];
                setAbsenceNotice(val);
                // Auto rule logic
                if (val === 'antecipada_24h' || val === 'atestado' || val === 'justificada') {
                  setAllowsReplacement(true);
                } else {
                  setAllowsReplacement(false);
                }
              }}
              className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="antecipada_24h">⏱️ Aviso com antecedência (+24h)</option>
              <option value="atestado">🩺 Atestado Médico / Emergência de Saúde</option>
              <option value="justificada">📝 Falta Justificada pelo Aluno</option>
              <option value="sem_aviso">🚫 Ausência sem aviso prévio (Em cima da hora)</option>
            </select>
          </div>

          <div className="bg-[#080b11] border border-[#1e293b] p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#f1f5f9]">Dá direito a Reposição?</span>
              <button
                type="button"
                onClick={() => setAllowsReplacement(!allowsReplacement)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                  allowsReplacement
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {allowsReplacement ? 'Sim (Elegível)' : 'Não (Sem direito)'}
              </button>
            </div>
            <p className="text-[11px] text-[#94a3b8] leading-relaxed">
              {allowsReplacement 
                ? '✅ O aluno receberá um crédito no saldo para reagendar esta aula em um novo horário.'
                : '❌ A falta foi marcada sem direito a reposição devido ao não cumprimento do aviso prévio contratual.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#f1f5f9] mb-1">Observações Internas</label>
            <textarea
              value={absenceNotes}
              onChange={e => setAbsenceNotes(e.target.value)}
              placeholder="Detalhes ou justificativa fornecida pelo aluno..."
              className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
            <Button type="button" variant="ghost" onClick={() => setIsAbsenceModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger">
              Confirmar Falta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

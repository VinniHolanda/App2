import React, { useState, useMemo } from 'react';
import { Client, Session } from '../../../domain/types';
import { Button, Badge } from '../ui/Primitives';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  GripVertical, Plus, Trash2, Clock, Activity, Dumbbell, 
  Move, CheckCircle2, AlertCircle, Info, Sparkles
} from 'lucide-react';

export interface MonthlyWorkoutCalendarProps {
  client: Client;
  onAddSession: (clientId: string, sessionData: Partial<Session>) => void;
  onMoveSession?: (clientId: string, sessionId: string, newDate: string) => void;
  onDeleteSession?: (clientId: string, sessionId: string) => void;
}

export const MonthlyWorkoutCalendar: React.FC<MonthlyWorkoutCalendarProps> = ({
  client,
  onAddSession,
  onMoveSession,
  onDeleteSession
}) => {
  // Calendar Month State (Defaults to current month)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null);

  // Quick Add Modal Form State
  const [selectedDayName, setSelectedDayName] = useState<string>('');
  const [sessionMin, setSessionMin] = useState<number>(60);
  const [sessionSrpe, setSessionSrpe] = useState<number>(7);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper formatting for Month / Year header in Portuguese
  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Generate calendar days for current month view grid (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: Array<{
      dateStr: string; // YYYY-MM-DD
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, pDay);
      const dateStr = prevDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cDate = new Date(year, month, d);
      // Format as YYYY-MM-DD cleanly using local timezone
      const yearStr = cDate.getFullYear();
      const monthStr = String(cDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(cDate.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (42 - days.length) % 7 === 0 && days.length >= 35 ? 0 : 42 - days.length;
    for (let n = 1; n <= remainingCells; n++) {
      const nDate = new Date(year, month + 1, n);
      const yearStr = nDate.getFullYear();
      const monthStr = String(nDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(nDate.getDate()).padStart(2, '0');
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

      days.push({
        dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    return days;
  }, [year, month]);

  // Map sessions by date (YYYY-MM-DD)
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    if (client.rpeLog && client.rpeLog.length > 0) {
      client.rpeLog.forEach(s => {
        if (!s.date) return;
        const formattedDate = s.date.slice(0, 10);
        if (!map[formattedDate]) map[formattedDate] = [];
        map[formattedDate].push(s);
      });
    }
    return map;
  }, [client.rpeLog]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Drag & Drop Handlers
  const handleDragStartPrescribed = (e: React.DragEvent, dayName: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'NEW_PRESCRIBED_DAY',
      dayName
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragStartExistingSession = (e: React.DragEvent, session: Session) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'MOVE_SESSION',
      sessionId: session.id,
      dayName: session.dayName,
      oldDate: session.date
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);

    const dataRaw = e.dataTransfer.getData('text/plain');
    if (!dataRaw) return;

    try {
      const payload = JSON.parse(dataRaw);
      if (payload.type === 'NEW_PRESCRIBED_DAY') {
        onAddSession(client.id, {
          date: targetDateStr,
          dayName: payload.dayName,
          min: 60,
          srpe: 7,
          by: 'treinador'
        });
      } else if (payload.type === 'MOVE_SESSION' && payload.sessionId) {
        if (onMoveSession) {
          onMoveSession(client.id, payload.sessionId, targetDateStr);
        } else {
          // Fallback if onMoveSession not provided: recreate on new date
          onAddSession(client.id, {
            id: payload.sessionId,
            date: targetDateStr,
            dayName: payload.dayName || 'Treino',
            min: 60,
            srpe: 7,
            by: 'treinador'
          });
        }
      }
    } catch (err) {
      console.error('Error handling drop on calendar:', err);
    }
  };

  // Program days available for drag-and-drop
  const programDays = client.program?.days || [
    { name: 'Treino A', focus: 'Membros Superiores' },
    { name: 'Treino B', focus: 'Membros Inferiores' },
    { name: 'Treino C', focus: 'Core & Cardio' }
  ];

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl">
      {/* CALENDAR HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="font-display font-extrabold text-lg text-[#f1f5f9] capitalize">
              Organização de Treinos — {monthName}
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Arraste os blocos de treino prescritos para os dias desejados ou mova sessões existentes entre as datas.
          </p>
        </div>

        {/* Month Nav Buttons */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-[#080b11] border border-[#1e293b] hover:border-[#00f0ff] text-xs font-bold text-[#f1f5f9] transition-all"
          >
            Hoje
          </button>

          <div className="flex items-center bg-[#080b11] border border-[#1e293b] rounded-xl p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-[#00f0ff] transition-all"
              title="Mês Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold font-mono text-[#00f0ff] capitalize min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#1e293b] rounded-lg text-[#94a3b8] hover:text-[#00f0ff] transition-all"
              title="Próximo Mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DRAGGABLE PRESCRIBED WORKOUTS TRAY */}
      <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#f1f5f9] flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#00f0ff]" />
            Treinos Prescritos para Agendar (Arraste para o Calendário):
          </span>
          <span className="text-[10px] text-[#00f0ff] font-mono bg-[#00f0ff]/10 px-2 py-0.5 rounded-full border border-[#00f0ff]/20">
            💡 Drag & Drop Ativo
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {programDays.map((day, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStartPrescribed(e, day.name)}
              className="bg-[#0f172a] hover:bg-[#1e293b] border border-[#00f0ff]/40 hover:border-[#00f0ff] rounded-xl px-3 py-2 text-xs font-bold text-[#f1f5f9] flex items-center gap-2 cursor-grab active:cursor-grabbing shadow-md transition-all hover:scale-[1.03] group"
            >
              <GripVertical className="w-3.5 h-3.5 text-[#00f0ff] group-hover:scale-110 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[#00f0ff] font-extrabold">{day.name}</span>
                {day.focus && <span className="text-[10px] text-[#94a3b8] font-normal truncate max-w-[120px]">{day.focus}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MONTHLY CALENDAR GRID */}
      <div className="space-y-2">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#64748b] uppercase tracking-wider py-1 border-b border-[#1e293b]">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Calendar Days Matrix */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell) => {
            const daySessions = sessionsByDate[cell.dateStr] || [];
            const isTarget = dragOverDate === cell.dateStr;

            return (
              <div
                key={cell.dateStr}
                onDragOver={(e) => handleDragOver(e, cell.dateStr)}
                onDragLeave={(e) => handleDragLeave(e, cell.dateStr)}
                onDrop={(e) => handleDrop(e, cell.dateStr)}
                onClick={() => {
                  setQuickAddDate(cell.dateStr);
                  setSelectedDayName(programDays[0]?.name || 'Treino A');
                }}
                className={`min-h-[105px] sm:min-h-[120px] rounded-xl p-1.5 flex flex-col justify-between border transition-all relative group cursor-pointer ${
                  cell.isCurrentMonth ? 'bg-[#080b11]' : 'bg-[#05070a]/50 opacity-40'
                } ${
                  cell.isToday
                    ? 'border-[#00f0ff] shadow-lg shadow-[#00f0ff]/10 ring-1 ring-[#00f0ff]'
                    : 'border-[#1e293b]'
                } ${
                  isTarget
                    ? 'bg-[#00f0ff]/15 border-2 border-dashed border-[#00f0ff] scale-[1.02] z-20 shadow-xl'
                    : 'hover:border-[#00f0ff]/40'
                }`}
              >
                {/* Cell Day Header */}
                <div className="flex items-center justify-between border-b border-[#1e293b]/40 pb-1 mb-1">
                  <span
                    className={`text-xs font-mono font-bold ${
                      cell.isToday
                        ? 'bg-[#00f0ff] text-[#080b11] w-5 h-5 rounded-full flex items-center justify-center font-black'
                        : cell.isCurrentMonth
                        ? 'text-[#f1f5f9]'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {cell.isToday && (
                    <span className="text-[9px] font-black text-[#00f0ff] tracking-wider uppercase hidden sm:inline">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Scheduled Sessions List in Cell */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[85px] pr-0.5">
                  {daySessions.map((sess) => (
                    <div
                      key={sess.id}
                      draggable
                      onDragStart={(e) => handleDragStartExistingSession(e, sess)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSession(sess);
                      }}
                      className="bg-[#0f172a] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#00f0ff] rounded-lg p-1.5 text-[11px] cursor-grab active:cursor-grabbing shadow-sm transition-all group/card relative"
                      title="Clique para ver detalhes ou arraste para outro dia"
                    >
                      <div className="flex items-center justify-between font-bold text-[#f1f5f9]">
                        <span className="text-[#00f0ff] truncate max-w-[80px]">
                          {sess.dayName}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono text-[#94a3b8] bg-[#080b11] px-1 rounded border border-[#1e293b]">
                            sRPE {sess.srpe}
                          </span>
                          {onDeleteSession && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(client.id, sess.id);
                              }}
                              className="text-[#64748b] hover:text-red-400 opacity-0 group-hover/card:opacity-100 transition-opacity"
                              title="Remover sessão"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[#94a3b8] mt-0.5 font-mono">
                        <span>{sess.min} min</span>
                        {sess.tonnage > 0 && (
                          <span className="text-emerald-400 font-bold">
                            {sess.tonnage.toLocaleString('pt-BR')}kg
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state prompt on hover */}
                  {daySessions.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#00f0ff] font-bold text-center py-2">
                      + Clique ou solte treino aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK ADD MODAL */}
      {quickAddDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h4 className="font-display font-extrabold text-base text-[#f1f5f9] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#00f0ff]" />
                Agendar Treino para {new Date(quickAddDate + 'T12:00:00').toLocaleDateString('pt-BR')}
              </h4>
              <button
                onClick={() => setQuickAddDate(null)}
                className="text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#f1f5f9] font-bold mb-1">Selecione o Treino Prescrito:</label>
                <select
                  value={selectedDayName}
                  onChange={(e) => setSelectedDayName(e.target.value)}
                  className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
                >
                  {programDays.map((d, i) => (
                    <option key={i} value={d.name}>{d.name} — {d.focus || 'Prescrição'}</option>
                  ))}
                  <option value="Treino Especial">Treino Especial / Avulso</option>
                  <option value="Avaliação Física">Avaliação Física / Teste 1RM</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">Duração Estimada (min)</label>
                  <input
                    type="number"
                    value={sessionMin}
                    onChange={(e) => setSessionMin(Number(e.target.value))}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2 text-sm text-[#f1f5f9]"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] font-semibold mb-1">sRPE Alvo (0-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={sessionSrpe}
                    onChange={(e) => setSessionSrpe(Number(e.target.value))}
                    className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-2 text-sm text-[#f1f5f9]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
              <Button variant="ghost" size="sm" onClick={() => setQuickAddDate(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onAddSession(client.id, {
                    date: quickAddDate,
                    dayName: selectedDayName,
                    min: sessionMin,
                    srpe: sessionSrpe,
                    by: 'treinador'
                  });
                  setQuickAddDate(null);
                }}
              >
                + Agendar Treino
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION DETAILS MODAL */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div>
                <span className="text-[10px] text-[#00f0ff] font-mono font-bold uppercase tracking-wider">
                  Detalhes da Sessão
                </span>
                <h4 className="font-display font-extrabold text-lg text-[#f1f5f9]">
                  {selectedSession.dayName}
                </h4>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-[#94a3b8] hover:text-[#f1f5f9] text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#f1f5f9]">
              <div className="grid grid-cols-2 gap-2 bg-[#080b11] p-3 rounded-xl border border-[#1e293b]">
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Data</span>
                  <span className="font-mono font-bold text-[#00f0ff]">
                    {new Date(selectedSession.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Duração</span>
                  <span className="font-mono font-bold">{selectedSession.min} minutos</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Percepção sRPE</span>
                  <span className="font-mono font-bold text-amber-400">{selectedSession.srpe} / 10</span>
                </div>
                <div>
                  <span className="text-[#64748b] block text-[10px] uppercase font-bold">Tonelagem</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {selectedSession.tonnage ? `${selectedSession.tonnage.toLocaleString('pt-BR')} kg` : 'Sem cargas'}
                  </span>
                </div>
              </div>

              {selectedSession.notes && (
                <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-bold text-[#00f0ff] uppercase">Feedback do Aluno</span>
                  <p className="italic text-[#94a3b8]">"{selectedSession.notes}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1e293b]">
              {onDeleteSession && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onDeleteSession(client.id, selectedSession.id);
                    setSelectedSession(null);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Sessão
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

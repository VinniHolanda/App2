import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, ClientAgendaSlot, Session } from '../../../domain/types';
import { clientRepository } from '../../../data/repositories/ClientRepository';
import { 
  Calendar, Clock, CheckCircle2, Play, Move, Zap, Dumbbell, 
  ChevronRight, Sparkles, AlertCircle, Plus, Trash2, ArrowRightLeft, Moon
} from 'lucide-react';

export interface WeeklySchedulerWidgetProps {
  client: Client;
  onSelectWorkoutDay?: (dayIndex: number) => void;
  onStartWorkoutDay?: (dayIndex: number) => void;
  onClientUpdate?: (updatedClient: Client) => void;
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Segunda', short: 'Seg', isWeekend: false },
  { id: 2, name: 'Terça', short: 'Ter', isWeekend: false },
  { id: 3, name: 'Quarta', short: 'Qua', isWeekend: false },
  { id: 4, name: 'Quinta', short: 'Qui', isWeekend: false },
  { id: 5, name: 'Sexta', short: 'Sex', isWeekend: false },
  { id: 6, name: 'Sábado', short: 'Sáb', isWeekend: true },
  { id: 0, name: 'Domingo', short: 'Dom', isWeekend: true }
];

export const WeeklySchedulerWidget: React.FC<WeeklySchedulerWidgetProps> = ({
  client,
  onSelectWorkoutDay,
  onStartWorkoutDay,
  onClientUpdate
}) => {
  const [draggedWorkoutIndex, setDraggedWorkoutIndex] = useState<number | null>(null);
  const [dragOverDayId, setDragOverDayId] = useState<number | null>(null);
  const [editingSlotTime, setEditingSlotTime] = useState<{ dayId: number; time: string } | null>(null);
  const [movingModalWorkoutIndex, setMovingModalWorkoutIndex] = useState<number | null>(null);

  const todayDayId = new Date().getDay(); // 0-6

  const programDays = useMemo(() => {
    return client.program?.days || [];
  }, [client.program]);

  // Map agenda slots to a dictionary by dayId
  // agenda format: array of ClientAgendaSlot
  const currentAgendaMap = useMemo(() => {
    const map: Record<number, ClientAgendaSlot[]> = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    if (client.agenda && client.agenda.length > 0) {
      client.agenda.forEach(slot => {
        if (map[slot.dia] !== undefined) {
          map[slot.dia].push(slot);
        }
      });
    } else {
      // Default initial schedule if no agenda is defined yet
      programDays.forEach((pDay, idx) => {
        const defaultDays = [1, 2, 4, 5, 3, 6, 0]; // Seg, Ter, Qui, Sex, Qua, Sáb, Dom
        const targetDay = defaultDays[idx % defaultDays.length];
        map[targetDay].push({
          dia: targetDay,
          hora: '07:30',
          workoutDayIndex: idx,
          workoutName: pDay.name
        });
      });
    }

    return map;
  }, [client.agenda, programDays]);

  // Check completion status from client.rpeLog
  const getCompletionForDay = (dayId: number, workoutName?: string): Session | null => {
    if (!client.rpeLog || client.rpeLog.length === 0) return null;

    // Find sessions in current week
    return client.rpeLog.find(s => {
      if (workoutName && s.dayName) {
        return s.dayName.toLowerCase().includes(workoutName.toLowerCase()) || workoutName.toLowerCase().includes(s.dayName.toLowerCase());
      }
      return false;
    }) || null;
  };

  // Update client agenda in Firestore & state
  const saveUpdatedAgenda = async (newAgenda: ClientAgendaSlot[]) => {
    const updatedClient: Client = {
      ...client,
      agenda: newAgenda
    };

    try {
      await clientRepository.saveClient(updatedClient);
      if (onClientUpdate) {
        onClientUpdate(updatedClient);
      }
    } catch (err) {
      console.error("Error saving updated agenda:", err);
    }
  };

  // Handle Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, workoutDayIndex: number) => {
    e.dataTransfer.setData('text/plain', String(workoutDayIndex));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedWorkoutIndex(workoutDayIndex);
  };

  const handleDragOver = (e: React.DragEvent, dayId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDayId !== dayId) {
      setDragOverDayId(dayId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, dayId: number) => {
    e.preventDefault();
    if (dragOverDayId === dayId) {
      setDragOverDayId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDayId: number) => {
    e.preventDefault();
    setDragOverDayId(null);

    const workoutIdxStr = e.dataTransfer.getData('text/plain');
    const workoutDayIdx = workoutIdxStr ? parseInt(workoutIdxStr, 10) : draggedWorkoutIndex;

    if (workoutDayIdx === null || isNaN(workoutDayIdx)) return;

    await moveWorkoutToDay(workoutDayIdx, targetDayId);
    setDraggedWorkoutIndex(null);
  };

  const moveWorkoutToDay = async (workoutDayIdx: number, targetDayId: number, customTime: string = '07:30') => {
    const pDay = programDays[workoutDayIdx];
    if (!pDay) return;

    // Build new agenda list removing previous instance of this workout and adding to targetDay
    const existingAgenda = client.agenda ? [...client.agenda] : [];
    
    // Remove existing slot for this workout if present
    const filteredAgenda = existingAgenda.filter(slot => slot.workoutDayIndex !== workoutDayIdx && slot.workoutName !== pDay.name);

    // Add new slot
    filteredAgenda.push({
      dia: targetDayId,
      hora: customTime,
      workoutDayIndex: workoutDayIdx,
      workoutName: pDay.name
    });

    await saveUpdatedAgenda(filteredAgenda);
  };

  const removeWorkoutFromDay = async (workoutDayIdx: number) => {
    if (!client.agenda) return;
    const filteredAgenda = client.agenda.filter(slot => slot.workoutDayIndex !== workoutDayIdx);
    await saveUpdatedAgenda(filteredAgenda);
  };

  const updateSlotTime = async (dayId: number, newTime: string) => {
    if (!client.agenda) return;
    const updated = client.agenda.map(slot => {
      if (slot.dia === dayId) {
        return { ...slot, hora: newTime };
      }
      return slot;
    });
    await saveUpdatedAgenda(updated);
    setEditingSlotTime(null);
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-5 md:p-6 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f0ff]/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Title & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-[#1e293b] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendário Semanal & Agendador</span>
          </div>
          <h3 className="font-display font-black text-xl text-[#f1f5f9]">
            Planejamento Semanal de Treinos (Scheduler)
          </h3>
          <p className="text-xs text-[#a3a3b0] mt-0.5 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Arraste e solte os treinos para organizar os dias da semana conforme sua rotina.</span>
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] bg-[#0f172a] border border-[#1e293b] px-3 py-2 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-[#a3a3b0]">Concluído</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff]"></span>
            <span className="text-[#a3a3b0]">Agendado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span>
            <span className="text-[#a3a3b0]">Descanso</span>
          </div>
        </div>
      </div>

      {/* WEEKLY GRID (7 COLUMNS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative z-10">
        {DAYS_OF_WEEK.map((day) => {
          const slots = currentAgendaMap[day.id] || [];
          const isToday = day.id === todayDayId;
          const isTargeting = dragOverDayId === day.id;

          return (
            <div
              key={day.id}
              onDragOver={(e) => handleDragOver(e, day.id)}
              onDragLeave={(e) => handleDragLeave(e, day.id)}
              onDrop={(e) => handleDrop(e, day.id)}
              className={`rounded-2xl p-3 border transition-all min-h-[220px] flex flex-col justify-between ${
                isTargeting
                  ? 'bg-[#00f0ff]/15 border-[#00f0ff] scale-[1.02] shadow-xl shadow-[#00f0ff]/20'
                  : isToday
                  ? 'bg-[#181a14] border-[#00f0ff]/50 shadow-md shadow-[#00f0ff]/10'
                  : 'bg-[#0f172a] border-[#1e293b]'
              }`}
            >
              {/* Day Header */}
              <div className="border-b border-[#1e293b] pb-2 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-[#f1f5f9] flex items-center gap-1">
                    <span>{day.name}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 bg-[#00f0ff] text-[#080b11] text-[9px] font-black rounded uppercase">
                        Hoje
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748b] font-medium">{day.short}</span>
                </div>
                
                {slots.length > 0 && (
                  <span className="text-[10px] text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded font-mono font-bold">
                    {slots[0].hora || '07:30'}
                  </span>
                )}
              </div>

              {/* Slot Body */}
              <div className="py-2 flex-1 space-y-2">
                {slots.length > 0 ? (
                  slots.map((slot, sIdx) => {
                    const workoutDayIdx = slot.workoutDayIndex ?? 0;
                    const pDay = programDays[workoutDayIdx];
                    const workoutTitle = slot.workoutName || pDay?.name || `Treino ${workoutDayIdx + 1}`;
                    const completedSession = getCompletionForDay(day.id, workoutTitle);

                    return (
                      <motion.div
                        key={sIdx}
                        draggable
                        onDragStart={(e) => handleDragStart(e as any, workoutDayIdx)}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl border text-xs relative group cursor-grab active:cursor-grabbing transition-all ${
                          completedSession
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : isToday
                            ? 'bg-[#1c2211] border-[#00f0ff] text-[#f1f5f9] shadow-lg shadow-[#00f0ff]/10'
                            : 'bg-[#1a1a20] border-[#2a2a35] text-[#f1f5f9] hover:border-[#00f0ff]/50'
                        }`}
                      >
                        {/* Drag Handle Indicator */}
                        <div className="flex items-center justify-between mb-1 text-[10px] text-[#94a3b8]">
                          <span className="flex items-center gap-1 font-mono text-[#00f0ff] font-bold">
                            <Move className="w-3 h-3 text-[#00f0ff]" />
                            {slot.hora || '07:30'}
                          </span>
                          {completedSession ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" /> Concluído
                            </span>
                          ) : (
                            <button
                              onClick={() => removeWorkoutFromDay(workoutDayIdx)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                              title="Remover treino deste dia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Workout Name */}
                        <div className="font-display font-bold text-xs text-[#f1f5f9] line-clamp-2">
                          {workoutTitle}
                        </div>

                        {pDay?.focus && (
                          <div className="text-[10px] text-[#94a3b8] mt-1 line-clamp-1">
                            {pDay.focus}
                          </div>
                        )}

                        {/* Action Buttons inside slot */}
                        <div className="mt-2.5 pt-2 border-t border-[#1e293b]/60 flex items-center justify-between gap-1">
                          {completedSession ? (
                            <div className="text-[10px] text-emerald-400 font-mono">
                              {completedSession.tonnage > 0 ? `${(completedSession.tonnage/1000).toFixed(1)}k kg` : '✓ Registrado'}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (onStartWorkoutDay) onStartWorkoutDay(workoutDayIdx);
                                else if (onSelectWorkoutDay) onSelectWorkoutDay(workoutDayIdx);
                              }}
                              className="w-full bg-[#00f0ff] hover:bg-[#0284c7] text-[#080b11] font-black text-[10px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                              <Play className="w-3 h-3 fill-[#080b11]" />
                              <span>{isToday ? 'Iniciar Agora' : 'Treinar'}</span>
                            </button>
                          )}

                          {/* Quick Mobile Move Trigger */}
                          <button
                            onClick={() => setMovingModalWorkoutIndex(workoutDayIdx)}
                            className="bg-[#0f172a] border border-[#1e293b] hover:border-[#00f0ff] p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9]"
                            title="Mover para outro dia"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full min-h-[110px] rounded-xl border border-dashed border-[#1e293b] p-2 flex flex-col items-center justify-center text-center text-[#64748b] space-y-1">
                    <Moon className="w-4 h-4 opacity-40" />
                    <span className="text-[10px] font-medium">Dia de Descanso</span>
                    <span className="text-[9px] text-[#4a4a55]">Arraste um treino aqui</span>
                  </div>
                )}
              </div>

              {/* Day Footer */}
              <div className="pt-2 border-t border-[#1e293b] text-[10px] text-[#64748b] flex justify-between items-center">
                <span>{slots.length > 0 ? `${slots.length} treino` : 'Livre'}</span>
                {isToday && <Zap className="w-3 h-3 text-[#00f0ff] animate-pulse" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* UNASSIGNED WORKOUTS PALETTE (FOR EASY DRAGGING) */}
      {programDays.length > 0 && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-display font-bold text-xs text-[#f1f5f9] flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-[#00f0ff]" />
              Treinos do Programa Prescrito (Arraste para o dia desejado):
            </h4>
            <span className="text-[10px] text-[#64748b]">Total: {programDays.length} treinos</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {programDays.map((pDay, pIdx) => {
              const assignedSlot = client.agenda?.find(a => a.workoutDayIndex === pIdx || a.workoutName === pDay.name);
              const assignedDayObj = assignedSlot ? DAYS_OF_WEEK.find(d => d.id === assignedSlot.dia) : null;

              return (
                <div
                  key={pIdx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, pIdx)}
                  className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 cursor-grab active:cursor-grabbing transition-all ${
                    assignedDayObj
                      ? 'bg-[#18181f] border-[#1e293b] text-[#94a3b8]'
                      : 'bg-[#1a1d13] border-[#00f0ff] text-[#00f0ff] shadow-md'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span className="font-bold text-[#f1f5f9]">{pDay.name}</span>
                  {assignedDayObj ? (
                    <span className="text-[10px] font-bold bg-[#1e293b] text-[#00f0ff] px-2 py-0.5 rounded">
                      {assignedDayObj.short}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-[#00f0ff] text-[#080b11] px-2 py-0.5 rounded">
                      Não agendado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MOVE MODAL FOR MOBILE / TOUCH USERS */}
      <AnimatePresence>
        {movingModalWorkoutIndex !== null && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <h4 className="font-bold text-sm text-[#f1f5f9] flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#00f0ff]" />
                  Reagendar Treino
                </h4>
                <button
                  onClick={() => setMovingModalWorkoutIndex(null)}
                  className="text-xs text-[#94a3b8] hover:text-[#f1f5f9]"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#a3a3b0]">
                Selecione o dia da semana para mover <strong className="text-[#f1f5f9]">{programDays[movingModalWorkoutIndex]?.name}</strong>:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.id}
                    onClick={async () => {
                      await moveWorkoutToDay(movingModalWorkoutIndex, d.id);
                      setMovingModalWorkoutIndex(null);
                    }}
                    className="p-2.5 rounded-xl border border-[#1e293b] bg-[#0f172a] hover:border-[#00f0ff] hover:text-[#00f0ff] text-xs font-bold text-[#f1f5f9] transition-colors text-left flex items-center justify-between"
                  >
                    <span>{d.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

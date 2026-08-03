import React, { useMemo } from 'react';
import { Client } from '../../../domain/types';
import { Badge } from '../ui/Primitives';
import { AlertTriangle, ClipboardX, Activity, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export type KanbanStatus = 'sem_treino' | 'consultoria' | 'sem_registro' | 'ativo';

export function getClientKanbanStatus(client: Client): KanbanStatus {
  if (!client.program) {
    return 'sem_treino';
  }

  if (client.tipo === 'Consultoria online') {
    return 'consultoria';
  }

  const logs = client.rpeLog || [];
  if (logs.length === 0) {
    return 'sem_registro';
  }

  let latestDate = 0;
  for (const log of logs) {
    if (log.date) {
      const t = new Date(log.date).getTime();
      if (!isNaN(t) && t > latestDate) {
        latestDate = t;
      }
    }
  }

  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  if (latestDate < fourteenDaysAgo) {
    return 'sem_registro';
  }

  return 'ativo';
}

interface TrainerKanbanViewProps {
  clients: Client[];
  onSelectClient: (id: string) => void;
  onUpdateClient?: (client: Partial<Client>) => void;
}

export const TrainerKanbanView: React.FC<TrainerKanbanViewProps> = ({ clients, onSelectClient, onUpdateClient }) => {
  const columns = useMemo(() => {
    const cols: Record<KanbanStatus, Client[]> = {
      sem_treino: [],
      consultoria: [],
      sem_registro: [],
      ativo: []
    };

    clients.forEach(c => {
      const status = getClientKanbanStatus(c);
      cols[status].push(c);
    });

    return cols;
  }, [clients]);

  const columnConfig = [
    {
      id: 'sem_treino' as KanbanStatus,
      title: 'Sem Treino',
      icon: <ClipboardX className="w-4 h-4" />,
      color: 'border-rose-500/50 text-rose-400 bg-rose-500/10'
    },
    {
      id: 'consultoria' as KanbanStatus,
      title: 'Consultoria',
      icon: <Video className="w-4 h-4" />,
      color: 'border-purple-500/50 text-purple-400 bg-purple-500/10'
    },
    {
      id: 'sem_registro' as KanbanStatus,
      title: 'Sem Registro (>14d)',
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'border-amber-500/50 text-amber-400 bg-amber-500/10'
    },
    {
      id: 'ativo' as KanbanStatus,
      title: 'Ativos',
      icon: <Activity className="w-4 h-4" />,
      color: 'border-[#00f0ff]/50 text-[#00f0ff] bg-[#00f0ff]/10'
    }
  ];

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceCol = result.source.droppableId as KanbanStatus;
    const destCol = result.destination.droppableId as KanbanStatus;
    const clientId = result.draggableId;

    if (sourceCol === destCol) return;

    if (!onUpdateClient) return;

    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    let updates: Partial<any> = { ...client };

    if (destCol === 'consultoria') {
      updates.tipo = 'Consultoria online';
      onUpdateClient(updates);
    } else if (destCol === 'sem_treino') {
      if (window.confirm("Isso vai remover o programa de treino ativo deste aluno. Confirma?")) {
        updates.program = null;
        onUpdateClient(updates);
      }
    } else if (destCol === 'ativo' || destCol === 'sem_registro') {
      // Apenas informativas, sem side-effect de escrita
      return;
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columnConfig.map(col => (
          <Droppable key={col.id} droppableId={col.id}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`bg-[#080b11] border rounded-2xl flex flex-col overflow-hidden h-[600px] transition-colors ${
                  snapshot.isDraggingOver ? 'border-[#00f0ff] bg-[#00f0ff]/5' : 'border-[#1e293b]'
                }`}
              >
                <div className="p-4 border-b border-[#1e293b] bg-[#0f172a]/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${col.color}`}>
                      {col.icon}
                    </div>
                    <h3 className="font-display font-extrabold text-sm text-[#f1f5f9] tracking-tight">{col.title}</h3>
                  </div>
                  <Badge variant="neutral">{columns[col.id].length}</Badge>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {columns[col.id].map((client, index) => {
                    const initials = client.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
                    const goalShort = client.goal.split('(')[0].trim();
                    
                    return (
                      // @ts-expect-error - hello-pangea/dnd types don't include key in React 19
                      <Draggable key={client.id} draggableId={client.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={provided.draggableProps.style}
                            onClick={() => onSelectClient(client.id)}
                          >
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`bg-[#0f172a] border p-3 rounded-xl cursor-pointer transition-colors group ${
                                snapshot.isDragging ? 'border-[#00f0ff] shadow-lg shadow-[#00f0ff]/20' : 'border-[#1e293b] hover:border-[#00f0ff]/50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1e293b] to-[#334155] border border-[#334155] flex items-center justify-center font-display font-bold text-xs text-[#f1f5f9] shrink-0">
                                  {initials}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="font-bold text-xs text-[#f1f5f9] truncate group-hover:text-[#00f0ff] transition-colors">
                                    {client.name}
                                  </div>
                                  <div className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                                    {goalShort}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  
                  {provided.placeholder}
                  
                  {columns[col.id].length === 0 && (
                    <div className="h-full flex items-center justify-center pointer-events-none">
                      <span className="text-[11px] font-medium text-[#64748b] bg-[#0f172a] px-3 py-1.5 rounded-full">
                        Solte cartões aqui
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Program, Session, ClassBooking } from '../../domain/types';
import { ClientTab } from '../viewmodels/useTrainerViewModel';
import { Button, Badge, Modal } from '../components/ui/Primitives';
import { VolumeBarChart } from '../components/trainer/TrainerComponents';
import { BiomechanicsGauge } from '../components/trainer/BiomechanicsGauge';
import { StudentPerformanceOverview } from '../components/trainer/StudentPerformanceOverview';
import { OvertrainingTelemetryWidget } from '../components/trainer/OvertrainingTelemetryWidget';
import { PeriodizationProgressChart } from '../components/trainer/PeriodizationProgressChart';
import { MonthlyWorkoutCalendar } from '../components/trainer/MonthlyWorkoutCalendar';
import { AttendanceD3Chart } from '../components/trainer/AttendanceD3Chart';
import { TrainerNotesWidget } from '../components/trainer/TrainerNotesWidget';
import { TrainingMethodBadge } from '../components/ui/TrainingMethodBadge';
import { TrainingMethodsGuideModal } from '../components/trainer/TrainingMethodsGuideModal';
import { DynamicRPECalculatorWidget } from '../components/trainer/DynamicRPECalculatorWidget';
import { FatigueAnalysisReadinessWidget } from '../components/trainer/FatigueAnalysisReadinessWidget';
import { LoadProgressionProjectionWidget } from '../components/trainer/LoadProgressionProjectionWidget';
import { ComparativeLoadProgressionChart } from '../components/trainer/ComparativeLoadProgressionChart';
import { AISubstitutionAssistantModal } from '../components/trainer/AISubstitutionAssistantModal';
import { BodyCompositionIntegrationWidget } from '../components/trainer/BodyCompositionIntegrationWidget';
import { StudentInviteModal } from '../components/trainer/StudentInviteModal';
import { ProgramExercise } from '../../domain/types';
import { calculateWeekStats, calculatePersonalRecords } from '../../domain/calculators/loadCalculators';
import { calculateStudentClassStats } from '../../domain/calculators/classStatsCalculator';
import { MOVEMENT_PATTERN_LABELS } from '../../data/exerciseCatalog';
import { Maximize2, Minimize2, Target, Sparkles, Activity, X, Calendar, List, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Clock, Plus, Trash2, Check, Share2 } from 'lucide-react';

export interface ClientDetailViewProps {
  client: Client;
  activeTab: ClientTab;
  onSelectTab: (tab: ClientTab) => void;
  onGenerateProgram: (clientId: string, promptNotes: string) => void;
  onApplyAutoMeso: (clientId: string, totalWeeks: number) => void;
  onDeleteClient: (id: string) => void;
  onSendMessage: (clientId: string, text: string) => void;
  onAddSession: (clientId: string, sessionData: Partial<Session>) => void;
  onMoveSession?: (clientId: string, sessionId: string, newDate: string) => void;
  onDeleteSession?: (clientId: string, sessionId: string) => void;
  onSaveClassBooking?: (clientId: string, booking: Partial<ClassBooking>) => void;
  onUpdateBookingStatus?: (
    clientId: string, 
    bookingId: string, 
    status: ClassBooking['status'], 
    notice?: ClassBooking['absenceNotice'], 
    allowsRepl?: boolean, 
    notes?: string
  ) => void;
  onDeleteClassBooking?: (clientId: string, bookingId: string) => void;
  onSaveClient?: (clientData: Partial<Client>) => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  activeTab,
  onSelectTab,
  onGenerateProgram,
  onApplyAutoMeso,
  onDeleteClient,
  onSendMessage,
  onAddSession,
  onMoveSession,
  onDeleteSession,
  onSaveClassBooking,
  onUpdateBookingStatus,
  onDeleteClassBooking,
  onSaveClient
}) => {
  const [promptNotes, setPromptNotes] = useState('');
  const [mesoWeeksInput, setMesoWeeksInput] = useState(4);
  const [showMesoModal, setShowMesoModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMethodsGuide, setShowMethodsGuide] = useState(false);
  const [trainerMsg, setTrainerMsg] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [treinoSubTab, setTreinoSubTab] = useState<'lista' | 'calendario'>('lista');

  // AI Exercise Substitution Assistant Modal State
  const [aiSubModal, setAiSubModal] = useState<{
    isOpen: boolean;
    dayIndex: number;
    exerciseIndex: number;
    exercise: ProgramExercise | null;
  }>({ isOpen: false, dayIndex: 0, exerciseIndex: 0, exercise: null });

  const handleApplyAISubstitution = async (dayIndex: number, exerciseIndex: number, updatedEx: ProgramExercise) => {
    if (!client.program) return;
    const updatedClient: Client = JSON.parse(JSON.stringify(client));
    if (updatedClient.program?.days[dayIndex]?.exercises[exerciseIndex]) {
      updatedClient.program.days[dayIndex].exercises[exerciseIndex] = updatedEx;
      if (onSaveClient) {
        onSaveClient(updatedClient);
      }
    }
  };

  // Quick Session Log State
  const [manualDate, setManualDate] = useState(new Date().toISOString().slice(0, 10));
  const [manualMin, setManualMin] = useState(60);
  const [manualSrpe, setManualSrpe] = useState(7);

  const initials = client.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const prs = calculatePersonalRecords(client.rpeLog || []);
  const weekStats = calculateWeekStats(client.rpeLog || []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  const handleManualAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSession(client.id, {
      date: manualDate,
      min: manualMin,
      srpe: manualSrpe,
      dayName: client.program?.days?.[0]?.name || 'Treino A',
      by: 'treinador'
    });
  };

  if (isFocusMode) {
    return (
      <div className="space-y-5 animate-fade-in bg-[#080b11] min-h-screen p-4 sm:p-6 rounded-2xl border border-[#1e293b]">
        {/* Focus Mode Top Bar */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] flex items-center justify-center">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#00f0ff] text-[#080b11] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Modo Focus 🎯
                </span>
                <h2 className="font-display text-lg font-extrabold text-[#f1f5f9]">
                  {client.name}
                </h2>
              </div>
              <div className="text-xs text-[#94a3b8] flex items-center gap-2 mt-0.5">
                <span>{client.goal}</span>
                <span>•</span>
                <span>{client.level}</span>
                <span>•</span>
                <span>{client.days}x/semana</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMesoModal(true)}
              className="border-[#1e293b] text-[#f1f5f9] hover:bg-[#1e293b] text-xs font-bold"
            >
              Planejar Mesociclo
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFocusMode(false)}
              className="bg-amber-500 hover:bg-amber-400 text-[#080b11] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Sair do Focus (ESC)</span>
            </Button>
          </div>
        </div>

        {/* Main Expanded Periodization Chart */}
        <PeriodizationProgressChart 
          client={client} 
          isFocusMode={true} 
          onToggleFocusMode={() => setIsFocusMode(false)} 
        />

        {/* Side-by-side Focus Contextual Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quick 1RM Est PRs */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#00f0ff] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Recordes Pessoais (1RM Est.)
              </h3>
              <span className="text-[10px] text-[#64748b]">Fórmula de Epley</span>
            </div>

            {Object.keys(prs).length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {Object.entries(prs).map(([name, pr]) => (
                  <div key={name} className="bg-[#080b11] border border-[#1e293b]/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#f1f5f9] truncate max-w-[160px]">{name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#94a3b8] font-mono">{pr.bestReps}×{pr.bestKg}kg</span>
                      <span className="font-mono font-bold text-[#00f0ff]">{pr.est1RM.toFixed(1)} kg</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#64748b] py-3 text-center">Sem recordes registrados ainda.</p>
            )}
          </div>

          {/* Overtraining / Safety Alert */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-[#f1f5f9] flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Monitoramento de Segurança & Carga
            </h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              No Modo Focus, as variações de sRPE são ampliadas para facilitar a identificação visual de picos de carga. Mantenha a variação semanal equilibrada para evitar sobredoses de volume.
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-[#1e293b] text-xs font-mono">
              <span className="text-[#64748b]">Sessões Registradas:</span>
              <span className="font-bold text-[#00f0ff]">{client.rpeLog?.length || 0} sessões</span>
            </div>
          </div>
        </div>

        {/* Periodization Modal */}
        {showMesoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-md space-y-4">
              <h3 className="font-display font-bold text-lg text-[#f1f5f9]">Planejar Mesociclo</h3>
              <p className="text-xs text-[#94a3b8]">Escolha a duração em semanas para recalcular as fases de volume e RPE.</p>

              <div>
                <label className="block text-xs font-bold text-[#f1f5f9] mb-2">Duração: {mesoWeeksInput} Semanas</label>
                <input
                  type="range"
                  min="4"
                  max="16"
                  value={mesoWeeksInput}
                  onChange={e => setMesoWeeksInput(Number(e.target.value))}
                  className="w-full accent-[#00f0ff]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
                <Button variant="ghost" onClick={() => setShowMesoModal(false)}>Cancelar</Button>
                <Button variant="primary" onClick={() => {
                  onApplyAutoMeso(client.id, mesoWeeksInput);
                  setShowMesoModal(false);
                }}>
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Client Header */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1e293b] text-[#00f0ff] flex items-center justify-center font-display font-extrabold text-xl border border-[#1e293b]">
            {initials}
          </div>
          <div>
            <h2 className="font-display text-2xl font-extrabold text-[#f1f5f9]">{client.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="accent">{client.goal}</Badge>
              <Badge variant="neutral">{client.level}</Badge>
              <Badge variant="neutral">{client.days}x/sem · {client.dur}</Badge>
              <Badge variant="neutral">{client.eq}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-[#00f0ff] to-[#3b82f6] text-[#080b11] font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#00f0ff]/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Gerar Convite 📲</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFocusMode(true)}
            className="border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10 text-xs font-bold flex items-center gap-1.5"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Modo Focus 🎯</span>
          </Button>

          <Button variant="danger" size="sm" onClick={() => onDeleteClient(client.id)}>
            Excluir Aluno
          </Button>
        </div>
      </div>

      {/* Visual Biomechanics Proficiency Gauge */}
      <BiomechanicsGauge client={client} />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto">
        {(['treino', 'bioimpedancia', 'aulas', 'perfil', 'carga', 'progresso', 'msgs'] as ClientTab[]).map(tab => {
          const labels: Record<string, string> = {
            treino: '🏋️ Treino & Prescrição',
            bioimpedancia: '📊 Composição Corporal (Bioimpedância)',
            aulas: '📅 Aulas, Faltas & Reposição',
            perfil: '👤 Perfil & Anamnese',
            carga: '⚡ Carga Interna (sRPE)',
            progresso: '📈 Progresso & Recordes',
            msgs: '💬 Mensagens'
          };

          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#00f0ff] text-[#080b11]'
                  : 'bg-[#0f172a] text-[#94a3b8] border border-[#1e293b] hover:text-[#f1f5f9]'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* TAB: TREINO */}
        {activeTab === 'treino' && (
          <motion.div
            key="treino"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* View Sub-Toggle (Lista vs Calendario) */}
            <div className="flex items-center justify-between bg-[#0f172a] border border-[#1e293b] p-2 rounded-xl">
              <span className="text-xs font-bold text-[#94a3b8] pl-2 flex items-center gap-2">
                <span>Modo de Exibição da Prescrição:</span>
              </span>
              <div className="flex items-center gap-1.5 bg-[#080b11] p-1 rounded-lg border border-[#1e293b]">
                <button
                  onClick={() => setTreinoSubTab('lista')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    treinoSubTab === 'lista'
                      ? 'bg-[#00f0ff] text-[#080b11]'
                      : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Ficha de Treinos</span>
                </button>
                <button
                  onClick={() => setTreinoSubTab('calendario')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    treinoSubTab === 'calendario'
                      ? 'bg-[#00f0ff] text-[#080b11]'
                      : 'text-[#94a3b8] hover:text-[#f1f5f9]'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Calendário Mensal (Drag & Drop)</span>
                </button>
              </div>
            </div>

            {treinoSubTab === 'calendario' ? (
              <MonthlyWorkoutCalendar
                client={client}
                onAddSession={onAddSession}
                onMoveSession={onMoveSession}
                onDeleteSession={onDeleteSession}
              />
            ) : (
              <>
                {/* Fatigue Analysis & Readiness Score Module */}
                <FatigueAnalysisReadinessWidget 
                  client={client}
                  onApplyVolumeAdjust={(adjPct, reason) => {
                    setPromptNotes(prev => `${prev ? prev + ' | ' : ''}Ajuste de volume biológico (${adjPct > 0 ? '+' : ''}${adjPct}% devido a ${reason})`);
                  }}
                />

                {/* AI / Engine Prescription Box */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
                      ⚡ Motor de Prescrição Científica
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowMethodsGuide(true)} className="border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10">
                        ⚡ Guia de Métodos (28)
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setShowMesoModal(true)}>
                        📅 Planejar Mesociclo
                      </Button>
                    </div>
                  </div>

                  <textarea
                    value={promptNotes}
                    onChange={e => setPromptNotes(e.target.value)}
                    placeholder="Ênfases personalizadas ou observações (ex.: 'mais foco em glúteos e ombros', 'evitar impacto')..."
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] min-h-[70px]"
                  />

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => onGenerateProgram(client.id, promptNotes)}
                    >
                      {client.program ? '⚡ Regerar Novo Programa' : '✨ Gerar Treino Automático'}
                    </Button>
                  </div>
                </div>

                {/* Dynamic RPE Calculator & Intensity Simulation Card */}
                <DynamicRPECalculatorWidget client={client} />

                {/* Load Progression & 1RM Projection Calculator (Graphical) */}
                <LoadProgressionProjectionWidget client={client} />

                {/* Comparative Load Progression Chart (Projetado vs. Realizado with 1-Click Auto-Adjustment) */}
                <ComparativeLoadProgressionChart 
                  client={client} 
                  onUpdateClient={(up) => onSaveClient && onSaveClient(up)} 
                />
              </>
            )}

            {/* Volume Analytics */}
            {client.program && (
              <VolumeBarChart program={client.program} targets={client.program.targets} />
            )}

            {/* Performance Overview Bar Chart (Recharts) */}
            <StudentPerformanceOverview client={client} />

            {/* Program Days Display */}
            {client.program ? (
              <div className="space-y-4">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-2">
                  <h4 className="font-display font-bold text-sm text-[#00f0ff]">Racional da Prescrição</h4>
                  <p className="text-sm text-[#f1f5f9] leading-relaxed">{client.program.summary}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {client.program.principles?.map((p, idx) => (
                      <Badge key={idx} variant="accent">{p}</Badge>
                    ))}
                  </div>
                </div>

                {client.program.days.map((day, di) => (
                  <motion.div
                    key={di}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: di * 0.08, duration: 0.25 }}
                    className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3 hover:border-[#1e293b] transition-colors"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                      <div>
                        <h4 className="font-bold text-base text-[#f1f5f9]">{day.name}</h4>
                        <div className="text-xs text-[#64748b] font-medium">{day.focus}</div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="border-b border-[#1e293b] text-[#64748b] uppercase tracking-wider">
                            <th className="py-2 px-2">Exercício</th>
                            <th className="py-2 px-2">Padrão</th>
                            <th className="py-2 px-2 text-center">Séries</th>
                            <th className="py-2 px-2 text-center">Reps</th>
                            <th className="py-2 px-2 text-center">Descanso</th>
                            <th className="py-2 px-2 text-center">RPE</th>
                            <th className="py-2 px-2 text-center">Método</th>
                            <th className="py-2 px-2 text-right">IA Substituição</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises.map((ex, ei) => (
                            <tr key={ei} className="border-b border-[#1e293b]/50 hover:bg-[#0f172a] transition-colors">
                              <td className="py-2.5 px-2 font-bold text-[#f1f5f9]">
                                {ex.name}
                                {ex.notes && (
                                  <div className="text-[10px] font-normal text-emerald-400 mt-0.5">{ex.notes}</div>
                                )}
                              </td>
                              <td className="py-2.5 px-2 text-[#94a3b8]">{MOVEMENT_PATTERN_LABELS[ex.pat as keyof typeof MOVEMENT_PATTERN_LABELS] || ex.pat}</td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00f0ff]">{ex.sets}</td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#f1f5f9]">{ex.reps}</td>
                              <td className="py-2.5 px-2 text-center text-[#94a3b8]">{ex.rest}</td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#94a3b8]">RPE {ex.rpe}</td>
                              <td className="py-2.5 px-2 text-center">
                                <TrainingMethodBadge 
                                  methodKeyOrName={ex.method || 'tradicional'} 
                                  clientLevel={client.level}
                                  periodizationPhase={client.program?.meso?.weeks?.[0]?.f || 'Base'}
                                  goal={client.goal}
                                />
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => setAiSubModal({ isOpen: true, dayIndex: di, exerciseIndex: ei, exercise: ex })}
                                  className="text-[10px] font-bold text-[#00f0ff] hover:bg-[#00f0ff]/10 border border-[#00f0ff]/30 px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer"
                                  title="IA Assistente de Substituição Biomecânica"
                                >
                                  <Sparkles className="w-3 h-3 text-[#00f0ff]" />
                                  <span>IA Substituir</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-dashed border-[#1e293b] rounded-2xl p-8 text-center text-[#64748b]">
                Nenhum treino gerado ainda. Clique em "Gerar Treino Automático" acima.
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: COMPOSIÇÃO CORPORAL & BIOIMPEDÂNCIA */}
        {activeTab === 'bioimpedancia' && (
          <motion.div
            key="bioimpedancia"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <BodyCompositionIntegrationWidget
              client={client}
              onUpdateClient={(up) => onSaveClient && onSaveClient(up)}
            />
          </motion.div>
        )}

        {/* TAB: AULAS, FALTAS & REPOSIÇÃO */}
        {activeTab === 'aulas' && (() => {
          const isConsultoria = client.tipo === 'Consultoria Online' || client.tipo === 'Consultoria';
          const stats = calculateStudentClassStats(client);
          const bookings = client.classBookings || [];

          if (isConsultoria) {
            return (
              <motion.div
                key="aulas-consultoria"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Consultoria Header */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
                  <div className="border-b border-[#1e293b] pb-3">
                    <h3 className="font-display font-extrabold text-lg text-[#f1f5f9] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#00f0ff]" />
                      <span>Frequência de Treinos — {client.name} (Consultoria Online)</span>
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Acompanhamento de assiduidade à distância. As presenças são computadas automaticamente no histórico a cada treino concluído ou check-in do aluno no app.
                    </p>
                  </div>

                  <div className="bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-[#00f0ff]">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-[#00f0ff]" />
                    <span>
                      <strong>Modalidade Consultoria Online:</strong> Este aluno não utiliza agendamento de aulas presenciais nem controle de faltas e reposições. O treinador acompanha a frequência diretamente pelo histórico de treinos e check-ins no aplicativo.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                    <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5">
                      <div className="text-2xl font-black font-mono text-[#00f0ff]">
                        {client.rpeLog?.length || 0}
                      </div>
                      <div className="text-[11px] text-[#94a3b8] font-bold mt-0.5">Treinos Concluídos</div>
                    </div>
                    <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5">
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        {stats.frequencyPercentage}%
                      </div>
                      <div className="text-[11px] text-[#94a3b8] font-bold mt-0.5">Taxa de Frequência</div>
                    </div>
                    <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 col-span-2 sm:col-span-1">
                      <div className="text-2xl font-black font-mono text-[#f1f5f9]">
                        {client.days}x / sem
                      </div>
                      <div className="text-[11px] text-[#94a3b8] font-bold mt-0.5">Meta Semanal Prescrita</div>
                    </div>
                  </div>
                </div>

                {/* Workout History Log as Presences */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                  <h4 className="font-display font-bold text-sm text-[#f1f5f9] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#00f0ff]" />
                    <span>Histórico de Presenças & Treinos Concluídos no App</span>
                  </h4>

                  {client.rpeLog && client.rpeLog.length > 0 ? (
                    <div className="space-y-2.5">
                      {client.rpeLog.map((s) => (
                        <div 
                          key={s.id}
                          className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-[#f1f5f9] flex items-center gap-2">
                              <span className="text-[#00f0ff]">{s.dayName || 'Treino Concluído'}</span>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Presença Confirmada
                              </span>
                            </div>
                            <div className="text-[#94a3b8] font-mono text-[11px] flex items-center gap-3">
                              <span>📅 {s.date}</span>
                              <span>•</span>
                              <span>⏱️ {s.min || 45} min</span>
                              <span>•</span>
                              <span>⚡ sRPE: {s.srpe || 7}/10</span>
                            </div>
                            {s.notes && <div className="text-[#94a3b8] italic text-[11px]">"{s.notes}"</div>}
                          </div>

                          <div className="text-right sm:text-right text-[#94a3b8] font-mono text-[11px]">
                            <div className="text-[#f1f5f9] font-bold">{s.tonnage?.toLocaleString('pt-BR') || 0} kg</div>
                            <div className="text-[10px] text-[#64748b]">Tonelagem da Sessão</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748b] text-center py-6">
                      Nenhum treino concluído ainda pelo aluno na consultoria online. As presenças aparecerão aqui automaticamente assim que ele finalizar o primeiro treino.
                    </p>
                  )}
                </div>

                {/* Monthly Workout Calendar */}
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
                  <h4 className="font-display font-bold text-sm text-[#f1f5f9]">
                    🗓️ Calendário Mensal e Planejamento de Sessoes
                  </h4>
                  <MonthlyWorkoutCalendar
                    client={client}
                    onAddSession={onAddSession}
                    onMoveSession={onMoveSession}
                    onDeleteSession={onDeleteSession}
                  />
                </div>
              </motion.div>
            );
          }

          return (
            <motion.div
              key="aulas-presencial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Student Attendance & Absence Metrics Banner */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-[#f1f5f9] flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#00f0ff]" />
                      <span>Resumo de Aulas, Faltas & Reposição — {client.name} (Presencial)</span>
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Controle do histórico de aulas agendadas, presenças, faltas justificadas e direitos de reposição contratual.
                    </p>
                  </div>

                  {onSaveClassBooking && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const date = new Date().toISOString().slice(0, 10);
                        onSaveClassBooking(client.id, {
                          date,
                          time: "08:00",
                          durationMin: 60,
                          status: "agendada",
                          workoutName: "Aula de Personal Presencial"
                        });
                      }}
                      className="text-xs font-bold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Marcar Aula</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3">
                    <div className="text-2xl font-black font-mono text-[#f1f5f9]">{stats.totalClasses}</div>
                    <div className="text-[11px] text-[#94a3b8] font-bold">Total de Aulas</div>
                  </div>
                  <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3">
                    <div className="text-2xl font-black font-mono text-emerald-400">{stats.completedClasses}</div>
                    <div className="text-[11px] text-[#94a3b8] font-bold">Presenças ({stats.frequencyPercentage}%)</div>
                  </div>
                  <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3">
                    <div className="text-2xl font-black font-mono text-rose-400">{stats.absencesCount}</div>
                    <div className="text-[11px] text-[#94a3b8] font-bold">Faltas Registradas</div>
                  </div>
                  <div className="bg-[#080b11] border border-[#1e293b] rounded-xl p-3">
                    <div className="text-2xl font-black font-mono text-[#00f0ff]">{stats.replacementCreditsAvailable}</div>
                    <div className="text-[11px] text-[#94a3b8] font-bold">Saldo p/ Reposição</div>
                  </div>
                </div>

                {stats.replacementCreditsAvailable > 0 && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-purple-200">
                      <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                      <span>
                        Este aluno possui <strong className="text-[#00f0ff] font-bold">{stats.replacementCreditsAvailable} falta(s) com direito a reposição</strong> contratual!
                      </span>
                    </div>

                    {onSaveClassBooking && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const date = new Date().toISOString().slice(0, 10);
                          onSaveClassBooking(client.id, {
                            date,
                            time: "10:00",
                            durationMin: 60,
                            status: "reposicao_agendada",
                            isMakeupClass: true,
                            workoutName: "Aula de Reposição de Treino"
                          });
                        }}
                        className="text-xs font-bold whitespace-nowrap"
                      >
                        🔄 Agendar Aula de Reposição
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* D3 Frequency Statistics Panel */}
              <AttendanceD3Chart client={client} onSaveClient={onSaveClient} />

              {/* Persistent Trainer Notes & Gemini AI Communication Widget */}
              <TrainerNotesWidget client={client} onSaveClient={onSaveClient} />

              {/* Bookings Table / Cards */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                <h4 className="font-display font-bold text-sm text-[#f1f5f9]">
                  📋 Histórico Detalhado de Aulas & Faltas
                </h4>

                {bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map((b) => (
                      <div 
                        key={b.id} 
                        className="bg-[#080b11] border border-[#1e293b] rounded-xl p-4 space-y-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-bold text-[#f1f5f9]">
                            <span className="text-[#00f0ff]">{b.workoutName || 'Aula de Personal'}</span>
                            {b.isMakeupClass && (
                              <span className="bg-purple-500/20 text-purple-300 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-500/30 uppercase">
                                Reposição
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[#94a3b8] font-mono text-[11px]">
                            <span>📅 {b.date} às {b.time}</span>
                            <span>•</span>
                            <span>⏱️ {b.durationMin || 60} min</span>
                          </div>

                          {b.notes && (
                            <div className="text-[#94a3b8] italic text-[11px]">
                              "{b.notes}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {b.status === 'realizada' && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Presença
                            </span>
                          )}

                          {b.status === 'agendada' && (
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Agendada
                            </span>
                          )}

                          {b.status === 'reposicao_agendada' && (
                            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5" /> Reposição
                            </span>
                          )}

                          {b.status === 'falta' && (
                            b.allowsReplacement ? (
                              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Falta (Gera Reposição)
                              </span>
                            ) : (
                              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Falta (Sem Reposição)
                              </span>
                            )
                          )}

                          {onUpdateBookingStatus && b.status !== 'realizada' && (
                            <button
                              onClick={() => onUpdateBookingStatus(client.id, b.id, 'realizada')}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors"
                            >
                              Confirmar Presença
                            </button>
                          )}

                          {onDeleteClassBooking && (
                            <button
                              onClick={() => onDeleteClassBooking(client.id, b.id)}
                              className="text-[#64748b] hover:text-rose-400 p-1"
                              title="Excluir aula"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748b] text-center py-4">
                    Nenhuma aula registrada ainda na agenda deste aluno.
                  </p>
                )}
              </div>

              {/* Drag & Drop Calendar */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
                <h4 className="font-display font-bold text-sm text-[#f1f5f9]">
                  🗓️ Calendário Mensal e Planejamento Drag & Drop
                </h4>
                <MonthlyWorkoutCalendar
                  client={client}
                  onAddSession={onAddSession}
                  onMoveSession={onMoveSession}
                  onDeleteSession={onDeleteSession}
                />
              </div>
            </motion.div>
          );
        })()}

        {/* TAB: PERFIL */}
        {activeTab === 'perfil' && (
          <motion.div
            key="perfil"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <h3 className="font-display font-bold text-base text-[#00f0ff]">Informações Pessoais</h3>
              <div className="text-sm space-y-2.5 text-[#f1f5f9]">
                <div><strong className="text-[#64748b]">Nome:</strong> {client.name}</div>
                <div><strong className="text-[#64748b]">E-mail:</strong> {client.email || '—'}</div>
                <div><strong className="text-[#64748b]">WhatsApp:</strong> {client.whats || '—'}</div>
                <div className="flex items-center gap-2 pt-1 border-t border-[#1e293b]">
                  <strong className="text-[#64748b]">Atendimento:</strong>
                  {onSaveClient ? (
                    <select
                      value={client.tipo || 'Presencial'}
                      onChange={(e) => onSaveClient({ ...client, tipo: e.target.value })}
                      className="bg-[#080b11] border border-[#1e293b] text-[#00f0ff] font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#00f0ff]"
                    >
                      <option value="Presencial">🏋️ Presencial (Personal / Studio)</option>
                      <option value="Consultoria Online">📱 Consultoria Online (A distância)</option>
                    </select>
                  ) : (
                    <span className="font-bold text-[#00f0ff]">{client.tipo || 'Presencial'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <h3 className="font-display font-bold text-base text-[#00f0ff]">Credenciais do Portal Aluno</h3>
              <div className="text-sm space-y-2 text-[#f1f5f9]">
                <div><strong className="text-[#64748b]">E-mail/Login:</strong> {client.portal?.email || client.email || '—'}</div>
                <div><strong className="text-[#64748b]">Senha de Acesso:</strong> <span className="font-mono text-[#00f0ff] font-bold px-2 py-0.5 rounded bg-[#0f172a] border border-[#1e293b]">{client.portal?.pass || '123456'}</span></div>
                <p className="text-xs text-[#94a3b8] pt-1">
                  Passe esta senha para o aluno acessar o app. Ele poderá logar no Portal Aluno e registrar o treino em tempo real.
                </p>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3 md:col-span-2">
              <h3 className="font-display font-bold text-base text-[#00f0ff]">Saúde & Anamnese</h3>
              <div className="text-sm space-y-2 text-[#f1f5f9]">
                <div><strong className="text-[#64748b]">Lesões/Limitações:</strong> {client.inj || 'Nenhuma'}</div>
                <div><strong className="text-[#64748b]">Medicamentos:</strong> {client.meds || 'Nenhum'}</div>
              </div>
            </div>

            <div className="md:col-span-2">
              <TrainerNotesWidget client={client} onSaveClient={onSaveClient} />
            </div>
          </motion.div>
        )}

        {/* TAB: CARGA INTERNA */}
        {activeTab === 'carga' && (
          <motion.div
            key="carga"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-[#f1f5f9]">Registrar Sessão no Histórico (sRPE Foster)</h3>
              <form onSubmit={handleManualAddSession} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Data</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-2 text-sm text-[#f1f5f9]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">Duração (min)</label>
                  <input
                    type="number"
                    value={manualMin}
                    onChange={e => setManualMin(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-2 text-sm text-[#f1f5f9]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94a3b8] mb-1">sRPE (0-10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="10"
                    value={manualSrpe}
                    onChange={e => setManualSrpe(Number(e.target.value))}
                    className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-2 text-sm text-[#f1f5f9]"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" variant="primary" className="w-full">
                    + Salvar
                  </Button>
                </div>
              </form>
            </div>

            {/* Stats Metrics */}
            {weekStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                  <div className="text-2xl font-bold font-mono text-[#00f0ff]">{weekStats.totalUA}</div>
                  <div className="text-xs text-[#64748b] font-semibold">Carga Total (UA)</div>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                  <div className="text-2xl font-bold font-mono text-[#f1f5f9]">{weekStats.meanSRPE.toFixed(1)}</div>
                  <div className="text-xs text-[#64748b] font-semibold">sRPE Média</div>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                  <div className="text-2xl font-bold font-mono text-[#f1f5f9]">{weekStats.monotony ?? '—'}</div>
                  <div className="text-xs text-[#64748b] font-semibold">Monotonia</div>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                  <div className="text-2xl font-bold font-mono text-[#f1f5f9]">{weekStats.strain ?? '—'}</div>
                  <div className="text-xs text-[#64748b] font-semibold">Strain (Tensão)</div>
                </div>
              </div>
            )}

            {/* Periodization Progress & sRPE Line Chart */}
            <PeriodizationProgressChart 
              client={client} 
              onToggleFocusMode={() => setIsFocusMode(true)} 
            />

            {/* Overtraining & ACWR Telemetry Recharts Widget */}
            <OvertrainingTelemetryWidget clients={[client]} selectedClientId={client.id} />

            {/* Sessions History List with Voice Feedback Badges */}
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
                📋 Histórico de Treinos & Feedback Pós-Treino
              </h3>

              {client.rpeLog && client.rpeLog.length > 0 ? (
                <div className="space-y-3">
                  {client.rpeLog.map((s, idx) => (
                    <div 
                      key={s.id || idx} 
                      className="bg-[#080b11] border border-[#1e293b] rounded-xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b] pb-2">
                        <div className="flex items-center gap-2 font-bold text-[#f1f5f9]">
                          <span className="text-[#00f0ff]">{s.dayName || 'Sessão de Treino'}</span>
                          <span className="text-[#64748b]">•</span>
                          <span className="text-[#94a3b8] font-mono">{s.date}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="bg-[#00f0ff]/10 text-[#00f0ff] px-2.5 py-0.5 rounded-lg border border-[#00f0ff]/20 font-bold">
                            sRPE {s.srpe}/10
                          </span>
                          <span className="bg-[#0f172a] text-[#94a3b8] px-2 py-0.5 rounded-lg border border-[#1e293b]">
                            {s.min} min
                          </span>
                          {s.tonnage > 0 && (
                            <span className="bg-[#0f172a] text-[#f1f5f9] px-2 py-0.5 rounded-lg border border-[#1e293b] font-bold">
                              {s.tonnage.toLocaleString('pt-BR')} kg
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Post Workout Notes / Voice Feedback */}
                      {s.notes && (
                        <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-2.5 text-[#f1f5f9] space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00f0ff]">
                            {s.audioTranscribed ? (
                              <span className="inline-flex items-center gap-1 bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded-full border border-[#00f0ff]/30">
                                🎙️ Nota gravada por Áudio (Web Speech API)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#94a3b8]">
                                📝 Nota Pós-Treino do Aluno
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#f1f5f9] italic leading-relaxed">"{s.notes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748b] py-2">
                  Nenhum treino registrado ainda para este aluno.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: PROGRESSO */}
        {activeTab === 'progresso' && (
          <motion.div
            key="progresso"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Recharts Performance Overview Bar Chart Component */}
            <StudentPerformanceOverview client={client} />

            {/* Body Composition & Bioimpedance Integration Widget */}
            <BodyCompositionIntegrationWidget
              client={client}
              onUpdateClient={(up) => onSaveClient && onSaveClient(up)}
            />

            {/* Periodization Progress & sRPE Line Chart */}
            <PeriodizationProgressChart 
              client={client} 
              onToggleFocusMode={() => setIsFocusMode(true)} 
            />

            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-[#00f0ff]">Recordes Pessoais (1RM Est. Epley)</h3>
              {Object.keys(prs).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1e293b] text-[#64748b] uppercase">
                        <th className="py-2 px-2">Exercício</th>
                        <th className="py-2 px-2">Melhor Série</th>
                        <th className="py-2 px-2 text-center">1RM Estimado</th>
                        <th className="py-2 px-2 text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(prs).map(([name, pr]) => (
                        <tr key={name} className="border-b border-[#1e293b]/50">
                          <td className="py-2.5 px-2 font-bold text-[#f1f5f9]">{name}</td>
                          <td className="py-2.5 px-2 font-mono text-[#94a3b8]">{pr.bestReps}×{pr.bestKg} kg</td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00f0ff]">
                            {pr.est1RM.toFixed(1)} kg
                          </td>
                          <td className="py-2.5 px-2 text-right text-[#64748b]">{pr.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#64748b]">O aluno ainda não registrou séries com cargas para calcular PRs.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: MENSAGENS */}
        {activeTab === 'msgs' && (
          <motion.div
            key="msgs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4"
          >
            <h3 className="font-display font-bold text-base text-[#f1f5f9]">Chat com Aluno</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 bg-[#0f172a] rounded-xl border border-[#1e293b]">
              {client.trainerChat && client.trainerChat.length > 0 ? (
                client.trainerChat.map(m => (
                  <div key={m.id} className={`p-3 rounded-xl text-xs max-w-[80%] ${
                    m.from === 'trainer' ? 'ml-auto bg-[#00f0ff] text-[#080b11]' : 'bg-[#0f172a] text-[#f1f5f9]'
                  }`}>
                    <p>{m.text}</p>
                    <div className="text-[10px] opacity-60 mt-1">{new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748b] text-center py-4">Nenhuma mensagem trocada ainda.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={trainerMsg}
                onChange={e => setTrainerMsg(e.target.value)}
                placeholder="Digite uma mensagem para o aluno..."
                className="flex-1 bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
              <Button
                variant="primary"
                onClick={() => {
                  onSendMessage(client.id, trainerMsg);
                  setTrainerMsg('');
                }}
              >
                Enviar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Periodization Modal */}
      {showMesoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-display font-bold text-lg text-[#f1f5f9]">Planejar Mesociclo</h3>
            <p className="text-xs text-[#94a3b8]">Escolha a duração em semanas para recalcular as fases de volume e RPE.</p>

            <div>
              <label className="block text-xs font-bold text-[#f1f5f9] mb-2">Duração: {mesoWeeksInput} Semanas</label>
              <input
                type="range"
                min="4"
                max="16"
                value={mesoWeeksInput}
                onChange={e => setMesoWeeksInput(Number(e.target.value))}
                className="w-full accent-[#00f0ff]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
              <Button variant="ghost" onClick={() => setShowMesoModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => {
                onApplyAutoMeso(client.id, mesoWeeksInput);
                setShowMesoModal(false);
              }}>
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Exercise Substitution Assistant Modal */}
      {aiSubModal.isOpen && aiSubModal.exercise && (
        <AISubstitutionAssistantModal
          client={client}
          exercise={aiSubModal.exercise}
          dayIndex={aiSubModal.dayIndex}
          exerciseIndex={aiSubModal.exerciseIndex}
          isOpen={aiSubModal.isOpen}
          onClose={() => setAiSubModal(prev => ({ ...prev, isOpen: false }))}
          onApplySubstitution={handleApplyAISubstitution}
        />
      )}

      {/* Training Methods Reference Guide Modal */}
      <TrainingMethodsGuideModal
        isOpen={showMethodsGuide}
        onClose={() => setShowMethodsGuide(false)}
        clientLevel={client.level}
        periodizationPhase={client.program?.meso?.weeks?.[0]?.f || 'Base'}
        goal={client.goal}
      />

      {/* Student Invite Modal */}
      <StudentInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        client={client}
      />
    </div>
  );
};

export type MovementPattern = 
  | 'push_h'
  | 'push_v'
  | 'shoulder_iso'
  | 'pull_v'
  | 'pull_h'
  | 'rear'
  | 'quad'
  | 'hinge'
  | 'arms_bi'
  | 'arms_tri'
  | 'core'
  | 'calf'
  | 'cond';

export type CardioMethodKey = 
  | 'tabata' 
  | 'hiit' 
  | 'fartlek' 
  | 'intervalado' 
  | 'tempo' 
  | 'continuo' 
  | 'billat' 
  | 'piramide';

export type TrainingGoal = 
  | 'Ganho de massa (hipertrofia)'
  | 'Perda de gordura'
  | 'Força'
  | 'Condicionamento / saúde'
  | 'Performance esportiva'
  | 'Reabilitação / volta ao treino';

export type ClientLevel = 'Iniciante' | 'Intermediário' | 'Avançado';

export type EquipmentProfile = 
  | 'Academia completa'
  | 'Halteres + banco'
  | 'Peso corporal'
  | 'Funcional / crossfit'
  | 'Casa com equipamento mínimo';

export interface ParqAnswers {
  [key: number]: 'sim' | 'nao';
}

export interface PrepSet {
  load: string;
  reps: string;
  note?: string;
}

export interface ProgramExercise {
  id?: string;
  name: string;
  pat: MovementPattern;
  sets: string;
  reps: string;
  rest: string;
  rpe: string;
  notes?: string;
  method?: string;
  bisetGroup?: number;
  unilateral?: boolean;
  prepSets?: PrepSet[];
}

export interface CardioSession {
  id: string;
  method: CardioMethodKey;
  params: Record<string, any>;
  notes?: string;
  done?: boolean;
}

export interface ProgramDay {
  name: string;
  focus: string;
  exercises: ProgramExercise[];
  cardioSessions?: CardioSession[];
}

export interface MesoWeek {
  f: string; // Phase name (e.g. Acumulação 1)
  rpe: string;
  vol: number; // Volume factor (1.0 = 100%, 0.5 = 50% deload)
  load: string;
  how: string;
}

export interface Mesociclo {
  model: string;
  weeks: MesoWeek[];
  conservative?: boolean;
  auto?: boolean;
  nWeeks?: number;
}

export interface Program {
  summary: string;
  principles: string[];
  days: ProgramDay[];
  progression: string;
  warnings?: string;
  references?: Array<{ title?: string; t?: string; url?: string }>;
  meso?: Mesociclo;
  targets?: Record<string, number>;
  weekOverrides?: Record<number, { vol: number; note: string; appliedAt: string; auto?: boolean }>;
  _methodProfile?: 'A' | 'B' | 'C';
}

export interface ProgramHistoryItem {
  program: Program;
  savedAt: string;
  label: string;
}

export interface SetLog {
  reps: number;
  kg: number;
}

export interface LoggedExercise {
  name: string;
  pat: MovementPattern;
  planned?: {
    sets: number;
    reps: number;
    rest?: string;
  };
  sets: SetLog[];
  tonnage: number;
  _type?: string;
  sleep?: number;
  soreness?: number;
  energy?: number;
  score?: number;
}

export interface Session {
  id: string;
  client_id?: string;
  date: string;
  week: number;
  dayName: string;
  min: number;
  srpe: number;
  tonnage: number;
  checkin?: boolean;
  nutrition?: number;
  hydration?: number;
  exercises: LoggedExercise[];
  cardioLog?: Array<{
    method: CardioMethodKey;
    params: Record<string, any>;
    notes?: string;
    done?: boolean;
  }>;
  notes?: string;
  audioTranscribed?: boolean;
  by: 'aluno' | 'treinador';
}

export interface WellnessData {
  sleep: number; // 1-5
  stress?: number; // 1-10 ou 1-5
  soreness: number; // 1-5
  energy: number; // 1-5
  score: number; // 0-100%
  hasJointPain?: boolean; // PAR-Q question 1: Dor articular ou muscular aguda
  hasDizzinessOrDyspnea?: boolean; // PAR-Q question 2: Tontura, falta de ar ou mal-estar
  recoveryScale?: number; // 1-10 (Escala Subjetiva de Recuperação)
  loadAdjustmentFactor?: number; // 0.85 (-15%), 1.0 (100%), 1.025 (+2.5%)
  autoRegulatedNote?: string;
}

export interface ChatMessage {
  id: string;
  from: 'student' | 'trainer';
  text: string;
  date: string;
}

export interface ClassBooking {
  id: string;
  clientId: string;
  clientName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMin?: number;
  status: 'agendada' | 'realizada' | 'falta' | 'reposicao_agendada' | 'cancelada';
  isMakeupClass?: boolean; // Se é uma aula de reposição
  absenceNotice?: 'antecipada_24h' | 'atestado' | 'justificada' | 'sem_aviso'; // Motivo da falta
  allowsReplacement?: boolean; // Se a falta dá direito a reposição
  replacementUsed?: boolean; // Se o crédito de reposição já foi utilizado
  replacedBookingId?: string; // ID da falta que está sendo reposta
  notes?: string;
  workoutName?: string;
}

export interface BioimpedanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weekNumber?: number; // Semana 1, 2, 3...
  weightKg: number;
  heightCm?: number;
  fatPercentage: number; // % gordura
  fatMassKg: number; // kg de gordura
  leanMassKg: number; // kg de massa magra/muscular
  visceralFatLevel?: number; // nível 1-20
  bmrKcal?: number; // TMB
  waterPercentage?: number; // % água corporal
  adherenceRatePct?: number; // % adesão aos treinos no período
  sourceFileName?: string;
  notes?: string;
  aiPrescriptionInsights?: string[];
}

export interface ClientAgendaSlot {
  dia: number; // 0-6 (0=Dom, 1=Seg...)
  hora?: string; // HH:mm
  workoutDayIndex?: number;
  workoutName?: string;
  completed?: boolean;
}

export interface Client {
  id: string;
  trainerId?: string;
  updatedAt?: any;
  name: string;
  email?: string;
  whats?: string;
  birth?: string;
  gender: string;
  tipo?: 'Presencial' | 'Consultoria online';
  height?: string;
  weight?: string;
  goal: TrainingGoal;
  level: ClientLevel;
  days: number | string;
  dur: string;
  eq: EquipmentProfile;
  experience?: string;
  parq: ParqAnswers;
  diseases: string[];
  meds?: string;
  surgery?: string;
  smoke?: string;
  sleep?: string;
  inj?: string;
  notes?: string;
  program?: Program | null;
  programHistory?: ProgramHistoryItem[];
  rpeLog?: Session[];
  bodyCompositionHistory?: BioimpedanceRecord[];
  wellnessData?: WellnessData;
  alerts?: LoadAlert[];
  trainerChat?: ChatMessage[];
  agenda?: ClientAgendaSlot[];
  classBookings?: ClassBooking[];
  targetMonthlyClasses?: number;
  reminderSchedule?: {
    enabled: boolean;
    days: number[];
    time: string;
  };
  portal?: {
    email: string;
    enabled: boolean;
    pass?: string;
    inviteCode?: string;
  };
}

export interface LoadAlert {
  id?: string;
  type?: string;
  date?: string;
  level: 'danger' | 'warn' | 'info';
  severity?: 'high' | 'medium' | 'low';
  week: number;
  icon?: string;
  title: string;
  msg: string;
  message?: string;
  ref?: string;
  adj?: {
    weekIdx: number;
    newVol: number;
    note: string;
  } | null;
}

export interface PersonalRecord {
  est1RM: number;
  bestReps: number;
  bestKg: number;
  date: string;
}

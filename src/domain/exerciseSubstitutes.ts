import { Client } from './types';
import { calculate1RMEpley } from './calculators/loadCalculators';

export interface ExerciseSubstitute {
  name: string;
  muscleGroup: string;
  equipment: string;
  benefitNote: string;
}

export interface WeekLoadPoint {
  label: string;
  date: string;
  maxKg: number;
  avgReps: number;
  isTarget?: boolean;
}

export interface ExerciseTrendData {
  points: WeekLoadPoint[];
  trendPct: number; // e.g. +7.1%
  lastWeekKg: number | null;
  targetTodayKg: number | null;
}

export interface PRCheckResult {
  isPR: boolean;
  previousPR: number; // 1RM kg
  newPR: number;      // 1RM kg
  diffKg: number;
}

export interface FatigueCheckResult {
  hasHighFatigue: boolean;
  dropPct: number;
  set1Reps: number;
  lastReps: number;
  suggestedRestSecs: number;
}

export interface AutoRegulateResult {
  needsAutoReduce: boolean;
  suggestedKg: number;
  originalKg: number;
  reductionPct: number;
}

const SUBSTITUTES_DATABASE: Record<string, ExerciseSubstitute[]> = {
  'Agachamento Hack': [
    { name: 'Leg Press 45º', muscleGroup: 'Quadríceps / Glúteo', equipment: 'Aparelho Leg Press', benefitNote: 'Mesmo padrão de extensão de joelho e quadril com apoio lombar protegido.' },
    { name: 'Agachamento Búlgaro c/ Halteres', muscleGroup: 'Quadríceps / Glúteo (Unilateral)', equipment: 'Halteres + Banco', benefitNote: 'Excelente estimulação hipertrófica unilateral e estabilidade do quadril.' },
    { name: 'Agachamento Goblet c/ Halter', muscleGroup: 'Quadríceps', equipment: 'Halter', benefitNote: 'Mantém o tronco ereto e o padrão de agachamento profundo sem máquina.' }
  ],
  'Leg Press 45º': [
    { name: 'Agachamento Hack', muscleGroup: 'Quadríceps / Glúteos', equipment: 'Máquina Hack', benefitNote: 'Preserva vetor de força oblíquo com grande tensão mecânica no quadríceps.' },
    { name: 'Agachamento Búlgaro c/ Halteres', muscleGroup: 'Quadríceps / Glúteo', equipment: 'Halteres + Banco', benefitNote: 'Grande ativação do vasto lateral e glúteo máximo.' },
    { name: 'Passada com Halteres (Avanço)', muscleGroup: 'Quadríceps / Isquiotibiais', equipment: 'Halteres', benefitNote: 'Treino dinâmico funcional mantendo alto recrutamento de fibras.' }
  ],
  'Supino Reto c/ Barra': [
    { name: 'Supino Reto c/ Halteres', muscleGroup: 'Peitoral Maior / Tríceps', equipment: 'Halteres + Banco Reto', benefitNote: 'Permite maior amplitude de movimento e convergência no topo.' },
    { name: 'Supino Máquina Articulada', muscleGroup: 'Peitoral Maior', equipment: 'Máquina Chest Press', benefitNote: 'Trajetória fixa ideal para chegar até a falha com total segurança.' },
    { name: 'Flexão de Braço c/ Anilha nas Costas', muscleGroup: 'Peitoral Maior / Core', equipment: 'Peso Corporal / Anilha', benefitNote: 'Excelente alternativa funcional de empurrar horizontal.' }
  ],
  'Supino Inclinado c/ Barra': [
    { name: 'Supino Inclinado c/ Halteres', muscleGroup: 'Peitoral Superior (Clavicular)', equipment: 'Halteres + Banco 30º', benefitNote: 'Foco isolado na porção clavicular com menor estresse no ombro.' },
    { name: 'Supino Inclinado na Máquina', muscleGroup: 'Peitoral Superior', equipment: 'Máquina Articulada', benefitNote: 'Tensão mecânica contínua na fase concêntrica.' }
  ],
  'Puxada Alta Frontal': [
    { name: 'Puxada Articulada (Máquina)', muscleGroup: 'Dorsal / Latíssimo', equipment: 'Máquina Puxada', benefitNote: 'Simula a tração vertical com trajetória anatômica independente.' },
    { name: 'Remada Curvada c/ Barra', muscleGroup: 'Dorsais / Rombóides', equipment: 'Barra Olímpica', benefitNote: 'Trabalha densidade e largura das costas com estabilização do core.' },
    { name: 'Puxada Alta com Pegada Triângulo', muscleGroup: 'Latíssimo / Biceps', equipment: 'Polia Alta + Triângulo', benefitNote: 'Foco na porção inferior da dorsal com pegada neutra.' }
  ],
  'Remada Curvada': [
    { name: 'Remada Baixa c/ Triângulo', muscleGroup: 'Dorsais / Rombóides', equipment: 'Polia Baixa', benefitNote: 'Tração horizontal segura sem sobrecarga excessiva na lombar.' },
    { name: 'Remada Unilateral c/ Halter (Serrote)', muscleGroup: 'Latíssimo do Dorso', equipment: 'Halter + Banco', benefitNote: 'Maior amplitude de extensão/contração e ajuste individual por braço.' },
    { name: 'Remada Cavalo (Barra T)', muscleGroup: 'Espessura das Costas', equipment: 'Barra T / Canto', benefitNote: 'Excelente para sobrecarga de força em vetores horizontais.' }
  ],
  'Desenvolvimento c/ Halteres': [
    { name: 'Desenvolvimento Máquina Articulada', muscleGroup: 'Deltoide Anterior / Lateral', equipment: 'Máquina Shoulder Press', benefitNote: 'Estabilidade guiada mantendo vetor de empurrar vertical.' },
    { name: 'Desenvolvimento c/ Barra Frontal', muscleGroup: 'Deltoides / Tríceps', equipment: 'Barra Olímpica', benefitNote: 'Clássico exercício composto para força de ombros.' }
  ],
  'Elevação Lateral': [
    { name: 'Elevação Lateral na Polia Baixa', muscleGroup: 'Deltoide Lateral', equipment: 'Cabo / Polia', benefitNote: 'Tensão constante em todo o arco do movimento, inclusive no início.' },
    { name: 'Elevação Lateral c/ Halteres em Banco Inclinado', muscleGroup: 'Deltoide Lateral', equipment: 'Halteres + Banco', benefitNote: 'Elimina impulso e isola a porção medial do ombro.' }
  ],
  'Rosca Direta': [
    { name: 'Rosca W no Banco Scott', muscleGroup: 'Bíceps Braquial', equipment: 'Barra W + Banco Scott', benefitNote: 'Elimina compensação do ombro e isola o pico do bíceps.' },
    { name: 'Rosca Alternada c/ Halteres', muscleGroup: 'Bíceps / Braquiorradial', equipment: 'Halteres', benefitNote: 'Permite supinação completa do punho na fase concêntrica.' },
    { name: 'Rosca na Polia Baixa c/ Barra Reta', muscleGroup: 'Bíceps Braquial', equipment: 'Polia Baixa', benefitNote: 'Tensão contínua mantida do início ao fim da repetição.' }
  ],
  'Tríceps Polia Alta': [
    { name: 'Tríceps Teste c/ Barra W', muscleGroup: 'Tríceps (Cabeça Longa/Medial)', equipment: 'Barra W + Banco', benefitNote: 'Grande estiramento da cabeça longa do tríceps.' },
    { name: 'Tríceps Francês c/ Halter', muscleGroup: 'Tríceps Braquial', equipment: 'Halter + Banco', benefitNote: 'Foco na porção longa do tríceps com o braço elevado.' },
    { name: 'Tríceps Paralelas / Mergulho no Banco', muscleGroup: 'Tríceps / Peitoral Inferior', equipment: 'Paralelas / Banco', benefitNote: 'Excelente exercício multiarticular de empurrar para tríceps.' }
  ],
  'Mesa Flexora': [
    { name: 'Cadeira Flexora', muscleGroup: 'Isquiotibiais', equipment: 'Máquina Cadeira Flexora', benefitNote: 'Flexão de joelho com quadril fletido, aumentando o pré-estiramento dos isquiotibiais.' },
    { name: 'Stiff c/ Halteres', muscleGroup: 'Isquiotibiais / Glúteo', equipment: 'Halteres', benefitNote: 'Exercício focado em tensão no estiramento da cadeia posterior.' }
  ],
  'Cadeira Extensora': [
    { name: 'Agachamento Sissy', muscleGroup: 'Quadríceps (Reto Femoral)', equipment: 'Anilha / Peso Corporal', benefitNote: 'Isolamento do reto femoral em amplitude máxima.' },
    { name: 'Passada com Avanço', muscleGroup: 'Quadríceps / Glúteos', equipment: 'Halteres', benefitNote: 'Trabalho dinâmico e estável para extensores de joelho.' }
  ]
};

export function getExerciseSubstitutes(exerciseName: string): ExerciseSubstitute[] {
  // Try exact or partial match in database
  for (const key in SUBSTITUTES_DATABASE) {
    if (exerciseName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(exerciseName.toLowerCase())) {
      return SUBSTITUTES_DATABASE[key];
    }
  }

  // Fallback defaults based on exercise keywords
  const nameLower = exerciseName.toLowerCase();
  if (nameLower.includes('agachamento') || nameLower.includes('leg press') || nameLower.includes('hack')) {
    return [
      { name: 'Leg Press 45º', muscleGroup: 'Quadríceps / Glúteos', equipment: 'Aparelho Leg Press', benefitNote: 'Substituto direto para extensores de joelho.' },
      { name: 'Agachamento Búlgaro c/ Halteres', muscleGroup: 'Quadríceps / Glúteo', equipment: 'Halteres', benefitNote: 'Ativação hipertrófica unilateral de alta intensidade.' },
      { name: 'Passada com Halteres', muscleGroup: 'Quadríceps / Glúteos', equipment: 'Halteres', benefitNote: 'Excelente alternativa funcional.' }
    ];
  }

  if (nameLower.includes('supino') || nameLower.includes('peito') || nameLower.includes('chest')) {
    return [
      { name: 'Supino Reto c/ Halteres', muscleGroup: 'Peitoral Maior', equipment: 'Halteres + Banco', benefitNote: 'Substituto de livre escolha para empurrar horizontal.' },
      { name: 'Supino Articulado na Máquina', muscleGroup: 'Peitoral Maior', equipment: 'Máquina Chest Press', benefitNote: 'Execução guiada de alta segurança.' }
    ];
  }

  if (nameLower.includes('puxada') || nameLower.includes('remada') || nameLower.includes('costas') || nameLower.includes('pulldown')) {
    return [
      { name: 'Remada Baixa c/ Triângulo', muscleGroup: 'Dorsais / Rombóides', equipment: 'Polia Baixa', benefitNote: 'Substituto direto para tração de dorsais.' },
      { name: 'Remada Unilateral c/ Halter', muscleGroup: 'Latíssimo do Dorso', equipment: 'Halter + Banco', benefitNote: 'Excelente foco hipertrófico unilateral.' }
    ];
  }

  // Default universal fallback
  return [
    { name: `${exerciseName} c/ Halteres`, muscleGroup: 'Mesmo Grupamento Muscular', equipment: 'Halteres', benefitNote: 'Versão livre com halteres mantendo o mesmo padrão biomecânico.' },
    { name: `${exerciseName} na Polia / Cabo`, muscleGroup: 'Mesmo Grupamento Muscular', equipment: 'Polia / Cabos', benefitNote: 'Manutenção de tensão contínua em todo o arco do movimento.' }
  ];
}

export function get4WeekExerciseHistory(client: Client | null, exerciseName: string, currentTargetKg: number | null): ExerciseTrendData {
  if (!client || !client.rpeLog || client.rpeLog.length === 0) {
    const dummyPoints: WeekLoadPoint[] = [
      { label: 'Sem. 1', date: 'Anterior', maxKg: currentTargetKg ? Math.round(currentTargetKg * 0.9) : 20, avgReps: 10 },
      { label: 'Sem. 2', date: 'Anterior', maxKg: currentTargetKg ? Math.round(currentTargetKg * 0.95) : 22, avgReps: 10 },
      { label: 'Sem. 3', date: 'Anterior', maxKg: currentTargetKg ? currentTargetKg : 24, avgReps: 10 },
      { label: 'Meta Hoje', date: 'Atual', maxKg: currentTargetKg ? Math.round(currentTargetKg * 1.05) : 26, avgReps: 10, isTarget: true }
    ];
    return {
      points: dummyPoints,
      trendPct: 8.3,
      lastWeekKg: currentTargetKg || 24,
      targetTodayKg: currentTargetKg ? Math.round(currentTargetKg * 1.05) : 26
    };
  }

  // Sort sessions chronologically
  const sortedSessions = [...client.rpeLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const points: WeekLoadPoint[] = [];
  let weekCounter = 1;

  for (const session of sortedSessions) {
    const exMatch = (session.exercises || []).find(e => e.name.toLowerCase().trim() === exerciseName.toLowerCase().trim());
    if (exMatch && exMatch.sets && exMatch.sets.length > 0) {
      const validSets = exMatch.sets.filter(s => s.kg > 0);
      if (validSets.length > 0) {
        const maxKg = Math.max(...validSets.map(s => s.kg));
        const avgReps = Math.round(validSets.reduce((sum, s) => sum + s.reps, 0) / validSets.length);
        const dtStr = new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        
        points.push({
          label: `Sem. ${weekCounter}`,
          date: dtStr,
          maxKg,
          avgReps
        });
        weekCounter++;
      }
    }
  }

  // Slice to last 3 real historical points
  const recentPoints = points.slice(-3);
  
  if (recentPoints.length === 0) {
    const baseKg = currentTargetKg || 20;
    return {
      points: [
        { label: 'Sem. 1', date: 'Histórico', maxKg: Math.round(baseKg * 0.92), avgReps: 10 },
        { label: 'Sem. 2', date: 'Histórico', maxKg: Math.round(baseKg * 0.96), avgReps: 10 },
        { label: 'Sem. 3', date: 'Histórico', maxKg: baseKg, avgReps: 10 },
        { label: 'Meta Hoje', date: 'Atual', maxKg: Math.round(baseKg * 1.05), avgReps: 10, isTarget: true }
      ],
      trendPct: 5.2,
      lastWeekKg: baseKg,
      targetTodayKg: Math.round(baseKg * 1.05)
    };
  }

  const lastRealKg = recentPoints[recentPoints.length - 1].maxKg;
  const targetToday = currentTargetKg || Math.round(lastRealKg * 1.025);

  const finalPoints = [
    ...recentPoints,
    {
      label: 'Meta Hoje',
      date: 'Hoje',
      maxKg: targetToday,
      avgReps: recentPoints[recentPoints.length - 1].avgReps || 10,
      isTarget: true
    }
  ];

  const firstKg = finalPoints[0].maxKg;
  const trendPct = firstKg > 0 ? Number((((targetToday - firstKg) / firstKg) * 100).toFixed(1)) : 0;

  return {
    points: finalPoints,
    trendPct,
    lastWeekKg: lastRealKg,
    targetTodayKg: targetToday
  };
}

export function checkPersonalRecord(
  client: Client | null,
  exerciseName: string,
  currentKg: number,
  currentReps: number
): PRCheckResult {
  if (currentKg <= 0 || currentReps <= 0) {
    return { isPR: false, previousPR: 0, newPR: 0, diffKg: 0 };
  }

  const new1RM = calculate1RMEpley(currentKg, currentReps);
  let previousPR = 0;

  if (client && client.rpeLog) {
    for (const session of client.rpeLog) {
      const matchEx = (session.exercises || []).find(e => e.name.toLowerCase().trim() === exerciseName.toLowerCase().trim());
      if (matchEx) {
        for (const set of matchEx.sets) {
          if (set.kg > 0 && set.reps > 0) {
            const hist1RM = calculate1RMEpley(set.kg, set.reps);
            if (hist1RM > previousPR) {
              previousPR = hist1RM;
            }
          }
        }
      }
    }
  }

  // If no history, threshold PR is 0 or base
  if (previousPR > 0 && new1RM > previousPR) {
    return {
      isPR: true,
      previousPR,
      newPR: new1RM,
      diffKg: Number((new1RM - previousPR).toFixed(1))
    };
  }

  return { isPR: false, previousPR, newPR: new1RM, diffKg: 0 };
}

export function checkFatigueDrop(sets: Array<{ reps: number; kg: number; rpe?: number }>): FatigueCheckResult {
  if (sets.length < 2) {
    return { hasHighFatigue: false, dropPct: 0, set1Reps: 0, lastReps: 0, suggestedRestSecs: 90 };
  }

  const set1 = sets[0];
  const lastSet = sets[sets.length - 1];

  if (set1.reps > 0 && lastSet.reps > 0 && lastSet.kg >= set1.kg * 0.9) {
    const drop = ((set1.reps - lastSet.reps) / set1.reps) * 100;
    if (drop >= 35) { // 35% or higher drop in reps
      return {
        hasHighFatigue: true,
        dropPct: Math.round(drop),
        set1Reps: set1.reps,
        lastReps: lastSet.reps,
        suggestedRestSecs: 150 // 2.5 minutes for ATP recovery
      };
    }
  }

  return { hasHighFatigue: false, dropPct: 0, set1Reps: set1.reps, lastReps: lastSet.reps, suggestedRestSecs: 90 };
}

export function checkRPE10AutoRegulation(
  sets: Array<{ reps: number; kg: number; rpe?: number }>,
  currentKg: number
): AutoRegulateResult {
  if (sets.length === 1) {
    const set1 = sets[0];
    if (set1.rpe && set1.rpe >= 9.5) {
      const reducedKg = Math.max(1, Math.round((set1.kg * 0.9) * 2) / 2); // -10% rounded to 0.5kg
      return {
        needsAutoReduce: true,
        suggestedKg: reducedKg,
        originalKg: set1.kg,
        reductionPct: 10
      };
    }
  }

  return { needsAutoReduce: false, suggestedKg: currentKg, originalKg: currentKg, reductionPct: 0 };
}

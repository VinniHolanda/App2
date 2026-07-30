import { LoggedExercise, PersonalRecord, Session } from '../types';

export function isUnilateralMovement(name: string): boolean {
  return /unilateral|alterna[dt]|single[\s-]?(leg|arm)|uma[\s-]?perna|um[\s-]?bra[çc]o/i.test(name || '');
}

export function calculate1RMEpley(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0;
  return kg * (1 + reps / 30);
}

export function calculateEpleyAdjustedLoad(
  lastKg: number,
  lastReps: number,
  lastRpe: number,
  targetRpe: number = 8,
  targetReps?: number
): { suggestedKg: number; increment: number; est1RM: number; rir: number } {
  if (lastKg <= 0 || lastReps <= 0) {
    return { suggestedKg: lastKg, increment: 0, est1RM: 0, rir: 0 };
  }

  // RIR (Reps in Reserve) = 10 - actual RPE
  const rir = Math.max(0, 10 - lastRpe);
  
  // Total potential reps performed in reserve + actual reps
  const potentialReps = lastReps + rir;
  
  // Estimated 1RM via Epley formula
  const est1RM = lastKg * (1 + potentialReps / 30);
  
  // Target RIR (RPE 8 = 2 RIR)
  const targetRir = Math.max(0, 10 - targetRpe);
  const plannedReps = targetReps || lastReps;
  const targetEffectiveReps = plannedReps + targetRir;
  
  // Raw suggested load for target RPE
  const rawSuggestedKg = est1RM / (1 + targetEffectiveReps / 30);
  
  // Ensure an increment of at least +0.5kg or round to nearest 0.5kg/1.0kg
  const suggestedKg = Math.max(lastKg + 0.5, Math.round(rawSuggestedKg * 2) / 2);
  const increment = Math.round((suggestedKg - lastKg) * 10) / 10;

  return {
    suggestedKg,
    increment: Math.max(0, increment),
    est1RM: Math.round(est1RM * 10) / 10,
    rir
  };
}

export function suggestKgForReps(est1RM: number, targetReps: number): number | null {
  if (!est1RM || targetReps <= 0) return null;
  const raw = est1RM / (1 + targetReps / 30);
  return Math.round(raw / 2.5) * 2.5;
}

export function calculateExerciseTonnage(ex: { name: string; sets: Array<{ reps: number; kg: number }>; unilateral?: boolean }): number {
  if (!ex.sets || !ex.sets.length) return 0;
  const base = ex.sets.reduce((sum, s) => sum + (Number(s.reps) || 0) * (Number(s.kg) || 0), 0);
  return (isUnilateralMovement(ex.name) || ex.unilateral) ? base * 2 : base;
}

export function calculateSessionTonnage(exercises: LoggedExercise[]): number {
  if (!exercises || !exercises.length) return 0;
  return exercises.reduce((acc, ex) => {
    if (ex._type) return acc; // skip non-exercise entries like wellness
    return acc + (ex.tonnage != null && ex.tonnage > 0 ? ex.tonnage : calculateExerciseTonnage(ex));
  }, 0);
}

export function calculateInternalLoad(srpe: number, minutes: number): number {
  return (Number(srpe) || 0) * (Number(minutes) || 0);
}

export interface WeekStats {
  count: number;
  totalUA: number;
  meanUA: number;
  sd: number;
  monotony: number | null;
  strain: number | null;
  meanSRPE: number;
}

export function calculateWeekStats(sessions: Session[]): WeekStats | null {
  if (!sessions || !sessions.length) return null;
  const loads = sessions.map(s => calculateInternalLoad(s.srpe, s.min));
  const count = loads.length;
  const totalUA = loads.reduce((a, b) => a + b, 0);
  const meanUA = totalUA / count;
  const sd = Math.sqrt(loads.reduce((a, b) => a + Math.pow(b - meanUA, 2), 0) / count);
  const monotony = sd > 0.01 ? meanUA / sd : (count > 1 ? 5 : null);
  const strain = monotony != null ? totalUA * monotony : null;
  const meanSRPE = sessions.reduce((a, b) => a + (Number(b.srpe) || 0), 0) / count;

  return {
    count,
    totalUA: Math.round(totalUA),
    meanUA,
    sd,
    monotony: monotony != null ? Number(monotony.toFixed(2)) : null,
    strain: strain != null ? Math.round(strain) : null,
    meanSRPE
  };
}

export function calculatePersonalRecords(sessions: Session[]): Record<string, PersonalRecord> {
  const prs: Record<string, PersonalRecord> = {};
  for (const s of (sessions || [])) {
    if (s.checkin) continue;
    for (const ex of (s.exercises || [])) {
      if (!ex.name || ex._type) continue;
      for (const set of (ex.sets || [])) {
        const kg = Number(set.kg) || 0;
        const reps = Number(set.reps) || 0;
        if (kg <= 0 || reps <= 0) continue;
        const est1RM = calculate1RMEpley(kg, reps);
        if (!prs[ex.name] || est1RM > prs[ex.name].est1RM) {
          prs[ex.name] = {
            est1RM,
            bestReps: reps,
            bestKg: kg,
            date: s.date || ''
          };
        }
      }
    }
  }
  return prs;
}

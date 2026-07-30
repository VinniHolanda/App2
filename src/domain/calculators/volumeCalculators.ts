import { Client, MovementPattern, Program, ProgramExercise, Session } from '../types';
import { isUnilateralMovement } from './loadCalculators';

// Muscle group fractional contribution per movement pattern
export const VOLUME_CONTRIBUTION_MAP: Record<MovementPattern, Record<string, number>> = {
  push_h: { "Peito": 1, "Tríceps": 0.5, "Ombro (frontal)": 0.5 },
  push_v: { "Ombro (frontal)": 1, "Tríceps": 0.5 },
  shoulder_iso: { "Ombro (lateral)": 1 },
  pull_v: { "Costas": 1, "Bíceps": 0.5 },
  pull_h: { "Costas": 1, "Bíceps": 0.5 },
  rear: { "Ombro (posterior)": 1 },
  quad: { "Quadríceps": 1, "Glúteo": 0.5 },
  hinge: { "Posterior de coxa": 1, "Glúteo": 1 },
  arms_bi: { "Bíceps": 1 },
  arms_tri: { "Tríceps": 1 },
  core: { "Core": 1 },
  calf: { "Panturrilha": 1 },
  cond: {}
};

export function parseSetsNum(setsStr: string): number {
  const match = String(setsStr || '').match(/\d+/g);
  if (!match) return 3;
  return Math.max(...match.map(Number));
}

export function parseTargetReps(repsStr: string): number {
  const match = (repsStr || '').match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
  if (!match) return 10;
  return match[2] ? Math.round((+match[1] + +match[2]) / 2) : +match[1];
}

export interface MuscleVolumeResult {
  muscle: string;
  direct: number;
  total: number;
}

export function calculateWeeklyVolume(program: Program | null | undefined): MuscleVolumeResult[] {
  if (!program || !program.days) return [];
  const acc: Record<string, { direct: number; frac: number }> = {};

  for (const day of program.days) {
    for (const ex of (day.exercises || [])) {
      const pat = ex.pat;
      if (!pat || !VOLUME_CONTRIBUTION_MAP[pat]) continue;
      const numSets = parseSetsNum(ex.sets);

      for (const [muscle, weight] of Object.entries(VOLUME_CONTRIBUTION_MAP[pat])) {
        if (!acc[muscle]) acc[muscle] = { direct: 0, frac: 0 };
        if (weight >= 1) {
          acc[muscle].direct += numSets * weight;
        } else {
          acc[muscle].frac += numSets * weight;
        }
      }
    }
  }

  const roundHalf = (n: number) => Math.round(n * 2) / 2;

  return Object.entries(acc)
    .map(([muscle, v]) => ({
      muscle,
      direct: roundHalf(v.direct),
      total: roundHalf(v.direct + v.frac)
    }))
    .sort((a, b) => b.direct - a.direct || b.total - a.total);
}

const BASE_MUSCLE_TARGETS: Record<string, number> = {
  "Peito": 14,
  "Costas": 16,
  "Quadríceps": 14,
  "Posterior de coxa": 12,
  "Glúteo": 10,
  "Ombro (lateral)": 10,
  "Ombro (frontal)": 6,
  "Ombro (posterior)": 8,
  "Bíceps": 10,
  "Tríceps": 10,
  "Core": 8,
  "Panturrilha": 8
};

const GOAL_VOLUME_FACTOR: Record<string, number> = {
  "Ganho de massa (hipertrofia)": 1.0,
  "Perda de gordura": 0.9,
  "Força": 0.7,
  "Performance esportiva": 0.85,
  "Condicionamento / saúde": 0.65,
  "Reabilitação / volta ao treino": 0.5
};

const LEVEL_VOLUME_FACTOR: Record<string, number> = {
  "Iniciante": 0.7,
  "Intermediário": 1.0,
  "Avançado": 1.25
};

export function calculateMuscleTargets(
  client: Pick<Client, 'goal' | 'level' | 'parq'>,
  emphasisPats: MovementPattern[] = []
): Record<string, number> {
  const isParqPositive = client.parq && Object.values(client.parq).some(v => v === 'sim');
  const gf = GOAL_VOLUME_FACTOR[client.goal] ?? 0.9;
  const lf = LEVEL_VOLUME_FACTOR[client.level] ?? 1.0;
  const cf = isParqPositive ? 0.85 : 1.0;

  const emphasisMuscles = new Set<string>();
  for (const pat of emphasisPats) {
    const map = VOLUME_CONTRIBUTION_MAP[pat] || {};
    for (const [m, w] of Object.entries(map)) {
      if (w >= 1) emphasisMuscles.add(m);
    }
  }

  const targets: Record<string, number> = {};
  for (const [muscle, base] of Object.entries(BASE_MUSCLE_TARGETS)) {
    let vol = base * gf * lf * cf;
    if (emphasisMuscles.has(muscle)) vol *= 1.4;
    targets[muscle] = Math.round(vol);
  }
  return targets;
}

const NORMATIVE_KG_TABLE: Record<string, [number, number, number]> = {
  push_h: [22, 52, 82],
  push_v: [14, 32, 58],
  pull_v: [28, 58, 85],
  pull_h: [22, 48, 72],
  quad: [38, 78, 125],
  hinge: [28, 62, 100],
  shoulder_iso: [6, 13, 22],
  rear: [6, 11, 18],
  arms_bi: [9, 18, 30],
  arms_tri: [11, 20, 33],
  core: [5, 11, 18],
  calf: [22, 52, 82]
};

export function calculateSessionTonnageLimit(
  dayExercises: ProgramExercise[],
  weekVolFactor: number = 1.0,
  sessionsHistory: Session[] = [],
  clientLevel: string = 'Intermediário'
): number | null {
  const levelIdx = clientLevel === 'Iniciante' ? 0 : clientLevel === 'Avançado' ? 2 : 1;
  const levelMult = [1.0, 1.0, 1.25][levelIdx];
  let limit = 0;
  let hasValidEx = false;

  for (const ex of (dayExercises || [])) {
    if (ex.pat === 'cond') continue;
    hasValidEx = true;

    // Look up last used kg in user's sessions history
    let refKg: number | null = null;
    const sorted = [...sessionsHistory].filter(s => s.exercises && s.exercises.length).sort((a, b) => b.date.localeCompare(a.date));
    for (const s of sorted) {
      const matchEx = (s.exercises || []).find(e => e.name === ex.name);
      if (matchEx) {
        const lastWithKg = (matchEx.sets || []).filter(x => Number(x.kg) > 0).pop();
        if (lastWithKg) {
          refKg = Number(lastWithKg.kg);
          break;
        }
      }
    }

    const normRow = NORMATIVE_KG_TABLE[ex.pat];
    const normKg = normRow ? normRow[levelIdx] : 20;
    const kg = refKg != null ? refKg : normKg;
    const uniMult = (isUnilateralMovement(ex.name) || ex.unilateral) ? 2 : 1;

    limit += parseSetsNum(ex.sets) * parseTargetReps(ex.reps) * kg * uniMult;
  }

  if (!hasValidEx) return null;
  return Math.round(limit * weekVolFactor * levelMult);
}

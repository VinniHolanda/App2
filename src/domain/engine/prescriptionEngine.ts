import {
  Client,
  Mesociclo,
  MesoWeek,
  MovementPattern,
  Program,
  ProgramDay,
  ProgramExercise,
  TrainingGoal
} from '../types';
import { EXERCISE_CATALOG, EQUIPMENT_CODE_MAP, CatalogExercise } from '../../data/exerciseCatalog';
import { calculateMuscleTargets, parseSetsNum } from '../calculators/volumeCalculators';
import { TRAINING_METHODS_CATALOG, getRecommendedMethodsForContext, evaluateMethodForClient } from '../trainingMethods';

const SCHEMES: Record<string, { c: [string, string, string]; i: [string, string, string]; rpe: string; per: string }> = {
  "Ganho de massa (hipertrofia)": {
    c: ["3-4", "8-12", "60-90s"],
    i: ["3", "12-15", "45-60s"],
    rpe: "7-9",
    per: "Progressão dupla: quando atingir o topo das reps com boa técnica em todas as séries, aumente a carga ~2,5-5% e volte ao fundo da faixa."
  },
  "Força": {
    c: ["4-5", "3-6", "2-3 min"],
    i: ["3", "8-12", "90s"],
    rpe: "8",
    per: "Foque nos compostos: adicione pequenas cargas semanalmente (microcarga). A cada 4 semanas, faça uma semana mais leve (deload)."
  },
  "Perda de gordura": {
    c: ["3", "12-15", "45-60s"],
    i: ["3", "15-20", "30-45s"],
    rpe: "7-8",
    per: "Mantenha densidade alta (descansos curtos). Progrida adicionando reps ou reduzindo o descanso antes de subir carga. Combine com déficit calórico e cardio."
  },
  "Condicionamento / saúde": {
    c: ["2-3", "10-15", "60s"],
    i: ["2", "12-15", "45s"],
    rpe: "6-8",
    per: "Aumente gradualmente reps e carga conforme conforto. Priorize constância e amplitude de movimento sobre intensidade máxima."
  },
  "Performance esportiva": {
    c: ["3-4", "5-8", "90s-2 min"],
    i: ["3", "8-12", "60s"],
    rpe: "7-8",
    per: "Periodize por blocos (base → força → potência). Ajuste o volume conforme a fase da temporada do esporte."
  },
  "Reabilitação / volta ao treino": {
    c: ["2-3", "12-15", "60-90s"],
    i: ["2", "12-15", "45s"],
    rpe: "5-7",
    per: "Comece conservador, priorize técnica e amplitude indolor. Aumente carga só quando o movimento estiver sem dor por 2 sessões seguidas."
  }
};

const PERIODIZATION_TEMPLATES: Record<string, { model: string; weeks: MesoWeek[] }> = {
  "Ganho de massa (hipertrofia)": {
    model: "Acúmulo de volume → intensificação → deload (4 semanas)",
    weeks: [
      { f: "Acumulação 1", rpe: "7", vol: 1.0, load: "Carga base — 2-3 reps na reserva", how: "Semana base: ache uma carga que deixe 2-3 reps na reserva no topo da faixa. Registre carga e reps de tudo." },
      { f: "Acumulação 2", rpe: "7-8", vol: 1.15, load: "Mesma carga, +1 série", how: "Adicione 1 série nos compostos OU +1-2 reps por série mantendo a mesma carga." },
      { f: "Intensificação", rpe: "8-9", vol: 1.0, load: "+2,5-5% de carga", how: "Aumente a carga ~2,5-5% e busque o topo da faixa de reps. Pico do mesociclo." },
      { f: "Deload", rpe: "5-6", vol: 0.5, load: "Carga leve, -50% volume", how: "Reduza ~50% das séries e deixe 3-4 reps na reserva. Recupera para o próximo ciclo." }
    ]
  },
  "Força": {
    model: "Progressão de intensidade com microcargas (4 semanas)",
    weeks: [
      { f: "Base", rpe: "7-8", vol: 1.0, load: "Carga base, técnica sólida", how: "Estabeleça cargas nos compostos principais com técnica sólida e consistente." },
      { f: "Progressão", rpe: "8", vol: 1.0, load: "Microcarga +2,5kg", how: "Microcarga: +2,5kg nos inferiores / +1-2,5kg nos superiores onde manteve as reps." },
      { f: "Pico", rpe: "8-9", vol: 0.9, load: "Mais carga, -1-2 reps", how: "Mais carga, menos reps nos principais. Reduza levemente o acessório para priorizar a força." },
      { f: "Deload", rpe: "5-6", vol: 0.5, load: "~70% carga, metade do volume", how: "Cargas ~70% do habitual e metade das séries. Mantém o padrão motor sem acumular fadiga." }
    ]
  },
  "Perda de gordura": {
    model: "Densidade crescente + manutenção de força (4 semanas)",
    weeks: [
      { f: "Base", rpe: "7", vol: 1.0, load: "Carga base, descanso padrão", how: "Estabeleça cargas e tempos de descanso. Foque em executar o volume todo com boa técnica." },
      { f: "Densidade 1", rpe: "7-8", vol: 1.0, load: "Mesma carga, -10-15s descanso", how: "Reduza o descanso em ~10-15s OU adicione 1-2 reps. Mantenha as cargas para preservar massa." },
      { f: "Densidade 2", rpe: "8", vol: 1.0, load: "Descansos curtos / circuitos", how: "Descansos mais curtos / circuitos onde fizer sentido. Combine com o déficit calórico e cardio." },
      { f: "Deload", rpe: "5-6", vol: 0.6, load: "Volume e ritmo reduzidos", how: "Alivie o volume e o ritmo. Útil ainda mais em déficit, quando a recuperação cai." }
    ]
  }
};

export function isParqPositive(client: Client): boolean {
  return !!(client.parq && Object.values(client.parq).some(v => v === 'sim'));
}

export function buildAvoidSet(client: Client): Set<string> {
  const set = new Set<string>();
  const text = `${client.inj || ''} ${(client.diseases || []).join(' ')}`.toLowerCase();

  const isCervical = /cervical|pesco[çc]o|nuca/.test(text);
  if (isCervical) set.add('cervical');
  if (/lombar|lord|ci[aá]tic/.test(text)) set.add('lombar');
  if (/(h[eé]rnia|disco|coluna)/.test(text)) {
    if (isCervical) set.add('cervical');
    else set.add('lombar');
  }
  if (/joelho|menisc|patela|ligament/.test(text)) set.add('joelho');
  if (/ombro|manguito|deltoi/.test(text)) set.add('ombro');

  return set;
}

export function buildMesoCycle(client: Client, isConservative: boolean): Mesociclo {
  const base = PERIODIZATION_TEMPLATES[client.goal] || PERIODIZATION_TEMPLATES["Ganho de massa (hipertrofia)"];
  let weeks = base.weeks.map(w => ({ ...w }));
  if (isConservative) {
    weeks = weeks.map(w => ({ ...w, rpe: "5-6", vol: Math.min(w.vol, 0.85) }));
  }
  return {
    model: base.model,
    weeks,
    conservative: isConservative
  };
}

export function buildAutoMesoCycle(client: Client, totalWeeks: number): Mesociclo {
  const conservative = isParqPositive(client);
  const nDeload = 1;
  const nAcc = Math.ceil((totalWeeks - nDeload) * 0.55);
  const nInt = totalWeeks - nDeload - nAcc;

  const accWeeks: MesoWeek[] = Array.from({ length: nAcc }, (_, i) => {
    const volBase = 1.0 + i * (0.15 / Math.max(nAcc - 1, 1));
    const vol = Math.round(volBase * 100) / 100;
    const rpe = i < nAcc - 1 ? "7" : "7-8";
    return {
      f: `Acumulação ${i + 1}`,
      rpe,
      vol,
      load: i === 0 ? "Carga base — 2-3 reps na reserva" : "Mesma carga + 1 série ou +1-2 reps",
      how: i === 0 ? "Semana base: ache uma carga que deixe 2-3 reps na reserva." : "Adicione 1 série nos compostos ou +1-2 reps."
    };
  });

  const intWeeks: MesoWeek[] = Array.from({ length: nInt }, (_, i) => {
    const volBase = 1.0 - i * (0.1 / Math.max(nInt - 1, 1));
    const vol = Math.round(volBase * 100) / 100;
    return {
      f: `Intensificação ${i + 1}`,
      rpe: "8-9",
      vol,
      load: "+2,5-5% de carga, foco em execução",
      how: "Aumente a carga ~2,5-5%. Qualidade > quantidade."
    };
  });

  const deloadWeek: MesoWeek = {
    f: "Deload",
    rpe: "5-6",
    vol: 0.5,
    load: "Carga leve, ~50% do volume",
    how: "Reduza ~50% das séries e recupere para o próximo ciclo."
  };

  let weeks = [...accWeeks, ...intWeeks, deloadWeek];
  if (conservative) {
    weeks = weeks.map(w => ({ ...w, rpe: "5-6", vol: Math.min(w.vol, 0.85) }));
  }

  return {
    model: `Acúmulo ${nAcc}s → Intensificação ${nInt}s → Deload 1s`,
    weeks,
    conservative,
    auto: true,
    nWeeks: totalWeeks
  };
}

export function generateProgram(client: Client, promptNotes: string = ''): Program {
  const profile = EQUIPMENT_CODE_MAP[client.eq] || "full";
  const scheme = SCHEMES[client.goal] || SCHEMES["Ganho de massa (hipertrofia)"];
  const avoidSet = buildAvoidSet(client);
  const conservative = isParqPositive(client);

  const daysNum = Math.max(2, Math.min(6, Number(client.days) || 4));
  const maxExPerDay = client.level === 'Iniciante' ? 5 : client.level === 'Avançado' ? 7 : 6;

  // Split selector
  let defaultSplit: Array<[string, MovementPattern[]]> = [];
  if (daysNum === 2) {
    defaultSplit = [
      ["Treino A — Corpo inteiro", ["quad", "push_h", "pull_v", "hinge", "shoulder_iso", "core"]],
      ["Treino B — Corpo inteiro", ["hinge", "push_v", "pull_h", "quad", "arms_bi", "core"]]
    ];
  } else if (daysNum === 3) {
    defaultSplit = [
      ["Push — Peito / Ombro / Tríceps", ["push_h", "push_v", "push_h", "shoulder_iso", "arms_tri"]],
      ["Pull — Costas / Bíceps", ["pull_v", "pull_h", "pull_h", "rear", "arms_bi"]],
      ["Legs — Pernas e Core", ["quad", "hinge", "quad", "hinge", "calf", "core"]]
    ];
  } else if (daysNum === 4) {
    defaultSplit = [
      ["Upper A — Superiores", ["push_h", "pull_v", "push_v", "pull_h", "arms_bi", "arms_tri"]],
      ["Lower A — Inferiores", ["quad", "hinge", "quad", "calf", "core"]],
      ["Upper B — Superiores", ["push_v", "pull_h", "push_h", "pull_v", "shoulder_iso", "rear"]],
      ["Lower B — Inferiores", ["hinge", "quad", "hinge", "calf", "core"]]
    ];
  } else {
    defaultSplit = [
      ["Push A — Peito / Ombro / Tríceps", ["push_h", "push_v", "push_h", "shoulder_iso", "arms_tri"]],
      ["Pull A — Costas / Bíceps", ["pull_v", "pull_h", "pull_h", "rear", "arms_bi"]],
      ["Legs A — Pernas", ["quad", "hinge", "quad", "calf", "core"]],
      ["Push B — Peito / Ombro", ["push_v", "push_h", "shoulder_iso", "arms_tri", "arms_tri"]],
      ["Pull B — Costas / Bíceps", ["pull_h", "pull_v", "rear", "arms_bi", "arms_bi"]]
    ];
  }

  const usedExerciseNames = new Set<string>();

  const days: ProgramDay[] = defaultSplit.map(([dayName, patterns]) => {
    const exercises: ProgramExercise[] = [];

    for (const pat of patterns.slice(0, maxExPerDay)) {
      const candidates = EXERCISE_CATALOG.filter(ex => {
        if (ex.p !== pat) return false;
        if (!ex.eqs.includes(profile)) return false;
        if (usedExerciseNames.has(ex.n)) return false;
        if (ex.av.some(tag => avoidSet.has(tag))) return false;
        if (conservative && ex.heavy) return false;
        return true;
      });

      let chosen = candidates[0];
      if (!chosen) {
        // Fallback: relax name uniqueness if exhausted
        chosen = EXERCISE_CATALOG.find(ex => ex.p === pat && ex.eqs.includes(profile) && !ex.av.some(tag => avoidSet.has(tag)));
      }

      if (chosen) {
        usedExerciseNames.add(chosen.n);
        const isIso = chosen.iso || pat === 'shoulder_iso' || pat === 'arms_bi' || pat === 'arms_tri';
        const config = isIso ? scheme.i : scheme.c;

        // Determine method strategic assignment
        let method = 'tradicional';
        if (client.level === 'Iniciante') {
          method = isIso ? 'tut' : 'tradicional';
        } else if (client.level === 'Intermediário') {
          if (!isIso) {
            method = 'piramide_crescente';
          } else {
            method = 'biset_agonista';
          }
        } else if (client.level === 'Avançado') {
          if (!isIso) {
            method = client.goal === 'Força' ? 'cluster_set' : 'rest_pause';
          } else {
            method = 'dropset';
          }
        }

        // Validate method against safety rules
        const evalMethod = evaluateMethodForClient(method, client.level, 'Base', client.goal);
        if (!evalMethod.isAllowed) {
          method = 'tradicional';
        }

        exercises.push({
          name: chosen.n,
          pat: chosen.p,
          sets: config[0],
          reps: config[1],
          rest: config[2],
          rpe: conservative ? "5-7" : scheme.rpe,
          notes: "",
          method,
          unilateral: /unilateral|alterna/i.test(chosen.n)
        });
      }
    }

    return {
      name: dayName,
      focus: [...new Set(patterns)].join(' · '),
      exercises
    };
  });

  const recommendedMethods = getRecommendedMethodsForContext(client.level, 'Base', client.goal);
  const primaryMethodNames = recommendedMethods.slice(0, 3).map(m => m.name).join(', ');

  const principles = [
    "Sobrecarga progressiva planejada",
    `Métodos estratégicos aplicados (${client.level}): ${primaryMethodNames}`,
    "Volume calibrado por grupo muscular",
    `Adaptação ao equipamento: ${client.eq}`,
    `Filtro de nível: ${client.level}`
  ];

  if (avoidSet.size > 0) {
    principles.push(`Filtro de segurança: sem sobrecarga em ${Array.from(avoidSet).join(', ')}`);
  }

  const warnings = conservative
    ? "Atenção: PAR-Q sinalizado positivamente. Mantenha intensidade RPE <= 7 e monitore resposta de recuperação."
    : (avoidSet.size > 0 ? `Cuidados específicos aplicados para evitar desconforto em: ${Array.from(avoidSet).join(', ')}.` : undefined);

  return {
    summary: `Programa personalizado de ${daysNum} dias em formato estruturado para ${client.name.split(' ')[0]} (${client.level}), foco em ${client.goal.toLowerCase()} com ${client.eq.toLowerCase()}.`,
    principles,
    days,
    progression: scheme.per,
    warnings,
    meso: buildMesoCycle(client, conservative),
    targets: calculateMuscleTargets(client)
  };
}

export interface BioimpedancePrescriptionAnalysis {
  stagnatedLeanMass: boolean;
  leanMassDeltaKg: number;
  adherenceRatePct: number;
  weeksElapsed: number;
  recommendationType: 'increase_volume' | 'increase_intensity' | 'maintain' | 'deload_nutrition';
  title: string;
  suggestedActionText: string;
  volumeAdjustmentPct: number;
}

export function evaluateBodyCompositionProgress(
  client: Client
): BioimpedancePrescriptionAnalysis {
  const history = client.bodyCompositionHistory
    ? [...client.bodyCompositionHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  if (history.length < 2) {
    return {
      stagnatedLeanMass: false,
      leanMassDeltaKg: 0,
      adherenceRatePct: 85,
      weeksElapsed: 0,
      recommendationType: 'maintain',
      title: 'Acompanhamento Inicial de Bioimpedância',
      suggestedActionText: 'Aguarde o próximo laudo para que o motor de prescrição calcule a taxa de variação trófica.',
      volumeAdjustmentPct: 0
    };
  }

  const first = history[0];
  const latest = history[history.length - 1];

  const leanMassDeltaKg = Number((latest.leanMassKg - first.leanMassKg).toFixed(2));
  const avgAdherence = Math.round(
    history.reduce((acc, curr) => acc + (curr.adherenceRatePct || 85), 0) / history.length
  );

  const d1 = new Date(first.date);
  const d2 = new Date(latest.date);
  const diffDays = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksElapsed = Math.max(1, Math.round(diffDays / 7));

  const expectedLeanDelta = Math.max(0.3, weeksElapsed * 0.15);
  const stagnated = leanMassDeltaKg < expectedLeanDelta && avgAdherence >= 70;

  if (stagnated) {
    if (avgAdherence >= 80) {
      return {
        stagnatedLeanMass: true,
        leanMassDeltaKg,
        adherenceRatePct: avgAdherence,
        weeksElapsed,
        recommendationType: 'increase_volume',
        title: '⚠️ Estagnação de Massa Magra Detectada (IA Motor de Prescrição)',
        suggestedActionText: `Com adesão alta (${avgAdherence}%) em ${weeksElapsed} semanas, o ganho de massa magra (+${leanMassDeltaKg}kg) ficou abaixo da taxa esperada (+${expectedLeanDelta.toFixed(1)}kg). O motor de prescrição sugere um aumento imediato de +15% no volume semanal de séries.`,
        volumeAdjustmentPct: 15
      };
    } else {
      return {
        stagnatedLeanMass: true,
        leanMassDeltaKg,
        adherenceRatePct: avgAdherence,
        weeksElapsed,
        recommendationType: 'increase_intensity',
        title: '⚡ Sugestão de Revisão de Intensidade Subjetiva (RPE)',
        suggestedActionText: `Ganho de massa magra estagnado com adesão de ${avgAdherence}%. Recomenda-se intensificar a proximidade da falha muscular (RPE 8-9) e revisar a ingestão proteica.`,
        volumeAdjustmentPct: 10
      };
    }
  }

  return {
    stagnatedLeanMass: false,
    leanMassDeltaKg,
    adherenceRatePct: avgAdherence,
    weeksElapsed,
    recommendationType: 'maintain',
    title: '🎯 Recomposição Corporal Dentro das Metas do Mesociclo',
    suggestedActionText: `O progresso de massa magra (+${leanMassDeltaKg}kg) e redução de gordura corporal estão alinhados aos parâmetros ideais. Manter o planejamento do mesociclo atual.`,
    volumeAdjustmentPct: 0
  };
}


import { ClientLevel, TrainingGoal } from './types';

export type MethodCategory = 'hipertrofia' | 'forca' | 'metabolico' | 'potencia' | 'reabilitacao' | 'geral';

export interface TrainingMethodDefinition {
  id: string;
  name: string;
  periodizationPhase: string[]; // e.g. ['Base', 'Intensificação', 'Choque', 'Todas']
  targetLevels: ClientLevel[]; // ['Iniciante', 'Intermediário', 'Avançado']
  goal: string; // e.g. 'Hipertrofia', 'Força', 'Potência'
  practicalApplication: string; // Detailed instructions on how to perform
  category: MethodCategory;
  tier: 'fundamental' | 'intermediario' | 'avancado' | 'elite';
  tags: string[];
}

export const TRAINING_METHODS_CATALOG: TrainingMethodDefinition[] = [
  {
    id: 'sobrecarga_progressiva',
    name: 'Sobrecarga Progressiva',
    periodizationPhase: ['Todas'],
    targetLevels: ['Iniciante', 'Intermediário', 'Avançado'],
    goal: 'Base de força e hipertrofia',
    practicalApplication: 'Aumentar carga, volume de repetições ou densidade (redução de descanso) de forma sistemática a cada treino.',
    category: 'geral',
    tier: 'fundamental',
    tags: ['Aumento gradual', 'Fundamento', 'Microcarga']
  },
  {
    id: 'tradicional',
    name: 'Método Tradicional (3x8–12)',
    periodizationPhase: ['Base', 'Preparação'],
    targetLevels: ['Iniciante', 'Intermediário'],
    goal: 'Hipertrofia geral e adaptação neuromuscular',
    practicalApplication: 'Executar séries com carga fixa mantendo a mesma faixa de repetições e descanso completo (60–90s) entre séries.',
    category: 'hipertrofia',
    tier: 'fundamental',
    tags: ['Séries fixas', 'Carga constante', 'Adaptação']
  },
  {
    id: 'piramide_crescente',
    name: 'Pirâmide Crescente',
    periodizationPhase: ['Base', 'Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Força + hipertrofia',
    practicalApplication: 'Aumenta a carga e reduz o número de repetições a cada série sucessiva (ex: 12-10-8-6 repetições).',
    category: 'forca',
    tier: 'intermediario',
    tags: ['Aumento de carga', 'Foco concêntrico']
  },
  {
    id: 'piramide_decrescente',
    name: 'Pirâmide Decrescente',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Hipertrofia e máximo recrutamento',
    practicalApplication: 'Inicia com a carga mais alta (menor repetição) e reduz a carga a cada série aumentando as repetições.',
    category: 'hipertrofia',
    tier: 'intermediario',
    tags: ['Recrutamento inicial', 'Volume final']
  },
  {
    id: 'dropset',
    name: 'Drop-set',
    periodizationPhase: ['Intensificação', 'Choque'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Estresse metabólico e falha total',
    practicalApplication: 'Executa a série até a falha, reduz a carga em 20–30% imediatamente sem descanso e prossegue até nova falha.',
    category: 'metabolico',
    tier: 'avancado',
    tags: ['Sem descanso', 'Redução de carga', 'Pump']
  },
  {
    id: 'rest_pause',
    name: 'Rest-pause',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Avançado'],
    goal: 'Aumentar densidade e volume em alta carga',
    practicalApplication: 'Realiza uma série até a falha, faz uma pausa curta de 10 a 20 segundos e realiza mais repetições extras.',
    category: 'forca',
    tier: 'avancado',
    tags: ['Pausas curtas', 'Densidade', 'Fadiga pontual']
  },
  {
    id: 'cluster_set',
    name: 'Cluster Set',
    periodizationPhase: ['Intensificação', 'Pico'],
    targetLevels: ['Avançado'],
    goal: 'Força máxima e potência neuromuscular',
    practicalApplication: 'Mini pausas intra-série (ex: 3 blocos de 2 reps com 15s de pausa) permitindo treinar com cargas maiores e alta velocidade.',
    category: 'forca',
    tier: 'elite',
    tags: ['Intra-série', 'Velocidade de barra', 'Carga alta']
  },
  {
    id: 'biset_agonista',
    name: 'Bi-set (agonista)',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Hipertrofia e densidade muscular',
    practicalApplication: 'Executa dois exercícios consecutivos para o mesmo grupo muscular sem descanso entre eles.',
    category: 'hipertrofia',
    tier: 'intermediario',
    tags: ['Mesmo músculo', 'Dupla fadiga']
  },
  {
    id: 'biset_antagonista',
    name: 'Bi-set (agonista/antagonista)',
    periodizationPhase: ['Base', 'Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Eficiência de tempo e resistência',
    practicalApplication: 'Alterna exercícios de músculos opostos (ex: Bíceps e Tríceps ou Peito e Costas) sem descanso intermediário.',
    category: 'geral',
    tier: 'intermediario',
    tags: ['Músculos opostos', 'Otimização de tempo']
  },
  {
    id: 'triset',
    name: 'Tri-set',
    periodizationPhase: ['Intensificação', 'Choque'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Estresse metabólico elevado',
    practicalApplication: 'Sequência de três exercícios sem intervalo para o mesmo grupo muscular.',
    category: 'metabolico',
    tier: 'avancado',
    tags: ['3 exercícios', 'Volume expressivo']
  },
  {
    id: 'serie_gigante',
    name: 'Série Gigante',
    periodizationPhase: ['Choque'],
    targetLevels: ['Avançado'],
    goal: 'Hipertrofia extrema e condicionamento',
    practicalApplication: 'Execução de 4 ou mais exercícios em sequência direta para a mesma musculatura sem descanso.',
    category: 'metabolico',
    tier: 'elite',
    tags: ['4+ exercícios', 'Choque metabólico']
  },
  {
    id: 'fst7',
    name: 'FST-7 (Fascia Stretch Training)',
    periodizationPhase: ['Choque'],
    targetLevels: ['Avançado'],
    goal: 'Hipertrofia (alongamento de fáscia e pump)',
    practicalApplication: '7 séries de 10-12 repetições no exercício final com 30s de descanso e alongamento muscular intenso nas pausas.',
    category: 'hipertrofia',
    tier: 'elite',
    tags: ['7 séries', 'Fáscia', 'Pump extremo']
  },
  {
    id: 'gvt',
    name: 'GVT (German Volume Training)',
    periodizationPhase: ['Acumulação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Hipertrofia hipertrófica volumétrica',
    practicalApplication: '10 séries de 10 repetições com ~60% de 1RM em um exercício multiarticular com descanso rigoroso de 60s.',
    category: 'hipertrofia',
    tier: 'avancado',
    tags: ['10x10', 'Volume massivo', 'Intervalo fixo']
  },
  {
    id: 'repeticoes_forcadas',
    name: 'Repetições Forçadas',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Avançado'],
    goal: 'Superação da falha concêntrica',
    practicalApplication: 'Ao atingir a falha concêntrica, o treinador/parceiro fornece auxílio mínimo para completar 2 a 4 repetições adicionais.',
    category: 'hipertrofia',
    tier: 'avancado',
    tags: ['Ajuda externa', 'Pós-falha']
  },
  {
    id: 'repeticoes_parciais',
    name: 'Repetições Parciais',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Força específica e sobrecarga do ponto de alavanca',
    practicalApplication: 'Execução continuada na amplitude em que o músculo ainda consegue produzir tensão após perder a amplitude completa.',
    category: 'forca',
    tier: 'intermediario',
    tags: ['Amplitude reduzida', 'Tensão continuada']
  },
  {
    id: 'metodo_eccentrico',
    name: 'Método Excêntrico (Negativas)',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Avançado'],
    goal: 'Força máxima e estresse mecânico',
    practicalApplication: 'Uso de carga supra-máxima (105-120% 1RM) focando o controle lento na fase negativa (3–5s), com auxílio na subida.',
    category: 'forca',
    tier: 'elite',
    tags: ['Fase negativa', 'Sobrecarga supra-máxima']
  },
  {
    id: 'isometria',
    name: 'Isometria / Isometria Tática',
    periodizationPhase: ['Base', 'Reabilitação'],
    targetLevels: ['Iniciante', 'Intermediário', 'Avançado'],
    goal: 'Estabilidade articular e força no ponto cego',
    practicalApplication: 'Sustentação da contração estática sem movimento articular por 5 a 15 segundos no ponto de maior desvantagem.',
    category: 'reabilitacao',
    tier: 'fundamental',
    tags: ['Contração estática', 'Proteção articular']
  },
  {
    id: 'tut',
    name: 'Tempo Sob Tensão (TUT)',
    periodizationPhase: ['Base', 'Preparação'],
    targetLevels: ['Iniciante', 'Intermediário', 'Avançado'],
    goal: 'Hipertrofia por controle de cadência',
    practicalApplication: 'Controle estrito da cadência em cada repetição (ex: 4-0-2-0 -> 4s descendo, 2s subindo) garantindo tempo sob tensão ideal.',
    category: 'hipertrofia',
    tier: 'fundamental',
    tags: ['Cadência controlada', 'Consciência motora']
  },
  {
    id: 'pre_exaustao',
    name: 'Pré-exaustão',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Foco no músculo-alvo sem limitação de sinergistas',
    practicalApplication: 'Realiza um exercício isolador antes do composto principal (ex: Cadeira Extensora antes do Agachamento).',
    category: 'hipertrofia',
    tier: 'intermediario',
    tags: ['Isolador primeiro', 'Avaliador de sinergia']
  },
  {
    id: 'pos_exaustao',
    name: 'Pós-exaustão',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Fadiga máxima do músculo principal',
    practicalApplication: 'Realiza o exercício composto pesado em primeiro lugar e passa imediatamente para o isolador suplementar.',
    category: 'hipertrofia',
    tier: 'intermediario',
    tags: ['Composto primeiro', 'Esgotamento final']
  },
  {
    id: 'oclusao_bfr',
    name: 'Oclusão Vascular (BFR / Kaatsu)',
    periodizationPhase: ['Reabilitação', 'Base'],
    targetLevels: ['Iniciante', 'Intermediário', 'Avançado'],
    goal: 'Hipertrofia com baixa carga mecânica',
    practicalApplication: 'Uso de manguito de restrição sanguínea com 20-30% de 1RM (protocolo 30-15-15-15 reps) estimulando síntese proteica sem impacto articular.',
    category: 'reabilitacao',
    tier: 'avancado',
    tags: ['Restrição vascular', 'Baixa carga', 'Reabilitação']
  },
  {
    id: 'metodo_exaustao',
    name: 'Método de Exaustão',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Recrutamento máximo de unidades motoras',
    practicalApplication: 'Série conduzida rigorosamente até a falha concêntrica real (RPE 10).',
    category: 'metabolico',
    tier: 'intermediario',
    tags: ['RPE 10', 'Falha concêntrica']
  },
  {
    id: 'metodo_21',
    name: 'Método 21',
    periodizationPhase: ['Intensificação'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Pump muscular e variações de alavanca',
    practicalApplication: '7 repetições no 1º meio de amplitude + 7 repetições no 2º meio de amplitude + 7 repetições completas na mesma série.',
    category: 'metabolico',
    tier: 'intermediario',
    tags: ['7+7+7', 'Variabilidade de amplitude']
  },
  {
    id: 'sst',
    name: 'SST (Sarcoplasma Stimulating Training)',
    periodizationPhase: ['Choque'],
    targetLevels: ['Avançado'],
    goal: 'Hipertrofia extrema e estresse sarcoplasmático',
    practicalApplication: 'Combina drop-set, rest-pause e cadências variadas em uma única sequência ininterrupta de alta exaustão.',
    category: 'hipertrofia',
    tier: 'elite',
    tags: ['Sarcoplasma', 'Combinação avançada']
  },
  {
    id: 'metodo_ondulatorio',
    name: 'Método Ondulatório',
    periodizationPhase: ['Todas'],
    targetLevels: ['Intermediário', 'Avançado'],
    goal: 'Força + hipertrofia sem estagnação',
    practicalApplication: 'Varia o volume e a intensidade entre os dias da mesma semana (ex: Segunda foco em Força, Quarta Hipertrofia, Sexta Resistência).',
    category: 'geral',
    tier: 'intermediario',
    tags: ['Ondulação semanal', 'Prevenção de platô']
  },
  {
    id: 'metodo_linear',
    name: 'Método Linear',
    periodizationPhase: ['Base', 'Pico'],
    targetLevels: ['Iniciante', 'Intermediário', 'Avançado'],
    goal: 'Progressão estruturada e previsível',
    practicalApplication: 'Aumento gradual de carga ao longo das semanas reduzindo o volume de repetições de forma inversamente proporcional.',
    category: 'geral',
    tier: 'fundamental',
    tags: ['Carga ascendente', 'Volume descendente']
  },
  {
    id: 'contrast_training',
    name: 'Contrast Training (PAP)',
    periodizationPhase: ['Potência'],
    targetLevels: ['Avançado'],
    goal: 'Potência e potenciação pós-ativação',
    practicalApplication: 'Alterna uma série de força pesada (85%+ 1RM) seguida de um exercício explosivo/pliométrico similar (ex: Agachamento pesado + Salto vertical).',
    category: 'potencia',
    tier: 'elite',
    tags: ['Força + Salto', 'Potenciação PAP']
  },
  {
    id: 'pliometria_carga',
    name: 'Pliometria (com carga)',
    periodizationPhase: ['Potência'],
    targetLevels: ['Avançado'],
    goal: 'Explosão e taxa de desenvolvimento de força (TDF)',
    practicalApplication: 'Movimentos explosivos com ciclo de alongamento-encurtamento rápido (saltos, arremessos) com sobrecarga leve.',
    category: 'potencia',
    tier: 'elite',
    tags: ['CEA rápido', 'Atletas', 'Explosão']
  }
];

/**
 * STRATEGIC RULE ENGINE FOR METHOD RECOMMENDATIONS
 * Enforces periodization guidelines & safety constraints according to level and phase.
 */
export interface MethodEvaluation {
  method: TrainingMethodDefinition;
  isAllowed: boolean;
  score: number; // 0 to 100 recommendation rating
  reason: string;
  warning?: string;
}

export function evaluateMethodForClient(
  methodId: string,
  clientLevel: ClientLevel | string,
  periodizationPhase: string,
  goal: TrainingGoal | string
): MethodEvaluation {
  const method = TRAINING_METHODS_CATALOG.find(m => m.id === methodId || m.name.toLowerCase().includes(methodId.toLowerCase()));
  
  if (!method) {
    return {
      method: {
        id: methodId,
        name: methodId,
        periodizationPhase: ['Todas'],
        targetLevels: ['Iniciante', 'Intermediário', 'Avançado'],
        goal: 'Método customizado',
        practicalApplication: 'Aplicações específicas definidas pelo treinador.',
        category: 'geral',
        tier: 'intermediario',
        tags: []
      },
      isAllowed: true,
      score: 50,
      reason: 'Método customizado selecionado pelo treinador.'
    };
  }

  let isAllowed = true;
  let score = 70;
  let reason = 'Método adequado para o perfil selecionado.';
  let warning: string | undefined = undefined;

  // RULE 1: Level Safety Restrictions
  if (clientLevel === 'Iniciante') {
    const prohibitedForBeginners = ['dropset', 'rest_pause', 'cluster_set', 'serie_gigante', 'fst7', 'sst', 'repeticoes_forcadas', 'metodo_eccentrico', 'contrast_training'];
    if (prohibitedForBeginners.includes(method.id) || method.tier === 'elite' || method.tier === 'avancado') {
      isAllowed = false;
      score = 0;
      reason = `Incompatível com o nível ${clientLevel}.`;
      warning = `Alunos iniciantes não devem usar métodos de extrema exaustão como ${method.name} devido ao risco de lesão e rabdomiólise. Priorize Sobrecarga Progressiva, Método Tradicional ou TUT.`;
    }
  }

  // RULE 2: Periodization Phase Strategy
  const normalizedPhase = periodizationPhase.toLowerCase();
  
  if (normalizedPhase.includes('base') || normalizedPhase.includes('acumula')) {
    if (['tradicional', 'tut', 'metodo_linear', 'isometria', 'sobrecarga_progressiva'].includes(method.id)) {
      score += 25;
      reason = 'Excelente alinhamento estratégico para fase de Base/Acumulação.';
    } else if (['sst', 'fst7', 'serie_gigante'].includes(method.id)) {
      score -= 30;
      warning = `Atenção: O método ${method.name} acumula estresse excessivo para uma fase de Base.`;
    }
  } else if (normalizedPhase.includes('intensifica') || normalizedPhase.includes('choque')) {
    if (['dropset', 'rest_pause', 'cluster_set', 'biset_agonista', 'triset', 'fst7', 'sst'].includes(method.id)) {
      score += 25;
      reason = 'Método de alta intensidade ideal para pico de periodização/choque.';
    }
  } else if (normalizedPhase.includes('potencia')) {
    if (['contrast_training', 'pliometria_carga', 'cluster_set'].includes(method.id)) {
      score += 30;
      reason = 'Método específico e altamente recomendado para desenvolvimento de potência.';
    }
  } else if (normalizedPhase.includes('deload') || normalizedPhase.includes('recupera') || normalizedPhase.includes('reabilita')) {
    if (['isometria', 'oclusao_bfr', 'tradicional'].includes(method.id)) {
      score += 20;
      reason = 'Excelente controle de estresse articular e metabólico.';
    } else if (method.tier === 'avancado' || method.tier === 'elite') {
      isAllowed = false;
      score = 10;
      warning = `Métodos avançados de fadiga (${method.name}) devem ser evitados em semanas de Deload / Reabilitação.`;
    }
  }

  return {
    method,
    isAllowed,
    score: Math.min(100, Math.max(0, score)),
    reason,
    warning
  };
}

/**
 * Returns strategic method recommendations for a student context
 */
export function getRecommendedMethodsForContext(
  level: ClientLevel | string,
  phase: string,
  goal: TrainingGoal | string
): TrainingMethodDefinition[] {
  return TRAINING_METHODS_CATALOG.filter(method => {
    const evalResult = evaluateMethodForClient(method.id, level, phase, goal);
    return evalResult.isAllowed && evalResult.score >= 70;
  }).sort((a, b) => {
    const evalA = evaluateMethodForClient(a.id, level, phase, goal);
    const evalB = evaluateMethodForClient(b.id, level, phase, goal);
    return evalB.score - evalA.score;
  });
}

import { MovementPattern } from '../domain/types';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export type EquipmentCategory = 
  | 'Máquina'
  | 'Polia / Cabo'
  | 'Barra'
  | 'Halteres'
  | 'Peso Corporal'
  | 'Smith Machine'
  | 'Kettlebell'
  | 'Elástico / Band'
  | 'Ergômetro / Funcional';

export type ExerciseTypeCategory = 
  | 'Multiarticular (Composto)'
  | 'Monoarticular (Isolado)'
  | 'Calistenia'
  | 'Funcional / Pliométrico'
  | 'Cardio / Metcon';

export type PrimaryMuscleGroup = 
  | 'Peitoral'
  | 'Dorsal / Latíssimo'
  | 'Deltoide / Ombro'
  | 'Quadríceps'
  | 'Posterior de Coxa'
  | 'Glúteos'
  | 'Bíceps'
  | 'Tríceps'
  | 'Trapézio / Rombóides'
  | 'Core / Abdômen'
  | 'Panturrilha'
  | 'Metcon / Geral';

export interface CatalogExercise {
  id: string;
  n: string;
  name: string;
  p: MovementPattern;
  pattern: MovementPattern;
  eqs: string[];
  equipmentCategory: EquipmentCategory;
  exerciseType: ExerciseTypeCategory;
  primaryMuscle: PrimaryMuscleGroup;
  secondaryMuscles: string[];
  specificMuscles: string[];
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  heavy?: number;
  iso?: number;
  adv?: number;
  av: string[];
  biomechanicsTips: string;
  commonErrors: string[];
  defaultSetsReps: string;
  custom?: boolean;
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  // 1-15: PEITORAL / PUSH HORIZONTAL
  {
    id: "ex-1", n: "Supino Reto com Barra", name: "Supino Reto com Barra", p: "push_h", pattern: "push_h", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps Braquial", "Deltoide Anterior"], specificMuscles: ["Peitoral Maior (esternocostal)"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Escápulas aduzidas e retraídas contra o banco, pegada um pouco além da largura dos ombros e pés apoiados no solo.",
    commonErrors: ["Descolar a coluna sem controle", "Abrir cotovelos a 90° estressando ombros"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-2", n: "Supino Inclinado com Barra", name: "Supino Inclinado com Barra", p: "push_h", pattern: "push_h", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior", "Tríceps Braquial"], specificMuscles: ["Peitoral Maior (clavicular)"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Banco inclinado entre 30° e 45°. Toque a barra na porção clavicular do peitoral.",
    commonErrors: ["Inclinar banco excessivamente acima de 60°"], defaultSetsReps: "3-4 séries x 8-10 reps"
  },
  {
    id: "ex-3", n: "Supino Declinado com Barra", name: "Supino Declinado com Barra", p: "push_h", pattern: "push_h", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps Braquial", "Deltoide Anterior"], specificMuscles: ["Peitoral Maior (porção inferior)"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Enfaza fibras inferiores do peitoral. Mantenha trajetória vertical e alinhada.",
    commonErrors: ["Perder o controle na fase excêntrica"], defaultSetsReps: "3-4 séries x 8-10 reps"
  },
  {
    id: "ex-4", n: "Supino Reto com Halteres", name: "Supino Reto com Halteres", p: "push_h", pattern: "push_h", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps Braquial", "Deltoide Anterior", "Estabilizadores de Ombro"], specificMuscles: ["Peitoral Maior"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Maior amplitude de movimento. Aproxime os halteres no topo sem colidir os pesos.",
    commonErrors: ["Hiperextender ombro na descedida"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-5", n: "Supino Inclinado com Halteres", name: "Supino Inclinado com Halteres", p: "push_h", pattern: "push_h", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior", "Tríceps Braquial"], specificMuscles: ["Peitoral Maior (porção clavicular)"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Mantenha cotovelos a ~60° com o tronco. Foco naPorção superior do peito.",
    commonErrors: ["Arqueamento excessivo da coluna"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-6", n: "Crucifixo com Halteres (Reto)", name: "Crucifixo com Halteres (Reto)", p: "push_h", pattern: "push_h", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior"], specificMuscles: ["Peitoral Maior"], difficulty: "Iniciante", av: ["ombro"],
    biomechanicsTips: "Mantém cotovelos levemente flexionados em arco constante. Sentir o alongamento das fibras.",
    commonErrors: ["Flexionar demais os cotovelos transformando em supino"], defaultSetsReps: "3 séries x 10-15 reps"
  },
  {
    id: "ex-7", n: "Crucifixo Inclinado com Halteres", name: "Crucifixo Inclinado com Halteres", p: "push_h", pattern: "push_h", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior"], specificMuscles: ["Peitoral Maior (clavicular)"], difficulty: "Iniciante", av: ["ombro"],
    biomechanicsTips: "Banco inclinado a 30°. Amplitude controlada e trajeto em semicírculo.",
    commonErrors: ["Carga excessiva comprometendo a forma"], defaultSetsReps: "3 séries x 10-15 reps"
  },
  {
    id: "ex-8", n: "Crossover no Cabo (Alto para Baixo)", name: "Crossover no Cabo (Alto para Baixo)", p: "push_h", pattern: "push_h", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior"], specificMuscles: ["Peitoral Maior (porção inferior)"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Puxe as polias de cima para baixo cruzando as mãos no final do movimento.",
    commonErrors: ["Usar o balanço do corpo para gerar impulso"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-9", n: "Crossover no Cabo (Baixo para Alto)", name: "Crossover no Cabo (Baixo para Alto)", p: "push_h", pattern: "push_h", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior"], specificMuscles: ["Peitoral Maior (clavicular)"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Puxe de baixo para cima direcionando aos ombros. Foco em peitoral superior.",
    commonErrors: ["Elevar escápulas e tencionar pescoço"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-10", n: "Peck Deck / Voador", name: "Peck Deck / Voador", p: "push_h", pattern: "push_h", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide Anterior"], specificMuscles: ["Peitoral Maior"], difficulty: "Iniciante", av: ["ombro"],
    biomechanicsTips: "Ajuste o banco para que as empunhaduras fiquem na linha do peito. Eprema 1s no pico de contração.",
    commonErrors: ["Hiperestender o ombro atrás do tórax na volta"], defaultSetsReps: "3-4 séries x 10-15 reps"
  },
  {
    id: "ex-11", n: "Flexão de Braço (Push-up)", name: "Flexão de Braço (Push-up)", p: "push_h", pattern: "push_h", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps Braquial", "Deltoide Anterior", "Core"], specificMuscles: ["Peitoral Maior"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Mantenha o corpo alinhado da cabeça aos pés. Ative abdômen e glúteos.",
    commonErrors: ["Deixar o quadril cair ou elevar demais a pelve"], defaultSetsReps: "3-4 séries x 10-20 reps"
  },
  {
    id: "ex-12", n: "Flexão Diamante", name: "Flexão Diamante", p: "arms_tri", pattern: "arms_tri", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Peitoral Maior", "Deltoide Anterior"], specificMuscles: ["Tríceps Braquial"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Mãos juntas formando um triângulo sob o peito. Foco na cabeça lateral e medial do tríceps.",
    commonErrors: ["Abrir demais os cotovelos para os lados"], defaultSetsReps: "3 séries x 8-12 reps"
  },
  {
    id: "ex-13", n: "Flexão Declinada", name: "Flexão Declinada", p: "push_h", pattern: "push_h", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps", "Deltoide Anterior"], specificMuscles: ["Peitoral Maior (porção superior)"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Pés elevados em banco ou caixa. Maior sobrecarga no peitoral superior e ombros.",
    commonErrors: ["Perder o alinhamento da coluna lombar"], defaultSetsReps: "3-4 séries x 8-15 reps"
  },
  {
    id: "ex-14", n: "Flexão com Aplauso", name: "Flexão com Aplauso", p: "push_h", pattern: "push_h", eqs: ["full", "bw", "func"],
    equipmentCategory: "Peso Corporal", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps", "Deltoide Anterior", "Core"], specificMuscles: ["Peitoral Maior"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Empurrão explosivo de alta potência para descolar as mãos do chão e bater palma.",
    commonErrors: ["Aterrisagem rígida com cotovelos travados"], defaultSetsReps: "3-4 séries x 5-8 reps"
  },
  {
    id: "ex-15", n: "Dips (Paralelas) - Ênfase Peito", name: "Dips (Paralelas) - Ênfase Peito", p: "push_h", pattern: "push_h", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Tríceps Braquial", "Deltoide Anterior"], specificMuscles: ["Peitoral Maior (porção inferior)"], difficulty: "Intermediário", av: ["ombro"],
    biomechanicsTips: "Incline o tronco levemente para a frente e abra levemente os cotovelos para enfatizar o peito.",
    commonErrors: ["Descer fundo demais se houver dor ou limitação no ombro"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },

  // 16-31: DORSAL / COSTAS / PULL VERTICAL E HORIZONTAL
  {
    id: "ex-16", n: "Barra Fixa (Pull-up) Pronada", name: "Barra Fixa (Pull-up) Pronada", p: "pull_v", pattern: "pull_v", eqs: ["full", "bw", "func"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps Braquial", "Romboides", "Trapézio Médio/Inferior"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Pegada em pronação mais larga que os ombros. Deprima as escápulas e puxe o peito em direção à barra.",
    commonErrors: ["Uso de balanço de pernas (kipping) sem controle"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-17", n: "Barra Fixa Supinada (Chin-up)", name: "Barra Fixa Supinada (Chin-up)", p: "pull_v", pattern: "pull_v", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps Braquial", "Romboides"], specificMuscles: ["Latíssimo do Dorso", "Bíceps"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Pegada supinada na largura dos ombros. Forte recrutamento de bíceps e dorsal.",
    commonErrors: ["Não realizar extensão completa dos cotovelos na fase inferior"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-18", n: "Barra Fixa Neutra", name: "Barra Fixa Neutra", p: "pull_v", pattern: "pull_v", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps Braquial", "Braquial"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Pegada neutra (palmas voltadas uma para a outra). Posição mais anatômica e segura para o ombro.",
    commonErrors: ["Projetar os ombros para a frente no topo"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-19", n: "Remada Curvada com Barra", name: "Remada Curvada com Barra", p: "pull_h", pattern: "pull_h", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Trapézio", "Bíceps", "Eretores da Espinha"], specificMuscles: ["Latíssimo do Dorso", "Romboides"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Tronco inclinado a ~45° com a coluna neutra. Puxe a barra em direção ao umbigo.",
    commonErrors: ["Arredondar a coluna lombar por falta de estabilização do core"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-20", n: "Remada Unilateral com Halter", name: "Remada Unilateral com Halter", p: "pull_h", pattern: "pull_h", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Romboides", "Trapézio", "Bíceps", "Eretores da Espinha"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Apoie joelho e mão no banco. Puxe o halter em direção ao quadril cotovelo rente ao corpo.",
    commonErrors: ["Girar o tronco excessivamente no topo"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-21", n: "Remada Cavalinho (T-Bar)", name: "Remada Cavalinho (T-Bar)", p: "pull_h", pattern: "pull_h", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Trapézio", "Bíceps"], specificMuscles: ["Latíssimo do Dorso", "Romboides"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Pegada neutra na barra T. Puxe firme expandindo o peitoral e aduzindo escápulas.",
    commonErrors: ["Usar impulso do quadril para subir a carga"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-22", n: "Puxada Frontal (Lat Pulldown)", name: "Puxada Frontal (Lat Pulldown)", p: "pull_v", pattern: "pull_v", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps Braquial", "Romboides", "Trapézio"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Sentado, tronco levemente inclinado a 15°. Puxe a barra em direção à clavícula.",
    commonErrors: ["Inclinar demais o tronco para trás virando remada"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-23", n: "Puxada Atrás da Nuca", name: "Puxada Atrás da Nuca", p: "pull_v", pattern: "pull_v", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Romboides", "Trapézio"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Avançado", av: ["ombro", "cervical"],
    biomechanicsTips: "Exige alta mobilidade de ombro e coluna torácica. Puxe com controle sem projetar o pescoço.",
    commonErrors: ["Projetar a cabeça para frente com impacto na cervical"], defaultSetsReps: "3 séries x 10-12 reps"
  },
  {
    id: "ex-24", n: "Remada Sentada no Cabo", name: "Remada Sentada no Cabo", p: "pull_h", pattern: "pull_h", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Trapézio Médio", "Bíceps"], specificMuscles: ["Latíssimo do Dorso", "Romboides"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Pés firmes na base, joelhos levemente flexionados. Puxe o puxador ao abdômen retendo escápulas.",
    commonErrors: ["Balançar o tronco para frente e para trás sem estabilização"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-25", n: "Remada Baixa com Pegada Fechada", name: "Remada Baixa com Pegada Fechada", p: "pull_h", pattern: "pull_h", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps", "Romboides"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Triângulo na polia baixa. Enfaza na espessura do latíssimo e contração do miolo das costas.",
    commonErrors: ["Projetar ombros à frente na fase excêntrica"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-26", n: "Pullover com Halter", name: "Pullover com Halter", p: "pull_v", pattern: "pull_v", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Peitoral Maior", "Serrátil Anterior", "Tríceps"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Intermediário", av: ["ombro"],
    biomechanicsTips: "Deitado no banco, halter segurado pelas duas mãos sobre o peito. Desça em arco alongando a dorsal.",
    commonErrors: ["Dobrar cotovelos em excesso transformando em tríceps francês"], defaultSetsReps: "3 séries x 10-12 reps"
  },
  {
    id: "ex-27", n: "Pullover no Cabo", name: "Pullover no Cabo", p: "pull_v", pattern: "pull_v", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Serrátil Anterior", "Peitoral"], specificMuscles: ["Latíssimo do Dorso"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Barra reta na polia alta. Mantenha os braços quase retos e puxe a barra até a coxa.",
    commonErrors: ["Usar flexão de cotovelos em vez da extensão de ombros"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-28", n: "Face Pull", name: "Face Pull", p: "rear", pattern: "rear", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Trapézio / Rombóides",
    secondaryMuscles: ["Deltoide Posterior", "Manguito Rotador"], specificMuscles: ["Trapézio Médio/Inferior", "Romboides"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Polia na altura dos olhos com corda. Puxe em direção ao rosto abrindo os cotovelos e fazendo rotação externa.",
    commonErrors: ["Puxar para baixo na altura do peito sem rotação externa"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-29", n: "Encolhimento de Ombros com Barra", name: "Encolhimento de Ombros com Barra", p: "shoulder_iso", pattern: "shoulder_iso", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Trapézio / Rombóides",
    secondaryMuscles: ["Elevador da Escápula"], specificMuscles: ["Trapézio Superior"], difficulty: "Iniciante", av: ["cervical"],
    biomechanicsTips: "Eleve os ombros diretamente em direção às orelhas em plano vertical. Mantenha os braços estendidos.",
    commonErrors: ["Girar os ombros em círculos (causa atrito e estresse desnecessário)"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-30", n: "Encolhimento com Halteres", name: "Encolhimento com Halteres", p: "shoulder_iso", pattern: "shoulder_iso", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Trapézio / Rombóides",
    secondaryMuscles: ["Elevador da Escápula"], specificMuscles: ["Trapézio Superior"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Halteres ao lado do corpo. Suba o ombro вертикаmente e segure 1 segundo no topo.",
    commonErrors: ["Flexionar cotovelos para ajudar na elevação"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-31", n: "Remada Invertida (Inverted Row)", name: "Remada Invertida (Inverted Row)", p: "pull_h", pattern: "pull_h", eqs: ["full", "bw", "func"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps", "Trapézio", "Core"], specificMuscles: ["Latíssimo do Dorso", "Romboides"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Corpo suspenso sob barra baixa ou TRX. Puxe o peito até a barra mantendo o alinhamento corporal.",
    commonErrors: ["Deixar o quadril arriar durante a subida"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },

  // 32-42: DELTOIDE / OMBRO / PUSH VERTICAL
  {
    id: "ex-32", n: "Desenvolvimento Militar com Barra", name: "Desenvolvimento Militar com Barra", p: "push_v", pattern: "push_v", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps Braquial", "Trapézio Superior", "Core"], specificMuscles: ["Deltoide Anterior", "Deltoide Lateral"], difficulty: "Intermediário", av: ["ombro", "lombar"],
    biomechanicsTips: "Executado em pé. Glúteos e abdômen contraídos. Empurre a barra verticalmente passando rente ao rosto.",
    commonErrors: ["Hiperestender a coluna lombar inclinando-se para trás"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-33", n: "Desenvolvimento com Halteres Sentado", name: "Desenvolvimento com Halteres Sentado", p: "push_v", pattern: "push_v", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps Braquial"], specificMuscles: ["Deltoide Anterior", "Deltoide Lateral"], difficulty: "Iniciante", av: ["ombro"],
    biomechanicsTips: "Sentado em banco a 80°-90°. Suba os halteres em trajetória suave até quase encostar no topo.",
    commonErrors: ["Bater os halteres fortemente no topo"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-34", n: "Desenvolvimento Arnold", name: "Desenvolvimento Arnold", p: "push_v", pattern: "push_v", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps Braquial"], specificMuscles: ["Deltoide (todas as porções)"], difficulty: "Intermediário", av: ["ombro"],
    biomechanicsTips: "Inicie com palmas viradas para você na altura dos ombros e rode os punhos para fora durante a subida.",
    commonErrors: ["Girar acelerado sem controle de carga"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-35", n: "Elevação Lateral com Halteres", name: "Elevação Lateral com Halteres", p: "shoulder_iso", pattern: "shoulder_iso", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Trapézio Superior"], specificMuscles: ["Deltoide Lateral"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Eleve os braços no plano escapular (~30° à frente) até a altura dos ombros. Cotovelos levemente dobrados.",
    commonErrors: ["Usar o balanço do tronco para subir os pesos"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-36", n: "Elevação Frontal com Halteres", name: "Elevação Frontal com Halteres", p: "shoulder_iso", pattern: "shoulder_iso", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Peitoral Superior"], specificMuscles: ["Deltoide Anterior"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Eleve o halter à frente até a linha dos olhos com controle na descida.",
    commonErrors: ["Projectar o tronco para trás ao subir o halter"], defaultSetsReps: "3 séries x 10-12 reps"
  },
  {
    id: "ex-37", n: "Elevação Posterior (Pássaro)", name: "Elevação Posterior (Pássaro)", p: "rear", pattern: "rear", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Romboides", "Trapézio Médio"], specificMuscles: ["Deltoide Posterior"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Tronco flexionado à frente a ~70°. Abra os braços para os lados focando na porção posterior do ombro.",
    commonErrors: ["Usar trapézio superior encolhendo os ombros"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-38", n: "Elevação Lateral no Cabo", name: "Elevação Lateral no Cabo", p: "shoulder_iso", pattern: "shoulder_iso", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Trapézio Superior"], specificMuscles: ["Deltoide Lateral"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Garante tensão contínua em toda a amplitude. Puxe o cabo cruzando por trás ou pela frente das pernas.",
    commonErrors: ["Subir o braço além da linha do ombro desencadeando trapézio"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-39", n: "Remada Alta com Barra", name: "Remada Alta com Barra", p: "shoulder_iso", pattern: "shoulder_iso", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Bíceps", "Romboides"], specificMuscles: ["Deltoide Lateral", "Trapézio Superior"], difficulty: "Intermediário", av: ["ombro"],
    biomechanicsTips: "Puxe a barra verticalmente até a linha do peito mantendo cotovelos mais altos que as mãos.",
    commonErrors: ["Subir demais a barra acima do peito causando impacto subacromial"], defaultSetsReps: "3 séries x 10-12 reps"
  },
  {
    id: "ex-40", n: "Desenvolvimento Behind the Neck", name: "Desenvolvimento Behind the Neck", p: "push_v", pattern: "push_v", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps", "Trapézio"], specificMuscles: ["Deltoide"], difficulty: "Avançado", av: ["ombro", "cervical"],
    biomechanicsTips: "Desenvolvimento atrás da cabeça. Requer alta mobilidade e estabilidade escapular.",
    commonErrors: ["Forçar a barra fundo demais sem amplitude segura"], defaultSetsReps: "3 séries x 8-10 reps"
  },
  {
    id: "ex-41", n: "Handstand Push-up", name: "Handstand Push-up", p: "push_v", pattern: "push_v", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps", "Trapézio", "Core"], specificMuscles: ["Deltoide Anterior", "Deltoide Lateral"], difficulty: "Avançado", av: ["ombro"],
    biomechanicsTips: "Flexão de braço em parada de mão na parede. Alto nível de força relativa e estabilização.",
    commonErrors: ["Hiperestender a coluna em arco acentuado"], defaultSetsReps: "3-4 séries x 4-8 reps"
  },
  {
    id: "ex-42", n: "Pike Push-up", name: "Pike Push-up", p: "push_v", pattern: "push_v", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps", "Core"], specificMuscles: ["Deltoide Anterior"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Quadril elevado formando V inverso. Educativo excelente para o Handstand Push-up.",
    commonErrors: ["Deixar o quadril arriar virando flexão convencional"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },

  // 43-52: BÍCEPS / BRAÇOS PULL
  {
    id: "ex-43", n: "Rosca Direta com Barra", name: "Rosca Direta com Barra", p: "arms_bi", pattern: "arms_bi", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial", "Braquiorradial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Cotovelos fixos ao lado do tronco. Flexione os braços com pegada supinada sem balançar o corpo.",
    commonErrors: ["Usar impulso da coluna lombar para subir a barra"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-44", n: "Rosca Direta com Barra W", name: "Rosca Direta com Barra W", p: "arms_bi", pattern: "arms_bi", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Barra W reduz estresse nos punhos e antebraços. Excelente conforto articular.",
    commonErrors: ["Movimentar os cotovelos para frente durante a subida"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-45", n: "Rosca Alternada com Halteres", name: "Rosca Alternada com Halteres", p: "arms_bi", pattern: "arms_bi", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial", "Braquiorradial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Gire o punho (supinação) durante a subida do halter para recrutamento máximo do bíceps.",
    commonErrors: ["Perder a rotação do punho subindo neutro"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-46", n: "Rosca Martelo", name: "Rosca Martelo", p: "arms_bi", pattern: "arms_bi", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial"], specificMuscles: ["Braquiorradial", "Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Pegada neutra (palmas voltadas para dentro). Foco no braquiorradial e braquial.",
    commonErrors: ["Projetar o tronco para trás"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-47", n: "Rosca Concentrada", name: "Rosca Concentrada", p: "arms_bi", pattern: "arms_bi", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Cotovelo apoiado na parte interna da coxa. Elimina qualquer roubo por impulso.",
    commonErrors: ["Descolar o cotovelo da coxa na subida"], defaultSetsReps: "3 séries x 10-12 reps"
  },
  {
    id: "ex-48", n: "Rosca Scott (Banco Scott)", name: "Rosca Scott (Banco Scott)", p: "arms_bi", pattern: "arms_bi", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Braços totalmente apoiados no estofado Scott. Pico de tensão na fase inicial do movimento.",
    commonErrors: ["Hiperestender e travar o cotovelo bruscamente na descedida"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-49", n: "Rosca no Cabo (Polia Baixa)", name: "Rosca no Cabo (Polia Baixa)", p: "arms_bi", pattern: "arms_bi", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Tensão constante fornecida pelo cabo durante toda a amplitude de flexão de cotovelo.",
    commonErrors: ["Avançar os cotovelos para frente no final da subida"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-50", n: "Rosca Inversa", name: "Rosca Inversa", p: "arms_bi", pattern: "arms_bi", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Bíceps Braquial", "Extensores do Punho"], specificMuscles: ["Braquiorradial"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Pegada pronada (palmas para baixo). Forte estímulo para antebraços e braquiorradial.",
    commonErrors: ["Dobrar os punhos para cima ao flexionar"], defaultSetsReps: "3 séries x 10-12 reps"
  },
  {
    id: "ex-51", n: "Rosca 21", name: "Rosca 21", p: "arms_bi", pattern: "arms_bi", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Braquial"], specificMuscles: ["Bíceps Braquial"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Método metabólico: 7 reps metade inferior, 7 reps metade superior e 7 reps amplitude completa.",
    commonErrors: ["Usar carga alta demais e perder a técnica no final"], defaultSetsReps: "3 séries x 21 reps (7+7+7)"
  },
  {
    id: "ex-52", n: "Chin-up (Ênfase Bíceps)", name: "Chin-up (Ênfase Bíceps)", p: "arms_bi", pattern: "arms_bi", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Bíceps",
    secondaryMuscles: ["Latíssimo do Dorso"], specificMuscles: ["Bíceps Braquial"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Barra fixa supinada focando na flexão intencional dos braços puxando o corpo.",
    commonErrors: ["Amplitude incompleta no topo ou na base"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },

  // 53-62: TRÍCEPS / BRAÇOS PUSH
  {
    id: "ex-53", n: "Tríceps Testa com Barra", name: "Tríceps Testa com Barra", p: "arms_tri", pattern: "arms_tri", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: ["cotovelo"],
    biomechanicsTips: "Deitado no banco, cotovelos apontados para o teto. Desça a barra em direção à testa/topo da cabeça.",
    commonErrors: ["Abrir os cotovelos para os lados durante o movimento"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-54", n: "Tríceps Testa com Halteres", name: "Tríceps Testa com Halteres", p: "arms_tri", pattern: "arms_tri", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Pegada neutra com halteres. Permite trabalho independente de cada membro e ajuste de punho.",
    commonErrors: ["Mover os braços pela articulação do ombro em vez de isolar o cotovelo"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-55", n: "Tríceps Francês (Overhead)", name: "Tríceps Francês (Overhead)", p: "arms_tri", pattern: "arms_tri", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial (cabeça longa)"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Halter segurado acima da cabeça. Foco máximo de alongamento na cabeça longa do tríceps.",
    commonErrors: ["Arquear a coluna lombar na extensão acima da cabeça"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-56", n: "Tríceps Corda no Cabo", name: "Tríceps Corda no Cabo", p: "arms_tri", pattern: "arms_tri", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Empurre a corda para baixo abrindo as pontas no final do movimento para contração máxima.",
    commonErrors: ["Usar o peso do corpo inclinando por cima da corda"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-57", n: "Tríceps Barra Reta no Cabo", name: "Tríceps Barra Reta no Cabo", p: "arms_tri", pattern: "arms_tri", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Cotovelos colados às costelas. Empurre a barra até a extensão completa dos cotovelos.",
    commonErrors: ["Subir a barra muito alto descolando cotovelos da lateral"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-58", n: "Tríceps Coice com Halter", name: "Tríceps Coice com Halter", p: "arms_tri", pattern: "arms_tri", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Tronco paralelo ao solo. Estenda o cotovelo para trás até alinhar com o braço.",
    commonErrors: ["Deixar o cotovelo cair perdendo o ponto de alavanca"], defaultSetsReps: "3 séries x 12-15 reps"
  },
  {
    id: "ex-59", n: "Dips (Paralelas) - Ênfase Tríceps", name: "Dips (Paralelas) - Ênfase Tríceps", p: "arms_tri", pattern: "arms_tri", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Peitoral Maior", "Deltoide Anterior"], specificMuscles: ["Tríceps Braquial"], difficulty: "Intermediário", av: ["ombro"],
    biomechanicsTips: "Tronco ereto e vertical, cotovelos mantidos mais próximos ao corpo durante a descida.",
    commonErrors: ["Descer rápido demais sem controle de estabilização"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-60", n: "Mergulho no Banco (Bench Dips)", name: "Mergulho no Banco (Bench Dips)", p: "arms_tri", pattern: "arms_tri", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Peitoral", "Deltoide Anterior"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: ["ombro"],
    biomechanicsTips: "Mãos apoiadas no banco atrás das costas. Flexione e estenda os cotovelos verticalmente.",
    commonErrors: ["Afastar o quadril demais do banco estressando os ombros"], defaultSetsReps: "3-4 séries x 10-15 reps"
  },
  {
    id: "ex-61", n: "Extensão de Tríceps Unilateral no Cabo", name: "Extensão de Tríceps Unilateral no Cabo", p: "arms_tri", pattern: "arms_tri", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Anconeu"], specificMuscles: ["Tríceps Braquial"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Execução com uma mão por vez na polia sem manopla ou com pegada simples. Corrige assimetrias.",
    commonErrors: ["Girar o corpo para ajudar a puxar a carga"], defaultSetsReps: "3 séries x 12-15 reps"
  },
  {
    id: "ex-62", n: "Close-Grip Bench Press", name: "Close-Grip Bench Press", p: "arms_tri", pattern: "arms_tri", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Peitoral Maior", "Deltoide Anterior"], specificMuscles: ["Tríceps Braquial"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Supino com pegada fechada (na largura dos ombros). Cotovelos passam rente às costelas.",
    commonErrors: ["Juntar as mãos demais sob risco de sobrecarga articular nos punhos"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },

  // 63-75: QUADRÍCEPS / PERNAS PUSH
  {
    id: "ex-63", n: "Agachamento Livre com Barra (Back Squat)", name: "Agachamento Livre com Barra (Back Squat)", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Isquiotibiais", "Eretores", "Core"], specificMuscles: ["Quadríceps"], difficulty: "Intermediário", av: ["joelho", "lombar"],
    biomechanicsTips: "Barra sobre o trapézio, pés na largura dos ombros. Flexione joelhos e quadril simultaneamente mantendo pés bem plantados.",
    commonErrors: ["Valgo dinâmico (joelhos caindo para dentro)", "Perder a curvatura lombar no fundo (butt wink)"], defaultSetsReps: "3-5 séries x 6-10 reps"
  },
  {
    id: "ex-64", n: "Agachamento Frontal (Front Squat)", name: "Agachamento Frontal (Front Squat)", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Core", "Eretores"], specificMuscles: ["Quadríceps"], difficulty: "Avançado", av: ["joelho", "pulso"],
    biomechanicsTips: "Barra apoiada sobre os deltoides anteriores com cotovelos altos. Maior sobrecarga vertical nos quadríceps.",
    commonErrors: ["Deixar os cotovelos caírem derrubando a barra para frente"], defaultSetsReps: "3-4 séries x 6-8 reps"
  },
  {
    id: "ex-65", n: "Agachamento Goblet", name: "Agachamento Goblet", p: "quad", pattern: "quad", eqs: ["full", "db", "func", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Core"], specificMuscles: ["Quadríceps"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Halter ou Kettlebell segurado junto ao peitoral. Excelente para aprendizado do padrão motor de agachar.",
    commonErrors: ["Inclinando demais o tronco à frente"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-66", n: "Agachamento Búlgaro", name: "Agachamento Búlgaro", p: "quad", pattern: "quad", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Isquiotibiais", "Core"], specificMuscles: ["Quadríceps"], difficulty: "Intermediário", av: ["joelho"],
    biomechanicsTips: "Pé traseiro elevado em banco. Exercício unilateral potente para estabilização de pelve e força de quadríceps/glúteo.",
    commonErrors: ["Projetar o joelho da frente excessivamente para dentro"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-67", n: "Leg Press 45°", name: "Leg Press 45°", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Isquiotibiais"], specificMuscles: ["Quadríceps"], difficulty: "Iniciante", av: ["lombar", "joelho"],
    biomechanicsTips: "Pés apoiados na plataforma na largura dos ombros. Desça até 90° sem descolar o quadril do encosto.",
    commonErrors: ["Retroversão pélvica descolando a lombar da máquina no final da descida"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-68", n: "Hack Squat", name: "Hack Squat", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo"], specificMuscles: ["Quadríceps"], difficulty: "Intermediário", av: ["joelho"],
    biomechanicsTips: "Costas totalmente apoiadas no carrinho do Hack. Alta solicitação isolada de quadríceps com segurança.",
    commonErrors: ["Tirar os calcanhares da plataforma durante a flexão"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-69", n: "Cadeira Extensora", name: "Cadeira Extensora", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Quadríceps",
    secondaryMuscles: [], specificMuscles: ["Quadríceps (Reto Femoral / Vasto Lateral)"], difficulty: "Iniciante", av: ["joelho"],
    biomechanicsTips: "Ajuste o eixo da máquina exatamente com a articulação do joelho. Estenda as pernas sem dar trancos.",
    commonErrors: ["Arremessar a carga com impulso sem controle excêntrico"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-70", n: "Afundo (Lunge) com Halteres", name: "Afundo (Lunge) com Halteres", p: "quad", pattern: "quad", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Isquiotibiais", "Core"], specificMuscles: ["Quadríceps"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Passada estática ou alternada. Desça verticalmente até o joelho traseiro quase tocar o solo.",
    commonErrors: ["Tocar o joelho com força no chão ou inclinar e virar o quadril"], defaultSetsReps: "3-4 séries x 10-12 reps por perna"
  },
  {
    id: "ex-71", n: "Afundo Andando", name: "Afundo Andando", p: "quad", pattern: "quad", eqs: ["full", "db", "func"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Isquiotibiais", "Core"], specificMuscles: ["Quadríceps"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Caminhada contínua em passos largos com controle de equilíbrio e ritmo firme.",
    commonErrors: ["Passadas muito curtas sobrecarregando a patela"], defaultSetsReps: "3-4 séries x 10-12 passos cada perna"
  },
  {
    id: "ex-72", n: "Step-up", name: "Step-up", p: "quad", pattern: "quad", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo Máximo", "Core"], specificMuscles: ["Quadríceps"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Subida em banco ou caixa. Empurre concentrando a força no pé que está sobre a caixa.",
    commonErrors: ["Dar impulso com a perna de baixo no chão"], defaultSetsReps: "3-4 séries x 10-12 reps cada perna"
  },
  {
    id: "ex-73", n: "Agachamento Sumô", name: "Agachamento Sumô", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Adutores", "Glúteo Máximo"], specificMuscles: ["Quadríceps", "Adutores"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Pés afastados além dos ombros e apontados para fora a 45°. Foco em adutores e quadríceps.",
    commonErrors: ["Deixar joelhos caírem para dentro desalinhando dos pés"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-74", n: "Agachamento Pistol", name: "Agachamento Pistol", p: "quad", pattern: "quad", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo", "Core", "Equilíbrio"], specificMuscles: ["Quadríceps"], difficulty: "Avançado", av: ["joelho"],
    biomechanicsTips: "Agachamento completo em apenas uma perna com a outra estendida à frente. Requer alta mobilidade de tornozelo.",
    commonErrors: ["Perder o equilíbrio caindo para trás ou colapsar o joelho"], defaultSetsReps: "3 séries x 4-8 reps cada perna"
  },
  {
    id: "ex-75", n: "Sissy Squat", name: "Sissy Squat", p: "quad", pattern: "quad", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Quadríceps",
    secondaryMuscles: [], specificMuscles: ["Quadríceps (ênfase reto femoral)"], difficulty: "Avançado", av: ["joelho"],
    biomechanicsTips: "Projeta os joelhos à frente enquanto o tronco se inclina para trás em linha reta com as coxas. Isolamento de quadríceps.",
    commonErrors: ["Dobrar o quadril quebrando a linha reta tronco-coxa"], defaultSetsReps: "3 séries x 8-12 reps"
  },

  // 76-88: POSTERIOR DE COXA E GLÚTEOS / HINGE
  {
    id: "ex-76", n: "Levantamento Terra Convencional", name: "Levantamento Terra Convencional", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Glúteo Máximo", "Eretores da Espinha", "Quadríceps", "Trapézio", "Core"], specificMuscles: ["Isquiotibiais", "Glúteo Máximo"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Barra colada às canelas, escápulas ativas, tronco ereto. Puxe a barra estendendo quadril e joelhos simultaneamente.",
    commonErrors: ["Arredondar a coluna lombar na saída do chão"], defaultSetsReps: "3-5 séries x 5-8 reps"
  },
  {
    id: "ex-77", n: "Levantamento Terra Sumô", name: "Levantamento Terra Sumô", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Adutores", "Isquiotibiais", "Quadríceps", "Eretores"], specificMuscles: ["Glúteo Máximo", "Adutores"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Base bem larga, braços por dentro das pernas. Menor braço de alavanca na lombar, maior recrutamento de glúteo e adutores.",
    commonErrors: ["Subir o quadril primeiro que o tórax"], defaultSetsReps: "3-5 séries x 5-8 reps"
  },
  {
    id: "ex-78", n: "Levantamento Terra Romeno (RDL)", name: "Levantamento Terra Romeno (RDL)", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Glúteo Máximo", "Eretores da Espinha", "Core"], specificMuscles: ["Isquiotibiais"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Inicie no topo. Projete o quadril para trás com joelhos semi-flexionados sentindo o alongamento dos isquiotibiais.",
    commonErrors: ["Dobrar os joelhos demais virando agachamento ou flexionar a coluna"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-79", n: "Stiff com Halteres", name: "Stiff com Halteres", p: "hinge", pattern: "hinge", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Glúteo Máximo", "Eretores da Espinha"], specificMuscles: ["Isquiotibiais"], difficulty: "Iniciante", av: ["lombar"],
    biomechanicsTips: "Mantenha halteres rente às pernas, joelhos quase estendidos (com microflexão de proteção).",
    commonErrors: ["Tentar encostar o halter no chão flexionando a coluna"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-80", n: "Mesa Flexora", name: "Mesa Flexora", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: [], specificMuscles: ["Isquiotibiais"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Deitado em decúbito ventral. Flexione os joelhos trazendo o rolo em direção ao glúteo com quadril colado ao banco.",
    commonErrors: ["Elevar o quadril da mesa na fase de contração"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-81", n: "Cadeira Flexora", name: "Cadeira Flexora", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: [], specificMuscles: ["Isquiotibiais"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Sentado, tronco ereto contra o encosto. Permite maior alongamento prévio dos isquiotibiais devido à flexão de quadril.",
    commonErrors: ["Inclinando o tronco para frente para compensar a carga"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-82", n: "Good Morning", name: "Good Morning", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Eretores da Espinha", "Glúteo Máximo"], specificMuscles: ["Isquiotibiais", "Eretores"], difficulty: "Avançado", av: ["lombar"],
    biomechanicsTips: "Barra sobre o trapézio superior. Flexione o quadril à frente mantendo a coluna rigidamente neutra.",
    commonErrors: ["Sobrecarregar com peso excessivo comprometendo a lombar"], defaultSetsReps: "3 séries x 8-10 reps"
  },
  {
    id: "ex-83", n: "Hip Thrust com Barra", name: "Hip Thrust com Barra", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Isquiotibiais", "Core"], specificMuscles: ["Glúteo Máximo"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Escápulas apoiadas no banco, barra sobre a pelve. Eleve o quadril até alinhar tronco e coxas espremendo o glúteo no topo.",
    commonErrors: ["Hiperextender a coluna lombar no topo em vez de fazer retroversão pélvica"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-84", n: "Ponte de Glúteo (Glute Bridge)", name: "Ponte de Glúteo (Glute Bridge)", p: "hinge", pattern: "hinge", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Isquiotibiais", "Core"], specificMuscles: ["Glúteo Máximo"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Deitado de costas no solo, joelhos flexionados e pés firmes. Eleve o quadril espremendo glúteos.",
    commonErrors: ["Forçar a subida pelos joelhos e não pela extensão de quadril"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-85", n: "Kickback no Cabo", name: "Kickback no Cabo", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Isquiotibiais"], specificMuscles: ["Glúteo Máximo"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Tornozeleira conectada à polia baixa. Puxe a perna para trás em extensão de quadril controlada.",
    commonErrors: ["Arquear a lombar para chutar mais alto"], defaultSetsReps: "3-4 séries x 12-15 reps cada perna"
  },
  {
    id: "ex-86", n: "Abdução de Quadril na Máquina", name: "Abdução de Quadril na Máquina", p: "hinge", pattern: "hinge", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Glúteo Mínimo"], specificMuscles: ["Glúteo Médio"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Sentado, abra as pernas contra a resistência dos estofados laterais. Foco no glúteo médio.",
    commonErrors: ["Usar o tronco para dar impulso"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-87", n: "Monster Walk / Band Walk", name: "Monster Walk / Band Walk", p: "hinge", pattern: "hinge", eqs: ["full", "func", "home"],
    equipmentCategory: "Elástico / Band", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Glúteo Máximo", "Core"], specificMuscles: ["Glúteo Médio"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Mini band posicionada acima dos joelhos ou tornozelos. Passos laterais mantendo joelhos afastados.",
    commonErrors: ["Deixar a band afrouxar totalmente entre os passos"], defaultSetsReps: "3 séries x 15-20 passos cada lado"
  },
  {
    id: "ex-88", n: "Nordic Curl", name: "Nordic Curl", p: "hinge", pattern: "hinge", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Glúteo", "Core"], specificMuscles: ["Isquiotibiais"], difficulty: "Avançado", av: ["joelho"],
    biomechanicsTips: "Ajoelhado com tornozelos presos. Desça o tronco à frente controlando a fase excêntrica dos isquiotibiais.",
    commonErrors: ["Dobrar o quadril durante a descida"], defaultSetsReps: "3 séries x 4-6 reps"
  },

  // 89-92: PANTURRILHA
  {
    id: "ex-89", n: "Elevação de Panturrilha em Pé", name: "Elevação de Panturrilha em Pé", p: "calf", pattern: "calf", eqs: ["full", "db", "home"],
    equipmentCategory: "Barra", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Panturrilha",
    secondaryMuscles: ["Sóleo"], specificMuscles: ["Gastrocnêmio"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Com joelhos estendidos (para enfatizar o gastrocnêmio), suba na ponta dos pés na máxima amplitude.",
    commonErrors: ["Quicar no ponto inferior sem pausa"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-90", n: "Elevação de Panturrilha Sentado", name: "Elevação de Panturrilha Sentado", p: "calf", pattern: "calf", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Panturrilha",
    secondaryMuscles: ["Gastrocnêmio"], specificMuscles: ["Sóleo"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Com joelhos flexionados a 90°, a ação do gastrocnêmio diminui e o sóleo é isolado.",
    commonErrors: ["Amplitude curta de movimento"], defaultSetsReps: "3-4 séries x 15-20 reps"
  },
  {
    id: "ex-91", n: "Elevação de Panturrilha no Leg Press", name: "Elevação de Panturrilha no Leg Press", p: "calf", pattern: "calf", eqs: ["full"],
    equipmentCategory: "Máquina", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Panturrilha",
    secondaryMuscles: ["Sóleo"], specificMuscles: ["Gastrocnêmio"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Apenas as pontas dos pés na borda inferior da plataforma. Empurre flexionando e estendendo o tornozelo.",
    commonErrors: ["Dobrar os joelhos durante a flexão plantar"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-92", n: "Elevação Unilateral de Panturrilha", name: "Elevação Unilateral de Panturrilha", p: "calf", pattern: "calf", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Monoarticular (Isolado)", primaryMuscle: "Panturrilha",
    secondaryMuscles: ["Sóleo", "Equilíbrio"], specificMuscles: ["Gastrocnêmio"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Executado em uma perna por vez num degrau. Excelente controle e correção de assimetria.",
    commonErrors: ["Usar a mão de apoio para empurrar o corpo"], defaultSetsReps: "3 séries x 12-15 reps cada perna"
  },

  // 93-105: CORE / ABDÔMEN
  {
    id: "ex-93", n: "Prancha (Plank)", name: "Prancha (Plank)", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Oblíquos", "Eretores", "Ombros"], specificMuscles: ["Transverso do Abdômen", "Reto Abdominal"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Antebraços no chão, cotovelos sob os ombros. Mantenha linha reta da cabeça aos calcanhares.",
    commonErrors: ["Deixar o quadril arriar ou subir demais em V"], defaultSetsReps: "3-4 séries x 30-60 segundos"
  },
  {
    id: "ex-94", n: "Prancha Lateral", name: "Prancha Lateral", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Transverso", "Glúteo Médio"], specificMuscles: ["Oblíquos", "Quadrado Lombar"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Apoiado em um antebraço de lado. Alinhamento lateral rígido da cabeça aos pés.",
    commonErrors: ["Rotação do tronco caindo para frente"], defaultSetsReps: "3 séries x 20-40 segundos cada lado"
  },
  {
    id: "ex-95", n: "Abdominal Crunch", name: "Abdominal Crunch", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Oblíquos"], specificMuscles: ["Reto Abdominal"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Deitado no solo, flexione a coluna aproxima do tórax da pelve sem puxar o pescoço.",
    commonErrors: ["Puxar a cabeça com as mãos forcando a cervical"], defaultSetsReps: "3-4 séries x 15-20 reps"
  },
  {
    id: "ex-96", n: "Abdominal Infra (Leg Raise)", name: "Abdominal Infra (Leg Raise)", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Flexores do Quadril", "Oblíquos"], specificMuscles: ["Reto Abdominal (porção inferior)"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Deitado de costas, eleve as pernas estendidas ou levemente flexionadas com controle de pelve.",
    commonErrors: ["Descolar a coluna lombar do chão ao descer as pernas"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-97", n: "Elevação de Pernas Suspenso", name: "Elevação de Pernas Suspenso", p: "core", pattern: "core", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Flexores do Quadril", "Oblíquos"], specificMuscles: ["Reto Abdominal"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Suspenso na barra fixa. Eleve as pernas até a linha do quadril ou peito retrovertendo a pelve.",
    commonErrors: ["Balançar o corpo em pêndulo"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-98", n: "Russian Twist", name: "Russian Twist", p: "core", pattern: "core", eqs: ["full", "bw", "db", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Reto Abdominal", "Transverso"], specificMuscles: ["Oblíquos"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Sentado, tronco inclinado a 45° e pés fora do chão. Gire o tronco de um lado para o outro.",
    commonErrors: ["Girar apenas os braços sem rotação real da coluna torácica"], defaultSetsReps: "3 séries x 20 rotações totais"
  },
  {
    id: "ex-99", n: "Woodchopper no Cabo", name: "Woodchopper no Cabo", p: "core", pattern: "core", eqs: ["full"],
    equipmentCategory: "Polia / Cabo", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Reto Abdominal", "Transverso", "Ombros"], specificMuscles: ["Oblíquos"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Movimento diagonal de rotação do tronco puxando o cabo de cima para baixo ou de baixo para cima.",
    commonErrors: ["Girar apenas os ombros sem integrar o quadril e o core"], defaultSetsReps: "3 séries x 10-12 reps cada lado"
  },
  {
    id: "ex-100", n: "Ab Wheel (Roda Abdominal)", name: "Ab Wheel (Roda Abdominal)", p: "core", pattern: "core", eqs: ["full", "func", "home"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Oblíquos", "Ombros", "Latíssimo"], specificMuscles: ["Reto Abdominal", "Transverso"], difficulty: "Avançado", av: ["lombar"],
    biomechanicsTips: "Ajoelhado, role a roda à frente estendendo o corpo e retorne ativando o abdômen vigorosamente.",
    commonErrors: ["Hiperestender a coluna lombar na extensão máxima"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-101", n: "Dead Bug", name: "Dead Bug", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Reto Abdominal", "Estabilizadores"], specificMuscles: ["Transverso do Abdômen"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Deitado de costas, alterne extensão de braço e perna oposta mantendo a lombar totalmente selada no chão.",
    commonErrors: ["Perder o contato da lombar com o solo durante o movimento"], defaultSetsReps: "3 séries x 12-16 reps alternadas"
  },
  {
    id: "ex-102", n: "Bird Dog", name: "Bird Dog", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Glúteo", "Ombros"], specificMuscles: ["Eretores da Espinha", "Transverso"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Em quatro apoios, estenda o braço e a perna oposta mantendo a pelve e coluna completamente estáveis.",
    commonErrors: ["Rodar a pelve para os lados"], defaultSetsReps: "3 séries x 12-16 reps alternadas"
  },
  {
    id: "ex-103", n: "Hollow Body Hold", name: "Hollow Body Hold", p: "core", pattern: "core", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Flexores do Quadril", "Oblíquos"], specificMuscles: ["Reto Abdominal", "Transverso"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Deitado de costas, eleve escápulas e pernas formando uma canoa rígida com lombar pressionada ao chão.",
    commonErrors: ["Arquear a lombar perdendo o formato canoa"], defaultSetsReps: "3-4 séries x 20-45 segundos"
  },
  {
    id: "ex-104", n: "Mountain Climber", name: "Mountain Climber", p: "cond", pattern: "cond", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Cardio / Metcon", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Flexores do Quadril", "Ombros", "Cardio"], specificMuscles: ["Core"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Em posição de prancha alta, traga os joelhos alternadamente em direção ao peito em ritmo acelerado.",
    commonErrors: ["Subir o quadril demais"], defaultSetsReps: "3-4 séries x 30-45 segundos"
  },
  {
    id: "ex-105", n: "Bicycle Crunch", name: "Bicycle Crunch", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Flexores do Quadril"], specificMuscles: ["Oblíquos", "Reto Abdominal"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Toque o cotovelo oposto no joelho que flexiona enquanto a outra perna estende.",
    commonErrors: ["Puxar a cabeça com as mãos sem rotação de tronco"], defaultSetsReps: "3 séries x 20 reps alternadas"
  },

  // 106-125: OLÍMPICOS, PLIOMETRIA E POTÊNCIA
  {
    id: "ex-106", n: "Clean (Arrancada de Força)", name: "Clean (Arrancada de Força)", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core", "Ombros", "Antebraços"], specificMuscles: ["Cadeia Posterior", "Quadríceps", "Trapézio"], difficulty: "Avançado", av: ["pulso", "lombar"],
    biomechanicsTips: "Puxada explosiva tripla extensão (tornozelo, joelho e quadril) recebendo a barra nos ombros.",
    commonErrors: ["Puxar apenas com a força dos braços sem extensão de quadril"], defaultSetsReps: "3-5 séries x 3-5 reps"
  },
  {
    id: "ex-107", n: "Power Clean", name: "Power Clean", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core", "Ombros"], specificMuscles: ["Cadeia Posterior", "Quadríceps", "Trapézio"], difficulty: "Avançado", av: ["lombar"],
    biomechanicsTips: "Clean recebendo a barra em agachamento parcial (acima dos 90°). Foco na potência inicial.",
    commonErrors: ["Receber a barra com pernas hiperafastadas"], defaultSetsReps: "3-5 séries x 3-5 reps"
  },
  {
    id: "ex-108", n: "Snatch (Arranco)", name: "Snatch (Arranco)", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core", "Trapézio", "Mobilidade"], specificMuscles: ["Cadeia Posterior", "Quadríceps", "Ombros"], difficulty: "Avançado", av: ["ombro", "lombar"],
    biomechanicsTips: "Barra levada diretamente do chão para acima da cabeça em um único movimento explosivo.",
    commonErrors: ["Falta de mobilidade de ombro e quadril na recepção"], defaultSetsReps: "3-5 séries x 2-4 reps"
  },
  {
    id: "ex-109", n: "Power Snatch", name: "Power Snatch", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core", "Trapézio"], specificMuscles: ["Cadeia Posterior", "Quadríceps", "Ombros"], difficulty: "Avançado", av: ["ombro"],
    biomechanicsTips: "Snatch recebendo a barra acima da cabeça em base parcial acima dos 90°.",
    commonErrors: ["Descontração do core ao travar a barra no alto"], defaultSetsReps: "3-5 séries x 3-5 reps"
  },
  {
    id: "ex-110", n: "Clean and Jerk", name: "Clean and Jerk", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Potência", "Coordenação"], specificMuscles: ["Corpo Inteiro"], difficulty: "Avançado", av: ["ombro", "lombar"],
    biomechanicsTips: "Combinação clássica do LPO: Clean nos ombros seguido pelo arremesso (Jerk) acima da cabeça.",
    commonErrors: ["Falta de sincronia na transição do dip e drive do Jerk"], defaultSetsReps: "3-5 séries x 2-3 reps"
  },
  {
    id: "ex-111", n: "Push Press", name: "Push Press", p: "push_v", pattern: "push_v", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Quadríceps", "Core"], specificMuscles: ["Deltoide", "Tríceps"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Pequeno dip com os joelhos seguido por impulso de pernas para arremessar a barra acima dos ombros.",
    commonErrors: ["Dobrar o quadril à frente no dip em vez de afundar verticalmente"], defaultSetsReps: "3-4 séries x 5-8 reps"
  },
  {
    id: "ex-112", n: "Thruster", name: "Thruster", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Barra", exerciseType: "Cardio / Metcon", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Core", "Tríceps", "Glúteo"], specificMuscles: ["Quadríceps", "Deltoide"], difficulty: "Intermediário", av: ["joelho", "ombro"],
    biomechanicsTips: "Combinação fluida de Front Squat completo diretamente em um desenvolvimento acima da cabeça.",
    commonErrors: ["Pausar a barra nos ombros antes de empurrar"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-113", n: "Kettlebell Swing", name: "Kettlebell Swing", p: "hinge", pattern: "hinge", eqs: ["full", "func", "home"],
    equipmentCategory: "Kettlebell", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Core", "Ombros", "Trapézio"], specificMuscles: ["Glúteo Máximo", "Isquiotibiais"], difficulty: "Iniciante", av: ["lombar"],
    biomechanicsTips: "Flexão e extensão explosiva de quadril (hip hinge). O kettlebell é arremessado pela força da pelve.",
    commonErrors: ["Agachar em vez de projetar o quadril (virando squat swing)"], defaultSetsReps: "3-4 séries x 15-20 reps"
  },
  {
    id: "ex-114", n: "Kettlebell Clean", name: "Kettlebell Clean", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Kettlebell", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Ombros", "Antebraços"], specificMuscles: ["Cadeia Posterior", "Core"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Puxe o kettlebell do chão contornando o corpo e encaixando suavemente na posição de rack.",
    commonErrors: ["Deixar o kettlebell bater forte no antebraço"], defaultSetsReps: "3-4 séries x 8-10 reps"
  },
  {
    id: "ex-115", n: "Kettlebell Snatch", name: "Kettlebell Snatch", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Kettlebell", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core", "Trapézio"], specificMuscles: ["Cadeia Posterior", "Ombros"], difficulty: "Avançado", av: ["ombro"],
    biomechanicsTips: "Eleve o kettlebell do chão até acima da cabeça em um único fluxo dinâmico contínuo.",
    commonErrors: ["Impacto do kettlebell no dorso da mão no topo"], defaultSetsReps: "3-4 séries x 8-10 reps cada braço"
  },
  {
    id: "ex-116", n: "Box Jump", name: "Box Jump", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Isquiotibiais", "Panturrilhas", "Core"], specificMuscles: ["Quadríceps", "Glúteo Máximo"], difficulty: "Intermediário", av: ["joelho"],
    biomechanicsTips: "Salto explosivo para a caixa com recepção amortecida em joelhos flexionados.",
    commonErrors: ["Aterrisar com joelhos travados e impacto rígido"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-117", n: "Depth Jump", name: "Depth Jump", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Isquiotibiais", "Tendões"], specificMuscles: ["Quadríceps", "Glúteo"], difficulty: "Avançado", av: ["joelho"],
    biomechanicsTips: "Dê um passo para fora da caixa e, assim que tocar o chão, reaja saltando verticalmente de imediato.",
    commonErrors: ["Tempo de contato longo demais no solo"], defaultSetsReps: "3 séries x 4-6 reps"
  },
  {
    id: "ex-118", n: "Salto Vertical com Contramovimento", name: "Salto Vertical com Contramovimento", p: "cond", pattern: "cond", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Panturrilhas", "Core"], specificMuscles: ["Quadríceps", "Glúteo"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Flexão rápida prévia e salto vertical máximo usando braços para projeção.",
    commonErrors: ["Falta de sincronia do balanço de braços"], defaultSetsReps: "3 séries x 8-10 reps"
  },
  {
    id: "ex-119", n: "Broad Jump (Salto em Distância)", name: "Broad Jump (Salto em Distância)", p: "cond", pattern: "cond", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Core", "Panturrilhas"], specificMuscles: ["Glúteo", "Quadríceps", "Isquiotibiais"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Salto horizontal para frente buscando máxima distância com amortecimento duplo ao pousar.",
    commonErrors: ["Pouso pesado sobre os calcanhares"], defaultSetsReps: "3 séries x 6-8 reps"
  },
  {
    id: "ex-120", n: "Skater Jump", name: "Skater Jump", p: "cond", pattern: "cond", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Glúteos",
    secondaryMuscles: ["Isquiotibiais", "Core"], specificMuscles: ["Glúteo Médio", "Quadríceps"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Saltos laterais de um pé para o outro simulando um patinador, absorvendo impacto na perna de apoio.",
    commonErrors: ["Perder o equilíbrio e torcer o tornozelo"], defaultSetsReps: "3 séries x 12-16 saltos totais"
  },
  {
    id: "ex-121", n: "Burpee", name: "Burpee", p: "cond", pattern: "cond", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Cardio", "Core", "Peitoral", "Quadríceps"], specificMuscles: ["Corpo Inteiro"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Toque o peito no chão, suba em flexão, traga pés aos braços e salte batendo palma no alto.",
    commonErrors: ["Arquear a lombar ao subir do chão"], defaultSetsReps: "3-4 séries x 10-15 reps"
  },
  {
    id: "ex-122", n: "Burpee com Box Jump", name: "Burpee com Box Jump", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Cardio", "Potência"], specificMuscles: ["Corpo Inteiro"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Burpee convencional finalizado com salto sobre a caixa em vez de salto vertical simples.",
    commonErrors: ["Aproximar-se perto demais da caixa e bater as canelas"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-123", n: "Clapping Push-up", name: "Clapping Push-up", p: "push_h", pattern: "push_h", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Deltoide", "Core"], specificMuscles: ["Peitoral Maior", "Tríceps"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Empurrão de alta potência no solo para descolar o tronco e bater palmas rápido.",
    commonErrors: ["Falta de força caindo sobre os punhos"], defaultSetsReps: "3 séries x 5-8 reps"
  },
  {
    id: "ex-124", n: "Medicine Ball Slam", name: "Medicine Ball Slam", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Quadríceps", "Glúteo"], specificMuscles: ["Core", "Latíssimo", "Ombros"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Eleve a ball acima da cabeça e arremesse-a no chão com máxima força usando o core.",
    commonErrors: ["Inclinando a coluna na arremessada sem dobrar os joelhos"], defaultSetsReps: "3-4 séries x 12-15 reps"
  },
  {
    id: "ex-125", n: "Medicine Ball Chest Pass", name: "Medicine Ball Chest Pass", p: "push_h", pattern: "push_h", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Peitoral",
    secondaryMuscles: ["Core"], specificMuscles: ["Peitoral", "Tríceps", "Deltoide"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Passe explosivo da bola na parede ou parceiro a partir da linha do peito.",
    commonErrors: ["Empurrar sem ativar os braços e o peitoral"], defaultSetsReps: "3 séries x 12-15 reps"
  },

  // 126-138: CARDIO, MONOESTRUTURAL E CARREGAMENTO
  {
    id: "ex-126", n: "Corrida (Running)", name: "Corrida (Running)", p: "cond", pattern: "cond", eqs: ["full", "bw", "func", "home"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Panturrilhas", "Glúteo", "Core"], specificMuscles: ["Sistema Cardiovascular", "Quadríceps", "Isquiotibiais"], difficulty: "Iniciante", av: ["joelho"],
    biomechanicsTips: "Postura ereta, cadência de passadas estável e pisada leve no mediopé.",
    commonErrors: ["Overstriding (pisar longe demais à frente do centro de gravidade)"], defaultSetsReps: "20-45 minutos contínuos"
  },
  {
    id: "ex-127", n: "Corrida Intervalada (HIIT)", name: "Corrida Intervalada (HIIT)", p: "cond", pattern: "cond", eqs: ["full", "bw", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Membros Inferiores"], specificMuscles: ["Sistema Cardiovascular"], difficulty: "Intermediário", av: ["joelho"],
    biomechanicsTips: "Alternância entre sprints curtos de altíssima intensidade e recuperação ativa/passiva.",
    commonErrors: ["Falta de aquecimento prévio apropriado"], defaultSetsReps: "10-20 tiros de 30s / 30s rec."
  },
  {
    id: "ex-128", n: "Remo Ergômetro (Rowing)", name: "Remo Ergômetro (Rowing)", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Isquiotibiais", "Core", "Bíceps"], specificMuscles: ["Sistema Cardiovascular", "Latíssimo", "Quadríceps"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Sequência correta: empurrar com pernas, inclinar tronco, puxar com braços. Retorno inverso.",
    commonErrors: ["Dobrar os braços antes de empurrar com as pernas"], defaultSetsReps: "500m x 4-6 séries"
  },
  {
    id: "ex-129", n: "Bike Erg / Bicicleta Ergométrica", name: "Bike Erg / Bicicleta Ergométrica", p: "cond", pattern: "cond", eqs: ["full", "func", "home"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Isquiotibiais", "Panturrilhas"], specificMuscles: ["Sistema Cardiovascular", "Quadríceps"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Ajuste a altura do selim para que a perna fique levemente flexionada no ponto mais baixo.",
    commonErrors: ["Selim baixo demais causando dor patelar"], defaultSetsReps: "20-30 minutos ou tiros de HIIT"
  },
  {
    id: "ex-130", n: "Assault Bike / Air Bike", name: "Assault Bike / Air Bike", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Quadríceps", "Ombros", "Core"], specificMuscles: ["Sistema Cardiovascular", "Corpo Inteiro"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Resistência a ar proporcional ao esforço. Puxe e empurre com os braços integrando com a pedalada.",
    commonErrors: ["Pedalar apenas com as pernas deixando as manoplas soltas"], defaultSetsReps: "10 a 20 séries de 20s tiros / 10s descanso"
  },
  {
    id: "ex-131", n: "Ski Erg", name: "Ski Erg", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Tríceps", "Ombros"], specificMuscles: ["Sistema Cardiovascular", "Latíssimo", "Core"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Simula o esqui nórdico. Flexione o core e estenda os braços para baixo com força gravitacional.",
    commonErrors: ["Usar apenas a força dos braços sem flexionar o tronco"], defaultSetsReps: "3-5 séries de 500m"
  },
  {
    id: "ex-132", n: "Natação", name: "Natação", p: "cond", pattern: "cond", eqs: ["full"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Latíssimo", "Deltoide", "Core", "Pernas"], specificMuscles: ["Sistema Cardiovascular", "Corpo Inteiro"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Baixo impacto articular. Excelente para condicionamento aeróbio e resistência muscular geral.",
    commonErrors: ["Respiração desordenada e perda de alinhamento corporal"], defaultSetsReps: "20-40 minutos de nado fracionado"
  },
  {
    id: "ex-133", n: "Pular Corda", name: "Pular Corda", p: "cond", pattern: "cond", eqs: ["full", "bw", "func", "home"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core", "Coordenação", "Ombros"], specificMuscles: ["Sistema Cardiovascular", "Panturrilhas"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Saltos baixos na ponta dos pés com giros rápidos promovidos pelos punhos.",
    commonErrors: ["Girar a corda com os braços inteiros em vez do pulso"], defaultSetsReps: "5-10 rounds de 2 minutos"
  },
  {
    id: "ex-134", n: "Double Unders", name: "Double Unders", p: "cond", pattern: "cond", eqs: ["full", "func", "home"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Core"], specificMuscles: ["Sistema Cardiovascular", "Panturrilhas"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Dois giros de corda para cada salto. Requer alta cadência de pulso e tempo de voo ritmado.",
    commonErrors: ["Chutar os calcanhares para trás (dolphin kick)"], defaultSetsReps: "3-5 rounds de 50 a 100 saltos"
  },
  {
    id: "ex-135", n: "Farmers Walk", name: "Farmers Walk", p: "cond", pattern: "cond", eqs: ["full", "db", "func"],
    equipmentCategory: "Halteres", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Trapézio / Rombóides",
    secondaryMuscles: ["Glúteo", "Quadríceps", "Sistema Cardiovascular"], specificMuscles: ["Antebraços", "Trapézio", "Core"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Caminhada com cargas pesadas em ambas as mãos. Tronco ereto e pegada firme sem oscilação.",
    commonErrors: ["Deixar os ombros caírem para frente"], defaultSetsReps: "3-4 séries x 30-50 metros"
  },
  {
    id: "ex-136", n: "Sled Push", name: "Sled Push", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Core", "Panturrilhas"], specificMuscles: ["Quadríceps", "Glúteo", "Sistema Cardiovascular"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Empurre o trenó em ângulo de 45° mantendo passadas fortes e contínuas.",
    commonErrors: ["Perder a estabilização do core e curvar a coluna"], defaultSetsReps: "4-6 tiros x 20-30 metros"
  },
  {
    id: "ex-137", n: "Sled Pull", name: "Sled Pull", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Sistema Cardiovascular"], specificMuscles: ["Isquiotibiais", "Latíssimo", "Core"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Puxe o trenó caminhando para trás ou com fita de cintura. Alta ativação metabólica sem dor excêntrica.",
    commonErrors: ["Perder o atrito dos pés com o solo"], defaultSetsReps: "4-6 tiros x 20-30 metros"
  },
  {
    id: "ex-138", n: "Battle Ropes", name: "Battle Ropes", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Antebraços", "Latíssimo"], specificMuscles: ["Ombros", "Core", "Sistema Cardiovascular"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Ondulações alternadas ou simultâneas de corda em base atlética de semi-agachamento.",
    commonErrors: ["Ficar totalmente em pé sem engajar as pernas e o core"], defaultSetsReps: "4-6 séries x 30 segundos"
  },

  // 139-153: FUNCIONAL, MOBILIDADE, CALISTENIA E HABILIDADE
  {
    id: "ex-139", n: "Wall Ball", name: "Wall Ball", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Ergômetro / Funcional", exerciseType: "Cardio / Metcon", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo", "Tríceps"], specificMuscles: ["Quadríceps", "Deltoide", "Core"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Agachamento profundo segurando a medicine ball seguido de arremesso no alvo na parede.",
    commonErrors: ["Não agachar abaixo dos 90°"], defaultSetsReps: "3-4 séries x 15-20 reps"
  },
  {
    id: "ex-140", n: "Devil Press", name: "Devil Press", p: "cond", pattern: "cond", eqs: ["full", "db", "func"],
    equipmentCategory: "Halteres", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Peitoral", "Deltoide", "Quadríceps", "Core"], specificMuscles: ["Corpo Inteiro"], difficulty: "Intermediário", av: ["lombar"],
    biomechanicsTips: "Burpee segurando halteres seguido diretamente por um swing/snatch dos dois halteres acima da cabeça.",
    commonErrors: ["Curvar a lombar na subida dos halteres"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-141", n: "Man Maker", name: "Man Maker", p: "cond", pattern: "cond", eqs: ["full", "db", "func"],
    equipmentCategory: "Halteres", exerciseType: "Cardio / Metcon", primaryMuscle: "Metcon / Geral",
    secondaryMuscles: ["Peitoral", "Core", "Deltoide", "Quadríceps"], specificMuscles: ["Corpo Inteiro"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Flexão + remada unilateral direita + remada esquerda + salto para os pés + thruster completo.",
    commonErrors: ["Perder o ritmo pela escolha de carga excessiva"], defaultSetsReps: "3 séries x 6-8 reps"
  },
  {
    id: "ex-142", n: "Turkish Get-up", name: "Turkish Get-up", p: "cond", pattern: "cond", eqs: ["full", "func"],
    equipmentCategory: "Kettlebell", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Glúteo", "Quadríceps", "Mobilidade"], specificMuscles: ["Core", "Ombros", "Estabilidade Global"], difficulty: "Avançado", av: ["ombro"],
    biomechanicsTips: "Levantar-se do solo até ficar em pé mantendo o kettlebell travado verticalmente acima da cabeça.",
    commonErrors: ["Desviar o olhar do kettlebell durante a subida"], defaultSetsReps: "3 séries x 3-5 reps cada lado"
  },
  {
    id: "ex-143", n: "Windmill com Kettlebell", name: "Windmill com Kettlebell", p: "core", pattern: "core", eqs: ["full", "func"],
    equipmentCategory: "Kettlebell", exerciseType: "Funcional / Pliométrico", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Isquiotibiais", "Core"], specificMuscles: ["Oblíquos", "Ombros", "Mobilidade Torácica"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Com o kettlebell mantido no alto, flexione o quadril lateralmente tocando a mão oposta no chão.",
    commonErrors: ["Dobrar o joelho da perna de apoio desnecessariamente"], defaultSetsReps: "3 séries x 8-10 reps cada lado"
  },
  {
    id: "ex-144", n: "Overhead Squat", name: "Overhead Squat", p: "quad", pattern: "quad", eqs: ["full"],
    equipmentCategory: "Barra", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo", "Eretores", "Equilíbrio"], specificMuscles: ["Quadríceps", "Core", "Mobilidade de Ombro"], difficulty: "Avançado", av: ["ombro", "lombar"],
    biomechanicsTips: "Agachamento profundo sustentando a barra em pegada arranco acima e atrás da linha da cabeça.",
    commonErrors: ["Projetar a barra para frente pela falta de mobilidade torácica/ombros"], defaultSetsReps: "3-4 séries x 5-8 reps"
  },
  {
    id: "ex-145", n: "Single-leg RDL", name: "Single-leg RDL", p: "hinge", pattern: "hinge", eqs: ["full", "db", "home"],
    equipmentCategory: "Halteres", exerciseType: "Multiarticular (Composto)", primaryMuscle: "Posterior de Coxa",
    secondaryMuscles: ["Core", "Eretores"], specificMuscles: ["Isquiotibiais", "Glúteo", "Equilíbrio"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "RDL executado em uma perna com a outra estendendo para trás como pêndulo alinhado ao tronco.",
    commonErrors: ["Rodar o quadril abrindo para os lados"], defaultSetsReps: "3 séries x 8-10 reps cada perna"
  },
  {
    id: "ex-146", n: "Cossack Squat", name: "Cossack Squat", p: "quad", pattern: "quad", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo", "Core"], specificMuscles: ["Adutores", "Quadríceps", "Mobilidade de Quadril"], difficulty: "Intermediário", av: ["joelho"],
    biomechanicsTips: "Agachamento lateral profundo em uma perna enquanto a outra estende totalmente com calcanhar no solo.",
    commonErrors: ["Descolar o calcanhar da perna que agacha do chão"], defaultSetsReps: "3 séries x 8-10 reps cada lado"
  },
  {
    id: "ex-147", n: "Pistol Squat Assistido", name: "Pistol Squat Assistido", p: "quad", pattern: "quad", eqs: ["full", "bw", "func"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Quadríceps",
    secondaryMuscles: ["Glúteo", "Core"], specificMuscles: ["Quadríceps", "Equilíbrio"], difficulty: "Intermediário", av: [],
    biomechanicsTips: "Agachamento unilateral utilizando TRX ou fita de suspensão como auxílio de equilíbrio.",
    commonErrors: ["Puxar excessivamente com as mãos sem usar a perna"], defaultSetsReps: "3 séries x 6-10 reps cada perna"
  },
  {
    id: "ex-148", n: "Ring Row", name: "Ring Row", p: "pull_h", pattern: "pull_h", eqs: ["full", "bw", "func"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Bíceps", "Core"], specificMuscles: ["Latíssimo", "Romboides"], difficulty: "Iniciante", av: [],
    biomechanicsTips: "Remada em argolas olímpicas. Permite rotação natural do punho durante a puxada.",
    commonErrors: ["Perder o alinhamento pélvico"], defaultSetsReps: "3-4 séries x 10-12 reps"
  },
  {
    id: "ex-149", n: "Ring Dip", name: "Ring Dip", p: "push_h", pattern: "push_h", eqs: ["full", "bw", "func"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Tríceps",
    secondaryMuscles: ["Deltoide", "Core", "Estabilidade"], specificMuscles: ["Tríceps", "Peitoral"], difficulty: "Avançado", av: ["ombro"],
    biomechanicsTips: "Mergulho em argolas. Requer alta estabilidade do manguito rotador para controlar a instabilidade.",
    commonErrors: ["Tremer e perder a estabilidade dos ombros"], defaultSetsReps: "3-4 séries x 6-10 reps"
  },
  {
    id: "ex-150", n: "Muscle-up", name: "Muscle-up", p: "pull_v", pattern: "pull_v", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Dorsal / Latíssimo",
    secondaryMuscles: ["Core", "Ombros", "Coordenação"], specificMuscles: ["Latíssimo", "Tríceps", "Peitoral"], difficulty: "Avançado", av: ["ombro"],
    biomechanicsTips: "Transição contínua de puxada vertical (pull-up) para empurrão (dip) sobre a barra ou argolas.",
    commonErrors: ["Forçar a transição com apenas um braço primeiro (chicken wing)"], defaultSetsReps: "3 séries x 2-5 reps"
  },
  {
    id: "ex-151", n: "Toes-to-Bar", name: "Toes-to-Bar", p: "core", pattern: "core", eqs: ["full", "bw"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Latíssimo", "Antebraços"], specificMuscles: ["Reto Abdominal", "Flexores do Quadril"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Suspenso na barra, traga as pontas dos pés simultaneamente até tocarem a barra.",
    commonErrors: ["Balançar sem controle abdominal"], defaultSetsReps: "3-4 séries x 8-12 reps"
  },
  {
    id: "ex-152", n: "Handstand Hold", name: "Handstand Hold", p: "push_v", pattern: "push_v", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Deltoide / Ombro",
    secondaryMuscles: ["Tríceps", "Trapézio"], specificMuscles: ["Deltoide", "Core", "Equilíbrio"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Sustentação isométrica em parada de mão na parede ou livre. Foco em alinhar pulso, ombro e pelve.",
    commonErrors: ["Arquear as costas no formato banana"], defaultSetsReps: "3-4 séries x 20-45 segundos"
  },
  {
    id: "ex-153", n: "L-Sit", name: "L-Sit", p: "core", pattern: "core", eqs: ["full", "bw", "home"],
    equipmentCategory: "Peso Corporal", exerciseType: "Calistenia", primaryMuscle: "Core / Abdômen",
    secondaryMuscles: ["Ombros"], specificMuscles: ["Core", "Flexores do Quadril", "Tríceps"], difficulty: "Avançado", av: [],
    biomechanicsTips: "Sustentação isométrica nas paralelas ou chão mantendo pernas estendidas horizontalmente a 90°.",
    commonErrors: ["Deixar as pernas caírem abaixo do plano horizontal"], defaultSetsReps: "3-4 séries x 15-30 segundos"
  }
];

export const EQUIPMENT_CODE_MAP: Record<string, string> = {
  "Academia completa": "full",
  "Halteres + banco": "db",
  "Peso corporal": "bw",
  "Funcional / crossfit": "func",
  "Casa com equipamento mínimo": "home"
};

export const MOVEMENT_PATTERN_LABELS: Record<MovementPattern, string> = {
  push_h: "Peito / Empurrar H.",
  push_v: "Ombro / Empurrar V.",
  shoulder_iso: "Deltoide Lateral",
  pull_v: "Dorsal / Puxar V.",
  pull_h: "Costas / Puxar H.",
  rear: "Deltoide Posterior",
  quad: "Quadríceps / Joelho",
  hinge: "Posterior / Quadril",
  arms_bi: "Bíceps",
  arms_tri: "Tríceps",
  core: "Core / Abdômen",
  calf: "Panturrilha",
  cond: "Metcon / Condicionamento"
};

// --- STORAGE HELPER FOR CUSTOM EXERCISES ---
const CUSTOM_EXERCISES_STORAGE_KEY = 'fitconnect_custom_exercise_library_v1';
const CUSTOM_EXERCISES_COLLECTION = 'custom_exercises';

export function getCustomExercises(): CatalogExercise[] {
  try {
    const raw = localStorage.getItem(CUSTOM_EXERCISES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading custom exercises:', e);
  }
  return [];
}

export async function fetchCustomExercisesFromFirestore(): Promise<CatalogExercise[]> {
  const local = getCustomExercises();
  const uid = auth.currentUser?.uid;
  if (!uid) return local;

  try {
    const colRef = collection(db, CUSTOM_EXERCISES_COLLECTION);
    const q = query(colRef, where('trainerId', '==', uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const remote: CatalogExercise[] = [];
      snapshot.forEach(docSnap => {
        remote.push(docSnap.data() as CatalogExercise);
      });
      const mergedMap = new Map<string, CatalogExercise>();
      remote.forEach(ex => mergedMap.set(ex.id, ex));
      local.forEach(ex => mergedMap.set(ex.id, ex));
      const merged = Array.from(mergedMap.values());
      localStorage.setItem(CUSTOM_EXERCISES_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.warn('Error fetching custom exercises from Firestore:', e);
  }
  return local;
}

export function saveCustomExercise(exercise: Omit<CatalogExercise, 'id' | 'n' | 'p'> & { p?: MovementPattern }): CatalogExercise {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Usuário não autenticado");

  const newEx: CatalogExercise = {
    ...exercise,
    id: `custom-ex-${Date.now()}`,
    n: exercise.name,
    p: exercise.p || exercise.pattern,
    custom: true,
    trainerId: uid,
    updatedAt: serverTimestamp()
  } as any;

  const existing = getCustomExercises();
  const updated = [newEx, ...existing];
  try {
    localStorage.setItem(CUSTOM_EXERCISES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving custom exercise:', e);
  }

  try {
    const cleaned = JSON.parse(JSON.stringify(newEx, (k, v) => (v === undefined ? null : v)));
    const docRef = doc(db, CUSTOM_EXERCISES_COLLECTION, newEx.id);
    setDoc(docRef, cleaned, { merge: true }).catch(err => {
      console.warn('Firestore setDoc custom exercise error:', err);
    });
  } catch (err) {
    console.warn('Custom exercise firestore error:', err);
  }

  EXERCISE_CATALOG.unshift(newEx);
  return newEx;
}

export function getAllLibraryExercises(): CatalogExercise[] {
  const custom = getCustomExercises();
  const existingIds = new Set(EXERCISE_CATALOG.map(e => e.id));
  const newCustom = custom.filter(c => !existingIds.has(c.id));
  return [...newCustom, ...EXERCISE_CATALOG];
}

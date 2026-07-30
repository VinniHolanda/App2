import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Plus, Dumbbell, ShieldAlert, Sparkles, BookOpen, 
  Layers, ChevronRight, CheckCircle2, AlertTriangle, X, Info, Cpu, Zap, Activity
} from 'lucide-react';
import { 
  CatalogExercise, 
  EquipmentCategory, 
  ExerciseTypeCategory, 
  PrimaryMuscleGroup, 
  getAllLibraryExercises, 
  fetchCustomExercisesFromFirestore,
  saveCustomExercise,
  MOVEMENT_PATTERN_LABELS
} from '../../data/exerciseCatalog';
import { Button, Badge, Modal } from '../components/ui/Primitives';
import { MovementPattern } from '../../domain/types';

export interface ExerciseLibraryViewProps {
  onSelectExerciseForProgram?: (exercise: CatalogExercise) => void;
  isSelectionMode?: boolean;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
  onSelectExerciseForProgram,
  isSelectionMode = false
}) => {
  const [exercises, setExercises] = useState<CatalogExercise[]>(() => getAllLibraryExercises());

  useEffect(() => {
    fetchCustomExercisesFromFirestore().then(() => {
      setExercises(getAllLibraryExercises());
    });
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEqCategory, setSelectedEqCategory] = useState<string>('todos');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('todos');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('todos');
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<CatalogExercise | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state for adding custom exercise
  const [newExName, setNewExName] = useState('');
  const [newExPattern, setNewExPattern] = useState<MovementPattern>('push_h');
  const [newExEquipmentCat, setNewExEquipmentCat] = useState<EquipmentCategory>('Máquina');
  const [newExTypeCat, setNewExTypeCat] = useState<ExerciseTypeCategory>('Multiarticular (Composto)');
  const [newExPrimaryMuscle, setNewExPrimaryMuscle] = useState<PrimaryMuscleGroup>('Peitoral');
  const [newExSecondaryMuscles, setNewExSecondaryMuscles] = useState('');
  const [newExSpecificMuscles, setNewExSpecificMuscles] = useState('');
  const [newExDifficulty, setNewExDifficulty] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Intermediário');
  const [newExAvoidance, setNewExAvoidance] = useState<string[]>([]);
  const [newExTips, setNewExTips] = useState('');
  const [newExErrors, setNewExErrors] = useState('');
  const [newExSetsReps, setNewExSetsReps] = useState('3-4 séries x 8-12 reps');

  const equipmentCategoriesList: EquipmentCategory[] = [
    'Máquina',
    'Polia / Cabo',
    'Barra',
    'Halteres',
    'Peso Corporal',
    'Smith Machine',
    'Kettlebell',
    'Elástico / Band',
    'Ergômetro / Funcional'
  ];

  const muscleGroupsList: PrimaryMuscleGroup[] = [
    'Peitoral',
    'Dorsal / Latíssimo',
    'Deltoide / Ombro',
    'Quadríceps',
    'Posterior de Coxa',
    'Glúteos',
    'Bíceps',
    'Tríceps',
    'Trapézio / Rombóides',
    'Core / Abdômen',
    'Panturrilha',
    'Metcon / Geral'
  ];

  const exerciseTypesList: ExerciseTypeCategory[] = [
    'Multiarticular (Composto)',
    'Monoarticular (Isolado)',
    'Calistenia',
    'Funcional / Pliométrico',
    'Cardio / Metcon'
  ];

  // Filtering logic
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      // Search term
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ex.name.toLowerCase().includes(q);
        const matchPrimary = ex.primaryMuscle.toLowerCase().includes(q);
        const matchEq = ex.equipmentCategory.toLowerCase().includes(q);
        const matchSpecific = ex.specificMuscles.some(m => m.toLowerCase().includes(q));
        const matchSecondary = ex.secondaryMuscles.some(m => m.toLowerCase().includes(q));
        if (!matchName && !matchPrimary && !matchEq && !matchSpecific && !matchSecondary) {
          return false;
        }
      }

      // Equipment Category Filter
      if (selectedEqCategory !== 'todos' && ex.equipmentCategory !== selectedEqCategory) {
        return false;
      }

      // Muscle Group Filter
      if (selectedMuscle !== 'todos' && ex.primaryMuscle !== selectedMuscle) {
        return false;
      }

      // Type Category Filter
      if (selectedType !== 'todos' && ex.exerciseType !== selectedType) {
        return false;
      }

      // Difficulty Filter
      if (selectedDifficulty !== 'todos' && ex.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedEqCategory, selectedMuscle, selectedType, selectedDifficulty]);

  const handleCreateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    // Build equipment tags mapping
    let eqs = ['full'];
    if (newExEquipmentCat === 'Halteres') eqs = ['full', 'db', 'home'];
    else if (newExEquipmentCat === 'Peso Corporal') eqs = ['full', 'bw', 'func', 'home'];
    else if (newExEquipmentCat === 'Kettlebell' || newExEquipmentCat === 'Ergômetro / Funcional') eqs = ['full', 'func'];

    const created = saveCustomExercise({
      name: newExName.trim(),
      pattern: newExPattern,
      eqs,
      equipmentCategory: newExEquipmentCat,
      exerciseType: newExTypeCat,
      primaryMuscle: newExPrimaryMuscle,
      secondaryMuscles: newExSecondaryMuscles ? newExSecondaryMuscles.split(',').map(s => s.trim()) : [],
      specificMuscles: newExSpecificMuscles ? newExSpecificMuscles.split(',').map(s => s.trim()) : [newExPrimaryMuscle],
      difficulty: newExDifficulty,
      av: newExAvoidance,
      biomechanicsTips: newExTips || 'Instrução biomecânica em calibração.',
      commonErrors: newExErrors ? newExErrors.split('\n').filter(Boolean) : ['Balançar o tronco durante a execução'],
      defaultSetsReps: newExSetsReps
    });

    setExercises(getAllLibraryExercises());
    setIsAddModalOpen(false);

    // Reset Form
    setNewExName('');
    setNewExTips('');
    setNewExErrors('');
    setNewExSecondaryMuscles('');
    setNewExSpecificMuscles('');
    setNewExAvoidance([]);
  };

  const toggleAvoidanceTag = (tag: string) => {
    setNewExAvoidance(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const getEquipmentBadgeColor = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'Máquina': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Polia / Cabo': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Barra': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Halteres': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Peso Corporal': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-[#0f172a] text-[#94a3b8] border-[#1e293b]';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>FitConnect Engine · Biblioteca de Exercícios</span>
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-black text-[#f1f5f9] tracking-tight">
              Banco de Dados Biomecânico & Prescrição
            </h2>

            <p className="text-xs text-[#a3a3b0] leading-relaxed">
              Explore a base catalogada com classificações completas por <strong className="text-[#00f0ff]">equipamento, padrão motor, grupos musculares primários/secundários e orientações de lesão</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 shadow-lg shadow-[#00f0ff]/15 text-xs font-extrabold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              + Cadastrar Exercício Customizado
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1e293b]">
          <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">Total de Exercícios</span>
            <span className="font-display text-xl font-extrabold text-[#00f0ff]">{exercises.length}</span>
          </div>

          <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">Máquinas & Polias</span>
            <span className="font-display text-xl font-extrabold text-[#f1f5f9]">
              {exercises.filter(e => e.equipmentCategory === 'Máquina' || e.equipmentCategory === 'Polia / Cabo' || e.equipmentCategory === 'Smith Machine').length}
            </span>
          </div>

          <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">Pesos Livres</span>
            <span className="font-display text-xl font-extrabold text-[#f1f5f9]">
              {exercises.filter(e => e.equipmentCategory === 'Barra' || e.equipmentCategory === 'Halteres' || e.equipmentCategory === 'Kettlebell').length}
            </span>
          </div>

          <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#1e293b]">
            <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">Calistenia & Peso Corp.</span>
            <span className="font-display text-xl font-extrabold text-[#f1f5f9]">
              {exercises.filter(e => e.equipmentCategory === 'Peso Corporal').length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome do exercício, músculo alvo (ex: peitoral, bíceps, quadríceps, smith)..."
            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] placeholder:text-[#64748b]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f1f5f9]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns / Filter Chips Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Equipamento */}
          <div>
            <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">
              Equipamento
            </label>
            <select
              value={selectedEqCategory}
              onChange={e => setSelectedEqCategory(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos">Todos os Equipamentos</option>
              {equipmentCategoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Grupo Muscular */}
          <div>
            <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">
              Músculo Principal
            </label>
            <select
              value={selectedMuscle}
              onChange={e => setSelectedMuscle(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos">Todos os Grupos Musculares</option>
              {muscleGroupsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Exercício */}
          <div>
            <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">
              Classificação Técnica
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos">Todas as Classificações</option>
              {exerciseTypesList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Dificuldade */}
          <div>
            <label className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block mb-1">
              Nível
            </label>
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
            >
              <option value="todos">Todos os Níveis</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(selectedEqCategory !== 'todos' || selectedMuscle !== 'todos' || selectedType !== 'todos' || selectedDifficulty !== 'todos' || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEqCategory('todos');
                setSelectedMuscle('todos');
                setSelectedType('todos');
                setSelectedDifficulty('todos');
              }}
              className="text-[11px] text-[#00f0ff] hover:underline font-bold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Exercises Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(ex => (
          <motion.div
            key={ex.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-[#0f172a] border border-[#1e293b] hover:border-[#00f0ff]/40 transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
          >
            {ex.custom && (
              <span className="absolute top-3 right-3 bg-[#00f0ff]/20 text-[#00f0ff] text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#00f0ff]/30">
                Customizado
              </span>
            )}

            <div className="space-y-3">
              {/* Header tags */}
              <div className="flex items-center gap-2 flex-wrap text-[10px]">
                <span className={`px-2 py-0.5 rounded-full border font-bold ${getEquipmentBadgeColor(ex.equipmentCategory)}`}>
                  {ex.equipmentCategory}
                </span>

                <span className="px-2 py-0.5 rounded-full bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] font-semibold">
                  {ex.exerciseType}
                </span>
              </div>

              {/* Title & Pattern */}
              <div>
                <h3 className="font-display font-extrabold text-base text-[#f1f5f9] group-hover:text-[#00f0ff] transition-colors leading-snug">
                  {ex.name}
                </h3>
                <span className="text-[11px] text-[#64748b] font-bold">
                  {MOVEMENT_PATTERN_LABELS[ex.pattern]} • Nível {ex.difficulty}
                </span>
              </div>

              {/* Muscle Specifics */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-[#f1f5f9] font-medium flex items-center gap-1.5">
                  <span className="text-[#00f0ff] font-bold">Principal:</span>
                  <span className="font-semibold text-[#f1f5f9]">{ex.primaryMuscle}</span>
                </div>

                {ex.specificMuscles && ex.specificMuscles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ex.specificMuscles.map((sm, idx) => (
                      <span key={idx} className="text-[9px] bg-[#0f172a] text-[#94a3b8] px-2 py-0.5 rounded border border-[#1e293b]">
                        {sm}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Avoidance Warning Badge */}
              {ex.av && ex.av.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Atenção em: <strong>{ex.av.join(', ')}</strong></span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#1e293b] flex items-center justify-between">
              <button
                onClick={() => setSelectedExerciseForModal(ex)}
                className="text-xs text-[#00f0ff] font-bold hover:underline flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" /> Detalhes Biomecânicos
              </button>

              {isSelectionMode && onSelectExerciseForProgram && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectExerciseForProgram(ex)}
                  className="text-xs py-1 px-3"
                >
                  Selecionar
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12 bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-3">
          <Dumbbell className="w-10 h-10 text-[#64748b] mx-auto animate-bounce" />
          <h3 className="text-sm font-bold text-[#f1f5f9]">Nenhum exercício encontrado com estes filtros</h3>
          <p className="text-xs text-[#64748b]">Tente remover os termos da pesquisa ou alterar as seleções de equipamento/músculo.</p>
        </div>
      )}

      {/* MODAL DETALHES BIOMECÂNICOS DO EXERCÍCIO */}
      {selectedExerciseForModal && (
        <Modal
          isOpen={!!selectedExerciseForModal}
          onClose={() => setSelectedExerciseForModal(null)}
          title={`Biomecânica: ${selectedExerciseForModal.name}`}
        >
          <div className="space-y-5 text-xs text-[#f1f5f9]">
            {/* Badges Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${getEquipmentBadgeColor(selectedExerciseForModal.equipmentCategory)}`}>
                {selectedExerciseForModal.equipmentCategory}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#0f172a] border border-[#1e293b] text-xs font-semibold">
                {selectedExerciseForModal.exerciseType}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 text-xs font-bold">
                Nível {selectedExerciseForModal.difficulty}
              </span>
            </div>

            {/* Target Muscles Anatomy Box */}
            <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider block">
                Anatomia Recrutada & Músculos Alvo
              </span>
              <div className="space-y-1.5">
                <div>
                  <span className="text-[#94a3b8] font-semibold">Grupo Muscular Principal: </span>
                  <span className="font-bold text-[#f1f5f9]">{selectedExerciseForModal.primaryMuscle}</span>
                </div>

                {selectedExerciseForModal.specificMuscles && selectedExerciseForModal.specificMuscles.length > 0 && (
                  <div>
                    <span className="text-[#94a3b8] font-semibold">Porções Específicas: </span>
                    <span className="text-[#00f0ff] font-semibold">{selectedExerciseForModal.specificMuscles.join(' • ')}</span>
                  </div>
                )}

                {selectedExerciseForModal.secondaryMuscles && selectedExerciseForModal.secondaryMuscles.length > 0 && (
                  <div>
                    <span className="text-[#94a3b8] font-semibold">Músculos Sinergistas / Estabilizadores: </span>
                    <span className="text-[#f1f5f9]">{selectedExerciseForModal.secondaryMuscles.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Execution Guide */}
            <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-[#38bdf8] uppercase tracking-wider block">
                Guia de Execução & Postura Biomecânica
              </span>
              <p className="text-xs text-[#f1f5f9] leading-relaxed">
                {selectedExerciseForModal.biomechanicsTips}
              </p>
            </div>

            {/* Common Errors */}
            {selectedExerciseForModal.commonErrors && selectedExerciseForModal.commonErrors.length > 0 && (
              <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Erros Comuns de Execução para Corrigir
                </span>
                <ul className="space-y-1">
                  {selectedExerciseForModal.commonErrors.map((err, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-[#a3a3b0]">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{err}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Safety Avoidance */}
            {selectedExerciseForModal.av && selectedExerciseForModal.av.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Cuidados Clínicos de Saúde Articular
                </span>
                <p className="text-xs text-amber-200">
                  Exercício requer cautela para alunos com histórico de dores/lesões em: <strong>{selectedExerciseForModal.av.join(', ')}</strong>.
                </p>
              </div>
            )}

            {/* Prescription Suggestion */}
            <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-[#1e293b] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider block">Prescrição Padrão Sugerida</span>
                <span className="font-mono text-xs font-bold text-[#00f0ff]">{selectedExerciseForModal.defaultSetsReps}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL CADASTRAR NOVO EXERCÍCIO */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Cadastrar Novo Exercício na Biblioteca"
        >
          <form onSubmit={handleCreateExercise} className="space-y-4 text-xs text-[#f1f5f9]">
            <div>
              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                Nome do Exercício *
              </label>
              <input
                type="text"
                required
                value={newExName}
                onChange={e => setNewExName(e.target.value)}
                placeholder="Ex: Agachamento Pêndulo na Máquina"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                  Categoria do Equipamento
                </label>
                <select
                  value={newExEquipmentCat}
                  onChange={e => setNewExEquipmentCat(e.target.value as EquipmentCategory)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
                >
                  {equipmentCategoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                  Grupo Muscular Principal
                </label>
                <select
                  value={newExPrimaryMuscle}
                  onChange={e => setNewExPrimaryMuscle(e.target.value as PrimaryMuscleGroup)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
                >
                  {muscleGroupsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                  Classificação do Movimento
                </label>
                <select
                  value={newExTypeCat}
                  onChange={e => setNewExTypeCat(e.target.value as ExerciseTypeCategory)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
                >
                  {exerciseTypesList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                  Nível Recomendado
                </label>
                <select
                  value={newExDifficulty}
                  onChange={e => setNewExDifficulty(e.target.value as any)}
                  className="w-full bg-[#0f172a] border border-[#1e293b] text-[#f1f5f9] rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                Porções Específicas / Músculos Focados (separados por vírgula)
              </label>
              <input
                type="text"
                value={newExSpecificMuscles}
                onChange={e => setNewExSpecificMuscles(e.target.value)}
                placeholder="Ex: Vasto Medial, Reto Femoral"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                Instrução Biomecânica de Execução
              </label>
              <textarea
                rows={2}
                value={newExTips}
                onChange={e => setNewExTips(e.target.value)}
                placeholder="Descreva a postura das articulações, pegada e cadência..."
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl p-3 text-xs text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider block mb-1">
                Cuidados de Saúde / Contraindicações Articulares
              </label>
              <div className="flex gap-2 flex-wrap pt-1">
                {['lombar', 'joelho', 'ombro', 'cervical'].map(tag => {
                  const isSel = newExAvoidance.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleAvoidanceTag(tag)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        isSel
                          ? 'bg-amber-500 text-black'
                          : 'bg-[#0f172a] border border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9]'
                      }`}
                    >
                      ⚠️ Cuidado em {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary">
                Salvar na Biblioteca
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

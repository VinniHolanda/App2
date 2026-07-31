import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudentViewModel } from '../viewmodels/useStudentViewModel';
import { Button, Card, Badge, Modal } from '../components/ui/Primitives';
import { LiveWorkoutTracker, WellnessModal, DailyReadinessCard } from '../components/student/StudentComponents';
import { AudioNoteRecorder } from '../components/student/AudioNoteRecorder';
import { RestTimerBar } from '../components/ui/Gauges';
import { clientRepository } from '../../data/repositories/ClientRepository';
import { Client } from '../../domain/types';
import { calculatePersonalRecords } from '../../domain/calculators/loadCalculators';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { 
  Lock, UserCheck, Key, LogOut, Sparkles, CheckCircle2, Dumbbell, 
  Flame, Trophy, MessageSquare, Activity, ChevronRight, Zap, Play, Send, Calendar, TrendingUp, ShieldCheck, Phone, Instagram
} from 'lucide-react';
import { WeeklySchedulerWidget } from '../components/student/WeeklySchedulerWidget';
import { StudentPerformanceDashboard } from '../components/student/StudentPerformanceDashboard';
import { StudentBadgesWidget } from '../components/student/StudentBadgesWidget';
import { PersistentRestTimerOverlay } from '../components/student/PersistentRestTimerOverlay';
import { OfflineStatusIndicator } from '../components/student/OfflineStatusIndicator';
import { StudentRecoveryCheckinWidget } from '../components/student/StudentRecoveryCheckinWidget';

export interface StudentPortalViewProps {
  clientId?: string;
  onBackToTrainer?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ clientId: initialClientId, onBackToTrainer }) => {
  const { currentUser, userProfile, signInWithGoogle, linkStudentAccount, loginWithEmail, registerWithEmail } = useAuth();
  const [activeStudentId, setActiveStudentId] = useState<string | null>(() => {
    return initialClientId || localStorage.getItem('fitconnect_student_id') || null;
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // If we have a user from Firebase Auth, attempt to find their linked client record
    const fetchMatchedClient = async () => {
      if (!currentUser?.email) return;
      
      try {
        const userEmail = currentUser.email.toLowerCase();
        if (userProfile?.studentClientId) {
          setActiveStudentId(userProfile.studentClientId);
          localStorage.setItem('fitconnect_student_id', userProfile.studentClientId);
          return;
        }

        
        const q = query(collection(db, 'clients'), where('portal.email', '==', userEmail));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const matched = snap.docs[0].data() as Client;
          setActiveStudentId(matched.id);
          localStorage.setItem('fitconnect_student_id', matched.id);
          linkStudentAccount(matched.id);
        } else {
          const q2 = query(collection(db, 'clients'), where('email', '==', userEmail));
          const snap2 = await getDocs(q2);
          if (!snap2.empty) {
             const matched = snap2.docs[0].data() as Client;
             setActiveStudentId(matched.id);
             localStorage.setItem('fitconnect_student_id', matched.id);
             linkStudentAccount(matched.id);
          }
        }
      } catch (err) {
        console.warn("Error auto-matching student profile:", err);
      }
    };
    
    fetchMatchedClient();
  }, [currentUser, userProfile]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      await loginWithEmail(loginEmail, loginPass);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setLoginError('E-mail ou senha incorretos. Caso seja seu primeiro acesso, crie uma conta.');
      } else {
        setLoginError('Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await registerWithEmail(loginEmail, loginPass, loginEmail.split('@')[0], 'student');
    } catch (err: any) {
      setLoginError('Erro ao criar conta. Talvez este e-mail já esteja em uso ou a senha seja fraca (min 6 caracteres).');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleStudentLogin = async () => {
    try {
      await signInWithGoogle('student');
    } catch (err) {
      console.error("Google Auth error:", err);
    }
  };

  const handleLogout = () => {
    setActiveStudentId(null);
    localStorage.removeItem('fitconnect_student_id');
  };

  // If no student is logged in, show login form
  if (!activeStudentId) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto py-10 px-4 space-y-6"
      >
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00f0ff] to-[#3b82f6] text-[#080b11] font-display font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-[#00f0ff]/20 border border-[#00f0ff]/40">
            FC
          </div>
          <div>
            <h2 className="font-display text-2xl font-black text-[#f1f5f9] tracking-tight">
              Portal do Aluno · FitConnect
            </h2>
            <p className="text-xs text-[#94a3b8] mt-1 max-w-xs mx-auto">
              Acesse seus treinos prescritos com inteligência esportiva, registre marcas e acompanhe sua evolução em tempo real.
            </p>
          </div>
        </div>

        <Card className="p-6 bg-[#0f172a]/95 backdrop-blur-md border-[#1e293b] shadow-2xl space-y-5 rounded-2xl">
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#00f0ff]" />
                E-mail do Aluno
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="Ex: ana@fitconnect.com"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#00f0ff]" />
                Senha de Acesso
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="Digite sua senha (mínimo 6 caracteres)"
                className="w-full bg-[#0f172a] border border-[#1e293b] rounded-xl px-3.5 py-2.5 text-sm text-[#f1f5f9] focus:outline-none focus:border-[#00f0ff] transition-colors"
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {loginError}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                onClick={handleLogin}
                variant="primary"
                disabled={isLoggingIn}
                className="w-full py-3.5 shadow-xl shadow-[#00f0ff]/15 font-bold text-sm flex items-center justify-center gap-2"
              >
                {isLoggingIn ? 'Processando...' : 'Entrar'}
              </Button>
              <Button
                type="button"
                onClick={handleRegister}
                variant="ghost"
                disabled={isLoggingIn}
                className="w-full py-3.5 font-bold text-sm flex items-center justify-center gap-2 border border-[#1e293b] hover:border-[#00f0ff]/30 text-[#94a3b8] hover:text-[#f1f5f9]"
              >
                Criar Nova Conta
              </Button>
            </div>
          </form>
        </Card>

        {onBackToTrainer && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onBackToTrainer} className="text-xs text-[#94a3b8] hover:text-[#f1f5f9]">
              ← Voltar ao Painel do Treinador
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  // Once student is logged in, render Student View Model
  return (
    <StudentPortalActiveContent
      clientId={activeStudentId}
      onLogout={handleLogout}
      onBackToTrainer={onBackToTrainer}
    />
  );
};

const StudentPortalActiveContent: React.FC<{
  clientId: string;
  onLogout: () => void;
  onBackToTrainer?: () => void;
}> = ({ clientId, onLogout, onBackToTrainer }) => {
  const vm = useStudentViewModel(clientId);
  const { brand } = useBrand();

  // Finishing modal states
  const [finishMin, setFinishMin] = useState<number>(60);
  const [finishSrpe, setFinishSrpe] = useState<number>(7);
  const [finishNote, setFinishNote] = useState<string>('');
  const [isAudioNote, setIsAudioNote] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState<'all' | 'push' | 'pull' | 'legs' | 'core'>('all');
  const [treinoAtivoFocus, setTreinoAtivoFocus] = useState<boolean>(true);

  const handleFinishWorkout = async () => {
    await vm.finishSession(finishMin, finishSrpe, undefined, finishNote, isAudioNote);
    setFinishNote('');
    setIsAudioNote(false);
  };

  if (!vm.client) {
    return (
      <div className="p-12 text-center text-[#64748b] font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" /> Carregando portal do aluno...
      </div>
    );
  }

  const program = vm.client.program;
  const days = program?.days || [];
  const activeDay = days[vm.currentDayIndex] || days[0];
  const personalRecords = calculatePersonalRecords(vm.client.rpeLog || []);

  const totalCompletedSessions = vm.client.rpeLog?.length || 0;
  const isFocusingActiveWorkout = vm.inSession && !vm.isFinishing && treinoAtivoFocus;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Studio Branding Welcome Banner for Student */}
      {!vm.inSession && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden"
        >
          <div 
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
            style={{ backgroundColor: brand.primaryColor }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-3">
              {brand.logoUrl ? (
                <img 
                  src={brand.logoUrl} 
                  alt="Logo" 
                  className="w-10 h-10 rounded-xl object-contain bg-[#080b11] p-1 border border-[#1e293b]"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl text-[#080b11] font-display font-black flex items-center justify-center text-sm shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`
                  }}
                >
                  {brand.shortInitials || 'KS'}
                </div>
              )}
              <div>
                <div className="font-display font-extrabold text-sm text-[#f1f5f9] flex items-center gap-1.5">
                  <span>{brand.studioName}</span>
                  <span 
                    className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold"
                    style={{
                      backgroundColor: `${brand.primaryColor}20`,
                      color: brand.primaryColor,
                      borderColor: `${brand.primaryColor}40`
                    }}
                  >
                    CONSULTORIA
                  </span>
                </div>
                <div className="text-[11px] text-[#94a3b8] font-medium">
                  {brand.welcomeMessageStudent || 'Bem-vindo ao seu portal de treinos!'}
                </div>
              </div>
            </div>

            {/* Quick Support Contacts */}
            <div className="flex items-center gap-2">
              {brand.whatsappNumber && (
                <a
                  href={`https://wa.me/${brand.whatsappNumber.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(brand.trainerName)},%20sou%20o%20aluno%20${encodeURIComponent(vm.client.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
              {brand.instagramHandle && (
                <a
                  href={`https://instagram.com/${brand.instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Instagram</span>
                </a>
              )}
            </div>
          </div>

          {/* Student Profile Info Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-2xl text-[#080b11] font-display font-black flex items-center justify-center text-base shadow-md"
                style={{ backgroundColor: brand.primaryColor }}
              >
                {vm.client.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-display font-extrabold text-base text-[#f1f5f9]">
                  Olá, {vm.client.name.split(' ')[0]}
                </h2>
                <div className="text-xs text-[#94a3b8] font-medium flex items-center gap-2 mt-0.5">
                  <span 
                    className="px-2 py-0.5 rounded-md border text-[10px] font-bold"
                    style={{
                      backgroundColor: `${brand.primaryColor}15`,
                      color: brand.primaryColor,
                      borderColor: `${brand.primaryColor}30`
                    }}
                  >
                    {vm.client.goal}
                  </span>
                  <span>•</span>
                  <span className="text-[11px] text-[#64748b]">{totalCompletedSessions} sessões registradas</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-xs text-[#94a3b8] hover:text-red-400 border border-[#1e293b] px-3"
                title="Sair da conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>

              {onBackToTrainer && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onBackToTrainer} 
                  className="text-xs font-bold"
                  style={{ color: brand.primaryColor }}
                >
                  Painel Treinador
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Offline Status Bar Indicator */}
      <OfflineStatusIndicator />

      {/* Navigation Pills (Minimized/Hidden in Session Mode) */}
      {!vm.inSession && (
        <div className="flex gap-2 border-b border-[#1e293b] pb-3 overflow-x-auto relative">
          {[
            { key: 'home', label: 'Início', icon: Sparkles },
            { key: 'conquistas', label: 'Conquistas & Medalhas', icon: Trophy },
            { key: 'evolucao', label: 'Evolução & Performance', icon: TrendingUp },
            { key: 'agenda', label: 'Agenda Semanal', icon: Calendar },
            { key: 'treino', label: 'Meu Treino', icon: Dumbbell },
            { key: 'exercicios', label: 'Recordes & Cargas', icon: ShieldCheck },
            { key: 'chat', label: 'Mensagens', icon: MessageSquare }
          ].map(item => {
            const Icon = item.icon;
            const isActive = vm.activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => vm.setActiveTab(item.key as any)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap z-10 ${
                  isActive
                    ? 'text-[#080b11]'
                    : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="studentPortalActiveTab"
                    className="absolute inset-0 rounded-xl shadow-lg -z-10"
                    style={{
                      background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.secondaryColor})`
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* LIVE WORKOUT SESSION ACTIVE */}
      {vm.inSession && !vm.isFinishing && (
        <LiveWorkoutTracker
          exercises={vm.activeExercises}
          currentTonnage={vm.currentTonnage}
          targetLimit={vm.targetTonnageLimit}
          wellnessData={vm.wellnessData}
          client={vm.client}
          onAddSet={vm.addSetToExercise}
          onRemoveSet={vm.removeSetFromExercise}
          onApplyAll={vm.applyToAllRemainingSets}
          onReplaceExercise={vm.replaceExerciseName}
          onGoFinish={() => vm.setIsFinishing(true)}
          onCancel={() => vm.startLiveSession()}
          guidedMode={vm.guidedMode}
          onToggleGuided={() => vm.setGuidedMode(!vm.guidedMode)}
          restTimerSeconds={vm.restTimerSeconds}
          restTimerMax={vm.restTimerMax}
          restTimerActive={vm.restTimerActive}
          onStopRestTimer={vm.stopRestTimer}
          onAddRestSeconds={vm.addRestTimerSeconds}
          isTreinoAtivoFocus={treinoAtivoFocus}
          onToggleTreinoAtivoFocus={() => setTreinoAtivoFocus(!treinoAtivoFocus)}
        />
      )}

      {/* FINISHING SESSION FORM */}
      {vm.inSession && vm.isFinishing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-5 shadow-2xl"
        >
          <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
            <Trophy className="w-5 h-5 text-[#00f0ff]" />
            <h3 className="font-display font-bold text-xl text-[#00f0ff]">Como foi seu treino hoje?</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">Duração Total (minutos)</label>
              <input
                type="number"
                value={finishMin}
                onChange={e => setFinishMin(Number(e.target.value))}
                className="w-full bg-[#080b11] border border-[#1e293b] rounded-xl p-3 text-sm text-[#f1f5f9] focus:border-[#00f0ff] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94a3b8] mb-1">
                Esforço Percebido sRPE (0-10) — Escala Foster
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={finishSrpe}
                onChange={e => setFinishSrpe(Number(e.target.value))}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono font-bold text-[#00f0ff] mt-1">
                <span>1 = Muito Leve</span>
                <span className="bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/30">{finishSrpe} / 10</span>
                <span>10 = Máximo</span>
              </div>
            </div>

            <div>
              <AudioNoteRecorder
                value={finishNote}
                onChange={(text, isFromAudio) => {
                  setFinishNote(text);
                  if (isFromAudio) setIsAudioNote(true);
                }}
                label="Notas Pós-Treino por Áudio (Fala para Texto)"
                placeholder="Ex: Senti a musculatura das pernas bem fadigada. Cargas do agachamento foram ótimas, mas o descanso entre séries precisou ser um pouco maior..."
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-[#1e293b]">
            <Button
              variant="primary"
              className="flex-1 font-bold py-3 text-sm shadow-xl shadow-[#00f0ff]/15"
              onClick={handleFinishWorkout}
            >
              Salvar Treino no Histórico
            </Button>
            <Button variant="ghost" onClick={() => vm.setIsFinishing(false)}>
              Voltar
            </Button>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENTS WHEN NOT IN LIVE SESSION */}
      <AnimatePresence mode="wait">
        {!vm.inSession && vm.activeTab === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Quick Action Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <motion.button
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={vm.prepareSession}
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:border-[#00f0ff]/50 border border-[#1e293b] rounded-2xl p-3.5 text-left transition-all group shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-[#00f0ff]" />
                </div>
                <div className="font-bold text-xs text-[#f1f5f9]">Iniciar Treino</div>
                <div className="text-[10px] text-[#94a3b8]">Começar agora</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={vm.performQuickCheckin}
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:border-[#00f0ff]/50 border border-[#1e293b] rounded-2xl p-3.5 text-left transition-all group shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-[#f1f5f9]">Check-in Rápido</div>
                <div className="text-[10px] text-[#94a3b8]">Registrar presença</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => vm.setActiveTab('evolucao')}
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:border-[#00f0ff]/50 border border-[#1e293b] rounded-2xl p-3.5 text-left transition-all group shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-[#f1f5f9]">Ver Evolução</div>
                <div className="text-[10px] text-[#94a3b8]">Gráficos & 1RM</div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.025, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => vm.setActiveTab('chat')}
                className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] hover:border-[#00f0ff]/50 border border-[#1e293b] rounded-2xl p-3.5 text-left transition-all group shadow-md"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-[#f1f5f9]">Falar c/ Treinador</div>
                <div className="text-[10px] text-[#94a3b8]">Tirar dúvidas</div>
              </motion.button>
            </div>

            {/* Quick Recovery Check-in Form */}
            {vm.client && (
              <StudentRecoveryCheckinWidget 
                client={vm.client} 
                onCheckinSubmitted={() => vm.loadClientData && vm.loadClientData()} 
              />
            )}

            {/* Quick Day Selector with Animated Layout Pill */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map((day, idx) => {
                const isSelected = vm.currentDayIndex === idx;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => vm.setCurrentDayIndex(idx)}
                    className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'text-[#080b11] font-black'
                        : 'bg-[#080b11] border border-[#1e293b] text-[#94a3b8] hover:text-[#f1f5f9]'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeStudentDayPill"
                        className="absolute inset-0 bg-[#00f0ff] rounded-xl -z-10 shadow-lg shadow-[#00f0ff]/25"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    {day.name}
                  </motion.button>
                );
              })}
            </div>

            {/* Smooth Workout Block Transition Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`workout-block-${vm.currentDayIndex}`}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5"
              >
                {/* Hero Card for Selected Workout Block */}
                {activeDay ? (
                  <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0284c7] rounded-3xl p-6 text-[#f1f5f9] space-y-5 shadow-2xl relative overflow-hidden border border-[#00f0ff]/30">
                    <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none text-[#00f0ff]">
                      <Dumbbell className="w-40 h-40" />
                    </div>

                    <div className="relative z-10 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 px-3 py-1 rounded-full inline-flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-[#00f0ff]" /> Bloco de Treino Selecionado
                      </span>
                      <h3 className="font-display font-black text-2xl md:text-3xl tracking-tight text-[#f1f5f9]">
                        {activeDay?.name || 'Treino A'}
                      </h3>
                      <p className="text-xs text-[#94a3b8] font-semibold">
                        Ênfase: {activeDay?.focus || 'Geral'} · {activeDay?.exercises?.length || 0} exercícios programados
                      </p>
                    </div>

                    <div className="relative z-10 flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        variant="primary"
                        className="bg-gradient-to-r from-[#00f0ff] to-[#38bdf8] text-[#080b11] hover:brightness-110 font-black px-5 py-3 text-sm flex items-center gap-2 shadow-lg shadow-[#00f0ff]/25 border-0"
                        onClick={vm.prepareSession}
                      >
                        <Play className="w-4 h-4 fill-[#080b11]" /> Iniciar Treino Agora
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-[#f1f5f9] hover:bg-white/10 font-bold text-xs"
                        onClick={vm.performQuickCheckin}
                      >
                        ✓ Presença Rápida
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f172a] border border-dashed border-[#1e293b] rounded-2xl p-8 text-center text-[#94a3b8]">
                    Nenhum treino cadastrado ainda. Aguarde a prescrição do seu treinador.
                  </div>
                )}

                {/* Exercise Preview List with Micro-Animated Category Filtering */}
                {activeDay && activeDay.exercises && (
                  <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
                      <h4 className="font-display font-bold text-sm text-[#f1f5f9] flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-[#00f0ff]" /> Exercícios Prescritos
                      </h4>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                        {[
                          { key: 'all', label: 'Todos' },
                          { key: 'push', label: 'Empurrar' },
                          { key: 'pull', label: 'Puxar' },
                          { key: 'legs', label: 'Pernas' },
                          { key: 'core', label: 'Core / Cardio' }
                        ].map(f => (
                          <motion.button
                            key={f.key}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setExerciseCategoryFilter(f.key as any)}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                              exerciseCategoryFilter === f.key
                                ? 'bg-[#00f0ff] text-[#080b11]'
                                : 'bg-[#080b11] text-[#94a3b8] hover:text-[#f1f5f9] border border-[#1e293b]'
                            }`}
                          >
                            {f.label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-[#1e293b] min-h-[120px]">
                      <AnimatePresence mode="popLayout">
                        {activeDay.exercises
                          .filter(ex => {
                            if (exerciseCategoryFilter === 'all') return true;
                            const pat = ex.pat || '';
                            if (exerciseCategoryFilter === 'push') return pat.startsWith('push') || pat.includes('shoulder') || pat.includes('tri');
                            if (exerciseCategoryFilter === 'pull') return pat.startsWith('pull') || pat.includes('bi');
                            if (exerciseCategoryFilter === 'legs') return pat === 'quad' || pat === 'hinge' || pat === 'calf';
                            if (exerciseCategoryFilter === 'core') return pat === 'core' || pat === 'cond';
                            return true;
                          })
                          .map((ex, i) => (
                            <motion.div
                              key={`${ex.name}-${i}`}
                              layout
                              initial={{ opacity: 0, y: 8, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -8, scale: 0.98 }}
                              transition={{ duration: 0.18 }}
                              className="py-3 flex justify-between items-center text-xs"
                            >
                              <div>
                                <div className="font-bold text-[#f1f5f9] text-sm flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                                  {ex.name}
                                </div>
                                {ex.notes && <div className="text-[#94a3b8] text-[11px] mt-0.5 ml-3.5">{ex.notes}</div>}
                              </div>
                              <div className="font-mono text-[#00f0ff] font-bold bg-[#080b11] border border-[#1e293b] px-2.5 py-1 rounded-lg shadow-sm">
                                {ex.sets} × {ex.reps}
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Weekly Scheduler Widget on Home Tab */}
            <WeeklySchedulerWidget
              client={vm.client}
              onSelectWorkoutDay={(dIdx) => vm.setCurrentDayIndex(dIdx)}
              onStartWorkoutDay={(dIdx) => {
                vm.setCurrentDayIndex(dIdx);
                vm.prepareSession();
              }}
              onClientUpdate={(updated) => {
                // Client state updated via repository
              }}
            />

            {/* Badges and Medals System */}
            <StudentBadgesWidget client={vm.client} />
          </motion.div>
        )}

        {/* TAB: CONQUISTAS & MEDALHAS */}
        {!vm.inSession && vm.activeTab === 'conquistas' && (
          <motion.div
            key="conquistas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <StudentBadgesWidget client={vm.client} />
          </motion.div>
        )}

        {/* TAB: EVOLUÇÃO & PERFORMANCE (RECHARTS DASHBOARD) */}
        {!vm.inSession && vm.activeTab === 'evolucao' && (
          <motion.div
            key="evolucao"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <StudentPerformanceDashboard client={vm.client} />
          </motion.div>
        )}

        {/* TAB: AGENDA SEMANAL (SCHEDULER) */}
        {!vm.inSession && vm.activeTab === 'agenda' && (
          <motion.div
            key="agenda"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <WeeklySchedulerWidget
              client={vm.client}
              onSelectWorkoutDay={(dIdx) => vm.setCurrentDayIndex(dIdx)}
              onStartWorkoutDay={(dIdx) => {
                vm.setCurrentDayIndex(dIdx);
                vm.prepareSession();
              }}
            />
          </motion.div>
        )}

        {/* TAB: MEU TREINO (FULL PROGRAM) */}
        {!vm.inSession && vm.activeTab === 'treino' && (
          <motion.div
            key="treino"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {program ? (
              <div className="space-y-4">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3 shadow-lg">
                  <h4 className="font-display font-bold text-base text-[#00f0ff]">Programa de Treinamento</h4>
                  <p className="text-xs text-[#f1f5f9] leading-relaxed">{program.summary}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {program.principles?.map((p, idx) => (
                      <Badge key={idx} variant="accent">{p}</Badge>
                    ))}
                  </div>
                </div>

                {days.map((day, di) => (
                  <div key={di} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-[#1e293b]">
                      <div>
                        <h4 className="font-bold text-base text-[#f1f5f9]">{day.name}</h4>
                        <div className="text-xs text-[#64748b] font-medium">{day.focus}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => {
                          vm.setCurrentDayIndex(di);
                          vm.prepareSession();
                        }}
                        className="text-xs font-bold"
                      >
                        Iniciar
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#1e293b] text-[#64748b] uppercase">
                            <th className="py-2 px-2">Exercício</th>
                            <th className="py-2 px-2 text-center">Séries</th>
                            <th className="py-2 px-2 text-center">Reps</th>
                            <th className="py-2 px-2 text-center">Descanso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.exercises.map((ex, ei) => (
                            <tr key={ei} className="border-b border-[#1e293b]/50">
                              <td className="py-2.5 px-2 font-bold text-[#f1f5f9]">{ex.name}</td>
                              <td className="py-2.5 px-2 text-center font-mono font-bold text-[#00f0ff]">{ex.sets}</td>
                              <td className="py-2.5 px-2 text-center font-mono text-[#f1f5f9]">{ex.reps}</td>
                              <td className="py-2.5 px-2 text-center text-[#94a3b8]">{ex.rest || '90s'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-dashed border-[#1e293b] rounded-2xl p-8 text-center text-[#64748b]">
                Nenhum programa cadastrado.
              </div>
            )}
          </motion.div>
        )}

        {/* TAB: RECORDES & CARGAS */}
        {!vm.inSession && vm.activeTab === 'exercicios' && (
          <motion.div
            key="exercicios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg">
              <h3 className="font-display font-bold text-base text-[#00f0ff] flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Recordes Pessoais (1RM Est. Epley)
              </h3>
              
              {Object.keys(personalRecords).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1e293b] text-[#64748b] uppercase">
                        <th className="py-2 px-2">Exercício</th>
                        <th className="py-2 px-2">Melhor Carga</th>
                        <th className="py-2 px-2 text-center">1RM Estimado</th>
                        <th className="py-2 px-2 text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(personalRecords).map(([name, pr]) => (
                        <tr key={name} className="border-b border-[#1e293b]/50 hover:bg-[#0f172a]">
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
                <p className="text-xs text-[#64748b] py-2">
                  Você ainda não registrou séries com carga no portal. Realize treinos para ver seus recordes calculados automaticamente.
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB: CHAT COM TREINADOR */}
        {!vm.inSession && vm.activeTab === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="font-display font-bold text-base text-[#f1f5f9] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00f0ff]" /> Canal Direto com seu Treinador
              </h3>
              <span className="text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] font-bold px-2 py-0.5 rounded-full border border-[#00f0ff]/20">
                Online
              </span>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto p-3 bg-[#0f172a] rounded-xl border border-[#1e293b]">
              {vm.client.trainerChat && vm.client.trainerChat.length > 0 ? (
                vm.client.trainerChat.map(m => (
                  <div key={m.id} className={`p-3 rounded-xl text-xs max-w-[85%] ${
                    m.from === 'student' || m.from === 'client'
                      ? 'ml-auto bg-[#00f0ff] text-[#080b11] font-medium shadow-md shadow-[#00f0ff]/10' 
                      : 'bg-[#0f172a] text-[#f1f5f9] border border-[#1e293b]'
                  }`}>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <div className="text-[9px] opacity-60 mt-1 text-right">
                      {new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748b] text-center py-6">Nenhuma mensagem enviada ainda. Fale ou digite abaixo para conversar!</p>
              )}
            </div>

            <div className="space-y-2">
              <AudioNoteRecorder
                value={chatMessage}
                onChange={(text) => setChatMessage(text)}
                label="Enviar Mensagem por Áudio ou Texto"
                placeholder="Digite ou fale sua dúvida / observação para seu treinador..."
                compact
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (chatMessage.trim()) {
                      vm.sendStudentMessage(chatMessage);
                      setChatMessage('');
                    }
                  }}
                  className="font-bold px-5 py-2.5 flex items-center gap-1.5 shadow-lg shadow-[#00f0ff]/20"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar Mensagem
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Timer Persistent Floating Overlay */}
      <PersistentRestTimerOverlay
        restTimerSeconds={vm.restTimerSeconds}
        restTimerMax={vm.restTimerMax}
        restTimerActive={vm.restTimerActive}
        onStopRestTimer={vm.stopRestTimer}
        onAddRestSeconds={vm.addRestTimerSeconds}
        onTogglePlayPause={vm.toggleRestTimerPause}
      />

      {/* Wellness Check Modal */}
      <WellnessModal
        isOpen={vm.showWellnessModal}
        onSubmit={wellness => vm.startLiveSession(wellness)}
        onSkip={() => vm.startLiveSession()}
      />
    </div>
  );
};


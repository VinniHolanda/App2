import { useState, useEffect, useCallback } from 'react';
import { Client, Session, LoggedExercise, WellnessData, ClassBooking } from '../../domain/types';
import { clientRepository } from '../../data/repositories/ClientRepository';
import { calculateSessionTonnage, calculate1RMEpley, suggestKgForReps, calculatePersonalRecords } from '../../domain/calculators/loadCalculators';
import { calculateSessionTonnageLimit } from '../../domain/calculators/volumeCalculators';
import { OvertrainingMonitoringService } from '../../domain/services/OvertrainingMonitoringService';

export type StudentTab = 'home' | 'agenda' | 'treino' | 'exercicios' | 'evolucao' | 'conquistas' | 'chat' | 'historico' | 'perfil';

export interface ActiveExerciseState {
  name: string;
  pat: any;
  isCond: boolean;
  notes?: string;
  method?: string;
  planned: {
    sets: number;
    reps: number;
    rest: string;
  };
  sets: Array<{ reps: number; kg: number; rpe?: number }>;
  tonnage: number;
  refKg: number | null;
  suggestedKg: number | null;
}

export function useStudentViewModel(clientId: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<StudentTab>('home');
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  
  // Live workout session states
  const [inSession, setInSession] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [guidedMode, setGuidedMode] = useState<boolean>(false);
  const [guidedExerciseIndex, setGuidedExerciseIndex] = useState<number>(0);
  const [activeExercises, setActiveExercises] = useState<ActiveExerciseState[]>([]);
  const [wellnessData, setWellnessData] = useState<WellnessData | null>(null);
  const [showWellnessModal, setShowWellnessModal] = useState<boolean>(false);
  
  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [restTimerMax, setRestTimerMax] = useState<number>(90);
  const [restTimerActive, setRestTimerActive] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reloadClient = useCallback(async () => {
    if (!clientId) return;
    const data = await clientRepository.getClientById(clientId);
    setClient(data);
  }, [clientId]);

  useEffect(() => {
    reloadClient();
  }, [reloadClient]);

  // Rest Timer Interval
  useEffect(() => {
    let interval: any = null;
    if (restTimerActive && restTimerSeconds !== null && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimerSeconds === 0) {
      setRestTimerActive(false);
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [restTimerActive, restTimerSeconds]);

  const toggleRestTimerPause = () => {
    if (restTimerSeconds === null || restTimerSeconds === 0) {
      startRestTimer(restTimerMax || 90);
    } else {
      setRestTimerActive(prev => !prev);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const startRestTimer = (seconds: number) => {
    setRestTimerMax(seconds);
    setRestTimerSeconds(seconds);
    setRestTimerActive(true);
  };

  const stopRestTimer = () => {
    setRestTimerActive(false);
    setRestTimerSeconds(null);
  };

  const addRestTimerSeconds = (seconds: number) => {
    setRestTimerSeconds(prev => {
      if (prev === null) {
        setRestTimerMax(seconds);
        setRestTimerActive(true);
        return seconds;
      }
      const newSec = Math.max(0, prev + seconds);
      if (newSec === 0) setRestTimerActive(false);
      return newSec;
    });
  };

  const prepareSession = () => {
    if (!client || !client.program) return;
    setShowWellnessModal(true);
  };

  const startLiveSession = (wellness?: WellnessData) => {
    if (!client || !client.program) return;
    
    // Calculate dynamic auto-regulation factor
    let factor = 1.0;
    let autoNote = '';

    if (wellness) {
      if (wellness.hasJointPain || wellness.hasDizzinessOrDyspnea) {
        factor = 0.85; // Auto-regulation -15% for safety
        autoNote = 'Sintoma/Dor PAR-Q detectado: Cargas reduzidas em -15% para preservação e segurança.';
      } else if (wellness.recoveryScale !== undefined) {
        if (wellness.recoveryScale <= 4) {
          factor = 0.85;
          autoNote = `Baixa recuperação subjetiva (${wellness.recoveryScale}/10): Cargas ajustadas em -15% (Auto-regulação).`;
        } else if (wellness.recoveryScale >= 8) {
          factor = 1.025;
          autoNote = `Prontidão excelente (${wellness.recoveryScale}/10): +2.5% de carga sugerida para sobrecarga progressiva.`;
        } else {
          factor = 1.0;
          autoNote = `Recuperação normal (${wellness.recoveryScale}/10): Mantido 100% das cargas prescritas.`;
        }
      } else if (wellness.score < 50) {
        factor = 0.85;
        autoNote = 'Prontidão baixa (< 50%): Cargas reduzidas em -15%.';
      }

      const updatedWellness: WellnessData = {
        ...wellness,
        loadAdjustmentFactor: factor,
        autoRegulatedNote: autoNote
      };
      setWellnessData(updatedWellness);
    }
    setShowWellnessModal(false);

    const programDay = client.program.days[currentDayIndex] || client.program.days[0];
    const prs = calculatePersonalRecords(client.rpeLog || []);

    const prepared: ActiveExerciseState[] = (programDay.exercises || []).map(ex => {
      const matchPr = prs[ex.name];
      const targetRepsMatch = ex.reps.match(/\d+/);
      const targetRepsNum = targetRepsMatch ? Number(targetRepsMatch[0]) : 10;
      let suggested = matchPr ? suggestKgForReps(matchPr.est1RM, targetRepsNum) : null;

      if (suggested && factor !== 1.0) {
        suggested = Math.round(suggested * factor);
      }

      // Find last session reference
      let refKg: number | null = null;
      for (const s of (client.rpeLog || [])) {
        const foundEx = (s.exercises || []).find(e => e.name === ex.name);
        if (foundEx) {
          const lastWithKg = foundEx.sets.filter(st => st.kg > 0).pop();
          if (lastWithKg) {
            refKg = lastWithKg.kg;
            if (factor !== 1.0) {
              refKg = Math.round(refKg * factor);
            }
            break;
          }
        }
      }

      const numSetsMatch = ex.sets.match(/\d+/);
      const numSets = numSetsMatch ? Number(numSetsMatch[0]) : 3;

      return {
        name: ex.name,
        pat: ex.pat,
        isCond: ex.pat === 'cond',
        notes: ex.notes,
        method: ex.method,
        planned: {
          sets: numSets,
          reps: targetRepsNum,
          rest: ex.rest || '90s'
        },
        sets: [],
        tonnage: 0,
        refKg,
        suggestedKg: suggested
      };
    });

    setActiveExercises(prepared);
    setInSession(true);
    setIsFinishing(false);
  };

  const addSetToExercise = (exIndex: number, reps: number, kg: number, rpe?: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const targetEx = { ...updated[exIndex] };
      const newSets = [...targetEx.sets, { reps, kg, rpe }];
      
      const baseTon = newSets.reduce((sum, s) => sum + s.reps * s.kg, 0);
      const isUnilateral = /unilateral|alterna/i.test(targetEx.name);
      
      targetEx.sets = newSets;
      targetEx.tonnage = isUnilateral ? baseTon * 2 : baseTon;
      updated[exIndex] = targetEx;
      return updated;
    });

    const currentEx = activeExercises[exIndex];
    if (currentEx && currentEx.sets.length + 1 < currentEx.planned.sets) {
      const restSecsMatch = currentEx.planned.rest.match(/\d+/);
      const restSecs = restSecsMatch ? Number(restSecsMatch[0]) : 90;
      startRestTimer(restSecs);
    } else {
      stopRestTimer();
    }
  };

  const removeSetFromExercise = (exIndex: number, setIndex: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const targetEx = { ...updated[exIndex] };
      const newSets = targetEx.sets.filter((_, i) => i !== setIndex);
      
      const baseTon = newSets.reduce((sum, s) => sum + s.reps * s.kg, 0);
      const isUnilateral = /unilateral|alterna/i.test(targetEx.name);
      
      targetEx.sets = newSets;
      targetEx.tonnage = isUnilateral ? baseTon * 2 : baseTon;
      updated[exIndex] = targetEx;
      return updated;
    });
  };

  const applyToAllRemainingSets = (exIndex: number, reps: number, kg: number) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      const targetEx = { ...updated[exIndex] };
      const remaining = targetEx.planned.sets - targetEx.sets.length;
      
      if (remaining <= 0) return prev;

      const newSets = [...targetEx.sets];
      for (let i = 0; i < remaining; i++) {
        newSets.push({ reps, kg });
      }

      const baseTon = newSets.reduce((sum, s) => sum + s.reps * s.kg, 0);
      const isUnilateral = /unilateral|alterna/i.test(targetEx.name);

      targetEx.sets = newSets;
      targetEx.tonnage = isUnilateral ? baseTon * 2 : baseTon;
      updated[exIndex] = targetEx;
      return updated;
    });
    showToast("Todas as séries preenchidas!");
  };

  const replaceExerciseName = (exIndex: number, newName: string) => {
    setActiveExercises(prev => {
      const updated = [...prev];
      if (updated[exIndex]) {
        updated[exIndex] = {
          ...updated[exIndex],
          name: newName,
          notes: (updated[exIndex].notes ? updated[exIndex].notes + ' · ' : '') + `[Substituído: aparelho ocupado]`
        };
      }
      return updated;
    });
    showToast(`Exercício substituído por: ${newName}`);
  };

  const finishSession = async (
    min: number, 
    srpe: number, 
    dateStr?: string, 
    notes?: string, 
    audioTranscribed?: boolean
  ) => {
    if (!client) return;

    const loggedExs: LoggedExercise[] = [];

    if (wellnessData) {
      loggedExs.push({
        name: "Wellness Assessment",
        pat: "core",
        sets: [],
        tonnage: 0,
        _type: "wellness",
        sleep: wellnessData.sleep,
        soreness: wellnessData.soreness,
        energy: wellnessData.energy,
        score: wellnessData.score
      });
    }

    activeExercises.forEach(ex => {
      loggedExs.push({
        name: ex.name,
        pat: ex.pat,
        planned: ex.planned,
        sets: ex.sets,
        tonnage: ex.tonnage
      });
    });

    const totalTonnage = calculateSessionTonnage(loggedExs);
    const dayName = client.program?.days[currentDayIndex]?.name || 'Treino';

    const cleanNotes = notes?.trim();

    const newSession: Session = {
      id: `sess-${Date.now()}`,
      date: dateStr || new Date().toISOString().slice(0, 10),
      week: currentWeek,
      dayName,
      min,
      srpe,
      tonnage: totalTonnage,
      notes: cleanNotes || undefined,
      audioTranscribed: audioTranscribed || false,
      exercises: loggedExs,
      by: 'aluno'
    };

    // Automatically send feedback note to trainer chat thread if present
    if (cleanNotes) {
      if (!client.trainerChat) client.trainerChat = [];
      const prefix = audioTranscribed ? '🎙️ [Nota Pós-Treino por Áudio' : '📝 [Nota Pós-Treino';
      client.trainerChat.push({
        id: `msg-${Date.now()}`,
        from: 'student',
        text: `${prefix} - ${dayName} · sRPE ${srpe}/10]: ${cleanNotes}`,
        date: new Date().toISOString()
      });
    }

    // Process session with automated Overtraining Monitoring Service
    const { updatedClient, criticalAlertsTriggered } = OvertrainingMonitoringService.processSessionForTrainerAlerts(client, newSession);

    // Auto-connect check-in / finished workout to ClassBooking presence
    const sessionDate = dateStr || new Date().toISOString().slice(0, 10);
    if (!updatedClient.classBookings) updatedClient.classBookings = [];

    const existingBooking = updatedClient.classBookings.find(
      b => b.date === sessionDate && (b.status === 'agendada' || b.status === 'reposicao_agendada')
    );

    if (existingBooking) {
      existingBooking.status = 'realizada';
      existingBooking.workoutName = dayName;
    } else {
      updatedClient.classBookings.push({
        id: `class-auto-${Date.now()}`,
        clientId: updatedClient.id,
        clientName: updatedClient.name,
        date: sessionDate,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        durationMin: min || 60,
        status: 'realizada',
        workoutName: dayName || 'Treino Concluído (App)'
      });
    }

    await clientRepository.saveClient(updatedClient);
    await clientRepository.saveSession(updatedClient.id, newSession);
    await reloadClient();

    setInSession(false);
    setIsFinishing(false);
    setActiveExercises([]);
    setWellnessData(null);
    stopRestTimer();
    const noteFeedback = audioTranscribed ? ' (Nota de voz anexada)' : '';
    const alertFeedback = criticalAlertsTriggered.length > 0 ? ' 🚨 [Alerta de overtraining enviado ao treinador]' : '';
    showToast(`Treino concluído! Presença confirmada. Tonelagem: ${totalTonnage.toLocaleString('pt-BR')} kg${noteFeedback}${alertFeedback}`);
  };

  const performQuickCheckin = async () => {
    if (!client) return;
    const dayName = client.program?.days[currentDayIndex]?.name || 'Treino';
    const todayStr = new Date().toISOString().slice(0, 10);

    const newSession: Session = {
      id: `checkin-${Date.now()}`,
      date: todayStr,
      week: currentWeek,
      dayName,
      min: 0,
      srpe: 0,
      tonnage: 0,
      checkin: true,
      exercises: [],
      by: 'aluno'
    };

    if (!client.classBookings) client.classBookings = [];
    const existingBooking = client.classBookings.find(
      b => b.date === todayStr && (b.status === 'agendada' || b.status === 'reposicao_agendada')
    );

    if (existingBooking) {
      existingBooking.status = 'realizada';
      existingBooking.workoutName = `Check-in: ${dayName}`;
    } else {
      client.classBookings.push({
        id: `class-auto-${Date.now()}`,
        clientId: client.id,
        clientName: client.name,
        date: todayStr,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        durationMin: 60,
        status: 'realizada',
        workoutName: `Check-in: ${dayName}`
      });
    }

    await clientRepository.saveClient(client);
    await clientRepository.saveSession(client.id, newSession);
    await reloadClient();
    showToast(`✓ Check-in realizado! Presença computada na agenda para ${dayName}.`);
  };

  const sendStudentMessage = async (text: string) => {
    if (!client || !text.trim()) return;

    if (!client.trainerChat) client.trainerChat = [];
    client.trainerChat.push({
      id: `msg-${Date.now()}`,
      from: 'student',
      text: text.trim(),
      date: new Date().toISOString()
    });

    await clientRepository.saveClient(client);
    await reloadClient();
  };

  const currentTonnage = activeExercises.reduce((sum, ex) => sum + ex.tonnage, 0);
  const dayProgram = client?.program?.days[currentDayIndex];
  const targetTonnageLimit = dayProgram && client
    ? calculateSessionTonnageLimit(dayProgram.exercises, 1.0, client.rpeLog || [], client.level)
    : null;

  return {
    client,
    activeTab,
    currentWeek,
    currentDayIndex,
    inSession,
    isFinishing,
    guidedMode,
    guidedExerciseIndex,
    activeExercises,
    currentTonnage,
    targetTonnageLimit,
    wellnessData,
    showWellnessModal,
    restTimerSeconds,
    restTimerMax,
    restTimerActive,
    toastMessage,
    setActiveTab,
    setCurrentWeek,
    setCurrentDayIndex,
    setGuidedMode,
    setGuidedExerciseIndex,
    setIsFinishing,
    prepareSession,
    startLiveSession,
    addSetToExercise,
    removeSetFromExercise,
    applyToAllRemainingSets,
    replaceExerciseName,
    finishSession,
    performQuickCheckin,
    sendStudentMessage,
    startRestTimer,
    stopRestTimer,
    addRestTimerSeconds,
    toggleRestTimerPause,
    setShowWellnessModal,
    reloadClient,
    loadClientData: reloadClient
  };
}

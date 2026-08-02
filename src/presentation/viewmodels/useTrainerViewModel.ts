import { auth } from '../../lib/firebase';
import { useState, useEffect, useCallback } from 'react';
import { Client, Program, Session, TrainingGoal, ClientLevel, EquipmentProfile, ClassBooking } from '../../domain/types';
import { clientRepository } from '../../data/repositories/ClientRepository';
import { generateProgram, buildAutoMesoCycle } from '../../domain/engine/prescriptionEngine';

export type MainNavTab = 'dashboard' | 'client-detail' | 'library' | 'agenda' | 'templates' | 'brand';
export type ClientTab = 'perfil' | 'treino' | 'carga' | 'progresso' | 'bioimpedancia' | 'msgs' | 'aulas';

const NAV_TAB_STORAGE_KEY = 'fitconnect_trainer_nav_tab_v2';
const CLIENT_TAB_STORAGE_KEY = 'fitconnect_trainer_client_tab_v2';
const SELECTED_CLIENT_STORAGE_KEY = 'fitconnect_trainer_selected_client_id_v2';

export function useTrainerViewModel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(() => {
    return localStorage.getItem(SELECTED_CLIENT_STORAGE_KEY) || null;
  });
  const [activeNavTab, setActiveNavTabState] = useState<MainNavTab>(() => {
    return (localStorage.getItem(NAV_TAB_STORAGE_KEY) as MainNavTab) || 'dashboard';
  });
  const [activeClientTab, setActiveClientTabState] = useState<ClientTab>(() => {
    return (localStorage.getItem(CLIENT_TAB_STORAGE_KEY) as ClientTab) || 'treino';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const setSelectedClientId = (id: string | null) => {
    setSelectedClientIdState(id);
    if (id) {
      localStorage.setItem(SELECTED_CLIENT_STORAGE_KEY, id);
    } else {
      localStorage.removeItem(SELECTED_CLIENT_STORAGE_KEY);
    }
  };

  const setActiveNavTab = (tab: MainNavTab) => {
    setActiveNavTabState(tab);
    localStorage.setItem(NAV_TAB_STORAGE_KEY, tab);
  };

  const setActiveClientTab = (tab: ClientTab) => {
    setActiveClientTabState(tab);
    localStorage.setItem(CLIENT_TAB_STORAGE_KEY, tab);
  };

  // Load clients
  const refreshClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await clientRepository.getClients();
      setClients(data);
      const storedId = localStorage.getItem(SELECTED_CLIENT_STORAGE_KEY);
      if (storedId && data.some(c => c.id === storedId)) {
        setSelectedClientIdState(storedId);
      } else if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClients();
    if (clientRepository.subscribeToClients) {
      const unsubscribe = clientRepository.subscribeToClients((updatedClients) => {
        setClients(updatedClients);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  const selectClient = (id: string) => {
    setSelectedClientId(id);
    setActiveNavTab('client-detail');
    const client = clients.find(c => c.id === id);
    if (client) {
      setActiveClientTab(client.program ? 'treino' : 'perfil');
    }
  };

  const handleSaveClient = async (clientData: Partial<Client>) => {
    const isNew = !clientData.id;
    const clientToSave: Client = {
      id: clientData.id || `client-${Date.now()}`,
      trainerId: clientData.trainerId || auth.currentUser?.uid || '',
      name: clientData.name || 'Novo Aluno',
      email: clientData.email || '',
      whats: clientData.whats || '',
      birth: clientData.birth || '',
      gender: clientData.gender || 'Feminino',
      tipo: clientData.tipo || 'Presencial',
      height: clientData.height || '',
      weight: clientData.weight || '',
      goal: (clientData.goal as TrainingGoal) || 'Ganho de massa (hipertrofia)',
      level: (clientData.level as ClientLevel) || 'Intermediário',
      days: clientData.days || '4',
      dur: clientData.dur || '60 min',
      eq: (clientData.eq as EquipmentProfile) || 'Academia completa',
      experience: clientData.experience || '',
      parq: clientData.parq || { 0: 'nao', 1: 'nao', 2: 'nao', 3: 'nao', 4: 'nao', 5: 'nao', 6: 'nao' },
      diseases: clientData.diseases || [],
      meds: clientData.meds || '',
      surgery: clientData.surgery || '',
      smoke: clientData.smoke || 'Não fumante',
      sleep: clientData.sleep || '7-8h',
      inj: clientData.inj || '',
      notes: clientData.notes || '',
      rpeLog: clientData.rpeLog || [],
      trainerChat: clientData.trainerChat || [],
      agenda: clientData.agenda || []
    };

    if (!clientToSave.program) {
      // clientToSave.program = generateProgram(clientToSave);
    }

    const saved = await clientRepository.saveClient(clientToSave);
    await refreshClients();
    setSelectedClientId(saved.id);
    if (isNew) {
      setActiveNavTab('client-detail');
      setActiveClientTab('treino');
      showToast(`Aluno ${saved.name} cadastrado! Clique em "Gerar Treino Automático" para usar a IA.`);
    } else {
      showToast("Perfil atualizado com sucesso!");
    }
  };

  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleDeleteClient = (id: string) => {
    const target = clients.find(c => c.id === id);
    if (target) {
      setClientToDelete(target);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    const id = clientToDelete.id;
    const clientName = clientToDelete.name;
    setClientToDelete(null);

    await clientRepository.deleteClient(id);
    showToast(`Aluno ${clientName} excluído com sucesso`);
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    if (updated.length > 0) {
      if (selectedClientId === id) {
        setSelectedClientId(updated[0].id);
      }
    } else {
      setSelectedClientId(null);
      setActiveNavTab('dashboard');
    }
  };

  const cancelDeleteClient = () => {
    setClientToDelete(null);
  };

  const handleGenerateNewProgram = async (clientId: string, promptNotes: string = '') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    try {
      showToast("A Inteligência Artificial está gerando o treino...");
      const response = await fetch('/api/gemini/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientData: {
            name: client.name,
            level: client.level,
            goal: client.goal,
            daysPerWeek: typeof client.days === 'string' ? parseInt(client.days) : (client.days || 4),
            exercisesPerSession: client.exercisesPerSession || 6,
            programWeeks: client.programWeeks || 4,
            injuries: client.injuries || (client.inj ? [client.inj] : []),
            equipment: [client.eq]
          },
          promptNotes
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao gerar o programa');
      }

      const newProg = data.program;

      // Save previous program to history
      if (client.program) {
        if (!client.programHistory) client.programHistory = [];
        client.programHistory.unshift({
          program: JSON.parse(JSON.stringify(client.program)),
          savedAt: new Date().toISOString(),
          label: `${client.goal} — ${new Date().toLocaleDateString('pt-BR')}`
        });
        client.programHistory = client.programHistory.slice(0, 5);
      }

      client.program = newProg;
      await clientRepository.saveClient(client);
      await refreshClients();
      showToast("Novo treino prescrito com IA e salvo com sucesso!");
    } catch (err: any) {
      console.warn("Falha ao gerar treino via IA, usando motor local como fallback:", err);
      showToast("Falha na IA. Usando motor local de prescrição...");
      
      const newProg = generateProgram(client);
      
      if (client.program) {
        if (!client.programHistory) client.programHistory = [];
        client.programHistory.unshift({
          program: JSON.parse(JSON.stringify(client.program)),
          savedAt: new Date().toISOString(),
          label: `${client.goal} — ${new Date().toLocaleDateString('pt-BR')} (Automático)`
        });
        client.programHistory = client.programHistory.slice(0, 5);
      }
      
      client.program = newProg;
      await clientRepository.saveClient(client);
      await refreshClients();
      showToast("Treino gerado com sucesso (Motor Local)!");
    }
  };

  const handleApplyAutoMeso = async (clientId: string, totalWeeks: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.program) return;

    const autoMeso = buildAutoMesoCycle(client, totalWeeks);
    client.program.meso = autoMeso;
    await clientRepository.saveClient(client);
    await refreshClients();
    showToast(`Mesociclo de ${totalWeeks} semanas aplicado!`);
  };

  const handleSendTrainerMessage = async (clientId: string, text: string) => {
    if (!text.trim()) return;
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (!client.trainerChat) client.trainerChat = [];
    client.trainerChat.push({
      id: `msg-${Date.now()}`,
      from: 'trainer',
      text: text.trim(),
      date: new Date().toISOString()
    });

    await clientRepository.saveClient(client);
    await refreshClients();
  };

  const handleAddSession = async (clientId: string, sessionData: Partial<Session>) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const newSession: Session = {
      id: sessionData.id || `sess-${Date.now()}`,
      date: sessionData.date || new Date().toISOString().slice(0, 10),
      week: sessionData.week ?? 0,
      dayName: sessionData.dayName || (client.program?.days?.[0]?.name || 'Treino'),
      min: sessionData.min || 60,
      srpe: sessionData.srpe || 7,
      tonnage: sessionData.tonnage || 0,
      by: 'treinador',
      exercises: sessionData.exercises || []
    };

    await clientRepository.saveSession(clientId, newSession);
    await refreshClients();
    showToast("Sessão registrada no histórico!");
  };

  const handleDeleteSession = async (clientId: string, sessionId: string) => {
    await clientRepository.deleteSession(clientId, sessionId);
    await refreshClients();
    showToast("Sessão removida");
  };

  const handleMoveSession = async (clientId: string, sessionId: string, newDate: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.rpeLog) return;

    const sessionIndex = client.rpeLog.findIndex(s => s.id === sessionId);
    if (sessionIndex >= 0) {
      client.rpeLog[sessionIndex].date = newDate;
      await clientRepository.saveClient(client);
      await refreshClients();
      showToast(`Treino reagendado para ${new Date(newDate + 'T12:00:00').toLocaleDateString('pt-BR')}`);
    }
  };

  const handleApplyDeload = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (!client.program) {
      showToast("Atleta sem programa ativo para deload");
      return;
    }

    if (!client.program.weekOverrides) {
      client.program.weekOverrides = {};
    }

    // Determine current week or next week override
    const currentWeekIdx = client.rpeLog && client.rpeLog.length > 0 
      ? client.rpeLog[client.rpeLog.length - 1].week 
      : 0;

    client.program.weekOverrides[currentWeekIdx] = {
      vol: 0.70, // 30% reduction in volume
      note: 'Deload preventivo de segurança acionado por Alerta de Overtraining (ACWR / Monotonia)',
      appliedAt: new Date().toISOString(),
      auto: true
    };

    if (!client.trainerChat) client.trainerChat = [];
    client.trainerChat.push({
      id: `msg-deload-${Date.now()}`,
      from: 'trainer',
      text: '🛡️ [DELOAD PREVENTIVO DE SEGURANÇA APLICADO]: Identificamos acúmulo temporário de estresse e fadiga. O volume do seu treino foi reduzido em 30% para acelerar a recuperação e proteger suas articulações nesta semana. Mantenha boa hidratação e sono!',
      date: new Date().toISOString()
    });

    await clientRepository.saveClient(client);
    await refreshClients();
    showToast(`Deload preventivo (-30% volume) aplicado para ${client.name}!`);
  };

  const handleSaveClassBooking = async (clientId: string, bookingData: Partial<ClassBooking>) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    if (!client.classBookings) client.classBookings = [];

    const newBooking: ClassBooking = {
      id: bookingData.id || `class-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      date: bookingData.date || new Date().toISOString().slice(0, 10),
      time: bookingData.time || "08:00",
      durationMin: bookingData.durationMin || 60,
      status: bookingData.status || "agendada",
      isMakeupClass: bookingData.isMakeupClass || false,
      absenceNotice: bookingData.absenceNotice,
      allowsReplacement: bookingData.allowsReplacement,
      replacementUsed: bookingData.replacementUsed || false,
      replacedBookingId: bookingData.replacedBookingId,
      notes: bookingData.notes || "",
      workoutName: bookingData.workoutName || "Aula de Personal / Treino"
    };

    // If this booking replaces a previous missed class, mark that missed class as replaced
    if (newBooking.isMakeupClass && newBooking.replacedBookingId) {
      const missedIndex = client.classBookings.findIndex(b => b.id === newBooking.replacedBookingId);
      if (missedIndex >= 0) {
        client.classBookings[missedIndex].replacementUsed = true;
      }
    }

    const existingIndex = client.classBookings.findIndex(b => b.id === newBooking.id);
    if (existingIndex >= 0) {
      client.classBookings[existingIndex] = newBooking;
    } else {
      client.classBookings.push(newBooking);
    }

    await clientRepository.saveClient(client);
    await refreshClients();
    showToast(bookingData.id ? "Aula atualizada com sucesso!" : "Aula agendada com sucesso!");
  };

  const handleUpdateBookingStatus = async (
    clientId: string,
    bookingId: string,
    status: ClassBooking['status'],
    notice?: ClassBooking['absenceNotice'],
    allowsRepl?: boolean,
    notes?: string
  ) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.classBookings) return;

    const bIndex = client.classBookings.findIndex(b => b.id === bookingId);
    if (bIndex < 0) return;

    const booking = client.classBookings[bIndex];
    booking.status = status;

    if (status === 'falta') {
      booking.absenceNotice = notice || 'sem_aviso';
      booking.allowsReplacement = allowsRepl !== undefined 
        ? allowsRepl 
        : (notice === 'antecipada_24h' || notice === 'atestado' || notice === 'justificada');
      booking.notes = notes || booking.notes;
    } else if (status === 'realizada') {
      booking.notes = notes || booking.notes;
    }

    await clientRepository.saveClient(client);
    await refreshClients();

    const statusMap = {
      realizada: 'Presença confirmada!',
      falta: booking.allowsReplacement ? 'Falta registrada (Com direito a Reposição)!' : 'Falta registrada (Sem reposição)!',
      reposicao_agendada: 'Reposição agendada!',
      agendada: 'Aula agendada',
      cancelada: 'Aula cancelada'
    };
    showToast(statusMap[status] || 'Status atualizado');
  };

  const handleDeleteClassBooking = async (clientId: string, bookingId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !client.classBookings) return;

    client.classBookings = client.classBookings.filter(b => b.id !== bookingId);
    await clientRepository.saveClient(client);
    await refreshClients();
    showToast("Aula removida da agenda");
  };

  return {
    clients,
    selectedClient,
    selectedClientId,
    activeNavTab,
    activeClientTab,
    loading,
    toastMessage,
    setActiveNavTab,
    setActiveClientTab,
    selectClient,
    handleSaveClient,
    handleDeleteClient,
    clientToDelete,
    confirmDeleteClient,
    cancelDeleteClient,
    handleGenerateNewProgram,
    handleApplyAutoMeso,
    handleSendTrainerMessage,
    handleAddSession,
    handleDeleteSession,
    handleMoveSession,
    handleApplyDeload,
    handleSaveClassBooking,
    handleUpdateBookingStatus,
    handleDeleteClassBooking,
    showToast,
    refreshClients
  };
}

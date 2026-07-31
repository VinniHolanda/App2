import { Client, Session } from '../../domain/types';
import { generateProgram } from '../../domain/engine/prescriptionEngine';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import {
  saveClientToIDB,
  saveClientsToIDB,
  getClientFromIDB,
  getClientsFromIDB,
  deleteClientFromIDB,
  enqueueOfflineAction,
  getPendingOfflineActions,
  removePendingOfflineAction
} from '../../lib/indexedDbStorage';

const STORAGE_KEY = 'fitconnect_clients_v2';
const DELETED_CLIENTS_KEY = 'fitconnect_deleted_clients_v2';
const COLLECTION_NAME = 'clients';

export interface IClientRepository {
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | null>;
  saveClient(client: Client): Promise<Client>;
  updateClient?(client: Client): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  saveSession(clientId: string, session: Session): Promise<Client>;
  deleteSession(clientId: string, sessionId: string): Promise<Client>;
  subscribeToClients?(callback: (clients: Client[]) => void): () => void;
  authenticateStudent?(emailOrQuery: string, password: string): Promise<Client | null>;
}

function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (value === undefined ? null : value))
  );
}

const SAMPLE_CLIENTS: Client[] = [
  {
    id: "client-1",
    name: "Ana Carolina Silva",
    email: "ana@fitconnect.com",
    whats: "(11) 98765-4321",
    birth: "1996-05-14",
    gender: "Feminino",
    tipo: "Presencial",
    height: "165",
    weight: "62",
    goal: "Ganho de massa (hipertrofia)",
    level: "Intermediário",
    days: "4",
    dur: "60 min",
    eq: "Academia completa",
    experience: "Treina há 1-3 anos",
    parq: { 0: 'nao', 1: 'nao', 2: 'nao', 3: 'nao', 4: 'nao', 5: 'nao', 6: 'nao' },
    diseases: [],
    meds: "Nenhum",
    inj: "",
    notes: "Foco especial em quadríceps e glúteos",
    bodyCompositionHistory: [
      {
        id: "bio-ana-1",
        date: "2026-06-01",
        weekNumber: 1,
        weightKg: 64.2,
        heightCm: 165,
        fatPercentage: 24.8,
        fatMassKg: 15.9,
        leanMassKg: 48.3,
        visceralFatLevel: 4,
        bmrKcal: 1380,
        waterPercentage: 54.2,
        adherenceRatePct: 75,
        sourceFileName: "Bioimpedancia_InBody270_Junho.pdf",
        notes: "Início da periodização de hipertrofia. % de gordura moderado.",
        aiPrescriptionInsights: [
          "Progressão contínua de volume para quadríceps e glúteos recomendada.",
          "Consumo proteico sugerido: 2.0g/kg (aprox. 128g/dia).",
          "Manter 2 sessões de cardio Z2 de 30 min para otimização metabólica."
        ]
      },
      {
        id: "bio-ana-2",
        date: "2026-06-22",
        weekNumber: 4,
        weightKg: 63.4,
        heightCm: 165,
        fatPercentage: 23.1,
        fatMassKg: 14.6,
        leanMassKg: 48.8,
        visceralFatLevel: 3,
        bmrKcal: 1395,
        waterPercentage: 55.4,
        adherenceRatePct: 88,
        sourceFileName: "InBody_Avaliacao_Semana4.pdf",
        notes: "Adesão de 88%. Redução expressiva de gordura (-1.3kg) com pequeno ganho muscular (+0.5kg).",
        aiPrescriptionInsights: [
          "Boa resposta trófica. Manter sobrecarga progressiva no Agachamento e Leg Press.",
          "Manter déficit calórico leve sem restringir carboidrato pré-treino."
        ]
      },
      {
        id: "bio-ana-3",
        date: "2026-07-20",
        weekNumber: 8,
        weightKg: 62.0,
        heightCm: 165,
        fatPercentage: 20.8,
        fatMassKg: 12.9,
        leanMassKg: 49.1,
        visceralFatLevel: 3,
        bmrKcal: 1410,
        waterPercentage: 56.8,
        adherenceRatePct: 95,
        sourceFileName: "Laudo_Bioimpedancia_Julho_Ana.jpeg",
        notes: "Excelente recomposição corporal com 95% de frequência. +0.8kg de massa magra acumulada e -3.0kg de gordura no ciclo.",
        aiPrescriptionInsights: [
          "Resultado excelente! Resposta neuromuscular e hipertrófica consolidada.",
          "Sugerido bloco de intensificação (8-10 RPE) nas próximas 3 semanas."
        ]
      }
    ],
    portal: {
      email: "ana@fitconnect.com",
      enabled: true,
      pass: "123456"
    },
    reminderSchedule: {
      enabled: true,
      days: [1, 2, 4, 5],
      time: "07:30"
    },
    agenda: [
      { dia: 1, hora: "07:30" },
      { dia: 2, hora: "07:30" },
      { dia: 4, hora: "07:30" },
      { dia: 5, hora: "07:30" }
    ],
    classBookings: [
      {
        id: "class-ana-1",
        clientId: "client-1",
        clientName: "Ana Carolina Silva",
        date: "2026-07-28",
        time: "07:30",
        durationMin: 60,
        status: "agendada",
        workoutName: "Treino A — Quadríceps & Glúteos"
      },
      {
        id: "class-ana-2",
        clientId: "client-1",
        clientName: "Ana Carolina Silva",
        date: "2026-07-25",
        time: "07:30",
        durationMin: 60,
        status: "realizada",
        workoutName: "Treino B — Superiores & Core"
      },
      {
        id: "class-ana-3",
        clientId: "client-1",
        clientName: "Ana Carolina Silva",
        date: "2026-07-21",
        time: "07:30",
        durationMin: 60,
        status: "falta",
        absenceNotice: "antecipada_24h",
        allowsReplacement: true,
        replacementUsed: false,
        notes: "Avisou com 24h de antecedência por viagem de trabalho. Tem direito a reposição."
      }
    ],
    rpeLog: [
      {
        id: "sess-1",
        date: "2026-07-20",
        week: 0,
        dayName: "Lower A — Inferiores",
        min: 55,
        srpe: 7.5,
        tonnage: 4850,
        by: "aluno",
        exercises: [
          {
            name: "Agachamento livre com barra",
            pat: "quad",
            planned: { sets: 4, reps: 10 },
            sets: [
              { reps: 10, kg: 60 },
              { reps: 10, kg: 65 },
              { reps: 10, kg: 70 },
              { reps: 8, kg: 70 }
            ],
            tonnage: 2510
          },
          {
            name: "Leg press",
            pat: "quad",
            planned: { sets: 3, reps: 12 },
            sets: [
              { reps: 12, kg: 120 },
              { reps: 12, kg: 130 },
              { reps: 10, kg: 140 }
            ],
            tonnage: 4400
          }
        ]
      },
      {
        id: "sess-2",
        date: "2026-07-22",
        week: 0,
        dayName: "Upper A — Superiores",
        min: 50,
        srpe: 7,
        tonnage: 3200,
        by: "aluno",
        exercises: [
          {
            name: "Supino reto com halteres",
            pat: "push_h",
            planned: { sets: 3, reps: 10 },
            sets: [
              { reps: 10, kg: 16 },
              { reps: 10, kg: 18 },
              { reps: 8, kg: 18 }
            ],
            tonnage: 944
          }
        ]
      }
    ]
  },
  {
    id: "client-2",
    name: "Marcos Vinícius Oliveira",
    email: "marcos@fitconnect.com",
    whats: "(21) 99123-8877",
    birth: "1990-11-28",
    gender: "Masculino",
    tipo: "Consultoria online",
    height: "178",
    weight: "84",
    goal: "Força",
    level: "Avançado",
    days: "3",
    dur: "75 min",
    eq: "Academia completa",
    experience: "Treina há 3+ anos",
    parq: { 0: 'nao', 1: 'nao', 2: 'nao', 3: 'nao', 4: 'nao', 5: 'nao', 6: 'nao' },
    diseases: [],
    meds: "Nenhum",
    inj: "Leve desconforto no ombro esquerdo ao supinar com pegada aberta",
    portal: {
      email: "marcos@fitconnect.com",
      enabled: true,
      pass: "123456"
    },
    classBookings: [
      {
        id: "class-marcos-1",
        clientId: "client-2",
        clientName: "Marcos Vinícius Oliveira",
        date: "2026-07-28",
        time: "18:00",
        durationMin: 75,
        status: "agendada",
        workoutName: "Push — Peito, Ombro e Tríceps"
      },
      {
        id: "class-marcos-2",
        clientId: "client-2",
        clientName: "Marcos Vinícius Oliveira",
        date: "2026-07-24",
        time: "18:00",
        durationMin: 75,
        status: "falta",
        absenceNotice: "sem_aviso",
        allowsReplacement: false,
        notes: "Falta sem aviso prévio. Regra do estúdio: Sem direito a reposição."
      }
    ],
    rpeLog: [
      {
        id: "sess-m1",
        date: "2026-07-21",
        week: 0,
        dayName: "Push — Peito / Ombro / Tríceps",
        min: 65,
        srpe: 8.5,
        tonnage: 6200,
        by: "aluno",
        exercises: [
          {
            name: "Supino reto com barra",
            pat: "push_h",
            planned: { sets: 4, reps: 5 },
            sets: [
              { reps: 5, kg: 100 },
              { reps: 5, kg: 105 },
              { reps: 5, kg: 105 },
              { reps: 4, kg: 110 }
            ],
            tonnage: 2015
          }
        ]
      }
    ]
  }
];

// Pre-generate programs for sample clients
SAMPLE_CLIENTS.forEach(c => {
  if (!c.program) {
    c.program = generateProgram(c);
  }
});

export class FirebaseClientRepository implements IClientRepository {
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log("Conexão restabelecida. Sincronizando fila offline do IndexedDB...");
        this.syncOfflineQueue();
      });
      // Try initial sync if online
      if (navigator.onLine) {
        setTimeout(() => this.syncOfflineQueue(), 2000);
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log("Seeding initial clients to Firestore...");
        for (const sample of SAMPLE_CLIENTS) {
          const docRef = doc(db, COLLECTION_NAME, sample.id);
          await setDoc(docRef, cleanFirestoreData(sample));
        }
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn("Firestore initialization warning, using IndexedDB / LocalStorage fallback:", e);
    }
  }

  async syncOfflineQueue(): Promise<void> {
    try {
      const pending = await getPendingOfflineActions();
      if (pending.length === 0) return;

      console.log(`Processando ${pending.length} itens pendentes na fila do IndexedDB...`);
      for (const item of pending) {
        try {
          if (item.type === 'SAVE_CLIENT' || item.type === 'SAVE_SESSION') {
            const docRef = doc(db, COLLECTION_NAME, item.clientId);
            await setDoc(docRef, cleanFirestoreData(item.payload), { merge: true });
            await removePendingOfflineAction(item.id);
            console.log(`Item offline ${item.id} sincronizado com sucesso!`);
          }
        } catch (err) {
          console.warn(`Falha ao sincronizar item offline ${item.id}:`, err);
        }
      }
    } catch (err) {
      console.warn('Erro ao processar fila offline:', err);
    }
  }

  async getClients(): Promise<Client[]> {
    const deletedIds = this.getDeletedClientIds();
    const localLS = this.getFromLocalStorage().filter(c => !deletedIds.has(c.id));
    const localIDB = (await getClientsFromIDB()).filter(c => !deletedIds.has(c.id));

    // Merge LocalStorage and IndexedDB fallback
    const idbMap = new Map<string, Client>();
    localIDB.forEach(c => idbMap.set(c.id, c));
    localLS.forEach(c => {
      const existing = idbMap.get(c.id);
      if (!existing) {
        idbMap.set(c.id, c);
      } else {
        const localLogs = c.rpeLog || [];
        const idbLogs = existing.rpeLog || [];
        const logMap = new Map<string, Session>();
        idbLogs.forEach(s => logMap.set(s.id, s));
        localLogs.forEach(s => logMap.set(s.id, s));

        idbMap.set(c.id, {
          ...existing,
          ...c,
          rpeLog: Array.from(logMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        });
      }
    });

    const combinedLocal = Array.from(idbMap.values()).filter(c => !deletedIds.has(c.id));

    try {
      await this.ensureInitialized();
      const colRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const remoteClients: Client[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Client;
          if (!deletedIds.has(data.id)) {
            remoteClients.push(data);
          }
        });

        // Merge remote and local clients so local modifications or new sessions are never overwritten
        const mergedMap = new Map<string, Client>();
        remoteClients.forEach(rc => mergedMap.set(rc.id, rc));

        combinedLocal.forEach(lc => {
          const remote = mergedMap.get(lc.id);
          if (!remote) {
            mergedMap.set(lc.id, lc);
          } else {
            // Merge sessions from rpeLog
            const localLogs = lc.rpeLog || [];
            const remoteLogs = remote.rpeLog || [];
            const logMap = new Map<string, Session>();
            remoteLogs.forEach(s => logMap.set(s.id, s));
            localLogs.forEach(s => logMap.set(s.id, s));

            mergedMap.set(lc.id, {
              ...remote,
              ...lc,
              rpeLog: Array.from(logMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            });
          }
        });

        const merged = Array.from(mergedMap.values()).filter(c => !deletedIds.has(c.id));
        this.saveToLocalStorage(merged);
        await saveClientsToIDB(merged);
        return merged;
      }
    } catch (e) {
      console.warn("Firestore getClients offline/error fallback:", e);
    }

    const fallback = SAMPLE_CLIENTS.filter(c => !deletedIds.has(c.id));
    return combinedLocal.length > 0 ? combinedLocal : fallback;
  }

  async getClientById(id: string): Promise<Client | null> {
    const idbClient = await getClientFromIDB(id);
    const localLS = this.getFromLocalStorage();
    const localClient = localLS.find(c => c.id === id) || idbClient;

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const remoteClient = snapshot.data() as Client;
        if (localClient) {
          const localLogs = localClient.rpeLog || [];
          const remoteLogs = remoteClient.rpeLog || [];
          const logMap = new Map<string, Session>();
          remoteLogs.forEach(s => logMap.set(s.id, s));
          localLogs.forEach(s => logMap.set(s.id, s));

          const merged: Client = {
            ...remoteClient,
            ...localClient,
            rpeLog: Array.from(logMap.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          };
          await saveClientToIDB(merged);
          return merged;
        }
        await saveClientToIDB(remoteClient);
        return remoteClient;
      }
    } catch (e) {
      console.warn("Firestore getClientById offline/error fallback:", e);
    }

    return localClient || null;
  }

  async saveClient(client: Client): Promise<Client> {
    if (!client.program && client.goal && client.level) {
      client.program = generateProgram(client);
    }

    if (!client.portal) {
      client.portal = {
        email: client.email || `${client.name.toLowerCase().replace(/\s+/g, '.')}@fitconnect.com`,
        enabled: true,
        pass: '123456'
      };
    }

    // 1. Save synchronously to LocalStorage & IndexedDB immediately for instant offline access
    const local = this.getFromLocalStorage();
    const idx = local.findIndex(c => c.id === client.id);
    if (idx >= 0) local[idx] = client;
    else local.push(client);
    this.saveToLocalStorage(local);

    await saveClientToIDB(client);

    // 2. Sync to Firestore if online, or queue offline if network is down
    try {
      const cleaned = cleanFirestoreData(client);
      const docRef = doc(db, COLLECTION_NAME, client.id);
      await setDoc(docRef, cleaned, { merge: true });
    } catch (e) {
      console.warn("Firestore saveClient offline -> adicionado à fila IndexedDB:", e);
      await enqueueOfflineAction({
        type: 'SAVE_CLIENT',
        clientId: client.id,
        payload: client
      });
    }

    return client;
  }

  async updateClient(client: Client): Promise<Client> {
    return this.saveClient(client);
  }

  async deleteClient(id: string): Promise<void> {
    // 1. Record deleted ID so it's never re-seeded or restored
    this.saveDeletedClientId(id);

    // 2. Immediately delete from LocalStorage
    const local = this.getFromLocalStorage();
    const filtered = local.filter(c => c.id !== id);
    this.saveToLocalStorage(filtered);

    // 3. Immediately delete from IndexedDB
    await deleteClientFromIDB(id);

    // 4. Delete from Firestore
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn("Firestore deleteClient offline/error fallback:", e);
    }
  }

  async saveSession(clientId: string, session: Session): Promise<Client> {
    const client = await this.getClientById(clientId);
    if (!client) throw new Error("Cliente não encontrado");

    if (!client.rpeLog) client.rpeLog = [];
    const existingIndex = client.rpeLog.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      client.rpeLog[existingIndex] = session;
    } else {
      client.rpeLog.unshift(session);
    }

    return this.saveClient(client);
  }

  async deleteSession(clientId: string, sessionId: string): Promise<Client> {
    const client = await this.getClientById(clientId);
    if (!client) throw new Error("Cliente não encontrado");

    client.rpeLog = (client.rpeLog || []).filter(s => s.id !== sessionId);
    return this.saveClient(client);
  }

  subscribeToClients(callback: (clients: Client[]) => void): () => void {
    const colRef = collection(db, COLLECTION_NAME);
    return onSnapshot(
      colRef, 
      snapshot => {
        if (!snapshot.empty) {
          const clients: Client[] = [];
          snapshot.forEach(docSnap => {
            clients.push(docSnap.data() as Client);
          });
          this.saveToLocalStorage(clients);
          callback(clients);
        }
      }, 
      err => {
        console.warn("Firestore snapshot error (using local storage fallback):", err);
        callback(this.getFromLocalStorage());
      }
    );
  }

  async authenticateStudent(emailOrQuery: string, pass: string): Promise<Client | null> {
    const clients = await this.getClients();
    const query = emailOrQuery.trim().toLowerCase();

    return clients.find(c => {
      const matchEmail = c.email?.toLowerCase() === query || c.portal?.email?.toLowerCase() === query;
      const matchName = c.name.toLowerCase().includes(query);
      const storedPass = c.portal?.pass || '123456';
      
      return (matchEmail || matchName) && storedPass === pass;
    }) || null;
  }

  private getDeletedClientIds(): Set<string> {
    try {
      const stored = localStorage.getItem(DELETED_CLIENTS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.error("LocalStorage get deleted IDs failed:", e);
    }
    return new Set();
  }

  private saveDeletedClientId(id: string): void {
    const deleted = this.getDeletedClientIds();
    deleted.add(id);
    try {
      localStorage.setItem(DELETED_CLIENTS_KEY, JSON.stringify(Array.from(deleted)));
    } catch (e) {
      console.error("LocalStorage save deleted IDs failed:", e);
    }
  }

  private saveToLocalStorage(clients: Client[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error("LocalStorage save failed:", e);
    }
  }

  private getFromLocalStorage(): Client[] {
    const deletedIds = this.getDeletedClientIds();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => !deletedIds.has(c.id));
        }
      }
    } catch (e) {
      console.error("LocalStorage get failed:", e);
    }
    return SAMPLE_CLIENTS.filter(c => !deletedIds.has(c.id));
  }
}

export const clientRepository = new FirebaseClientRepository();

import { Client, Session } from '../../domain/types';
import { generateProgram } from '../../domain/engine/prescriptionEngine';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  serverTimestamp
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
}

function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) => (value === undefined ? null : value))
  );
}

// Ensure the local storage is keyed by user ID to prevent data leakage
function getStorageKey() {
  const uid = auth.currentUser?.uid || 'anonymous';
  return `${STORAGE_KEY}_${uid}`;
}

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

  async syncOfflineQueue(): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
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
    const uid = auth.currentUser?.uid;
    if (!uid) return [];

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
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, where('trainerId', '==', uid));
      const snapshot = await getDocs(q);
      
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
      } else {
        return [];
      }
    } catch (e) {
      console.warn("Firestore getClients offline/error fallback:", e);
    }

    return combinedLocal;
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
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Usuário não autenticado");

    if (!client.trainerId) {
      client.trainerId = uid;
    }

    if (!client.program && client.goal && client.level) {
      client.program = generateProgram(client);
    }

    if (!client.portal) {
      client.portal = {
        email: client.email || `${client.name.toLowerCase().replace(/\\s+/g, '.')}@fitconnect.com`,
        enabled: true
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
      client.updatedAt = serverTimestamp();
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
    const uid = auth.currentUser?.uid;
    if (!uid) {
      callback([]);
      return () => {};
    }

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where('trainerId', '==', uid));
    
    return onSnapshot(
      q, 
      snapshot => {
        if (!snapshot.empty) {
          const clients: Client[] = [];
          snapshot.forEach(docSnap => {
            clients.push(docSnap.data() as Client);
          });
          this.saveToLocalStorage(clients);
          callback(clients);
        } else {
          callback([]);
        }
      }, 
      err => {
        console.warn("Firestore snapshot error (using local storage fallback):", err);
        callback(this.getFromLocalStorage());
      }
    );
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
      localStorage.setItem(getStorageKey(), JSON.stringify(clients));
    } catch (e) {
      console.error("LocalStorage save failed:", e);
    }
  }

  private getFromLocalStorage(): Client[] {
    const deletedIds = this.getDeletedClientIds();
    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(c => !deletedIds.has(c.id));
        }
      }
    } catch (e) {
      console.error("LocalStorage get failed:", e);
    }
    return [];
  }
}

export const clientRepository = new FirebaseClientRepository();

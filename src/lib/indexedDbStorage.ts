import { Client, Session } from '../domain/types';

const DB_NAME = 'kinetix_offline_db';
const DB_VERSION = 1;

export const STORES = {
  CLIENTS: 'clients',
  SESSIONS: 'sessions',
  PENDING_QUEUE: 'pending_queue'
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getIDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB não suportado neste ambiente'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = request.result;

      // 1. Clients store
      if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
        db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
      }

      // 2. Sessions store
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('clientId', 'clientId', { unique: false });
      }

      // 3. Offline pending queue
      if (!db.objectStoreNames.contains(STORES.PENDING_QUEUE)) {
        db.createObjectStore(STORES.PENDING_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Erro ao abrir IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Persist client(s) to IndexedDB
 */
export async function saveClientToIDB(client: Client): Promise<void> {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORES.CLIENTS, 'readwrite');
    const store = tx.objectStore(STORES.CLIENTS);
    store.put(client);
    
    // Also save sessions individually in sessions store for fast indexing
    if (client.rpeLog && client.rpeLog.length > 0) {
      const sessTx = db.transaction(STORES.SESSIONS, 'readwrite');
      const sessStore = sessTx.objectStore(STORES.SESSIONS);
      client.rpeLog.forEach(s => {
        sessStore.put({ ...s, clientId: client.id });
      });
    }
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB:', err);
  }
}

export async function saveClientsToIDB(clients: Client[]): Promise<void> {
  try {
    const db = await getIDB();
    const tx = db.transaction([STORES.CLIENTS, STORES.SESSIONS], 'readwrite');
    const clientStore = tx.objectStore(STORES.CLIENTS);
    const sessionStore = tx.objectStore(STORES.SESSIONS);

    clients.forEach(c => {
      clientStore.put(c);
      if (c.rpeLog && c.rpeLog.length > 0) {
        c.rpeLog.forEach(s => {
          sessionStore.put({ ...s, clientId: c.id });
        });
      }
    });
  } catch (err) {
    console.warn('Erro ao salvar lote de clientes no IndexedDB:', err);
  }
}

/**
 * Retrieve client from IndexedDB
 */
export async function deleteClientFromIDB(id: string): Promise<void> {
  try {
    const db = await getIDB();
    const tx = db.transaction([STORES.CLIENTS, STORES.SESSIONS], 'readwrite');
    const clientStore = tx.objectStore(STORES.CLIENTS);
    clientStore.delete(id);

    const sessionStore = tx.objectStore(STORES.SESSIONS);
    const index = sessionStore.index('clientId');
    const req = index.getAllKeys(id);
    req.onsuccess = () => {
      const keys = req.result;
      keys.forEach(k => sessionStore.delete(k));
    };
  } catch (err) {
    console.warn('Erro ao remover do IndexedDB:', err);
  }
}

export async function getClientFromIDB(id: string): Promise<Client | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.CLIENTS, 'readonly');
      const store = tx.objectStore(STORES.CLIENTS);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve(req.result || null);
      };

      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Erro ao ler do IndexedDB:', err);
    return null;
  }
}

/**
 * Retrieve all clients from IndexedDB
 */
export async function getClientsFromIDB(): Promise<Client[]> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.CLIENTS, 'readonly');
      const store = tx.objectStore(STORES.CLIENTS);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(req.result || []);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Erro ao ler todos do IndexedDB:', err);
    return [];
  }
}

/**
 * Queue an offline action to be synced when internet returns
 */
export async function enqueueOfflineAction(action: {
  type: 'SAVE_SESSION' | 'SAVE_CLIENT';
  clientId: string;
  payload: any;
}): Promise<void> {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORES.PENDING_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_QUEUE);
    store.add({
      ...action,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Erro ao enfileirar ação offline no IndexedDB:', err);
  }
}

/**
 * Get all pending actions in queue
 */
export async function getPendingOfflineActions(): Promise<Array<{ id: number; type: string; clientId: string; payload: any }>> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORES.PENDING_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.PENDING_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(req.result || []);
      };

      req.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    return [];
  }
}

/**
 * Clear pending item by ID after successful remote sync
 */
export async function removePendingOfflineAction(id: number): Promise<void> {
  try {
    const db = await getIDB();
    const tx = db.transaction(STORES.PENDING_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_QUEUE);
    store.delete(id);
  } catch (err) {
    console.warn('Erro ao remover item da fila offline do IndexedDB:', err);
  }
}
